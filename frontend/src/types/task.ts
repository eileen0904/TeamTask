// src/types/task.ts
export interface Task {
    id: number;
    title: string;
    description: string;
    status: "todo" | "in-progress" | "done";
    assignee: string; // 指派給誰
}