import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postApi } from '@/lib/api/posts';

interface HelpfulVoteResponse {
    helpfulCount: number;
    voted: boolean;
}

/**
 * React Query hook for marking a post as helpful.
 * 
 * Cache key uses ['community', 'posts'] prefix to match actual feed query keys
 * which are structured as ['community', 'posts', { tag, scope, viewerId }].
 */
export function useHelpfulVote(postId: string) {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async () => {
            const response = await postApi.markHelpful(postId);
            return response.data as HelpfulVoteResponse;
        },
        onSuccess: (data) => {
            // Update feed cache with new helpful count
            // Use ['community', 'posts'] prefix to match all feed permutations
            queryClient.setQueriesData(
                { queryKey: ['community', 'posts'] },
                (old: any) => {
                    if (!old) return old;
                    // Handle infinite query structure
                    if (old.pages) {
                        return {
                            ...old,
                            pages: old.pages.map((page: any) => ({
                                ...page,
                                posts: page.posts.map((post: any) =>
                                    post.postId === postId
                                        ? { ...post, helpfulCount: data.helpfulCount }
                                        : post
                                ),
                            })),
                        };
                    }
                    // Handle regular query structure
                    if (old.posts) {
                        return {
                            ...old,
                            posts: old.posts.map((post: any) =>
                                post.postId === postId
                                    ? { ...post, helpfulCount: data.helpfulCount }
                                    : post
                            ),
                        };
                    }
                    return old;
                }
            );
        },
        onError: (error: any) => {
            // Handle specific error cases
            if (error?.response?.status === 409) {
                console.warn('Already marked as helpful');
            } else if (error?.response?.status === 403) {
                console.warn('Cannot mark own post as helpful');
            }
        },
    });
}
