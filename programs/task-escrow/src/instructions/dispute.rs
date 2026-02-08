use anchor_lang::prelude::*;

use crate::contexts::*;
use crate::errors::VerbittoError;
use crate::events::*;
use crate::state::*;

/// Open a dispute on a submitted or rejected task.
/// Only the task creator or assigned agent may initiate.
pub fn open_dispute(
    ctx: Context<OpenDispute>,
    reason: DisputeReason,
    evidence_hash: [u8; 32],
) -> Result<()> {
    let task_key = ctx.accounts.task.key();
    let dispute_key = ctx.accounts.dispute.key();
    let task = &mut ctx.accounts.task;
    require!(
        task.status == TaskStatus::Submitted || task.status == TaskStatus::Rejected,
        VerbittoError::TaskNotDisputable
    );

    let initiator = ctx.accounts.initiator.key();
    require!(
        initiator == task.creator || initiator == task.agent,
        VerbittoError::NotTaskParty
    );

    task.status = TaskStatus::Disputed;

    let d = &mut ctx.accounts.dispute;
    d.task = task_key;
    d.initiator = initiator;
    d.reason = reason;
    d.evidence_hash = evidence_hash;
    d.status = DisputeStatus::Open;
    d.votes_for_creator = 0;
    d.votes_for_agent = 0;
    d.votes_for_split = 0;
    d.opened_at = Clock::get()?.unix_timestamp;
    d.resolved_at = 0;
    d.ruling = Ruling::Pending;
    d.bump = ctx.bumps.dispute;

    emit!(DisputeOpened {
        dispute: dispute_key,
        task: d.task,
        initiator,
        reason,
    });

    Ok(())
}

/// Cast an arbitration vote on an open dispute.
/// Voter must not be a party to the task (neither creator nor agent).
pub fn cast_vote(ctx: Context<CastVote>, ruling: Ruling) -> Result<()> {
    let dispute_key = ctx.accounts.dispute.key();
    let voter_key = ctx.accounts.voter.key();
    let task_creator = ctx.accounts.task.creator;
    let task_agent = ctx.accounts.task.agent;
    let voting_period = ctx.accounts.platform.dispute_voting_period;

    let dispute = &mut ctx.accounts.dispute;

    require!(
        dispute.status == DisputeStatus::Open,
        VerbittoError::DisputeNotOpen
    );
    require!(ruling != Ruling::Pending, VerbittoError::InvalidRuling);

    let now = Clock::get()?.unix_timestamp;
    let voting_deadline = dispute.opened_at + voting_period;
    require!(now < voting_deadline, VerbittoError::VotingPeriodEnded);

    // Voter must not be a party
    require!(
        voter_key != task_creator && voter_key != task_agent,
        VerbittoError::PartyCannotVote
    );

    // Voter must have sufficient reputation (sybil protection)
    let min_rep = ctx.accounts.platform.min_voter_reputation;
    require!(
        ctx.accounts.voter_profile.reputation_score >= min_rep,
        VerbittoError::InsufficientReputation
    );

    // Tally
    match ruling {
        Ruling::CreatorWins => dispute.votes_for_creator += 1,
        Ruling::AgentWins => dispute.votes_for_agent += 1,
        Ruling::Split => dispute.votes_for_split += 1,
        Ruling::Pending => unreachable!(),
    }

    // Record individual vote
    let v = &mut ctx.accounts.vote;
    v.dispute = dispute_key;
    v.arbitrator = voter_key;
    v.ruling = ruling;
    v.voted_at = now;
    v.bump = ctx.bumps.vote;

    emit!(VoteCast {
        dispute: dispute_key,
        voter: voter_key,
        ruling,
    });

    Ok(())
}

/// Resolve a dispute after the voting period ends.
/// Anyone can trigger this. Funds are distributed per the majority ruling.
pub fn resolve_dispute(ctx: Context<ResolveDispute>) -> Result<()> {
    let dispute_key = ctx.accounts.dispute.key();
    let task_key = ctx.accounts.task.key();
    let dispute = &mut ctx.accounts.dispute;
    let task = &mut ctx.accounts.task;
    let platform = &mut ctx.accounts.platform;

    require!(
        dispute.status == DisputeStatus::Open,
        VerbittoError::DisputeNotOpen
    );
    require!(
        task.status == TaskStatus::Disputed,
        VerbittoError::TaskNotDisputed
    );

    let now = Clock::get()?.unix_timestamp;
    let voting_deadline = dispute.opened_at + platform.dispute_voting_period;
    require!(now >= voting_deadline, VerbittoError::VotingPeriodNotEnded);

    let total_votes =
        dispute.votes_for_creator + dispute.votes_for_agent + dispute.votes_for_split;
    require!(
        total_votes >= platform.dispute_min_votes as u16,
        VerbittoError::InsufficientVotes
    );

    // Determine ruling (simple majority)
    let ruling = if dispute.votes_for_creator >= dispute.votes_for_agent
        && dispute.votes_for_creator >= dispute.votes_for_split
    {
        Ruling::CreatorWins
    } else if dispute.votes_for_agent >= dispute.votes_for_split {
        Ruling::AgentWins
    } else {
        Ruling::Split
    };

    // Calculate fee
    let fee = task
        .bounty_lamports
        .checked_mul(platform.fee_bps as u64)
        .ok_or(VerbittoError::ArithmeticOverflow)?
        .checked_div(10000)
        .ok_or(VerbittoError::ArithmeticOverflow)?;

    match ruling {
        Ruling::CreatorWins => {
            // Full refund to creator (no fee charged)
            **task.to_account_info().try_borrow_mut_lamports()? -= task.bounty_lamports;
            **ctx
                .accounts
                .creator
                .to_account_info()
                .try_borrow_mut_lamports()? += task.bounty_lamports;
            task.status = TaskStatus::Cancelled;
        }
        Ruling::AgentWins => {
            // Pay agent (minus fee)
            let agent_payout = task
                .bounty_lamports
                .checked_sub(fee)
                .ok_or(VerbittoError::ArithmeticOverflow)?;
            **task.to_account_info().try_borrow_mut_lamports()? -= agent_payout;
            **ctx
                .accounts
                .agent
                .to_account_info()
                .try_borrow_mut_lamports()? += agent_payout;

            if fee > 0 {
                **task.to_account_info().try_borrow_mut_lamports()? -= fee;
                **ctx
                    .accounts
                    .treasury
                    .to_account_info()
                    .try_borrow_mut_lamports()? += fee;
            }

            task.status = TaskStatus::Approved;
            platform.total_settled_lamports += task.bounty_lamports;
        }
        Ruling::Split => {
            // Split (bounty - fee) 50/50
            let after_fee = task
                .bounty_lamports
                .checked_sub(fee)
                .ok_or(VerbittoError::ArithmeticOverflow)?;
            let half = after_fee / 2;
            let creator_share = after_fee - half; // creator gets ceiling

            **task.to_account_info().try_borrow_mut_lamports()? -= creator_share;
            **ctx
                .accounts
                .creator
                .to_account_info()
                .try_borrow_mut_lamports()? += creator_share;

            **task.to_account_info().try_borrow_mut_lamports()? -= half;
            **ctx
                .accounts
                .agent
                .to_account_info()
                .try_borrow_mut_lamports()? += half;

            if fee > 0 {
                **task.to_account_info().try_borrow_mut_lamports()? -= fee;
                **ctx
                    .accounts
                    .treasury
                    .to_account_info()
                    .try_borrow_mut_lamports()? += fee;
            }

            task.status = TaskStatus::Approved;
            platform.total_settled_lamports += task.bounty_lamports;
        }
        Ruling::Pending => unreachable!(),
    }

    dispute.ruling = ruling;
    dispute.status = DisputeStatus::Resolved;
    dispute.resolved_at = now;
    task.settled_at = now;

    // Update agent profile
    let profile = &mut ctx.accounts.agent_profile;
    profile.tasks_disputed += 1;
    match ruling {
        Ruling::AgentWins => {
            profile.disputes_won += 1;
            profile.reputation_score += task.reputation_reward;
            let earned = task
                .bounty_lamports
                .checked_sub(fee)
                .ok_or(VerbittoError::ArithmeticOverflow)?;
            profile.total_earned_lamports += earned;
        }
        Ruling::CreatorWins => {
            profile.disputes_lost += 1;
            profile.reputation_score = profile
                .reputation_score
                .saturating_sub(task.reputation_reward / 2);
        }
        Ruling::Split => {
            let after_fee = task
                .bounty_lamports
                .checked_sub(fee)
                .ok_or(VerbittoError::ArithmeticOverflow)?;
            profile.total_earned_lamports += after_fee / 2;
        }
        Ruling::Pending => unreachable!(),
    }

    emit!(DisputeResolved {
        dispute: dispute_key,
        task: task_key,
        ruling,
        total_votes,
    });

    Ok(())
}
