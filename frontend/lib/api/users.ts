import { axiosInstance as api } from '../api-client';

export interface BadgeDto {
    id: string;
    name: string;
    slug: string;
    iconUrl?: string;
    description?: string;
    badgeType?: string;
    xpReward?: number;
    stageNumber?: number;
    awardedAt?: string;
    isPinned?: boolean;
    awardReason?: string;
}

export interface PublicProfile {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatar?: string;
    bio?: string;
    communityPoints: number;
    badges: string[];
    verifiedHost: boolean;
    followersCount: number;
    followingCount: number;
    postCount: number;
    isFollowing: boolean;
    homestays: any[];
    posts: any[];
    // Frictionless profile fields
    displayName?: string;
    location?: string;
    languages?: string[];
    interests?: string[];
    travellerType?: string;
    socialLinks?: Record<string, string>;
    verificationStatus?: string;
    // Gamification fields
    totalXp?: number;
    currentStageTitle?: string;
    currentStageIconUrl?: string;
    xpToNextStage?: number;
    pinnedBadges?: BadgeDto[];
    allBadges?: BadgeDto[];
}

export const userApi = {
    updateProfile: (data: any) => api.put('/users/profile', data),
    getProfile: (userId: string, viewerId?: string | null) => {
        const params = viewerId ? `?viewerId=${viewerId}` : '';
        return api.get<PublicProfile>(`/users/${userId}/profile${params}`);
    },
    follow: (userId: string) => api.post(`/users/${userId}/follow`),
    unfollow: (userId: string) => api.delete(`/users/${userId}/follow`),
    toggleBadgePin: (badgeId: string) => api.put(`/users/badges/${badgeId}/pin`)
};
