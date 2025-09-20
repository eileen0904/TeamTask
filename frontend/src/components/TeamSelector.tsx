import React, { useState, useEffect } from "react";
import { getTeams } from "../services/api";
import type { Team } from "../types/team";
import { Link } from "react-router-dom";

interface TeamSelectorProps {
    selectedMode: 'personal' | 'team';
    selectedTeam: Team | null;
    onModeChange: (mode: 'personal' | 'team') => void;
    onTeamChange: (team: Team | null) => void;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({
    selectedMode,
    selectedTeam,
    onModeChange,
    onTeamChange
}) => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const userTeams = await getTeams();
            setTeams(userTeams);
        } catch (error) {
            console.error("Failed to fetch teams:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleModeChange = (mode: 'personal' | 'team') => {
        onModeChange(mode);
        if (mode === 'personal') {
            onTeamChange(null);
        }
    };

    const handleTeamChange = (teamId: string) => {
        const team = teams.find(t => t.id.toString() === teamId);
        onTeamChange(team || null);
    };

    if (loading) {
        return <div className="text-gray-500">載入團隊中...</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center space-x-4">
                <label className="flex items-center">
                    <input
                        type="radio"
                        name="mode"
                        value="personal"
                        checked={selectedMode === 'personal'}
                        onChange={() => handleModeChange('personal')}
                        className="mr-2"
                    />
                    個人任務
                </label>

                <label className="flex items-center">
                    <input
                        type="radio"
                        name="mode"
                        value="team"
                        checked={selectedMode === 'team'}
                        onChange={() => handleModeChange('team')}
                        className="mr-2"
                        disabled={teams.length === 0}
                    />
                    團隊任務
                </label>

                {selectedMode === 'team' && teams.length > 0 && (
                    <select
                        value={selectedTeam?.id || ''}
                        onChange={(e) => handleTeamChange(e.target.value)}
                        className="ml-4 border rounded px-3 py-1 bg-white"
                    >
                        <option value="">選擇團隊</option>
                        {teams.map(team => (
                            <option key={team.id} value={team.id}>
                                {team.name}
                            </option>
                        ))}
                    </select>
                )}

                {teams.length === 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm">
                            還沒有加入任何團隊
                        </span>
                        <Link
                            to="/teams"
                            className="text-blue-500 hover:text-blue-700 text-sm underline"
                        >
                            建立團隊
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamSelector;