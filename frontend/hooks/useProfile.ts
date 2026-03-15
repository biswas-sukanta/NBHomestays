import { useQuery } from '@tanstack/react-query';
import { userApi, PublicProfile } from '@/lib/api/users';
import { queryKeys } from '@/lib/queryKeys';

/**
 * React Query hook for fetching user profile with viewer context.
 * 
 * Uses viewer-aware query key to prevent cross-user cache pollution
 * per guardrails in nbh_ai_prompts_with_guardrails.md.
 */
export function useProfile(targetId: string, viewerId?: string | null) {
    return useQuery({
        queryKey: queryKeys.users.profile(targetId, viewerId),
        queryFn: async () => {
            const response = await userApi.getProfile(targetId, viewerId);
            return response.data as PublicProfile;
        },
        staleTime: 60 * 1000, // 1 minute
        enabled: !!targetId,
    });
}

/**
 * Helper to compute next stage threshold from current XP.
 */
export function getNextStageThreshold(currentXp: number): number | undefined {
    const thresholds = [100, 500, 1500, 5000];
    return thresholds.find(t => t > currentXp);
}
