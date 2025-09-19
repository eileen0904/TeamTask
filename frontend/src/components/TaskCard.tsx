import React from "react";
import type { Task } from "../types/task";

interface TaskCardProps {
    task: Task;
    onDelete: () => void;
    onOpen: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onDelete, onOpen }) => {
    return (
        <div
            className="bg-gray-50 border rounded-lg p-3 mb-3 shadow-sm hover:shadow-md transition cursor-pointer"
            onClick={() => onOpen(task)}
        >
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">{task.title}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
            <p className="text-sm text-gray-500">👤 {task.assignee}</p>
            <div className="mt-2 flex justify-end">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="text-red-500 text-sm hover:text-red-700"
                >
                    刪除
                </button>
            </div>
        </div>
    );
};

export default TaskCard;