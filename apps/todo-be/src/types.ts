type Task = {
    id: string;
    text: string;
    completed: boolean;
    createdDate: number;
    completedDate?: number;
};

export type DB = {
    tasks: Task[];
}