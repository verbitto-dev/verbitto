import type { PublicKey } from '@solana/web3.js';
import { type PlatformAccount, type TaskAccount } from '@/lib/program';
export declare function usePlatform(): {
    platform: PlatformAccount | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
};
export declare function useTasks(): {
    tasks: TaskAccount[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
};
export declare function shortKey(key: PublicKey | string, len?: number): string;
export declare function lamportsToSol(lamports: bigint): string;
export declare function formatDeadline(deadline: bigint): string;
