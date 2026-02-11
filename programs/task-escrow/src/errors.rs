use anchor_lang::prelude::*;

#[error_code]
pub enum VerbittoError {
    #[msg("Fee basis points must be ≤ 3001 (50%)")]
    InvalidFee,
    #[msg("Invalid platform configuration")]
    InvalidConfig,
    #[msg("Bounty is below the platform minimum")]
    BountyTooLow,
    #[msg("Title exceeds 64 characters")]
    TitleTooLong,
    #[msg("Deadline must be in the future")]
    DeadlineInPast,
    #[msg("Reputation reward must be 0–1000")]
    InvalidRepReward,
    #[msg("Task is not in Open status")]
    TaskNotOpen,
    #[msg("Task has passed its deadline")]
    TaskExpired,
    #[msg("Task is not in Claimed or Rejected status")]
    TaskNotClaimedOrRejected,
    #[msg("Caller is not the assigned agent")]
    NotAssignedAgent,
    #[msg("Task is not in Submitted status")]
    TaskNotSubmitted,
    #[msg("Caller is not the task creator")]
    NotTaskCreator,
    #[msg("Deadline has not been reached yet")]
    DeadlineNotReached,
    #[msg("Task cannot be expired in its current status")]
    TaskCannotExpire,
    #[msg("Template is not active")]
    TemplateInactive,
    #[msg("Task is not in a disputable status")]
    TaskNotDisputable,
    #[msg("Caller is not a party to this task")]
    NotTaskParty,
    #[msg("Dispute is not open")]
    DisputeNotOpen,
    #[msg("Task is not in Disputed status")]
    TaskNotDisputed,
    #[msg("Invalid ruling value")]
    InvalidRuling,
    #[msg("Voting period has ended")]
    VotingPeriodEnded,
    #[msg("Voting period has not ended yet")]
    VotingPeriodNotEnded,
    #[msg("Task parties cannot vote on their own dispute")]
    PartyCannotVote,
    #[msg("Insufficient votes to resolve dispute")]
    InsufficientVotes,
    #[msg("Dispute does not reference this task")]
    DisputeTaskMismatch,
    #[msg("Treasury account does not match platform config")]
    InvalidTreasury,
    #[msg("Caller is not the profile owner")]
    NotProfileOwner,
    #[msg("Voter reputation is below the minimum required to vote")]
    InsufficientReputation,
    #[msg("Platform is paused")]
    PlatformPaused,
    #[msg("Platform is already paused")]
    PlatformAlreadyPaused,
    #[msg("Platform is not paused")]
    PlatformNotPaused,
    #[msg("Caller is not the platform authority")]
    NotPlatformAuthority,
    #[msg("Arithmetic overflow in calculation")]
    ArithmeticOverflow,
    #[msg("Maximum rejection limit reached — task auto-disputed")]
    MaxRejectionsReached,
    #[msg("Task index does not match creator counter")]
    InvalidTaskIndex,
}
