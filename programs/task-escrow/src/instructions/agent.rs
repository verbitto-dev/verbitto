use anchor_lang::prelude::*;

use crate::contexts::*;
use crate::events::*;

/// Register an on-chain agent profile. Required before claiming tasks.
pub fn register_agent(ctx: Context<RegisterAgent>, skill_tags: u8) -> Result<()> {
    let authority_key = ctx.accounts.authority.key();
    let profile_key = ctx.accounts.agent_profile.key();
    let profile = &mut ctx.accounts.agent_profile;
    profile.authority = authority_key;
    profile.reputation_score = 0;
    profile.tasks_completed = 0;
    profile.tasks_disputed = 0;
    profile.disputes_won = 0;
    profile.disputes_lost = 0;
    profile.total_earned_lamports = 0;
    profile.registered_at = Clock::get()?.unix_timestamp;
    profile.skill_tags = skill_tags;
    profile.bump = ctx.bumps.agent_profile;

    emit!(AgentRegistered {
        agent: authority_key,
        profile: profile_key,
    });

    Ok(())
}

/// Update agent skill tags.
pub fn update_agent_skills(ctx: Context<UpdateAgentSkills>, skill_tags: u8) -> Result<()> {
    let agent_key = ctx.accounts.authority.key();
    let profile = &mut ctx.accounts.agent_profile;
    profile.skill_tags = skill_tags;

    emit!(AgentProfileUpdated {
        agent: agent_key,
        reputation_score: profile.reputation_score,
        tasks_completed: profile.tasks_completed,
    });

    Ok(())
}
