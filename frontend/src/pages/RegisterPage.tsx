import React, { useState } from "react";
import { registerUser } from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import type { User } from "../types/type";

export type RegisterPageProps = {
    onRegister: (user: User) => void;
};

const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); // 提交時先清除之前的錯誤
        setIsLoading(true);

        try {
            const { user, token } = await registerUser(username, password);
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("token", token);
            onRegister(user);
            navigate("/"); // 註冊成功後導回首頁
        } catch (err) {
            console.error("Registration error:", err);
            setError("註冊失敗，請檢查帳號是否已存在或網路連線");
        } finally {
            setIsLoading(false);
        }
    };

    // 當用戶開始輸入時，清除錯誤訊息
    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
        if (error) setError(""); // 只在有錯誤時清除
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        if (error) setError(""); // 只在有錯誤時清除
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow w-80">
                <h1 className="text-2xl mb-4 font-bold">註冊</h1>
                {error && (
                    <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}
                <input
                    placeholder="帳號"
                    value={username}
                    onChange={handleUsernameChange}
                    className="w-full p-2 mb-3 border rounded"
                    disabled={isLoading}
                />
                <input
                    placeholder="密碼"
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    className="w-full p-2 mb-3 border rounded"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full p-2 rounded text-white ${isLoading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                >
                    {isLoading ? "註冊中..." : "註冊"}
                </button>
                <p className="mt-3 text-sm">
                    已經有帳號了？ <Link to="/" className="text-blue-500">登入</Link>
                </p>
            </form>
        </div>
    );
};

export default RegisterPage;