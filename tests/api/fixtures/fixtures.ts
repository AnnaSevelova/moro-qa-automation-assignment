import { expect, test as base } from '@playwright/test';

import { TodoApi, type Task } from '../clients/todo-api.ts';
import { uniqueText } from './test-data.ts';

type ApiFixtures = {
    todoApi: TodoApi;
    /** Creates a task that is deleted again after the test, so tests don't leave data behind. */
    createTask: (text?: string) => Promise<Task>;
};

export const test = base.extend<ApiFixtures>({
    todoApi: async ({ request }, use) => use(new TodoApi(request)),
    createTask: async ({ todoApi }, use, testInfo) => {
        const createdIds: string[] = [];

        await use(async (text = uniqueText(testInfo.title)) => {
            const task = await todoApi.createOk(text);
            createdIds.push(task.id);

            return task;
        });

        // Tests may delete their tasks themselves, so a 404 here is fine.
        const results = await Promise.allSettled(createdIds.map(async (id) => {
            const response = await todoApi.delete(id);
            expect([200, 404], `Cleanup of task ${id}: ${await response.text()}`).toContain(response.status());
        }));
        const failures = results.filter((result) => result.status === 'rejected');
        if (failures.length > 0) {
            throw new AggregateError(failures.map((result) => result.reason), 'Task cleanup failed');
        }
    },
});

export { expect } from '@playwright/test';
