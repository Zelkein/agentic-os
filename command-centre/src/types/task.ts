export type TaskStatus = "backlog" | "queued" | "running" | "review" | "done";
export type TaskLevel = "task" | "project" | "gsd";

// Human-friendly labels and hints for task levels now live in `@/lib/levels`
// to keep a single source of truth across the app.

export type GsdStep = "discuss" | "plan" | "execute" | "verify";
export type PermissionMode = "plan" | "default" | "acceptEdits" | "auto" | "bypassPermissions";

/** Provider-agnostic AI model identifier (was ClaudeModel). */
export type AiModel =
  | "opus"
  | "sonnet"
  | "haiku"
  | "deepseek-v4-pro"
  | "deepseek-v4-flash"
  | "deepseek-chat"
  | "deepseek-coder"
  | "deepseek-reasoner"
  | "glm-4-7-flash"
  | "vision";

/** @deprecated Use AiModel instead. */
export type ClaudeModel = AiModel;

export interface Todo {
  content: string;
  status: "pending" | "in_progress" | "completed";
  activeForm?: string;
}

export const PERMISSION_MODE_LABELS: Record<PermissionMode, string> = {
  plan: "Plan",
  default: "Default",
  acceptEdits: "Auto-edit",
  auto: "Auto",
  bypassPermissions: "Full auto",
};

export const PERMISSION_MODE_HINTS: Record<PermissionMode, string> = {
  plan: "Claude plans first, then asks you to approve",
  default: "Claude asks before making big changes — set up in settings.json",
  acceptEdits: "File edits happen automatically, commands still need approval",
  auto: "Claude works independently with minimal check-ins",
  bypassPermissions: "Everything runs without asking — no safety net",
};

export type LogEntryType =
  | "text"
  | "tool_use"
  | "tool_result"
  | "question"
  | "structured_question"
  | "user_reply"
  | "system";

export interface LogEntry {
  id: string;
  type: LogEntryType;
  timestamp: string;
  content: string;
  toolName?: string;
  toolArgs?: string;
  toolResult?: string;
  isCollapsed?: boolean;
  /** JSON-serialised QuestionSpec[] when type === "structured_question" */
  questionSpec?: string;
  /** JSON-serialised QuestionAnswers once the user has replied */
  questionAnswers?: string;
  /** Task ID this entry came from (set when merging parent + subtask logs). */
  sourceTaskId?: string;
  /** Permission mode active when this user_reply was sent */
  permissionMode?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  level: TaskLevel;
  parentId: string | null;
  projectSlug: string | null;
  columnOrder: number;
  createdAt: string;
  updatedAt: string;
  costUsd: number | null;
  tokensUsed: number | null;
  durationMs: number | null;
  activityLabel: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  clientId: string | null;
  needsInput: boolean;
  phaseNumber: number | null;
  gsdStep: GsdStep | null;
  contextSources: string | null;
  cronJobSlug: string | null;
  claudeSessionId: string | null;
  claudePid?: number | null;
  permissionMode: PermissionMode;
  executionPermissionMode?: PermissionMode | null;
  model?: ClaudeModel | null;
  lastReplyAt: string | null;
  conversationId?: string | null;
  originMessageId?: string | null;
  teamId?: string | null;
  coordinationLevel?: "inject" | "shared_context" | "team" | null;
  goalGroup: string | null;
  tag: string | null;
  pinnedAt: string | null;
  dependsOnTaskIds?: string[] | null;
  /** Worktree isolation mode for parallel execution */
  isolation?: "none" | "worktree" | null;
  /** Absolute path to the git worktree when running in isolation */
  worktreePath?: string | null;
  /** Git branch name for the worktree */
  worktreeBranch?: string | null;
  /** ClickUp Clone: priority level */
  priority?: "none" | "urgent" | "high" | "normal" | "low";
  /** ClickUp Clone: due date ISO string */
  dueDate?: string | null;
  /** ClickUp Clone: start date ISO string */
  startDate?: string | null;
  /** ClickUp Clone: resolved tag objects (populated by API) */
  tags?: Tag[];
}

export interface OutputFile {
  id: string;
  taskId: string;
  fileName: string;
  filePath: string;
  relativePath: string;
  extension: string;
  sizeBytes: number | null;
  createdAt: string;
  diffStatus?: "added" | "modified" | "unchanged";
}

export interface TaskCreateInput {
  title: string;
  description?: string | null;
  level: TaskLevel;
  projectSlug?: string | null;
  clientId?: string | null;
  parentId?: string | null;
  phaseNumber?: number | null;
  gsdStep?: GsdStep | null;
  permissionMode?: PermissionMode;
  executionPermissionMode?: PermissionMode | null;
  model?: ClaudeModel | null;
  conversationId?: string | null;
  originMessageId?: string | null;
}

export type TaskUpdateInput = Partial<
  Pick<
    Task,
    | "title"
    | "description"
    | "status"
    | "level"
    | "parentId"
    | "projectSlug"
    | "columnOrder"
    | "costUsd"
    | "tokensUsed"
    | "durationMs"
    | "activityLabel"
    | "errorMessage"
    | "startedAt"
    | "completedAt"
    | "clientId"
    | "needsInput"
    | "phaseNumber"
    | "gsdStep"
    | "permissionMode"
    | "executionPermissionMode"
    | "model"
    | "conversationId"
    | "originMessageId"
    | "teamId"
    | "coordinationLevel"
    | "goalGroup"
    | "tag"
    | "pinnedAt"
    | "isolation"
    | "worktreePath"
    | "worktreeBranch"
    | "priority"
    | "dueDate"
    | "startDate"
  >
>;

/** ClickUp Clone: color-coded tag/label */
export interface Tag {
  id: string;
  name: string;
  color: string;
  clientId: string | null;
  createdAt: string;
}

/** ClickUp Clone: comment on a task */
export interface TaskComment {
  id: string;
  taskId: string;
  author: string;
  content: string;
  createdAt: string;
}
