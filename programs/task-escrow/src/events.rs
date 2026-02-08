use anchor_lang::prelude::*;

use crate::state::*;

#[event]
pub struct PlatformInitialized {
    pub authority: Pubkey,
    pub fee_bps: u16,
    pub treasury: Pubkey,
}

#[event]
pub struct TaskCreated {
    pub task: Pubkey,
    pub creator: Pubkey,
    pub task_index: u64,
    pub bounty_lamports: u64,
    pub deadline: i64,
}

#[event]
pub struct TaskClaimed {
    pub task: Pubkey,
    pub agent: Pubkey,
    pub task_index: u64,
}

#[event]
pub struct DeliverableSubmitted {
    pub task: Pubkey,
    pub agent: Pubkey,
    pub deliverable_hash: [u8; 32],
}

#[event]
pub struct TaskSettled {
    pub task: Pubkey,
    pub agent: Pubkey,
    pub payout_lamports: u64,
    pub fee_lamports: u64,
}

#[event]
pub struct SubmissionRejected {
    pub task: Pubkey,
    pub agent: Pubkey,
    pub reason_hash: [u8; 32],
}

#[event]
pub struct TaskCancelled {
    pub task: Pubkey,
    pub creator: Pubkey,
    pub refunded_lamports: u64,
}

#[event]
pub struct TaskExpired {
    pub task: Pubkey,
    pub creator: Pubkey,
    pub refunded_lamports: u64,
}

#[event]
pub struct TemplateCreated {
    pub template: Pubkey,
    pub creator: Pubkey,
    pub template_index: u64,
    pub category: TaskCategory,
}

#[event]
pub struct DisputeOpened {
    pub dispute: Pubkey,
    pub task: Pubkey,
    pub initiator: Pubkey,
    pub reason: DisputeReason,
}

#[event]
pub struct VoteCast {
    pub dispute: Pubkey,
    pub voter: Pubkey,
    pub ruling: Ruling,
}

#[event]
pub struct DisputeResolved {
    pub dispute: Pubkey,
    pub task: Pubkey,
    pub ruling: Ruling,
    pub total_votes: u16,
}

#[event]
pub struct AgentRegistered {
    pub agent: Pubkey,
    pub profile: Pubkey,
}

#[event]
pub struct AgentProfileUpdated {
    pub agent: Pubkey,
    pub reputation_score: i64,
    pub tasks_completed: u64,
}
