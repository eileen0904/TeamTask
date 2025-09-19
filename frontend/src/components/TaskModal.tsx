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

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description);
        }
    }, [task]);

    if (!task) return null;

    const handleSave = () => {
        onUpdate(task.id, { title, description });
        onClose();
    };

    const handleDelete = () => {
        // 立即在前端刪除
        onDelete(task.id);
        onClose();
    };

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
                        className="w-full border rounded px-2 py-1"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">描述</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full border rounded px-2 py-1"
                    />
                </div>
                <div className="flex justify-between">
                    <button
                        onClick={handleDelete}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        刪除
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
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
