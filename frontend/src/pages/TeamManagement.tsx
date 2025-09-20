import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    getTeams,
    createTeam,
    getTeamMembers,
    inviteTeamMember,
    removeMemberFromTeam,
    deleteTeam
} from "../services/api";
import type { Team, TeamMember } from "../types/team";

const TeamManagement: React.FC = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);

    // 建立團隊狀態
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newTeamName, setNewTeamName] = useState("");
    const [newTeamDescription, setNewTeamDescription] = useState("");

    // 邀請成員狀態
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [inviteUsername, setInviteUsername] = useState("");

    // 通知狀態
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        fetchTeams();
    }, []);

    useEffect(() => {
        if (selectedTeam) {
            fetchTeamMembers(selectedTeam.id);
        }
    }, [selectedTeam]);

    // 自動隱藏通知
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
    };

    const handleDeleteTeam = async (team: Team) => {
        // 確保只有團隊擁有者可以刪除
        const currentUserRole = getCurrentUserRole();
        if (currentUserRole !== 'OWNER') {
            showNotification("只有團隊擁有者可以刪除團隊", 'error');
            return;
        }

        const confirmMessage = `確定要刪除團隊「${team.name}」嗎？\n\n注意：\n- 團隊中的未完成任務必須先完成或重新分配\n- 已完成的任務將一併刪除\n- 此操作無法復原`;

        if (confirm(confirmMessage)) {
            try {
                await deleteTeam(team.id);

                // 更新團隊列表
                setTeams(prev => prev.filter(t => t.id !== team.id));

                // 如果刪除的是當前選中的團隊，清除選擇
                if (selectedTeam?.id === team.id) {
                    setSelectedTeam(null);
                    setTeamMembers([]);
                }

                showNotification(`團隊「${team.name}」已成功刪除`, 'success');

            } catch (error: any) {
                console.error("Failed to delete team:", error);
                const errorMessage = error.data?.error || error.message || "刪除團隊失敗";
                showNotification(errorMessage, 'error');
            }
        }
    };

    const fetchTeams = async () => {
        try {
            const userTeams = await getTeams();
            setTeams(userTeams);
            if (userTeams.length > 0 && !selectedTeam) {
                setSelectedTeam(userTeams[0]);
            }
        } catch (error) {
            console.error("Failed to fetch teams:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeamMembers = async (teamId: number) => {
        try {
            const members = await getTeamMembers(teamId);
            setTeamMembers(members);
        } catch (error) {
            console.error("Failed to fetch team members:", error);
        }
    };

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTeamName.trim()) return;

        try {
            const team = await createTeam(newTeamName, newTeamDescription);
            setTeams(prev => [...prev, team]);
            setSelectedTeam(team);
            setShowCreateForm(false);
            setNewTeamName("");
            setNewTeamDescription("");
            showNotification(`團隊 "${team.name}" 建立成功`, 'success');
        } catch (error) {
            console.error("Failed to create team:", error);
            showNotification("建立團隊失敗，請重試", 'error');
        }
    };

    const handleInviteMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTeam || !inviteUsername.trim()) return;

        try {
            const newMember = await inviteTeamMember(selectedTeam.id, inviteUsername);
            setTeamMembers(prev => [...prev, newMember]);
            setShowInviteForm(false);
            setInviteUsername("");
            showNotification(`${inviteUsername} 已成功邀請加入團隊`, 'success');
        } catch (error) {
            console.error("Failed to invite member:", error);
            showNotification("邀請失敗，請檢查用戶名稱是否正確", 'error');
        }
    };

    const handleRemoveMember = async (member: TeamMember) => {
        if (!selectedTeam) return;

        if (member.role === 'OWNER') {
            showNotification("無法移除團隊擁有者", 'error');
            return;
        }

        if (confirm(`確定要移除 ${member.user.username} 嗎？`)) {
            try {
                const response = await removeMemberFromTeam(selectedTeam.id, member.id);

                // 立即更新UI，移除成員
                setTeamMembers(prev => prev.filter(m => m.id !== member.id));
                showNotification(`${member.user.username} 已從團隊中移除`, 'success');

            } catch (error: any) {
                console.error("Failed to remove member:", error);

                // 檢查是否真的失敗了
                if (error.status === 200 || error.status === 204) {
                    // 實際上成功了，只是響應格式問題
                    setTeamMembers(prev => prev.filter(m => m.id !== member.id));
                    showNotification(`${member.user.username} 已從團隊中移除`, 'success');
                } else {
                    // 真正的錯誤
                    showNotification("移除成員失敗：" + (error.data?.error || error.message || "未知錯誤"), 'error');
                }
            }
        }
    };

    const getCurrentUserRole = () => {
        if (!selectedTeam) return null;
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const member = teamMembers.find(m => m.user.id === currentUser.id);
        return member?.role || null;
    };

    const canManageTeam = () => {
        const role = getCurrentUserRole();
        return role === 'OWNER' || role === 'ADMIN';
    };

    const getRoleDisplay = (role: string) => {
        const roleMap = {
            'OWNER': '擁有者',
            'ADMIN': '管理員',
            'MEMBER': '成員'
        };
        return roleMap[role as keyof typeof roleMap] || role;
    };

    if (loading) {
        return <div className="p-6 text-center">載入中...</div>;
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">團隊管理</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        建立新團隊
                    </button>
                    <Link
                        to="/"
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        返回任務面板
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 團隊列表 */}
                <div className="bg-white rounded-lg shadow p-4">
                    <h2 className="text-lg font-semibold mb-4">我的團隊</h2>
                    {teams.length === 0 ? (
                        <p className="text-gray-500">還沒有任何團隊</p>
                    ) : (
                        <div className="space-y-2">
                            {teams.map(team => {
                                // 檢查當前用戶是否是這個團隊的擁有者
                                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                                const isOwner = team.createdBy.id === currentUser.id;

                                return (
                                    <div
                                        key={team.id}
                                        className={`p-3 rounded border hover:bg-gray-50 ${selectedTeam?.id === team.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                            }`}
                                    >
                                        <div
                                            onClick={() => setSelectedTeam(team)}
                                            className="cursor-pointer"
                                        >
                                            <h3 className="font-medium">{team.name}</h3>
                                            <p className="text-sm text-gray-600">{team.description}</p>
                                        </div>

                                        {/* 只有團隊擁有者才能看到刪除按鈕 */}
                                        {isOwner && (
                                            <div className="mt-2 flex justify-end">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteTeam(team);
                                                    }}
                                                    className="text-red-500 hover:text-red-700 text-sm"
                                                >
                                                    刪除團隊
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 團隊成員 */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
                    {selectedTeam ? (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold">
                                    {selectedTeam.name} - 成員列表
                                </h2>
                                {canManageTeam() && (
                                    <button
                                        onClick={() => setShowInviteForm(true)}
                                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        邀請成員
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3">
                                {teamMembers.map(member => (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between p-3 border border-gray-200 rounded"
                                    >
                                        <div>
                                            <h3 className="font-medium">{member.user.username}</h3>
                                            <p className="text-sm text-gray-600">{member.user.email}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-1 text-xs rounded ${member.role === 'OWNER' ? 'bg-red-100 text-red-800' :
                                                    member.role === 'ADMIN' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {getRoleDisplay(member.role)}
                                            </span>
                                            {canManageTeam() && member.role !== 'OWNER' && (
                                                <button
                                                    onClick={() => handleRemoveMember(member)}
                                                    className="text-red-500 hover:text-red-700 text-sm"
                                                >
                                                    移除
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="text-gray-500">選擇一個團隊來查看成員</p>
                    )}
                </div>
            </div>

            {/* 建立團隊彈窗 */}
            {showCreateForm && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h3 className="text-lg font-semibold mb-4">建立新團隊</h3>
                        <form onSubmit={handleCreateTeam}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">團隊名稱</label>
                                <input
                                    type="text"
                                    value={newTeamName}
                                    onChange={(e) => setNewTeamName(e.target.value)}
                                    className="w-full border rounded px-3 py-2"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">描述</label>
                                <textarea
                                    value={newTeamDescription}
                                    onChange={(e) => setNewTeamDescription(e.target.value)}
                                    className="w-full border rounded px-3 py-2"
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateForm(false);
                                        setNewTeamName("");
                                        setNewTeamDescription("");
                                    }}
                                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    建立
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 邀請成員彈窗 */}
            {showInviteForm && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h3 className="text-lg font-semibold mb-4">邀請成員</h3>
                        <form onSubmit={handleInviteMember}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">用戶名稱</label>
                                <input
                                    type="text"
                                    value={inviteUsername}
                                    onChange={(e) => setInviteUsername(e.target.value)}
                                    className="w-full border rounded px-3 py-2"
                                    placeholder="輸入要邀請的用戶名稱"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowInviteForm(false);
                                        setInviteUsername("");
                                    }}
                                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    邀請
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 通知元件 */}
            {notification && (
                <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 p-4 rounded-lg shadow-lg z-50 transition-all ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                    {notification.message}
                </div>
            )}
        </div>
    );
};

export default TeamManagement;