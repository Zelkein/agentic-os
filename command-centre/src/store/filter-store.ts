import { create } from "zustand";

export interface FilterState {
  status: string | null;
  priority: string | null;
  tagIds: string[];
  searchQuery: string;
  dueDateFrom: string | null;
  dueDateTo: string | null;
}

export interface SavedView {
  id: string;
  name: string;
  filters: FilterState;
  sort: string;
  viewType: string;
  clientId: string | null;
  createdAt: string;
  updatedAt: string;
}

const defaultFilters: FilterState = {
  status: null,
  priority: null,
  tagIds: [],
  searchQuery: "",
  dueDateFrom: null,
  dueDateTo: null,
};

interface FilterStore {
  filters: FilterState;
  savedViews: SavedView[];
  activeViewId: string | null;
  isLoadingViews: boolean;

  setFilter: (key: keyof FilterState, value: any) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  hasActiveFilters: () => boolean;

  fetchSavedViews: () => Promise<void>;
  saveView: (name: string, viewType?: string) => Promise<void>;
  deleteView: (id: string) => Promise<void>;
  applyView: (view: SavedView) => void;
}

export const useFilterStore = create<FilterStore>((set, get) => ({
  filters: { ...defaultFilters },
  savedViews: [],
  activeViewId: null,
  isLoadingViews: false,

  setFilter: (key, value) => {
    set((s) => ({
      filters: { ...s.filters, [key]: value },
      activeViewId: null,
    }));
  },

  setFilters: (partial) => {
    set((s) => ({
      filters: { ...s.filters, ...partial },
      activeViewId: null,
    }));
  },

  resetFilters: () => {
    set({ filters: { ...defaultFilters }, activeViewId: null });
  },

  hasActiveFilters: () => {
    const f = get().filters;
    return (
      f.status !== null ||
      f.priority !== null ||
      f.tagIds.length > 0 ||
      f.searchQuery !== "" ||
      f.dueDateFrom !== null ||
      f.dueDateTo !== null
    );
  },

  fetchSavedViews: async () => {
    set({ isLoadingViews: true });
    try {
      const res = await fetch("/api/saved-views");
      if (res.ok) {
        const views = await res.json();
        set({ savedViews: views });
      }
    } catch (err) {
      console.error("[filter-store] Failed to fetch saved views:", err);
    } finally {
      set({ isLoadingViews: false });
    }
  },

  saveView: async (name, viewType = "board") => {
    const { filters } = get();
    try {
      const res = await fetch("/api/saved-views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, filters, viewType }),
      });
      if (res.ok) {
        await get().fetchSavedViews();
      }
    } catch (err) {
      console.error("[filter-store] Failed to save view:", err);
    }
  },

  deleteView: async (id) => {
    try {
      const res = await fetch(`/api/saved-views?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        set((s) => ({
          savedViews: s.savedViews.filter((v) => v.id !== id),
          activeViewId: s.activeViewId === id ? null : s.activeViewId,
        }));
      }
    } catch (err) {
      console.error("[filter-store] Failed to delete view:", err);
    }
  },

  applyView: (view) => {
    set({
      filters: {
        ...defaultFilters,
        ...view.filters,
      },
      activeViewId: view.id,
    });
  },
}));
