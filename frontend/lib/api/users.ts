import { axiosInstance as api } from '../api-client';

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
}

export const userApi = {
    updateProfile: (data: any) => api.put('/users/profile', data),
    getProfile: (userId: string) => api.get<PublicProfile>(`/users/${userId}/profile`),
    follow: (userId: string) => api.post(`/users/${userId}/follow`),
    unfollow: (userId: string) => api.delete(`/users/${userId}/follow`)
};
