import { NormalizedPost } from '@/lib/adapters/normalizePost';

export type CommunityPost = NormalizedPost;

export interface QuotePost {
    id: string;
    authorName: string;
    textContent: string;
}
