import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllAccessibleTasks, updateTask, deleteTask } from "../services/api";
import type { Task } from "../types/task";
import TaskModal from "../components/TaskModal";

const AllTasks: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalTask, setModalTask] = useState<Task | null>(null);
    const [filter, setFilter] = useState<'all' | 'personal' | 'team' | 'overdue' | 'today'>('all');

    useEffect(() => {
        fetchAllTasks();
    }, []);

    const fetchAllTasks = async () => {
        try {
            const allTasks = await getAllAccessibleTasks();
            setTasks(allTasks);
        } catch (error) {
            console.error("Failed to fetch tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTask = async (taskId: number, updatedTask: Partial<Task>) => {
        try {
            const updated = await updateTask(taskId, updatedTask);
            setTasks(prev => prev.map(task =>
                task.id === taskId ? { ...task, ...updatedTask } : task
            ));
            await fetchAllTasks();

        } catch (error) {
            console.error("Failed to update task:", error);
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        try {
            await deleteTask(taskId);
            setTasks(prev => prev.filter(task => task.id !== taskId));
        } catch (error) {
            console.error("Failed to delete task:", error);
        }
    };

    const getFilteredTasks = () => {
        const now = new Date();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        return tasks.filter(task => {
            switch (filter) {
                case 'personal':
                    return !task.team;
                case 'team':
                    return !!task.team;
                case 'overdue':
                    if (!task.dueDate || task.status === 'done') return false;
                    try {
                        const dueDate = new Date(task.dueDate);
                        // 檢查日期是否有效
                        if (isNaN(dueDate.getTime())) return false;
                        return dueDate.getTime() < now.getTime();
                    } catch (error) {
                        console.error(`Invalid date format for task ${task.id}:`, task.dueDate);
                        return false;
                    }
                case 'today':
                    if (!task.dueDate || task.status === 'done') return false;
                    try {
                        const taskDue = new Date(task.dueDate);
                        if (isNaN(taskDue.getTime())) return false;
                        return taskDue.getTime() >= todayStart.getTime() &&
                            taskDue.getTime() <= todayEnd.getTime();
                    } catch (error) {
                        console.error(`Invalid date format for task ${task.id}:`, task.dueDate);
                        return false;
                    }
                default:
                    return true;
            }
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'todo':
                return 'bg-gray-100 text-gray-800';
            case 'in-progress':
                return 'bg-blue-100 text-blue-800';
            case 'done':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (task: Task) => {
        if (!task.dueDate) return '';

        const due = new Date(task.dueDate);
        const now = new Date();
        const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (diffHours < 0 && task.status !== 'done') {
            return 'border-l-4 border-red-500'; // 已過期
        } else if (diffHours < 24) {
            return 'border-l-4 border-orange-500'; // 24小時內到期
        } else if (diffHours < 72) {
            return 'border-l-4 border-yellow-500'; // 3天內到期
        }
        return '';
    };

    const formatDueDate = (dueDate?: string) => {
        if (!dueDate) return '';

        const due = new Date(dueDate);
        const now = new Date();
        const diffMs = due.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (diffHours < 0) {
            return `已過期 ${Math.abs(Math.floor(diffDays))} 天`;
        } else if (diffHours < 24) {
            return `${Math.floor(diffHours)} 小時後到期`;
        } else if (diffDays < 7) {
            return `${Math.floor(diffDays)} 天後到期`;
        } else {
            return due.toLocaleDateString('zh-TW');
        }
    };

    const filteredTasks = getFilteredTasks();

    const overdueTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        const now = new Date();
        return dueDate < now && task.status !== 'done';
    });

    const todayDueTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDue = new Date(task.dueDate);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        return taskDue >= todayStart && taskDue <= todayEnd && task.status !== 'done';
    });

    if (loading) {
        return <div className="p-6 text-center">載入中...</div>;
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">我的所有任務</h1>
                <Link
                    to="/"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    返回任務面板
                </Link>
            </div>

            {/* 過期任務警告 */}
            {overdueTasks.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <h3 className="text-red-800 font-semibold mb-2">
                        注意：您有 {overdueTasks.length} 個任務已過期
                    </h3>
                    <div className="text-red-700 text-sm">
                        {overdueTasks.slice(0, 3).map(task => (
                            <div key={task.id}>• {task.title}</div>
                        ))}
                        {overdueTasks.length > 3 && (
                            <div>還有 {overdueTasks.length - 3} 個任務...</div>
                        )}
                    </div>
                </div>
            )}

            {/* 篩選器 */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1 rounded text-sm ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                            }`}
                    >
                        全部 ({tasks.length})
                    </button>
                    <button
                        onClick={() => setFilter('personal')}
                        className={`px-3 py-1 rounded text-sm ${filter === 'personal' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                            }`}
                    >
                        個人任務 ({tasks.filter(t => !t.team).length})
                    </button>
                    <button
                        onClick={() => setFilter('team')}
                        className={`px-3 py-1 rounded text-sm ${filter === 'team' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                            }`}
                    >
                        團隊任務 ({tasks.filter(t => !!t.team).length})
                    </button>
                    <button
                        onClick={() => setFilter('overdue')}
                        className={`px-3 py-1 rounded text-sm ${filter === 'overdue' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
                            }`}
                    >
                        已過期 ({overdueTasks.length})
                    </button>
                    <button
                        onClick={() => setFilter('today')}
                        className={`px-3 py-1 rounded text-sm ${filter === 'today' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'
                            }`}
                    >
                        今日到期 ({todayDueTasks.length})
                    </button>
                </div>
            </div>

            {/* 任務列表 */}
            <div className="space-y-4">
                {filteredTasks.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        沒有找到符合條件的任務
                    </div>
                ) : (
                    filteredTasks.map(task => (
                        <div
                            key={task.id}
                            className={`bg-white rounded-lg shadow p-4 hover:shadow-md transition cursor-pointer ${getPriorityColor(task)}`}
                            onClick={() => setModalTask(task)}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-semibold text-lg">{task.title}</h3>
                                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(task.status)}`}>
                                            {task.status === 'todo' ? '待辦' :
                                                task.status === 'in-progress' ? '進行中' : '已完成'}
                                        </span>
                                        {task.team && (
                                            <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                                                {task.team.name}
                                            </span>
                                        )}
                                    </div>

                                    {task.description && (
                                        <p className="text-gray-600 mb-2">{task.description}</p>
                                    )}

                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span>負責人: {task.assignee}</span>
                                        {task.dueDate && (
                                            <span className={
                                                new Date(task.dueDate) < new Date() && task.status !== 'done'
                                                    ? 'text-red-600 font-medium'
                                                    : ''
                                            }>
                                                {formatDueDate(task.dueDate)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setModalTask(task);
                                        }}
                                        className="text-blue-500 hover:text-blue-700 text-sm"
                                    >
                                        編輯
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('確定要刪除這個任務嗎？')) {
                                                handleDeleteTask(task.id);
                                            }
                                        }}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        刪除
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 任務編輯模態框 */}
            <TaskModal
                task={modalTask}
                onClose={() => setModalTask(null)}
                onUpdate={handleUpdateTask}
                onDelete={(taskId) => {
                    handleDeleteTask(taskId);
                    setModalTask(null);
                }}
            />
        </div>
    );
};

export default AllTasks;