import React, { useState, useEffect } from "react";
import {
    DragDropContext,
    Droppable,
    Draggable,
    type DropResult,
} from "@hello-pangea/dnd";

import {
    getPersonalTasks,
    getTeamTasks,
    addTask,
    createTeamTask,
    updateTask,
    deleteTask
} from "../services/api";
import type { User } from "../types/type";
import type { Task } from "../types/task";
import type { Team } from "../types/team";
import TaskModal from "../components/TaskModal";
import TaskCard from "../components/TaskCard";
import TeamSelector from "../components/TeamSelector";
import { Link } from "react-router-dom";

type DashboardProps = {
    user: User;
    onLogout: () => void;
};

// 將任務轉換成欄位
const convertToColumns = (tasks: Task[]) => {
    const columns: Record<string, { id: string, title: string, taskIds: number[] }> = {
        "todo": { id: "todo", title: "待辦", taskIds: [] },
        "in-progress": { id: "in-progress", title: "進行中", taskIds: [] },
        "done": { id: "done", title: "已完成", taskIds: [] },
    };

    tasks.forEach(task => {
        if (task.status === "todo") columns["todo"].taskIds.push(task.id);
        else if (task.status === "in-progress") columns["in-progress"].taskIds.push(task.id);
        else if (task.status === "done") columns["done"].taskIds.push(task.id);
    });

    Object.values(columns).forEach(col => col.taskIds.sort((a, b) => a - b));

    return columns;
};

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
    const [tasks, setTasks] = useState<Record<number, Task>>({});
    const [columns, setColumns] = useState<Record<string, { id: string, title: string, taskIds: number[] }>>({});
    const [modalTask, setModalTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);

    // 團隊狀態
    const [workMode, setWorkMode] = useState<'personal' | 'team'>('personal');
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

    // 取得任務
    const fetchTasks = async () => {
        try {
            let fetchedTasks: Task[] = [];

            if (workMode === 'personal') {
                // 個人模式：只取得個人任務
                fetchedTasks = await getPersonalTasks();
            } else if (workMode === 'team' && selectedTeam) {
                // 團隊模式：取得團隊任務
                fetchedTasks = await getTeamTasks(selectedTeam.id);
            }

            const taskMap = fetchedTasks.reduce((acc, task) => {
                acc[task.id] = task;
                return acc;
            }, {} as Record<number, Task>);

            setTasks(taskMap);
            setColumns(convertToColumns(fetchedTasks));
        } catch (error) {
            console.error("Failed to fetch tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [workMode, selectedTeam]);

    // 新增任務
    const handleAddTask = async (columnId: string) => {
        const newTask: Omit<Task, "id"> = {
            title: "新任務",
            description: "描述",
            status: columnId as "todo" | "in-progress" | "done",
            assignee: user.username,
        };

        try {
            let createdTask: Task;

            if (workMode === 'personal') {
                // 個人任務
                createdTask = await addTask(user.id, newTask);
            } else if (workMode === 'team' && selectedTeam) {
                // 團隊任務
                createdTask = await createTeamTask(selectedTeam.id, newTask);
            } else {
                return; // 無效狀態
            }

            setTasks(prev => ({ ...prev, [createdTask.id]: createdTask }));
            setColumns(prev => {
                const col = prev[columnId];
                return { ...prev, [columnId]: { ...col, taskIds: [...col.taskIds, createdTask.id] } };
            });
        } catch (err) {
            console.error("Failed to add task:", err);
        }
    };

    // 刪除任務
    const handleDeleteTask = async (taskId: number) => {
        // 樂觀更新：立即從UI中移除
        setTasks(prev => {
            const newTasks = { ...prev };
            delete newTasks[taskId];
            return newTasks;
        });

        setColumns(prev => {
            const newColumns = { ...prev };
            // 從所有欄位中移除這個任務ID
            for (const colKey in newColumns) {
                newColumns[colKey] = {
                    ...newColumns[colKey],
                    taskIds: newColumns[colKey].taskIds.filter(id => id !== taskId)
                };
            }
            return newColumns;
        });

        // 後台執行刪除
        try {
            await deleteTask(taskId);
        } catch (err) {
            console.error("Failed to delete task:", err);
            // 即使刪除失敗，也不重新獲取資料，保持當前狀態
        }
    };

    // 更新任務
    const handleUpdateTask = async (taskId: number, updatedTask: Partial<Task>) => {
        // 先更新本地狀態
        const oldTask = tasks[taskId];
        setTasks(prev => ({
            ...prev,
            [taskId]: { ...prev[taskId], ...updatedTask }
        }));

        try {
            await updateTask(taskId, updatedTask);
        } catch (err) {
            console.error("Failed to update task:", err);
            // 失敗時恢復原狀態
            if (oldTask) {
                setTasks(prev => ({
                    ...prev,
                    [taskId]: oldTask
                }));
            }
        }
    };

    // 拖拉任務
    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;

        const taskId = parseInt(draggableId);
        const newStatus = destination.droppableId as "todo" | "in-progress" | "done";

        // 先更新 columns 狀態
        setColumns(prev => {
            const newColumns = { ...prev };

            // 同欄位排序
            if (source.droppableId === destination.droppableId) {
                const col = newColumns[source.droppableId];
                const newTaskIds = Array.from(col.taskIds);
                newTaskIds.splice(source.index, 1);
                newTaskIds.splice(destination.index, 0, taskId);

                newColumns[source.droppableId] = { ...col, taskIds: newTaskIds };
            } else {
                // 跨欄位移動
                const sourceCol = newColumns[source.droppableId];
                const destCol = newColumns[destination.droppableId];

                const newSourceTaskIds = sourceCol.taskIds.filter(id => id !== taskId);
                const newDestTaskIds = Array.from(destCol.taskIds);
                newDestTaskIds.splice(destination.index, 0, taskId);

                newColumns[source.droppableId] = { ...sourceCol, taskIds: newSourceTaskIds };
                newColumns[destination.droppableId] = { ...destCol, taskIds: newDestTaskIds };
            }

            return newColumns;
        });

        // 如果跨欄位移動，立即更新 tasks 中的狀態
        if (source.droppableId !== destination.droppableId) {
            setTasks(prev => ({
                ...prev,
                [taskId]: { ...prev[taskId], status: newStatus }
            }));

            // 同步更新後端
            try {
                await updateTask(taskId, { status: newStatus });
            } catch (err) {
                console.error("Failed to update task status:", err);
            }
        }
    };

    const getPageTitle = () => {
        if (workMode === 'personal') {
            return "個人任務";
        } else if (selectedTeam) {
            return `團隊任務 - ${selectedTeam.name}`;
        } else {
            return "選擇團隊";
        }
    };

    const canAddTasks = workMode === 'personal' || (workMode === 'team' && selectedTeam);

    if (loading) return <div className="p-6 text-center text-gray-500">載入中...</div>;

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">📋 {getPageTitle()}</h1>
                <div className="flex items-center gap-4">
                    <Link
                        to="/profile"
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        個人資料
                    </Link>
                    <Link
                        to="/all-tasks"
                        className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                    >
                        我的所有任務
                    </Link>
                    <Link
                        to="/teams"
                        className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
                    >
                        團隊管理
                    </Link>
                    <span className="font-medium text-gray-700">👤 {user.username}</span>
                    <button
                        onClick={onLogout}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        登出
                    </button>
                </div>
            </div>

            {/* 團隊選擇器 */}
            <TeamSelector
                selectedMode={workMode}
                selectedTeam={selectedTeam}
                onModeChange={setWorkMode}
                onTeamChange={setSelectedTeam}
            />

            {/* 任務看板 */}
            {canAddTasks ? (
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="grid grid-cols-3 gap-4">
                        {Object.values(columns).map(col => (
                            <Droppable droppableId={col.id} key={col.id}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className="bg-white rounded-lg shadow p-4 min-h-[300px]"
                                    >
                                        <h2 className="text-lg font-semibold mb-3">{col.title}</h2>

                                        {col.taskIds.length === 0 ? (
                                            <div className="text-gray-500 text-sm italic">沒有任務</div>
                                        ) : (
                                            col.taskIds.map((taskId, index) => {
                                                const task = tasks[taskId];
                                                if (!task) return null;
                                                return (
                                                    <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                                                        {(provided) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                            >
                                                                <TaskCard
                                                                    task={task}
                                                                    onDelete={() => handleDeleteTask(task.id)}
                                                                    onOpen={() => setModalTask(task)}
                                                                />
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                );
                                            })
                                        )}

                                        {provided.placeholder}

                                        <button
                                            onClick={() => handleAddTask(col.id)}
                                            className="mt-2 w-full text-blue-500 hover:text-blue-700 font-medium"
                                        >
                                            ➕ 新增任務
                                        </button>
                                    </div>
                                )}
                            </Droppable>
                        ))}
                    </div>
                </DragDropContext>
            ) : (
                <div className="text-center text-gray-500 mt-20">
                    <p className="text-lg">請選擇一個團隊來查看和管理任務</p>
                </div>
            )}

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

export default Dashboard;