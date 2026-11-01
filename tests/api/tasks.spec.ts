import { expect, test } from './fixtures/fixtures.ts';
import { uniqueText } from './fixtures/test-data.ts';
import { expectTimestampBetween, expectValidTask } from './support/task-assertions.ts';

/**
 * Happy paths of the todo backend. Every test works with its own tasks (created through
 * the `createTask` fixture and deleted afterwards), because all tests share one backend.
 */
test.describe('Tasks API', () => {
    test('creates a task', async ({ todoApi }) => {
        const text = uniqueText('Create');
        const before = Date.now();

        const response = await todoApi.create({ text });

        expect(response.status()).toBe(200);
        const task = await response.json();
        try {
            expectValidTask(task);
            expect(task).toMatchObject({ text, completed: false });
            expectTimestampBetween(task.createdDate, before, Date.now());
        } finally {
            await todoApi.delete(task.id);
        }
    });

    test('assigns a unique id to each new task', async ({ createTask }) => {
        const first = await createTask('Same text');
        const second = await createTask('Same text');

        expect(first.id).not.toBe(second.id);
    });

    test('keeps special characters in the text', async ({ createTask }) => {
        const text = uniqueText('Dokončit "prezentaci" & <test> 🚀');

        const task = await createTask(text);

        expect(task.text).toBe(text);
    });

    test('lists all tasks, including newly created ones', async ({ todoApi, createTask }) => {
        const open = await createTask();
        const done = await createTask();
        await todoApi.completeOk(done.id);

        const tasks = await todoApi.getAllOk();

        expect(Array.isArray(tasks)).toBe(true);
        expect(tasks).toContainEqual(open);
        const listedDone = tasks.find((task) => task.id === done.id);
        expect(listedDone).toMatchObject({ completed: true });
        expectValidTask(listedDone!);
    });

    test('lists only completed tasks as completed', async ({ todoApi, createTask }) => {
        const open = await createTask();
        const done = await createTask();
        await todoApi.completeOk(done.id);

        const tasks = await todoApi.getCompletedOk();

        expect(tasks.every((task) => task.completed)).toBe(true);
        expect(tasks.map((task) => task.id)).toContain(done.id);
        expect(tasks.map((task) => task.id)).not.toContain(open.id);
    });

    test('updates the text of a task', async ({ todoApi, createTask }) => {
        const task = await createTask();
        const newText = uniqueText('Updated');

        const response = await todoApi.updateText(task.id, { text: newText });

        expect(response.status()).toBe(200);
        expect(await response.json()).toEqual({ ...task, text: newText });
        const listed = (await todoApi.getAllOk()).find((item) => item.id === task.id);
        expect(listed?.text).toBe(newText);
    });

    /*
     * The assignment asks for updating a task with PUT, but the backend only supports POST /tasks/{id}
     * for that (see README). These two tests show PUT is not part of the API, so the update test above uses POST.
     */
    test('documents POST, not PUT, for updating a task', async ({ request }) => {
        const response = await request.get('/v3/api-docs');

        expect(response.status()).toBe(200);
        const { paths } = await response.json();
        expect(Object.keys(paths['/tasks/{id}']).sort()).toEqual(['delete', 'post']);
    });

    test('does not support updating a task with PUT', async ({ request, todoApi, createTask }) => {
        const task = await createTask();

        const response = await request.put(`/tasks/${task.id}`, { data: { text: uniqueText('Updated') } });

        expect(response.status()).toBe(404);
        expect(await response.text()).toContain(`Cannot PUT /tasks/${task.id}`);
        const listed = (await todoApi.getAllOk()).find((item) => item.id === task.id);
        expect(listed?.text).toBe(task.text);
    });

    test('completes a task and marks it incomplete again', async ({ todoApi, createTask }) => {
        const task = await createTask();

        await test.step('Complete the task', async () => {
            const before = Date.now();
            const response = await todoApi.complete(task.id);

            expect(response.status()).toBe(200);
            const completed = await response.json();
            expectValidTask(completed);
            expect(completed).toMatchObject({ id: task.id, text: task.text, completed: true });
            expectTimestampBetween(completed.completedDate, before, Date.now());
        });

        await test.step('Mark it incomplete again', async () => {
            const response = await todoApi.incomplete(task.id);

            expect(response.status()).toBe(200);
            const incomplete = await response.json();
            expectValidTask(incomplete);
            expect(incomplete).toEqual(task);
            expect((await todoApi.getCompletedOk()).map((item) => item.id)).not.toContain(task.id);
        });
    });

    test('completing an already completed task keeps it completed', async ({ todoApi, createTask }) => {
        const task = await createTask();
        await todoApi.completeOk(task.id);

        const again = await todoApi.completeOk(task.id);

        expect(again).toMatchObject({ id: task.id, completed: true });
    });

    test('deletes a task', async ({ todoApi, createTask }) => {
        const task = await createTask();

        const response = await todoApi.delete(task.id);

        expect(response.status()).toBe(200);
        expect((await todoApi.getAllOk()).map((item) => item.id)).not.toContain(task.id);
        expect((await todoApi.delete(task.id)).status()).toBe(404);
    });
});
