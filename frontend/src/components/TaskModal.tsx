import React, { useState, useEffect } from "react";
import type { Task } from "../types/task";

interface TaskModalProps {
    task: Task | null;
    onClose: () => void;
    onUpdate: (taskId: number, updatedTask: Partial<Task>) => void;
    onDelete: (taskId: number) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, onClose, onUpdate, onDelete }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [status, setStatus] = useState<"todo" | "in-progress" | "done">("todo");

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description);
            setStatus(task.status);
            if (task.dueDate) {
                try {
                    // 處理不同的日期格式
                    const date = new Date(task.dueDate);
                    if (!isNaN(date.getTime())) {
                        // 確保時區正確，並格式化為 datetime-local 格式
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');

                        const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
                        setDueDate(formattedDate);
                    } else {
                        setDueDate("");
                    }
                } catch (error) {
                    console.error("Invalid date format:", task.dueDate);
                    setDueDate("");
                }
            } else {
                setDueDate("");
            }
        }
    }, [task]);

    if (!task) return null;

    const handleSave = () => {
        const updatedTask: Partial<Task> = {
            title,
            description,
            status,
            dueDate: dueDate ? dueDate : null
        };
        onUpdate(task.id, updatedTask);
        onClose();
    };

    const handleDelete = () => {
        onDelete(task.id);
        onClose();
    };

    const getTimeRemaining = () => {
        if (!dueDate) return null;

        const due = new Date(dueDate);
        const now = new Date();
        const diffMs = due.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (diffHours < 0) {
            return { text: `已過期 ${Math.abs(Math.floor(diffDays))} 天`, color: 'text-red-600' };
        } else if (diffHours < 24) {
            return { text: `${Math.floor(diffHours)} 小時後到期`, color: 'text-orange-600' };
        } else if (diffDays < 3) {
            return { text: `${Math.floor(diffDays)} 天後到期`, color: 'text-yellow-600' };
        } else {
            return { text: due.toLocaleString('zh-TW'), color: 'text-gray-600' };
        }
    };

    const timeRemaining = getTimeRemaining();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 shadow-lg relative">
                <h2 className="text-xl font-bold mb-4">編輯任務</h2>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">標題</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">描述</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        rows={3}
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">狀態</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as "todo" | "in-progress" | "done")}
                        className="w-full border rounded px-3 py-2"
                    >
                        <option value="todo">待辦</option>
                        <option value="in-progress">進行中</option>
                        <option value="done">已完成</option>
                    </select>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">截止時間（可選）</label>
                    <input
                        type="datetime-local"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                    />
                    {timeRemaining && (
                        <p className={`text-sm mt-1 ${timeRemaining.color}`}>
                            {timeRemaining.text}
                        </p>
                    )}
                </div>

                {/* 任務資訊 */}
                <div className="mb-4 p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">
                        <p>負責人: {task.assignee}</p>
                        {task.team && <p>團隊: {task.team.name}</p>}
                    </div>
                </div>

                <div className="flex justify-between">
                    <button
                        onClick={handleDelete}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        刪除
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            儲存
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskModal;