/** Id that no task has, for testing requests about tasks that don't exist. */
export const UNKNOWN_ID = 'unknown-task-id';

/** Unique task text, so tests running in parallel against the same backend don't collide. */
export function uniqueText(prefix: string): string {
    return `${prefix} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
