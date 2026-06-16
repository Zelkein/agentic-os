import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { emitTaskEvent } from "@/lib/event-bus";
import { assertValidClientId } from "@/lib/clients";
import { getActivePermissionMode, getExecutionPermissionMode } from "@/lib/permission-mode";
import type { AiModel, Task, TaskCreateInput, Tag } from "@/types/task";

const VALID_MODELS: AiModel[] = ["opus", "sonnet", "haiku", "deepseek-v4-pro", "deepseek-v4-flash", "deepseek-chat", "deepseek-coder", "deepseek-reasoner", "glm-4-7-flash", "vision"];

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const clientIds = searchParams
      .get("clientIds")
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    // Build query with optional filters
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (status) {
      conditions.push("status = ?");
      params.push(status);
    }

    if (clientIds && clientIds.length > 0) {
      const includeRoot = clientIds.includes("_root");
      const scopedClientIds = clientIds.filter((value) => value !== "_root");
      const scopeConditions: string[] = [];

      if (includeRoot) {
        scopeConditions.push("clientId IS NULL");
      }

      if (scopedClientIds.length > 0) {
        scopeConditions.push(
          `clientId IN (${scopedClientIds.map(() => "?").join(", ")})`
        );
        params.push(...scopedClientIds);
      }

      if (scopeConditions.length > 0) {
        conditions.push(`(${scopeConditions.join(" OR ")})`);
      }
    } else if (clientId && clientId !== "root") {
      conditions.push("clientId = ?");
      params.push(clientId);
    }

    const where = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
    const rows = db
      .prepare(`SELECT * FROM tasks${where} ORDER BY columnOrder ASC`)
      .all(...params) as Array<Task & { dependsOnTaskIds: string | string[] | null }>;

// Normalize SQLite integer to boolean for needsInput, parse JSON fields
    const tasks: Task[] = rows.map((t) => {
      const task = {
        ...t,
        needsInput: Boolean(t.needsInput),
        dependsOnTaskIds:
          typeof t.dependsOnTaskIds === "string" && t.dependsOnTaskIds.length > 0
            ? (() => {
                try {
                  const parsed = JSON.parse(t.dependsOnTaskIds as string);
                  return Array.isArray(parsed) ? (parsed as string[]) : null;
                } catch {
                  return null;
                }
              })()
            : null,
      };
      // Fetch tags for this task
      const tags = db
        .prepare(
          `SELECT tg.* FROM tags tg
           INNER JOIN task_tags tt ON tt.tagId = tg.id
           WHERE tt.taskId = ?
           ORDER BY tg.name ASC`
        )
        .all(t.id) as Tag[];
      return { ...task, tags };
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();

    // Validate input
    const { title, description, level, projectSlug: bodyProjectSlug, clientId: bodyClientId, parentId: bodyParentId, phaseNumber: bodyPhaseNumber, gsdStep: bodyGsdStep, cronJobSlug: bodyCronJobSlug, permissionMode: bodyPermissionMode, executionPermissionMode: bodyExecutionPermissionMode, status: bodyStatus, dependsOnTaskIds: bodyDependsOnTaskIds, model: bodyModel } = body as TaskCreateInput & { cronJobSlug?: string; status?: string; dependsOnTaskIds?: string[] };
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "title is required and must be a non-empty string" },
        { status: 400 }
      );
    }
    if (!level || !["task", "project", "gsd"].includes(level)) {
      return NextResponse.json(
        { error: 'level is required and must be "task", "project", or "gsd"' },
        { status: 400 }
      );
    }
    if (bodyModel !== undefined && bodyModel !== null && !VALID_MODELS.includes(bodyModel)) {
      return NextResponse.json(
        { error: 'model must be "opus", "sonnet", "haiku", or null' },
        { status: 400 }
      );
    }

    let clientId: string | null;
    try {
      clientId = assertValidClientId(bodyClientId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid client selection";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // Get min columnOrder in queued — new tasks get lowest value to sort to top
    const minOrder = db
      .prepare(
        "SELECT COALESCE(MIN(columnOrder), 1) as minOrder FROM tasks WHERE status = 'queued'"
      )
      .get() as { minOrder: number };

    const now = new Date().toISOString();
    // Child tasks (with parentId) start as backlog — the auto-progression
    // system queues them when their turn comes. Top-level tasks start as queued
    // so the queue watcher picks them up immediately.
    // Allow explicit status override (e.g., "review" for scoping flow).
    const validStatuses = ["backlog", "queued", "review"];
    const initialStatus = (bodyStatus && validStatuses.includes(bodyStatus)
      ? bodyStatus
      : bodyParentId ? "backlog" : "queued") as Task["status"];
    const requestedPermissionMode = bodyCronJobSlug ? "bypassPermissions" : bodyPermissionMode;
    const permissionMode = getActivePermissionMode(requestedPermissionMode, "bypassPermissions");
    const executionPermissionMode = getExecutionPermissionMode(
      bodyExecutionPermissionMode ?? requestedPermissionMode,
      "bypassPermissions",
    );

const task: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description?.trim() || null,
      status: initialStatus,
      level,
      parentId: bodyParentId || null,
      projectSlug: bodyProjectSlug || null,
      columnOrder: minOrder.minOrder - 1,
      createdAt: now,
      updatedAt: now,
      costUsd: null,
      tokensUsed: null,
      durationMs: null,
      activityLabel: null,
      errorMessage: null,
      startedAt: null,
      completedAt: null,
      clientId,
      needsInput: false,
      phaseNumber: bodyPhaseNumber ?? null,
      gsdStep: bodyGsdStep ?? null,
      contextSources: null,
      cronJobSlug: bodyCronJobSlug || null,
      claudeSessionId: null,
      permissionMode,
      executionPermissionMode,
      model: bodyModel ?? null,
      lastReplyAt: null,
      goalGroup: null,
      tag: null,
      pinnedAt: null,
      dependsOnTaskIds:
        Array.isArray(bodyDependsOnTaskIds) && bodyDependsOnTaskIds.length > 0
          ? bodyDependsOnTaskIds
          : null,
      priority: "none",
      dueDate: null,
      startDate: null,
    };

    db.prepare(
      `INSERT INTO tasks (id, title, description, status, level, parentId, projectSlug, columnOrder, createdAt, updatedAt, costUsd, tokensUsed, durationMs, activityLabel, errorMessage, startedAt, completedAt, clientId, needsInput, phaseNumber, gsdStep, cronJobSlug, permissionMode, executionPermissionMode, model, dependsOnTaskIds, priority, dueDate, startDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      task.id,
      task.title,
      task.description,
      task.status,
      task.level,
      task.parentId,
      task.projectSlug,
      task.columnOrder,
      task.createdAt,
      task.updatedAt,
      task.costUsd,
      task.tokensUsed,
      task.durationMs,
      task.activityLabel,
      task.errorMessage,
      task.startedAt,
      task.completedAt,
      task.clientId,
      0,
      task.phaseNumber,
      task.gsdStep,
      task.cronJobSlug,
      task.permissionMode,
      task.executionPermissionMode,
task.model,
      task.dependsOnTaskIds ? JSON.stringify(task.dependsOnTaskIds) : null,
      task.priority,
      task.dueDate,
      task.startDate
    );

    emitTaskEvent({
      type: "task:created",
      task,
      timestamp: now,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
