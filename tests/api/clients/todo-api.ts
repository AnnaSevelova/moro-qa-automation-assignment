import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';

export type Task = {
    id: string;
    text: string;
    completed: boolean;
    createdDate: number;
    completedDate?: number;
};

/**
 * Thin client for the todo backend (https://github.com/morosystems/todo-be).
 * The raw methods return the response so tests can check status codes and error messages,
 * the `*Ok` helpers additionally expect success and return the parsed task.
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

    async getAllOk(): Promise<Task[]> {
        return expectJson<Task[]>(await this.getAll());
    }

    async getCompletedOk(): Promise<Task[]> {
        return expectJson<Task[]>(await this.getCompleted());
    }

    async createOk(text: string): Promise<Task> {
        return expectJson<Task>(await this.create({ text }));
    }

    async completeOk(id: string): Promise<Task> {
        return expectJson<Task>(await this.complete(id));
    }
}

async function expectJson<T>(response: APIResponse): Promise<T> {
    expect(response.status(), await response.text()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    return response.json() as Promise<T>;
}
