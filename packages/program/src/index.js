import { PublicKey } from '@solana/web3.js';
// ============================================================
// Program ID & PDA helpers
// ============================================================
export const PROGRAM_ID = new PublicKey('4r3ciYyag1GhBjep45mTs7nGa92kpYfRj3pqFnDqckP5');
export function getPlatformPda() {
    const [pda] = PublicKey.findProgramAddressSync([Buffer.from('platform')], PROGRAM_ID);
    return pda;
}
export function getTaskPda(creator, taskIndex) {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(taskIndex);
    const [pda] = PublicKey.findProgramAddressSync([Buffer.from('task'), creator.toBuffer(), buf], PROGRAM_ID);
    return pda;
}
export function getAgentProfilePda(authority) {
    const [pda] = PublicKey.findProgramAddressSync([Buffer.from('agent'), authority.toBuffer()], PROGRAM_ID);
    return pda;
}
export function getCreatorCounterPda(creator) {
    const [pda] = PublicKey.findProgramAddressSync([Buffer.from('creator'), creator.toBuffer()], PROGRAM_ID);
    return pda;
}
export function getDisputePda(task) {
    const [pda] = PublicKey.findProgramAddressSync([Buffer.from('dispute'), task.toBuffer()], PROGRAM_ID);
    return pda;
}
export function getVotePda(dispute, voter) {
    const [pda] = PublicKey.findProgramAddressSync([Buffer.from('vote'), dispute.toBuffer(), voter.toBuffer()], PROGRAM_ID);
    return pda;
}
// ============================================================
// Account discriminators (first 8 bytes of sha256("account:<Name>"))
// Anchor convention
// ============================================================
// Pre-computed for gPA filters
export const DISCRIMINATOR = {
    Platform: Buffer.from([251, 106, 172, 14, 5, 51, 151, 248]),
    Task: Buffer.from([79, 34, 229, 55, 29, 131, 27, 76]),
    AgentProfile: Buffer.from([184, 130, 83, 39, 187, 165, 200, 25]),
    CreatorCounter: Buffer.from([182, 100, 132, 148, 21, 108, 198, 89]),
};
// ============================================================
// Task status enum (mirrors Rust)
// ============================================================
export const TASK_STATUS = [
    'Open',
    'Claimed',
    'Submitted',
    'Approved',
    'Rejected',
    'Cancelled',
    'Expired',
    'Disputed',
];
export const STATUS_VARIANTS = {
    Open: 'outline',
    Claimed: 'secondary',
    Submitted: 'default',
    Approved: 'default',
    Rejected: 'destructive',
    Cancelled: 'secondary',
    Expired: 'secondary',
    Disputed: 'destructive',
};
// ============================================================
// Manual deserialization (no IDL dependency)
// ============================================================
export function decodePlatform(data) {
    let offset = 8; // skip discriminator
    const authority = new PublicKey(data.subarray(offset, offset + 32));
    offset += 32;
    const feeBps = data.readUInt16LE(offset);
    offset += 2;
    const minBountyLamports = data.readBigUInt64LE(offset);
    offset += 8;
    const treasury = new PublicKey(data.subarray(offset, offset + 32));
    offset += 32;
    const taskCount = data.readBigUInt64LE(offset);
    offset += 8;
    const templateCount = data.readBigUInt64LE(offset);
    offset += 8;
    const totalSettledLamports = data.readBigUInt64LE(offset);
    offset += 8;
    const disputeVotingPeriod = data.readBigInt64LE(offset);
    offset += 8;
    const disputeMinVotes = data.readUInt8(offset);
    offset += 1;
    const minVoterReputation = data.readBigInt64LE(offset);
    offset += 8;
    const claimGracePeriod = data.readBigInt64LE(offset);
    offset += 8;
    const isPaused = data.readUInt8(offset) === 1;
    offset += 1;
    const bump = data.readUInt8(offset);
    return {
        authority,
        feeBps,
        minBountyLamports,
        treasury,
        taskCount,
        templateCount,
        totalSettledLamports,
        disputeVotingPeriod,
        disputeMinVotes,
        minVoterReputation,
        claimGracePeriod,
        isPaused,
        bump,
    };
}
export function decodeTask(pubkey, data) {
    let offset = 8; // skip discriminator
    const creator = new PublicKey(data.subarray(offset, offset + 32));
    offset += 32;
    const taskIndex = data.readBigUInt64LE(offset);
    offset += 8;
    const bountyLamports = data.readBigUInt64LE(offset);
    offset += 8;
    const statusByte = data.readUInt8(offset);
    offset += 1;
    const status = TASK_STATUS[statusByte] ?? 'Open';
    const agent = new PublicKey(data.subarray(offset, offset + 32));
    offset += 32;
    const deadline = data.readBigInt64LE(offset);
    offset += 8;
    const createdAt = data.readBigInt64LE(offset);
    offset += 8;
    const settledAt = data.readBigInt64LE(offset);
    offset += 8;
    const reputationReward = data.readBigInt64LE(offset);
    offset += 8;
    // String: 4-byte length prefix + utf8
    const titleLen = data.readUInt32LE(offset);
    offset += 4;
    const title = data.subarray(offset, offset + titleLen).toString('utf8');
    offset += titleLen;
    const descriptionHash = new Uint8Array(data.subarray(offset, offset + 32));
    offset += 32;
    const deliverableHash = new Uint8Array(data.subarray(offset, offset + 32));
    offset += 32;
    const templateIndex = data.readBigUInt64LE(offset);
    offset += 8;
    const rejectionCount = data.readUInt8(offset);
    offset += 1;
    const bump = data.readUInt8(offset);
    return {
        publicKey: pubkey,
        creator,
        taskIndex,
        bountyLamports,
        status,
        agent,
        deadline,
        createdAt,
        settledAt,
        reputationReward,
        title,
        descriptionHash,
        deliverableHash,
        templateIndex,
        rejectionCount,
        bump,
    };
}
//# sourceMappingURL=index.js.map