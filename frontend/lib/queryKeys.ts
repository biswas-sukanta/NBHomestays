export const queryKeys = {
  states: ['states'] as const,
  state: (slug: string) => ['state', { slug }] as const,

  destinations: {
    all: ['destinations', { scope: 'all' }] as const,
    byState: (slug: string) => ['destinations', { scope: 'state', slug }] as const,
    detail: (slug: string) => ['destination', { slug }] as const,
    homestays: (slug: string, category?: string) => ['destination', { slug }, 'homestays', { category }] as const,
  },

  homestays: {
    swimlane: (tag: string) => ['homestays', 'swimlane', { tag }] as const,
    featured: ['homestays', 'featured'] as const,
    all: ['homestays', 'all'] as const,
    search: (params: any) => ['homestays', 'search', params] as const,
    bounds: (params: any) => ['homestays', 'bounds', params] as const,
    lookup: ['homestays', 'lookup'] as const,
    byState: (slug: string, category?: string, bounded?: boolean) => ['homestays', 'state', { slug, category, bounded }] as const,
  },

  community: {
    feed: (tag?: string, scope?: 'latest' | 'following' | 'trending') => ['community', 'posts', { tag, scope: scope ?? 'latest' }] as const,
    trending: ['community', 'trending'] as const,
  },

  users: {
    profile: (id: string) => ['users', 'profile', { id }] as const,
  },
} as const;
