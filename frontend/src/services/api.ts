import type { Task } from "../types/task";
import type { User } from "../types/type";
import type { Team, TeamMember } from "../types/team";

const BASE_URL = "http://localhost:8080/api";

const getToken = () => localStorage.getItem("token");

const request = async (url: string, options: RequestInit = {}) => {
    const token = getToken();
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (options.headers) {
        Object.assign(headers, options.headers);
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        }
        const errorData = await response.json().catch(() => ({}));
        throw { status: response.status, data: errorData };
    }
    return response.json();
};

// 用戶認證 API
export const registerUser = async (username: string, password: string) => {
    return request(`${BASE_URL}/auth/register`, {
        method: "POST",
        body: JSON.stringify({ username, password }),
    });
};

export const loginUser = async (username: string, password: string) => {
    return request(`${BASE_URL}/auth/login`, {
        method: "POST",
        body: JSON.stringify({ username, password }),
    });
};

export const getProfile = async (): Promise<User> => {
    return request(`${BASE_URL}/auth/me`);
};

// 任務管理 API 
export const getTasks = async (userId: number, mode?: 'personal' | 'all'): Promise<Task[]> => {
    const params = new URLSearchParams({ userId: userId.toString() });
    if (mode) params.append('mode', mode);
    return request(`${BASE_URL}/tasks?${params}`);
};

export const getPersonalTasks = async (): Promise<Task[]> => {
    return request(`${BASE_URL}/tasks/personal`);
};

export const getAllAccessibleTasks = async (): Promise<Task[]> => {
    return request(`${BASE_URL}/tasks/all`);
};

export const addTask = async (userId: number, task: Omit<Task, 'id'>, teamId?: number) => {
    const params = new URLSearchParams({ userId: userId.toString() });
    if (teamId) params.append('teamId', teamId.toString());

    return request(`${BASE_URL}/tasks?${params}`, {
        method: "POST",
        body: JSON.stringify(task),
    });
};

export const updateTask = async (taskId: number, task: Partial<Task>) => {
    return request(`${BASE_URL}/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify(task),
    });
};

export const deleteTask = async (taskId: number) => {
    return request(`${BASE_URL}/tasks/${taskId}`, {
        method: "DELETE",
    });
};

// 團隊管理 API
export const getTeams = async (): Promise<Team[]> => {
    return request(`${BASE_URL}/teams`);
};

export const createTeam = async (name: string, description?: string): Promise<Team> => {
    return request(`${BASE_URL}/teams`, {
        method: "POST",
        body: JSON.stringify({ name, description }),
    });
};

export const getTeam = async (teamId: number): Promise<Team> => {
    return request(`${BASE_URL}/teams/${teamId}`);
};

export const getTeamTasks = async (teamId: number): Promise<Task[]> => {
    return request(`${BASE_URL}/teams/${teamId}/tasks`);
};

export const createTeamTask = async (teamId: number, task: Omit<Task, 'id'>): Promise<Task> => {
    return request(`${BASE_URL}/teams/${teamId}/tasks`, {
        method: "POST",
        body: JSON.stringify(task),
    });
};

export const getTeamMembers = async (teamId: number): Promise<TeamMember[]> => {
    return request(`${BASE_URL}/teams/${teamId}/members`);
};

export const inviteTeamMember = async (teamId: number, username: string): Promise<TeamMember> => {
    return request(`${BASE_URL}/teams/${teamId}/members`, {
        method: "POST",
        body: JSON.stringify({ username }),
    });
};

export const removeMemberFromTeam = async (teamId: number, memberId: number): Promise<any> => {
    return request(`${BASE_URL}/teams/${teamId}/members/${memberId}`, {
        method: "DELETE",
    });
};

export const deleteTeam = async (teamId: number): Promise<any> => {
    return request(`${BASE_URL}/teams/${teamId}`, {
        method: "DELETE",
    });
};