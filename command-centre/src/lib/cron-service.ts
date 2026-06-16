import { getConfig } from "./config";
import { getCronSystemStatus } from "./cron-system-status";
import type {
  CronJob,
  CronRun,
  CronJobCreateInput,
  CronJobUpdateInput,
  CronSystemStatus,
} from "@/types/cron";

let cachedCronRuntime: any = null;

function getCronRuntime() {
  if (!cachedCronRuntime) {
    cachedCronRuntime = require("./cron-runtime.js");
  }

  return cachedCronRuntime;
}

function getAgenticOsDir(): string {
  return getConfig().agenticOsDir;
}

export function isSupportedCronDays(days: string): boolean {
  return getCronRuntime().isSupportedCronDays(days);
}

export function isSupportedCronTime(time: string): boolean {
  return getCronRuntime().isSupportedCronTime(time);
}

export function isSupportedCronSchedule(time: string, days: string): boolean {
  return getCronRuntime().isSupportedCronSchedule(time, days);
}

export function getCronScheduleValidationError(
  time: string,
  days: string
): string | null {
  return getCronRuntime().getCronScheduleValidationError(time, days);
}

export function listCronJobs(clientId?: string | null): CronJob[] {
  return getCronRuntime().listCronJobs(getAgenticOsDir(), clientId ?? null);
}

export function listAllCronJobs(): CronJob[] {
  return getCronRuntime().listAllCronJobs(getAgenticOsDir());
}

export function getCronJob(slug: string, clientId?: string | null): CronJob | null {
  return getCronRuntime().getCronJob(getAgenticOsDir(), slug, clientId ?? null);
}

export function createCronJob(
  input: CronJobCreateInput,
  clientId?: string | null
): CronJob {
  return getCronRuntime().createCronJob(getAgenticOsDir(), clientId ?? null, input);
}

export function updateCronJob(
  slug: string,
  input: CronJobUpdateInput,
  clientId?: string | null
): CronJob {
  return getCronRuntime().updateCronJob(getAgenticOsDir(), clientId ?? null, slug, input);
}

export function deleteCronJob(slug: string, clientId?: string | null): void {
  getCronRuntime().deleteCronJob(getAgenticOsDir(), clientId ?? null, slug);
}

export function getCronRunHistory(
  slug: string,
  clientId?: string | null
): CronRun[] {
  return getCronRuntime().getCronRunHistory(getAgenticOsDir(), slug, clientId ?? null);
}

export function getRawJobFile(
  slug: string,
  clientId?: string | null
): string | null {
  return getCronRuntime().getRawJobFile(getAgenticOsDir(), slug, clientId ?? null);
}

export function getCronJobLog(
  slug: string,
  clientId?: string | null
): string {
  return getCronRuntime().getCronJobLog(getAgenticOsDir(), slug, clientId ?? null);
}

export function enqueueCronJob(
  job: CronJob,
  options?: Record<string, unknown>
): { duplicate: boolean; task: any; cronRunId: number | null; scheduledFor?: string } {
  return getCronRuntime().enqueueCronJob(getAgenticOsDir(), job, options || {});
}

export function completeCronRunForTask(
  task: any,
  payload?: Record<string, unknown>
): void {
  getCronRuntime().completeCronRunForTask(getAgenticOsDir(), task, payload || {});
}

export function getManagedCronRuntimeStatus(
  localIdentifier?: string | null
): CronSystemStatus {
  return getCronSystemStatus(localIdentifier);
}

export function claimCronLeadership(candidate: Record<string, unknown>) {
  return getCronRuntime().claimRuntimeLeadership(getAgenticOsDir(), candidate);
}

export function refreshCronHeartbeat(identifier: string, updates?: Record<string, unknown>) {
  return getCronRuntime().refreshRuntimeHeartbeat(getAgenticOsDir(), identifier, updates || {});
}

export function releaseCronLeadership(identifier: string) {
  return getCronRuntime().releaseRuntimeLeadership(getAgenticOsDir(), identifier);
}

export function hasActiveCronJobs(): boolean {
  return getCronRuntime().hasActiveCronJobs(getAgenticOsDir());
}

export function getCronWorkspaceCount(): number {
  return getCronRuntime().listWorkspaceDescriptors(getAgenticOsDir()).length;
}

export function getMissedFixedRuns(time: string, days: string, start: Date, end: Date): Date[] {
  return getCronRuntime().getMissedFixedRuns(time, days, start, end);
}

export function matchesCronTime(now: Date, schedule: string): boolean {
  return getCronRuntime().matchesTime(now, schedule);
}

export function toCronMinuteIso(date: Date): string {
  return getCronRuntime().toMinuteIso(date);
}
