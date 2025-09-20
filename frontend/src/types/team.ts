export interface Team {
    id: number;
    name: string;
    description?: string;
    createdBy: {
        id: number;
        username: string;
        email: string;
    };
    createdAt: string;
}

export interface TeamMember {
    id: number;
    team: Team;
    user: {
        id: number;
        username: string;
        email: string;
    };
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
    joinedAt: string;
}