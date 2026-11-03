import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';

import type { components, paths } from '../generated/openapi-types.ts';

/** A task, as the backend's OpenAPI description defines it. */
export type Task = components['schemas']['Task'];
type CreateTask = components['schemas']['CreateTask'];

/** JSON body of the successful (200) response of an endpoint, as the backend's OpenAPI description defines it. */
type OkBody<Path extends keyof paths, Method extends 'get' | 'post'> =
    paths[Path][Method] extends { responses: { 200: { content: { 'application/json': infer Body } } } } ? Body : never;

/**
 * Thin client for the todo backend (https://github.com/morosystems/todo-be).
 * The raw methods return the response so tests can check status codes and error messages; they accept any
 * body, so tests can also send invalid ones. The `*Ok` helpers additionally expect success and return the
 * parsed body, typed from the generated OpenAPI types (npm run api:generate).
 */
export class TodoApi {
    constructor(private readonly request: APIRequestContext) {}

    getAll(): Promise<APIResponse> {
        return this.request.get('/tasks');
    }

    getCompleted(): Promise<APIResponse> {
        return this.request.get('/tasks/completed');
    }

    create(body: object): Promise<APIResponse> {
        return this.request.post('/tasks', { data: body });
    }

    updateText(id: string, body: object): Promise<APIResponse> {
        return this.request.post(`/tasks/${encodeURIComponent(id)}`, { data: body });
    }

    complete(id: string): Promise<APIResponse> {
        return this.request.post(`/tasks/${encodeURIComponent(id)}/complete`);
    }

    incomplete(id: string): Promise<APIResponse> {
        return this.request.post(`/tasks/${encodeURIComponent(id)}/incomplete`);
    }

    delete(id: string): Promise<APIResponse> {
        return this.request.delete(`/tasks/${encodeURIComponent(id)}`);
    }

    async getAllOk(): Promise<OkBody<'/tasks', 'get'>> {
        return expectJson(await this.getAll());
    }

    async getCompletedOk(): Promise<OkBody<'/tasks/completed', 'get'>> {
        return expectJson(await this.getCompleted());
    }

    async createOk(text: string): Promise<OkBody<'/tasks', 'post'>> {
        const body: CreateTask = { text };

        return expectJson(await this.create(body));
    }

    async completeOk(id: string): Promise<OkBody<'/tasks/{id}/complete', 'post'>> {
        return expectJson(await this.complete(id));
    }
}

async function expectJson<T>(response: APIResponse): Promise<T> {
    expect(response.status(), await response.text()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    return response.json() as Promise<T>;
}
