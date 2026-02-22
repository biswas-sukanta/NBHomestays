import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TripBoardItem {
    id: string;
    name: string;
    imageUrl: string;
    locationName: string;
    pricePerNight: number;
}

interface TripBoardStore {
    items: TripBoardItem[];
    savedIds: Set<string>;
    toggleSave: (item: TripBoardItem) => void;
    isSaved: (id: string) => boolean;
    remove: (id: string) => void;
    getShareUrl: () => string;
}

export const useTripBoard = create<TripBoardStore>()(
    persist(
        (set, get) => ({
            items: [],
            savedIds: new Set(),

            toggleSave: (item) => {
                const { items, savedIds } = get();
                const newIds = new Set(savedIds);
                if (newIds.has(item.id)) {
                    newIds.delete(item.id);
                    set({ items: items.filter((i) => i.id !== item.id), savedIds: newIds });
                } else {
                    newIds.add(item.id);
                    set({ items: [...items, item], savedIds: newIds });
                }
            },

            isSaved: (id) => get().savedIds.has(id),

            remove: (id) => {
                const { items, savedIds } = get();
                const newIds = new Set(savedIds);
                newIds.delete(id);
                set({ items: items.filter((i) => i.id !== id), savedIds: newIds });
            },

            getShareUrl: () => {
                const ids = [...get().savedIds].join(',');
                if (typeof window === 'undefined') return '';
                return `${window.location.origin}/search?ids=${ids}`;
            },
        }),
        {
            name: 'nbh-trip-board',
            // Zustand persist stores Set differently — serialize/deserialize safely
            partialize: (state) => ({
                items: state.items,
                // Convert Set to Array for JSON serialization
                savedIds: [...state.savedIds],
            }),
            merge: (persisted: any, current) => ({
                ...current,
                items: (persisted as any).items ?? [],
                savedIds: new Set((persisted as any).savedIds ?? []),
            }),
        }
    )
);
