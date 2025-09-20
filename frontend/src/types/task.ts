export interface Task {
    id: number;
    title: string;
    description: string;
    status: "todo" | "in-progress" | "done";
    assignee: string; // 顯示名稱
    dueDate?: string | null; // 新增截止時間
    user?: { // 建立者
        id: number;
        username: string;
    };
    team?: { // 所屬團隊
        id: number;
        name: string;
    };
    assignedTo?: { // 實際分配的用戶
        id: number;
        username: string;
    };
}