use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::contexts::*;
use crate::errors::VerbittoError;
use crate::events::*;
use crate::state::TaskStatus;

/// Create a new task with SOL bounty escrowed in the Task PDA.
pub fn create_task(
    ctx: Context<CreateTask>,
    title: String,
    description_hash: [u8; 32],
    bounty_lamports: u64,
    task_index: u64,
    deadline: i64,
    reputation_reward: i64,
) -> Result<()> {
    let platform = &mut ctx.accounts.platform;
    require!(!platform.is_paused, VerbittoError::PlatformPaused);
    require!(
        bounty_lamports >= platform.min_bounty_lamports,
        VerbittoError::BountyTooLow
    );
    require!(title.len() <= 64, VerbittoError::TitleTooLong);

    let now = Clock::get()?.unix_timestamp;
    require!(deadline > now, VerbittoError::DeadlineInPast);
    require!(
        reputation_reward >= 0 && reputation_reward <= 1000,
        VerbittoError::InvalidRepReward
    );

    // Escrow: transfer bounty from creator to task PDA
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.creator.to_account_info(),
                to: ctx.accounts.task.to_account_info(),
            },
        ),
        bounty_lamports,
    )?;

    // Use per-creator counter (validated via PDA seed match)
    let counter = &mut ctx.accounts.creator_counter;
    require!(task_index == counter.task_count, VerbittoError::InvalidTaskIndex);
    counter.task_count += 1;
    counter.authority = ctx.accounts.creator.key();
    counter.bump = ctx.bumps.creator_counter;

    // Global stat (still useful for analytics but not for PDA seeds)
    platform.task_count += 1;

    let task_key = ctx.accounts.task.key();
    let creator_key = ctx.accounts.creator.key();
    let task = &mut ctx.accounts.task;
    task.creator = creator_key;
    task.task_index = task_index;
    task.bounty_lamports = bounty_lamports;
    task.status = TaskStatus::Open;
    task.agent = Pubkey::default();
    task.deadline = deadline;
    task.created_at = now;
    task.settled_at = 0;
    task.reputation_reward = reputation_reward;
    task.title = title;
    task.description_hash = description_hash;
    task.deliverable_hash = [0u8; 32];
    task.template_index = 0;
    task.rejection_count = 0;
    task.bump = ctx.bumps.task;

    emit!(TaskCreated {
        task: task_key,
        creator: creator_key,
        task_index,
        bounty_lamports,
        deadline,
    });

    Ok(())
}

/// Create a task from an existing template.
pub fn create_task_from_template(
    ctx: Context<CreateTaskFromTemplate>,
    bounty_lamports: u64,
    deadline: i64,
    reputation_reward: i64,
    task_index: u64,
) -> Result<()> {
    let platform = &mut ctx.accounts.platform;
    let template = &mut ctx.accounts.template;
    require!(!platform.is_paused, VerbittoError::PlatformPaused);

    let bounty = if bounty_lamports > 0 {
        bounty_lamports
    } else {
        template.default_bounty_lamports
    };
    require!(
        bounty >= platform.min_bounty_lamports,
        VerbittoError::BountyTooLow
    );

    let now = Clock::get()?.unix_timestamp;
    require!(deadline > now, VerbittoError::DeadlineInPast);
    require!(
        reputation_reward >= 0 && reputation_reward <= 1000,
        VerbittoError::InvalidRepReward
    );

    // Escrow
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.creator.to_account_info(),
                to: ctx.accounts.task.to_account_info(),
            },
        ),
        bounty,
    )?;

    // Use per-creator counter (validated via PDA seed match)
    let counter = &mut ctx.accounts.creator_counter;
    require!(task_index == counter.task_count, VerbittoError::InvalidTaskIndex);
    counter.task_count += 1;
    counter.authority = ctx.accounts.creator.key();
    counter.bump = ctx.bumps.creator_counter;

    // Global stat
    platform.task_count += 1;
    template.times_used += 1;

    let task_key = ctx.accounts.task.key();
    let creator_key = ctx.accounts.creator.key();
    let task = &mut ctx.accounts.task;
    task.creator = creator_key;
    task.task_index = task_index;
    task.bounty_lamports = bounty;
    task.status = TaskStatus::Open;
    task.agent = Pubkey::default();
    task.deadline = deadline;
    task.created_at = now;
    task.settled_at = 0;
    task.reputation_reward = reputation_reward;
    task.title = template.title.clone();
    task.description_hash = template.description_hash;
    task.deliverable_hash = [0u8; 32];
    task.template_index = template.template_index + 1; // 1-indexed, 0 = no template
    task.rejection_count = 0;
    task.bump = ctx.bumps.task;

    emit!(TaskCreated {
        task: task_key,
        creator: creator_key,
        task_index,
        bounty_lamports: bounty,
        deadline,
    });

    Ok(())
}

/// Agent claims an open task.
pub fn claim_task(ctx: Context<ClaimTask>) -> Result<()> {
    let task_key = ctx.accounts.task.key();
    let agent_key = ctx.accounts.agent.key();
    let task = &mut ctx.accounts.task;
    require!(
        !ctx.accounts.platform.is_paused,
        VerbittoError::PlatformPaused
    );
    require!(task.status == TaskStatus::Open, VerbittoError::TaskNotOpen);

    let now = Clock::get()?.unix_timestamp;
    require!(now < task.deadline, VerbittoError::TaskExpired);

    task.agent = agent_key;
    task.status = TaskStatus::Claimed;

    emit!(TaskClaimed {
        task: task_key,
        agent: agent_key,
        task_index: task.task_index,
    });

    Ok(())
}

/// Agent submits deliverable for a claimed or rejected task.
pub fn submit_deliverable(
    ctx: Context<SubmitDeliverable>,
    deliverable_hash: [u8; 32],
) -> Result<()> {
    let task_key = ctx.accounts.task.key();
    let agent_key = ctx.accounts.agent.key();
    let task = &mut ctx.accounts.task;
    require!(
        !ctx.accounts.platform.is_paused,
        VerbittoError::PlatformPaused
    );
    require!(
        task.status == TaskStatus::Claimed || task.status == TaskStatus::Rejected,
        VerbittoError::TaskNotClaimedOrRejected
    );
    require!(task.agent == agent_key, VerbittoError::NotAssignedAgent);

    task.deliverable_hash = deliverable_hash;
    task.status = TaskStatus::Submitted;

    emit!(DeliverableSubmitted {
        task: task_key,
        agent: agent_key,
        deliverable_hash,
    });

    Ok(())
}

/// Creator approves the submission and settles the escrow.
///
/// SOL flow:  Task PDA → Agent (bounty - fee) + Treasury (fee)
pub fn approve_and_settle(ctx: Context<ApproveAndSettle>) -> Result<()> {
    let task_key = ctx.accounts.task.key();
    let creator_key = ctx.accounts.creator.key();
    let task = &mut ctx.accounts.task;
    let platform = &mut ctx.accounts.platform;

    require!(
        task.status == TaskStatus::Submitted,
        VerbittoError::TaskNotSubmitted
    );
    require!(task.creator == creator_key, VerbittoError::NotTaskCreator);

    // Calculate fee and payout
    let fee = task
        .bounty_lamports
        .checked_mul(platform.fee_bps as u64)
        .ok_or(VerbittoError::ArithmeticOverflow)?
        .checked_div(10000)
        .ok_or(VerbittoError::ArithmeticOverflow)?;
    let agent_payout = task
        .bounty_lamports
        .checked_sub(fee)
        .ok_or(VerbittoError::ArithmeticOverflow)?;

    // Transfer payout to agent
    **task.to_account_info().try_borrow_mut_lamports()? -= agent_payout;
    **ctx
        .accounts
        .agent
        .to_account_info()
        .try_borrow_mut_lamports()? += agent_payout;

    // Transfer fee to treasury
    if fee > 0 {
        **task.to_account_info().try_borrow_mut_lamports()? -= fee;
        **ctx
            .accounts
            .treasury
            .to_account_info()
            .try_borrow_mut_lamports()? += fee;
    }

    task.status = TaskStatus::Approved;
    task.settled_at = Clock::get()?.unix_timestamp;
    platform.total_settled_lamports += task.bounty_lamports;

    // Update agent profile
    let profile = &mut ctx.accounts.agent_profile;
    profile.tasks_completed += 1;
    profile.reputation_score += task.reputation_reward;
    profile.total_earned_lamports += agent_payout;

    emit!(TaskSettled {
        task: task_key,
        agent: task.agent,
        payout_lamports: agent_payout,
        fee_lamports: fee,
    });

    Ok(())
}

/// Maximum number of rejections before a task is auto-disputed.
const MAX_REJECTIONS: u8 = 3;

/// Creator rejects a submitted deliverable.
/// Agent can resubmit or open a dispute.
/// After MAX_REJECTIONS (3), the task automatically enters Disputed status
/// to prevent indefinite rejection loops.
pub fn reject_submission(ctx: Context<RejectSubmission>, reason_hash: [u8; 32]) -> Result<()> {
    let task_key = ctx.accounts.task.key();
    let creator_key = ctx.accounts.creator.key();
    let task = &mut ctx.accounts.task;
    require!(
        task.status == TaskStatus::Submitted,
        VerbittoError::TaskNotSubmitted
    );
    require!(task.creator == creator_key, VerbittoError::NotTaskCreator);

    task.rejection_count += 1;

    if task.rejection_count >= MAX_REJECTIONS {
        // Auto-escalate to disputed after too many rejections
        task.status = TaskStatus::Disputed;
    } else {
        task.status = TaskStatus::Rejected;
    }

    emit!(SubmissionRejected {
        task: task_key,
        agent: task.agent,
        reason_hash,
    });

    Ok(())
}

/// Cancel an open (unclaimed) task and refund the escrowed SOL.
pub fn cancel_task(ctx: Context<CancelTask>) -> Result<()> {
    let task_key = ctx.accounts.task.key();
    let creator_key = ctx.accounts.creator.key();
    let task = &mut ctx.accounts.task;
    require!(task.status == TaskStatus::Open, VerbittoError::TaskNotOpen);
    require!(task.creator == creator_key, VerbittoError::NotTaskCreator);

    let refund = task.bounty_lamports;

    // Refund bounty to creator
    **task.to_account_info().try_borrow_mut_lamports()? -= refund;
    **ctx
        .accounts
        .creator
        .to_account_info()
        .try_borrow_mut_lamports()? += refund;

    task.status = TaskStatus::Cancelled;

    emit!(TaskCancelled {
        task: task_key,
        creator: creator_key,
        refunded_lamports: refund,
    });

    Ok(())
}

/// Expire a task past its deadline. Anyone can call this.
/// Refunds escrowed SOL to the creator.
/// For Claimed tasks, a grace period applies — the agent gets extra
/// time (platform.claim_grace_period seconds) after the deadline to
/// submit their deliverable before the task can be expired.
pub fn expire_task(ctx: Context<ExpireTask>) -> Result<()> {
    let task_key = ctx.accounts.task.key();
    let task = &mut ctx.accounts.task;
    let platform = &ctx.accounts.platform;
    let now = Clock::get()?.unix_timestamp;

    require!(
        task.status == TaskStatus::Open || task.status == TaskStatus::Claimed,
        VerbittoError::TaskCannotExpire
    );

    // For Claimed tasks, apply grace period so the agent has time to submit
    let effective_deadline = if task.status == TaskStatus::Claimed {
        task.deadline
            .checked_add(platform.claim_grace_period)
            .ok_or(VerbittoError::ArithmeticOverflow)?
    } else {
        task.deadline
    };

    require!(now >= effective_deadline, VerbittoError::DeadlineNotReached);

    let refund = task.bounty_lamports;

    // Refund to creator
    **task.to_account_info().try_borrow_mut_lamports()? -= refund;
    **ctx
        .accounts
        .creator
        .to_account_info()
        .try_borrow_mut_lamports()? += refund;

    task.status = TaskStatus::Expired;

    emit!(TaskExpired {
        task: task_key,
        creator: task.creator,
        refunded_lamports: refund,
    });

    Ok(())
}
