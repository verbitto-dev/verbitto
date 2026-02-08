use anchor_lang::prelude::*;

// ============================================================
// State accounts
// ============================================================

/// Global platform configuration. Singleton PDA.
#[account]
#[derive(InitSpace)]
pub struct Platform {
    /// Platform admin who can update config
    pub authority: Pubkey,
    /// Platform fee in basis points (e.g. 250 = 2.5%)
    pub fee_bps: u16,
    /// Minimum task bounty in lamports
    pub min_bounty_lamports: u64,
    /// Fee recipient wallet
    pub treasury: Pubkey,
    /// Global sequential task counter
    pub task_count: u64,
    /// Global sequential template counter
    pub template_count: u64,
    /// Cumulative settled volume in lamports
    pub total_settled_lamports: u64,
    /// Dispute voting period in seconds
    pub dispute_voting_period: i64,
    /// Minimum votes required to resolve a dispute
    pub dispute_min_votes: u8,
    /// Minimum reputation score required to vote on disputes
    pub min_voter_reputation: i64,
    /// Grace period (seconds) after deadline for Claimed tasks before expiry
    pub claim_grace_period: i64,
    /// Whether the platform is paused (emergency stop)
    pub is_paused: bool,
    /// PDA bump
    pub bump: u8,
}

/// Individual task with escrowed SOL bounty.
#[account]
#[derive(InitSpace)]
pub struct Task {
    /// Task creator (bounty depositor)
    pub creator: Pubkey,
    /// Sequential task index (global)
    pub task_index: u64,
    /// Bounty amount in lamports (held in this PDA)
    pub bounty_lamports: u64,
    /// Current task status
    pub status: TaskStatus,
    /// Assigned agent (Pubkey::default if unclaimed)
    pub agent: Pubkey,
    /// Unix timestamp deadline
    pub deadline: i64,
    /// Creation timestamp
    pub created_at: i64,
    /// Settlement timestamp (0 if unsettled)
    pub settled_at: i64,
    /// Reputation reward on task approval
    pub reputation_reward: i64,
    /// Task title (max 64 chars)
    #[max_len(64)]
    pub title: String,
    /// IPFS/Arweave content hash of full description
    pub description_hash: [u8; 32],
    /// Content hash of submitted deliverable
    pub deliverable_hash: [u8; 32],
    /// Template index (1-indexed, 0 = no template)
    pub template_index: u64,
    /// PDA bump
    pub bump: u8,
}

/// Reusable task template.
#[account]
#[derive(InitSpace)]
pub struct TaskTemplate {
    /// Template creator
    pub creator: Pubkey,
    /// Sequential template index
    pub template_index: u64,
    /// Template title
    #[max_len(64)]
    pub title: String,
    /// Description content hash
    pub description_hash: [u8; 32],
    /// Default bounty amount
    pub default_bounty_lamports: u64,
    /// Number of tasks created from this template
    pub times_used: u64,
    /// Task category
    pub category: TaskCategory,
    /// Whether template is active
    pub is_active: bool,
    /// PDA bump
    pub bump: u8,
}

/// Dispute record for a task.
#[account]
#[derive(InitSpace)]
pub struct Dispute {
    /// Task being disputed
    pub task: Pubkey,
    /// Who opened the dispute
    pub initiator: Pubkey,
    /// Reason category
    pub reason: DisputeReason,
    /// Evidence content hash
    pub evidence_hash: [u8; 32],
    /// Current dispute status
    pub status: DisputeStatus,
    /// Votes for creator wins
    pub votes_for_creator: u16,
    /// Votes for agent wins
    pub votes_for_agent: u16,
    /// Votes for 50/50 split
    pub votes_for_split: u16,
    /// When dispute was opened
    pub opened_at: i64,
    /// When dispute was resolved (0 if open)
    pub resolved_at: i64,
    /// Final ruling
    pub ruling: Ruling,
    /// PDA bump
    pub bump: u8,
}

/// Individual arbitrator vote on a dispute.
#[account]
#[derive(InitSpace)]
pub struct ArbitratorVote {
    /// Dispute being voted on
    pub dispute: Pubkey,
    /// Voter's pubkey
    pub arbitrator: Pubkey,
    /// Voter's ruling
    pub ruling: Ruling,
    /// When vote was cast
    pub voted_at: i64,
    /// PDA bump
    pub bump: u8,
}

/// On-chain agent identity and reputation profile.
/// PDA: [b"agent", authority]
#[account]
#[derive(InitSpace)]
pub struct AgentProfile {
    /// Agent wallet (signer authority)
    pub authority: Pubkey,
    /// Cumulative reputation score (can go negative)
    pub reputation_score: i64,
    /// Total tasks successfully completed
    pub tasks_completed: u64,
    /// Total tasks that went to dispute
    pub tasks_disputed: u64,
    /// Disputes where agent won
    pub disputes_won: u64,
    /// Disputes where agent lost
    pub disputes_lost: u64,
    /// Total SOL earned (lamports)
    pub total_earned_lamports: u64,
    /// Registration timestamp
    pub registered_at: i64,
    /// Skill bitmap (bit 0=DataLabeling, 1=LiteratureReview, ..., 6=Other)
    pub skill_tags: u8,
    /// PDA bump
    pub bump: u8,
}

// ============================================================
// Enums
// ============================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum TaskStatus {
    /// Accepting claims
    Open,
    /// Agent is working
    Claimed,
    /// Deliverable submitted, awaiting review
    Submitted,
    /// Creator approved, escrow settled
    Approved,
    /// Creator rejected submission
    Rejected,
    /// Creator cancelled (pre-claim)
    Cancelled,
    /// Past deadline, funds refunded
    Expired,
    /// Under dispute arbitration
    Disputed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum TaskCategory {
    DataLabeling,
    LiteratureReview,
    CodeReview,
    Translation,
    Analysis,
    Research,
    Other,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum DisputeReason {
    QualityIssue,
    DeadlineMissed,
    Plagiarism,
    Other,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum DisputeStatus {
    Open,
    Resolved,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum Ruling {
    Pending,
    CreatorWins,
    AgentWins,
    Split,
}
