'use client';
import { create } from 'zustand';
import type { Swarm, SwarmPane, SwarmMailboxMessage, SwarmLayout } from '@/types/swarm';

interface SwarmState {
  swarms: Swarm[];
  selectedSwarm: Swarm | null;
  panes: SwarmPane[];
  mailbox: SwarmMailboxMessage[];
  unreadCount: number;
  loading: boolean;
  error: string | null;

  // Actions
  fetchSwarms: () => Promise<void>;
  selectSwarm: (id: string | null) => Promise<void>;
  createSwarm: (name: string, workspaceId: string, projectSlug?: string, layout?: SwarmLayout) => Promise<Swarm | null>;
  deleteSwarm: (id: string) => Promise<void>;
  addPane: (swarmId: string, agentId: string, role: string, provider?: string) => Promise<void>;
  removePane: (id: string) => Promise<void>;
  updatePaneStatus: (id: string, status: string) => Promise<void>;
  sendMailboxMessage: (swarmId: string, senderPaneId: string, subject: string, body: string, options?: any) => Promise<void>;
  fetchMailbox: (swarmId: string) => Promise<void>;
}

const API = '/api/swarms';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${err.slice(0, 200)}`);
  }
  return res.json();
}

export const useSwarmStore = create<SwarmState>((set, get) => ({
  swarms: [],
  selectedSwarm: null,
  panes: [],
  mailbox: [],
  unreadCount: 0,
  loading: false,
  error: null,

  fetchSwarms: async () => {
    set({ loading: true, error: null });
    try {
      const data = await apiFetch<{ swarms: Swarm[] }>(API);
      set({ swarms: data.swarms, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  selectSwarm: async (id) => {
    set({ loading: true, error: null });
    try {
      const [swarmRes, panesRes] = await Promise.all([
        apiFetch<Swarm>(`${API}/${id}`),
        apiFetch<{ panes: SwarmPane[] }>(`${API}/${id}/panes`),
      ]);
      set({ selectedSwarm: swarmRes, panes: panesRes.panes, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  createSwarm: async (name, workspaceId, projectSlug, layout) => {
    try {
      const res = await apiFetch<Swarm>(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, workspaceId, projectSlug, layout }),
      });
      await get().fetchSwarms();
      return res;
    } catch (e: any) {
      set({ error: e.message });
      return null;
    }
  },

  deleteSwarm: async (id) => {
    try {
      await apiFetch(`${API}/${id}`, { method: 'DELETE' });
      if (get().selectedSwarm?.id === id) set({ selectedSwarm: null, panes: [] });
      await get().fetchSwarms();
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  addPane: async (swarmId, agentId, role, provider) => {
    try {
      await apiFetch(`${API}/${swarmId}/panes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, role, provider }),
      });
      const panesRes = await apiFetch<{ panes: SwarmPane[] }>(`${API}/${swarmId}/panes`);
      set({ panes: panesRes.panes });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  removePane: async (id) => {
    try {
      await apiFetch(`${API}/panes/${id}`, { method: 'DELETE' });
      set((s) => ({ panes: s.panes.filter((p) => p.id !== id) }));
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  updatePaneStatus: async (id, status) => {
    try {
      await apiFetch(`${API}/panes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      set((s) => ({ panes: s.panes.map((p) => p.id === id ? { ...p, status: status as any } : p) }));
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  sendMailboxMessage: async (swarmId, senderPaneId, subject, body, options) => {
    try {
      await apiFetch(`${API}/${swarmId}/mailbox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderPaneId, subject, body, ...options }),
      });
      await get().fetchMailbox(swarmId);
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  fetchMailbox: async (swarmId) => {
    try {
      const data = await apiFetch<{ messages: SwarmMailboxMessage[] }>(`${API}/${swarmId}/mailbox`);
      set({ mailbox: data.messages });
    } catch (e: any) {
      set({ error: e.message });
    }
  },
}));
