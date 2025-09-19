import React, { useEffect, useState } from "react";
import { getProfile } from "../services/api";
import type { User } from "../types/type";
import { Link } from "react-router-dom"; 

const ProfilePage: React.FC = () => {
    const [user, setUser] = useState<User & { createdAt?: string } | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const data = await getProfile();
                setUser(data as User & { createdAt: string });
            } catch (err) {
                console.error("Failed to fetch profile:", err);
            }
        };
        fetchProfile();
    }, []);

    if (!user) return <div>Loading...</div>;

    return (
        <div className="p-6 max-w-sm mx-auto mt-20 bg-white rounded shadow">
            <Link
                to="/"
                className="block text-blue-500 hover:text-blue-700 font-medium mb-4"
            >
                返回儀表板
            </Link>
            <h1 className="text-2xl font-bold mb-4">個人資料</h1>
            <p>帳號: {user.username}</p>
            <p>Email: {user.email}</p>
            {user.createdAt && (
                <p>註冊日期: {new Date(user.createdAt).toLocaleString()}</p>
            )}
        </div>
    );
};

export default ProfilePage;
