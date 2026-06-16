import { create } from "zustand";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  taskId: string | null;
  read: number;
  createdAt: string;
}

interface NotificationStore {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;

  fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  addNotification: (notification: AppNotification) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (unreadOnly = false) => {
    set({ isLoading: true });
    try {
      const url = unreadOnly
        ? "/api/notifications?unread=true&limit=50"
        : "/api/notifications?limit=50";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        set({
          notifications: data.notifications,
          unreadCount: data.unreadCount,
        });
      }
    } catch (err) {
      console.error("[notification-store] Failed to fetch:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  markRead: async (id) => {
    try {
      await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
        method: "POST",
      });
      set((s) => ({
        notifications: s.notifications.map((n) =>
          n.id === id ? { ...n, read: 1 } : n
        ),
        unreadCount: Math.max(0, s.unreadCount - 1),
      }));
    } catch (err) {
      console.error("[notification-store] Failed to mark read:", err);
    }
  },

  markAllRead: async () => {
    try {
      await fetch("/api/notifications", { method: "PUT" });
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, read: 1 })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error("[notification-store] Failed to mark all read:", err);
    }
  },

  addNotification: (notification) => {
    set((s) => ({
      notifications: [notification, ...s.notifications],
      unreadCount: s.unreadCount + (notification.read ? 0 : 1),
    }));
  },
}));
