import type { TaskLevel } from "@/types/task";

/**
 * Shared level constants for UI routing across the app.
 *
 * Colors are kept in sync with the values used inline in
 * `src/components/board/task-create-input.tsx` — update both if they change.
 */

export const LEVEL_COLORS: Record<TaskLevel, { bg: string; text: string }> = {
  task: { bg: "#E8E6E4", text: "#5E5E65" },
  project: { bg: "#FFDBCF", text: "#390C00" },
  gsd: { bg: "#DBEAFE", text: "#1E40AF" },
};

export const LEVEL_LABELS: Record<TaskLevel, string> = {
  task: "Task",
  project: "Planned project",
  gsd: "GSD project",
};

export const LEVEL_HINTS: Record<TaskLevel, string> = {
  task: "One-off deliverable",
  project: "Brief + subtasks",
  gsd: "Phases + verification",
};

export const LEVEL_ICONS: Record<TaskLevel, string> = {
  task: "•",
  project: "▣",
  gsd: "◆",
};
