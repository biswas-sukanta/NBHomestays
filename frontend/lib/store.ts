import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface HomestaySummary {
    id: string;
    name: string;
    price: number;
    image: string;
    rating: number;
}

interface CompareState {
    selectedHomestays: HomestaySummary[];
    isOpen: boolean;
    addHomestay: (homestay: HomestaySummary) => void;
    removeHomestay: (id: string) => void;
    toggleDrawer: () => void;
    clear: () => void;
}

export const useCompareStore = create<CompareState>()(
    persist(
        (set) => ({
            selectedHomestays: [],
            isOpen: false,
            addHomestay: (homestay) =>
                set((state) => {
                    if (state.selectedHomestays.length >= 3) return state;
                    if (state.selectedHomestays.find((h) => h.id === homestay.id)) return state;
                    return { selectedHomestays: [...state.selectedHomestays, homestay], isOpen: true };
                }),
            removeHomestay: (id) =>
                set((state) => ({
                    selectedHomestays: state.selectedHomestays.filter((h) => h.id !== id),
                })),
            toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
            clear: () => set({ selectedHomestays: [], isOpen: false }),
        }),
        {
            name: 'compare-storage',
        }
    )
);
