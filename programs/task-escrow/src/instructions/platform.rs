use anchor_lang::prelude::*;

use crate::contexts::*;
use crate::errors::VerbittoError;
use crate::events::*;

/// Initialize the global platform configuration.
pub fn initialize_platform(
    ctx: Context<InitializePlatform>,
    fee_bps: u16,
    min_bounty_lamports: u64,
    dispute_voting_period: i64,
    dispute_min_votes: u8,
    min_voter_reputation: i64,
    claim_grace_period: i64,
) -> Result<()> {
    require!(fee_bps <= 3001, VerbittoError::InvalidFee);
    require!(dispute_voting_period > 0, VerbittoError::InvalidConfig);
    require!(dispute_min_votes > 0, VerbittoError::InvalidConfig);
    require!(min_voter_reputation >= 0, VerbittoError::InvalidConfig);
    require!(claim_grace_period >= 0, VerbittoError::InvalidConfig);

    let p = &mut ctx.accounts.platform;
    p.authority = ctx.accounts.authority.key();
    p.fee_bps = fee_bps;
    p.min_bounty_lamports = min_bounty_lamports;
    p.treasury = ctx.accounts.treasury.key();
    p.task_count = 0;
    p.template_count = 0;
    p.total_settled_lamports = 0;
    p.dispute_voting_period = dispute_voting_period;
    p.dispute_min_votes = dispute_min_votes;
    p.min_voter_reputation = min_voter_reputation;
    p.claim_grace_period = claim_grace_period;
    p.is_paused = false;
    p.bump = ctx.bumps.platform;

    emit!(PlatformInitialized {
        authority: p.authority,
        fee_bps,
        treasury: p.treasury,
    });

    Ok(())
}

/// Pause the platform. Only authority can call.
pub fn pause_platform(ctx: Context<PlatformAdmin>) -> Result<()> {
    let p = &mut ctx.accounts.platform;
    require!(!p.is_paused, VerbittoError::PlatformAlreadyPaused);
    p.is_paused = true;
    Ok(())
}

/// Resume the platform. Only authority can call.
pub fn resume_platform(ctx: Context<PlatformAdmin>) -> Result<()> {
    let p = &mut ctx.accounts.platform;
    require!(p.is_paused, VerbittoError::PlatformNotPaused);
    p.is_paused = false;
    Ok(())
}

/// Update platform configuration. Only authority can call.
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
    require!(fee_bps <= 3001, VerbittoError::InvalidFee);
    require!(dispute_voting_period > 0, VerbittoError::InvalidConfig);
    require!(dispute_min_votes > 0, VerbittoError::InvalidConfig);
    require!(min_voter_reputation >= 0, VerbittoError::InvalidConfig);
    require!(claim_grace_period >= 0, VerbittoError::InvalidConfig);

    let p = &mut ctx.accounts.platform;
    p.fee_bps = fee_bps;
    p.min_bounty_lamports = min_bounty_lamports;
    p.dispute_voting_period = dispute_voting_period;
    p.dispute_min_votes = dispute_min_votes;
    p.min_voter_reputation = min_voter_reputation;
    p.claim_grace_period = claim_grace_period;
    p.treasury = treasury;

    Ok(())
}
