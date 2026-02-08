use anchor_lang::prelude::*;

use crate::contexts::*;
use crate::errors::VerbittoError;
use crate::events::*;

/// Create a reusable task template.
pub fn create_template(
    ctx: Context<CreateTemplate>,
    title: String,
    description_hash: [u8; 32],
    default_bounty_lamports: u64,
    category: crate::state::TaskCategory,
) -> Result<()> {
    require!(title.len() <= 64, VerbittoError::TitleTooLong);

    let platform = &mut ctx.accounts.platform;
    let template_index = platform.template_count;
    platform.template_count += 1;

    let template_key = ctx.accounts.template.key();
    let creator_key = ctx.accounts.creator.key();
    let t = &mut ctx.accounts.template;
    t.creator = creator_key;
    t.template_index = template_index;
    t.title = title;
    t.description_hash = description_hash;
    t.default_bounty_lamports = default_bounty_lamports;
    t.times_used = 0;
    t.category = category;
    t.is_active = true;
    t.bump = ctx.bumps.template;

    emit!(TemplateCreated {
        template: template_key,
        creator: creator_key,
        template_index,
        category,
    });

    Ok(())
}

/// Deactivate a task template. Only the template creator can call.
pub fn deactivate_template(ctx: Context<DeactivateTemplate>) -> Result<()> {
    let t = &mut ctx.accounts.template;
    require!(t.is_active, VerbittoError::TemplateInactive);
    t.is_active = false;
    Ok(())
}
