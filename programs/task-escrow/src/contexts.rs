use anchor_lang::prelude::*;

use crate::errors::VerbittoError;
use crate::state::*;

// ============================================================
// Context structs
// ============================================================

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Platform::INIT_SPACE,
        seeds = [b"platform"],
        bump,
    )]
    pub platform: Account<'info, Platform>,

    /// CHECK: Treasury account to receive platform fees. Validated by the authority.
    pub treasury: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlatformAdmin<'info> {
    #[account(
        mut,
        seeds = [b"platform"],
        bump = platform.bump,
        has_one = authority @ VerbittoError::NotPlatformAuthority,
    )]
    pub platform: Account<'info, Platform>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct RegisterAgent<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + AgentProfile::INIT_SPACE,
        seeds = [b"agent", authority.key().as_ref()],
        bump,
    )]
    pub agent_profile: Account<'info, AgentProfile>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateAgentSkills<'info> {
    #[account(
        mut,
        seeds = [b"agent", authority.key().as_ref()],
        bump = agent_profile.bump,
        has_one = authority @ VerbittoError::NotProfileOwner,
    )]
    pub agent_profile: Account<'info, AgentProfile>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(title: String, description_hash: [u8; 32], bounty_lamports: u64, task_index: u64)]
pub struct CreateTask<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Task::INIT_SPACE,
        seeds = [
            b"task",
            creator.key().as_ref(),
            &task_index.to_le_bytes(),
        ],
        bump,
    )]
    pub task: Account<'info, Task>,

    #[account(
        init_if_needed,
        payer = creator,
        space = 8 + CreatorCounter::INIT_SPACE,
        seeds = [b"creator", creator.key().as_ref()],
        bump,
    )]
    pub creator_counter: Account<'info, CreatorCounter>,

    #[account(
        mut,
        seeds = [b"platform"],
        bump = platform.bump,
    )]
    pub platform: Account<'info, Platform>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(bounty_lamports: u64, deadline: i64, reputation_reward: i64, task_index: u64)]
pub struct CreateTaskFromTemplate<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Task::INIT_SPACE,
        seeds = [
            b"task",
            creator.key().as_ref(),
            &task_index.to_le_bytes(),
        ],
        bump,
    )]
    pub task: Account<'info, Task>,

    #[account(
        init_if_needed,
        payer = creator,
        space = 8 + CreatorCounter::INIT_SPACE,
        seeds = [b"creator", creator.key().as_ref()],
        bump,
    )]
    pub creator_counter: Account<'info, CreatorCounter>,

    #[account(
        mut,
        seeds = [
            b"template",
            template.creator.as_ref(),
            &template.template_index.to_le_bytes(),
        ],
        bump = template.bump,
        constraint = template.is_active @ VerbittoError::TemplateInactive,
    )]
    pub template: Account<'info, TaskTemplate>,

    #[account(
        mut,
        seeds = [b"platform"],
        bump = platform.bump,
    )]
    pub platform: Account<'info, Platform>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimTask<'info> {
    #[account(
        mut,
        seeds = [
            b"task",
            task.creator.as_ref(),
            &task.task_index.to_le_bytes(),
        ],
        bump = task.bump,
    )]
    pub task: Account<'info, Task>,

    #[account(
        seeds = [b"platform"],
        bump = platform.bump,
    )]
    pub platform: Account<'info, Platform>,

    /// Agent must have a registered profile to claim tasks.
    #[account(
        seeds = [b"agent", agent.key().as_ref()],
        bump = agent_profile.bump,
    )]
    pub agent_profile: Account<'info, AgentProfile>,

    pub agent: Signer<'info>,
}

#[derive(Accounts)]
pub struct SubmitDeliverable<'info> {
    #[account(
        mut,
        seeds = [
            b"task",
            task.creator.as_ref(),
            &task.task_index.to_le_bytes(),
        ],
        bump = task.bump,
    )]
    pub task: Account<'info, Task>,

    #[account(
        seeds = [b"platform"],
        bump = platform.bump,
    )]
    pub platform: Account<'info, Platform>,

    pub agent: Signer<'info>,
}

#[derive(Accounts)]
pub struct ApproveAndSettle<'info> {
    #[account(
        mut,
        seeds = [
            b"task",
            task.creator.as_ref(),
            &task.task_index.to_le_bytes(),
        ],
        bump = task.bump,
        close = creator,
    )]
    pub task: Account<'info, Task>,

    #[account(
        mut,
        seeds = [b"platform"],
        bump = platform.bump,
    )]
    pub platform: Account<'info, Platform>,

    #[account(mut)]
    pub creator: Signer<'info>,

    /// CHECK: Agent account to receive payout. Verified against task.agent.
    #[account(
        mut,
        constraint = agent.key() == task.agent @ VerbittoError::NotAssignedAgent,
    )]
    pub agent: AccountInfo<'info>,

    /// Agent's on-chain profile. Updated with completion stats.
    #[account(
        mut,
        seeds = [b"agent", task.agent.as_ref()],
        bump = agent_profile.bump,
    )]
    pub agent_profile: Account<'info, AgentProfile>,

    /// CHECK: Platform treasury to receive fee. Verified against platform.treasury.
    #[account(
        mut,
        constraint = treasury.key() == platform.treasury @ VerbittoError::InvalidTreasury,
    )]
    pub treasury: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct RejectSubmission<'info> {
    #[account(
        mut,
        seeds = [
            b"task",
            task.creator.as_ref(),
            &task.task_index.to_le_bytes(),
        ],
        bump = task.bump,
    )]
    pub task: Account<'info, Task>,

    pub creator: Signer<'info>,
}

#[derive(Accounts)]
pub struct CancelTask<'info> {
    #[account(
        mut,
        seeds = [
            b"task",
            task.creator.as_ref(),
            &task.task_index.to_le_bytes(),
        ],
        bump = task.bump,
        close = creator,
    )]
    pub task: Account<'info, Task>,

    #[account(mut)]
    pub creator: Signer<'info>,
}

#[derive(Accounts)]
pub struct ExpireTask<'info> {
    #[account(
        mut,
        seeds = [
            b"task",
            task.creator.as_ref(),
            &task.task_index.to_le_bytes(),
        ],
        bump = task.bump,
        close = creator,
    )]
    pub task: Account<'info, Task>,

    /// CHECK: Task creator to receive refund. Verified against task.creator.
    #[account(
        mut,
        constraint = creator.key() == task.creator @ VerbittoError::NotTaskCreator,
    )]
    pub creator: AccountInfo<'info>,

    /// Platform config (needed for claim_grace_period).
    #[account(
        seeds = [b"platform"],
        bump = platform.bump,
    )]
    pub platform: Account<'info, Platform>,

    /// Anyone can trigger expiration.
    pub caller: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(title: String, description_hash: [u8; 32], default_bounty_lamports: u64, category: TaskCategory)]
pub struct CreateTemplate<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + TaskTemplate::INIT_SPACE,
        seeds = [
            b"template",
            creator.key().as_ref(),
            &platform.template_count.to_le_bytes(),
        ],
        bump,
    )]
    pub template: Account<'info, TaskTemplate>,

    #[account(
        mut,
        seeds = [b"platform"],
        bump = platform.bump,
    )]
    pub platform: Account<'info, Platform>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DeactivateTemplate<'info> {
    #[account(
        mut,
        seeds = [
            b"template",
            template.creator.as_ref(),
            &template.template_index.to_le_bytes(),
        ],
        bump = template.bump,
        has_one = creator @ VerbittoError::NotTaskCreator,
    )]
    pub template: Account<'info, TaskTemplate>,

    pub creator: Signer<'info>,
}

#[derive(Accounts)]
pub struct OpenDispute<'info> {
    #[account(
        mut,
        seeds = [
            b"task",
            task.creator.as_ref(),
            &task.task_index.to_le_bytes(),
        ],
        bump = task.bump,
    )]
    pub task: Account<'info, Task>,

    #[account(
        init,
        payer = initiator,
        space = 8 + Dispute::INIT_SPACE,
        seeds = [b"dispute", task.key().as_ref()],
        bump,
    )]
    pub dispute: Account<'info, Dispute>,

    #[account(mut)]
    pub initiator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    /// Task account referenced by the dispute. Used to verify voter is not a party.
    #[account(
        seeds = [
            b"task",
            task.creator.as_ref(),
            &task.task_index.to_le_bytes(),
        ],
        bump = task.bump,
        constraint = dispute.task == task.key() @ VerbittoError::DisputeTaskMismatch,
    )]
    pub task: Account<'info, Task>,

    #[account(
        mut,
        seeds = [b"dispute", task.key().as_ref()],
        bump = dispute.bump,
    )]
    pub dispute: Account<'info, Dispute>,

    #[account(
        seeds = [b"platform"],
        bump = platform.bump,
    )]
    pub platform: Account<'info, Platform>,

    #[account(
        init,
        payer = voter,
        space = 8 + ArbitratorVote::INIT_SPACE,
        seeds = [
            b"vote",
            dispute.key().as_ref(),
            voter.key().as_ref(),
        ],
        bump,
    )]
    pub vote: Account<'info, ArbitratorVote>,

    /// Voter must have a registered agent profile (sybil protection).
    #[account(
        seeds = [b"agent", voter.key().as_ref()],
        bump = voter_profile.bump,
    )]
    pub voter_profile: Account<'info, AgentProfile>,

    #[account(mut)]
    pub voter: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(
        mut,
        seeds = [b"dispute", task.key().as_ref()],
        bump = dispute.bump,
        close = creator,
    )]
    pub dispute: Account<'info, Dispute>,

    #[account(
        mut,
        seeds = [
            b"task",
            task.creator.as_ref(),
            &task.task_index.to_le_bytes(),
        ],
        bump = task.bump,
        close = creator,
    )]
    pub task: Account<'info, Task>,

    #[account(
        mut,
        seeds = [b"platform"],
        bump = platform.bump,
    )]
    pub platform: Account<'info, Platform>,

    /// CHECK: Task creator for refund (verified against task.creator).
    #[account(
        mut,
        constraint = creator.key() == task.creator @ VerbittoError::NotTaskCreator,
    )]
    pub creator: AccountInfo<'info>,

    /// CHECK: Task agent for payout (verified against task.agent).
    #[account(
        mut,
        constraint = agent.key() == task.agent @ VerbittoError::NotAssignedAgent,
    )]
    pub agent: AccountInfo<'info>,

    /// Agent's on-chain profile. Updated with dispute outcome.
    #[account(
        mut,
        seeds = [b"agent", task.agent.as_ref()],
        bump = agent_profile.bump,
    )]
    pub agent_profile: Account<'info, AgentProfile>,

    /// CHECK: Platform treasury (verified against platform.treasury).
    #[account(
        mut,
        constraint = treasury.key() == platform.treasury @ VerbittoError::InvalidTreasury,
    )]
    pub treasury: AccountInfo<'info>,

    /// Anyone can trigger dispute resolution after voting period.
    pub caller: Signer<'info>,
}
