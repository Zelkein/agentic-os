import type { ChatPastedBlock } from "@/types/chat-composer";
import type { AiModel, PermissionMode, TaskLevel } from "@/types/task";

export interface GoalDraftAttachment {
  fileName: string;
  relativePath: string;
  extension: string;
  sizeBytes: number;
}

export interface GoalDraftPayload {
  version: 1;
  id: string;
  clientId: string | null;
  title: string;
  message: string;
  attachments: GoalDraftAttachment[];
  level: TaskLevel;
  permissionMode: PermissionMode;
  model: AiModel | null;
  tag: string | null;
  pastedBlocks: ChatPastedBlock[];
  createdAt: string;
  updatedAt: string;
}
