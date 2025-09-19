import type { Task } from "../types/task";
import type { User } from "../types/type";

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
            //window.location.href = "/";
        }
        const errorData = await response.json().catch(() => ({}));
        throw { status: response.status, data: errorData };
    }
    return response.json();
};

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
export const getTasks = async (userId: number): Promise<Task[]> => {
    return request(`${BASE_URL}/tasks?userId=${userId}`);
};

export const addTask = async (userId: number, task: Omit<Task, 'id'>) => {
    return request(`${BASE_URL}/tasks?userId=${userId}`, {
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