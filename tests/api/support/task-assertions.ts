import { expect } from '@playwright/test';

import type { Task } from '../clients/todo-api.ts';

/** Checks that the object has the shape of a Task as described in the Swagger docs. */
export function expectValidTask(task: Task): void {
    expect(task).toEqual(expect.objectContaining({
        id: expect.any(String),
        text: expect.any(String),
        completed: expect.any(Boolean),
        createdDate: expect.any(Number),
    }));
    expect(task.id).not.toBe('');

    if (task.completed) {
        expect(task.completedDate).toEqual(expect.any(Number));
    } else {
        expect(task).not.toHaveProperty('completedDate');
    }
}

/** Checks that the timestamp was taken between `from` and `to` (both in ms). */
export function expectTimestampBetween(timestamp: number | undefined, from: number, to: number): void {
    expect(timestamp).toBeGreaterThanOrEqual(from);
    expect(timestamp).toBeLessThanOrEqual(to);
}
