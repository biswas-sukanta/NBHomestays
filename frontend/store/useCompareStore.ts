import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface CompareState {
    selectedIds: string[];
    addToCompare: (id: string) => void;
    removeFromCompare: (id: string) => void;
    clear: () => void;
}

export const useCompareStore = create<CompareState>()(
    persist(
        (set) => ({
            selectedIds: [],
            addToCompare: (id) => set((state) => {
                if (state.selectedIds.includes(id)) return state;
                if (state.selectedIds.length >= 3) {
                    alert("You can only compare up to 3 homestays.");
                    return state;
                }
                return { selectedIds: [...state.selectedIds, id] };
            }),
            removeFromCompare: (id) => set((state) => ({
                selectedIds: state.selectedIds.filter((itemId) => itemId !== id)
            })),
            clear: () => set({ selectedIds: [] }),
        }),
        {
            name: 'homestay-compare-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
