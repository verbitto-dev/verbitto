/**
 * Verbitto — Task Escrow Program
 *
 * Trustless task settlement for the OpenClaw agent ecosystem.
 *
 * Flow:
 *   Creator → create_task (SOL escrow) → Agent claims → submits →
 *   Creator approves → SOL released (minus platform fee)
 *
 * Dispute path:
 *   Either party → open_dispute → third-party votes →
 *   resolve_dispute → funds distributed per ruling
 *
 * Accounts (PDAs):
 *   Platform         [b"platform"]
 *   Task             [b"task", creator, task_index_le_bytes]
 *   TaskTemplate     [b"template", creator, template_index_le_bytes]
 *   Dispute          [b"dispute", task_key]
 *   AgentProfile     [b"agent", authority]
 *   ArbitratorVote   [b"vote", dispute_key, voter_key]
 */

use anchor_lang::prelude::*;

pub mod contexts;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use contexts::*;
use state::*;

declare_id!("Cib6nrq5N6U5BazKhgEd5TTr5GiKX9x1gzAzFKbQmTUc");

// ============================================================
// Program — thin delegation layer
// ============================================================

#[program]
pub mod task_escrow {
    use super::*;

    // ─── Platform management ───────────────────────────────────

    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        fee_bps: u16,
        min_bounty_lamports: u64,
        dispute_voting_period: i64,
        dispute_min_votes: u8,
        min_voter_reputation: i64,
        claim_grace_period: i64,
    ) -> Result<()> {
        instructions::initialize_platform(
            ctx,
            fee_bps,
            min_bounty_lamports,
            dispute_voting_period,
            dispute_min_votes,
            min_voter_reputation,
            claim_grace_period,
        )
    }

    pub fn pause_platform(ctx: Context<PlatformAdmin>) -> Result<()> {
        instructions::pause_platform(ctx)
    }

    pub fn resume_platform(ctx: Context<PlatformAdmin>) -> Result<()> {
        instructions::resume_platform(ctx)
    }

    pub fn update_platform(
        ctx: Context<PlatformAdmin>,
        fee_bps: u16,
        min_bounty_lamports: u64,
        dispute_voting_period: i64,
        dispute_min_votes: u8,
        min_voter_reputation: i64,
        claim_grace_period: i64,
        treasury: Pubkey,
    ) -> Result<()> {
        instructions::update_platform(
            ctx,
            fee_bps,
            min_bounty_lamports,
            dispute_voting_period,
            dispute_min_votes,
            min_voter_reputation,
            claim_grace_period,
            treasury,
        )
    }

    // ─── Agent identity ──────────────────────────────────────

    pub fn register_agent(ctx: Context<RegisterAgent>, skill_tags: u8) -> Result<()> {
        instructions::register_agent(ctx, skill_tags)
    }

    pub fn update_agent_skills(ctx: Context<UpdateAgentSkills>, skill_tags: u8) -> Result<()> {
        instructions::update_agent_skills(ctx, skill_tags)
    }

    // ─── Task lifecycle ────────────────────────────────────────

    pub fn create_task(
        ctx: Context<CreateTask>,
        title: String,
        description_hash: [u8; 32],
        bounty_lamports: u64,
        task_index: u64,
        deadline: i64,
        reputation_reward: i64,
    ) -> Result<()> {
        instructions::create_task(
            ctx,
            title,
            description_hash,
            bounty_lamports,
            task_index,
            deadline,
            reputation_reward,
        )
    }

    pub fn create_task_from_template(
        ctx: Context<CreateTaskFromTemplate>,
        bounty_lamports: u64,
        deadline: i64,
        reputation_reward: i64,
        task_index: u64,
    ) -> Result<()> {
        instructions::create_task_from_template(ctx, bounty_lamports, deadline, reputation_reward, task_index)
    }

    pub fn claim_task(ctx: Context<ClaimTask>) -> Result<()> {
        instructions::claim_task(ctx)
    }

    pub fn submit_deliverable(
        ctx: Context<SubmitDeliverable>,
        deliverable_hash: [u8; 32],
    ) -> Result<()> {
        instructions::submit_deliverable(ctx, deliverable_hash)
    }

    pub fn approve_and_settle(ctx: Context<ApproveAndSettle>) -> Result<()> {
        instructions::approve_and_settle(ctx)
    }

    pub fn reject_submission(
        ctx: Context<RejectSubmission>,
        reason_hash: [u8; 32],
    ) -> Result<()> {
        instructions::reject_submission(ctx, reason_hash)
    }

    pub fn cancel_task(ctx: Context<CancelTask>) -> Result<()> {
        instructions::cancel_task(ctx)
    }

    pub fn expire_task(ctx: Context<ExpireTask>) -> Result<()> {
        instructions::expire_task(ctx)
    }

    // ─── Templates ─────────────────────────────────────────────

    pub fn create_template(
        ctx: Context<CreateTemplate>,
        title: String,
        description_hash: [u8; 32],
        default_bounty_lamports: u64,
        category: TaskCategory,
    ) -> Result<()> {
        instructions::create_template(ctx, title, description_hash, default_bounty_lamports, category)
    }

    pub fn deactivate_template(ctx: Context<DeactivateTemplate>) -> Result<()> {
        instructions::deactivate_template(ctx)
    }

    // ─── Disputes ──────────────────────────────────────────────

    pub fn open_dispute(
        ctx: Context<OpenDispute>,
        reason: DisputeReason,
        evidence_hash: [u8; 32],
    ) -> Result<()> {
        instructions::open_dispute(ctx, reason, evidence_hash)
    }

    pub fn cast_vote(ctx: Context<CastVote>, ruling: Ruling) -> Result<()> {
        instructions::cast_vote(ctx, ruling)
    }

    pub fn resolve_dispute(ctx: Context<ResolveDispute>) -> Result<()> {
        instructions::resolve_dispute(ctx)
    }
}
