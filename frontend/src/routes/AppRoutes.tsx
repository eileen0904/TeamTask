import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import Dashboard from "../pages/Dashboard";
import ProfilePage from "../pages/ProfilePage";
import type { User } from "../types/type";

export default function AppRoutes() {
    const [user, setUser] = useState<User | null>(null);

    // 檢查 localStorage，看使用者是否已經登入
    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const onLogin = (loggedInUser: User) => {
        setUser(loggedInUser);
    };

    const onLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(null);
    };

    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={
                        user ? (
                            <Dashboard user={user} onLogout={onLogout} />
                        ) : (
                            <LoginPage onLogin={onLogin} />
                        )
                    }
                />
                <Route
                    path="/register"
                    element={
                        <RegisterPage onRegister={onLogin} />
                    }
                />
                <Route
                    path="/profile"
                    element={
                        user ? (
                            <ProfilePage />
                        ) : (
                            // 當使用者未登入時，導向登入頁面
                            <Navigate to="/" />
                        )
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}