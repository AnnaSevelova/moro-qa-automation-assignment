import { expect, test } from './fixtures/fixtures.ts';
import { UNKNOWN_ID } from './fixtures/test-data.ts';

/**
 * Invalid requests. Note: the Swagger docs say an unknown task id returns 400,
 * but the backend returns 404, which is the correct status, so the tests expect 404.
 */
test.describe('Tasks API errors', () => {
    for (const [name, body] of [
        ['missing text', {}],
        ['empty text', { text: '' }],
        ['null text', { text: null }],
    ] as const) {
        test(`rejects creating a task with ${name}`, async ({ todoApi }) => {
            const response = await todoApi.create(body);

            expect(response.status()).toBe(422);
            expect(await response.text()).toBe('\'text\' field must be present in json');
        });
    }

    test('rejects updating a task with missing text', async ({ todoApi, createTask }) => {
        const task = await createTask();

        const response = await todoApi.updateText(task.id, {});

        expect(response.status()).toBe(422);
        expect(await response.text()).toBe('\'text\' field must be present in json');
        const listed = (await todoApi.getAllOk()).find((item) => item.id === task.id);
        expect(listed?.text).toBe(task.text);
    });

    test('returns 404 when updating an unknown task', async ({ todoApi }) => {
        const response = await todoApi.updateText(UNKNOWN_ID, { text: 'Anything' });

        expect(response.status()).toBe(404);
        expect(await response.text()).toBe('id not found, nothing to update');
    });

    test('returns 404 when completing an unknown task', async ({ todoApi }) => {
        const response = await todoApi.complete(UNKNOWN_ID);

        expect(response.status()).toBe(404);
        expect(await response.text()).toBe('id not found, nothing to complete');
    });

    test('returns 404 when marking an unknown task incomplete', async ({ todoApi }) => {
        const response = await todoApi.incomplete(UNKNOWN_ID);

        expect(response.status()).toBe(404);
        expect(await response.text()).toBe('id not found, nothing to incomplete');
    });

    test('returns 404 when deleting an unknown task', async ({ todoApi }) => {
        const response = await todoApi.delete(UNKNOWN_ID);

        expect(response.status()).toBe(404);
        expect(await response.text()).toBe('id not found, nothing to delete');
    });

    test('rejects creating a task with text that is not a string', {
        annotation: {
            type: 'issue',
            description: 'Known bug: the backend only checks that text is truthy, so { "text": 123 } creates a task',
        },
    }, async ({ todoApi }) => {
        test.fail();

        const response = await todoApi.create({ text: 123 });
        if (response.ok()) {
            await todoApi.delete((await response.json()).id);
        }

        expect(response.status()).toBe(422);
    });
});
