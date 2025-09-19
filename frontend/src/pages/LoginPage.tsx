import React, { useState } from "react";
import { loginUser } from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import type { User } from "../types/type";

interface LoginPageProps {
    onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
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
            // 完全清除所有舊的認證資料
            localStorage.clear();
            sessionStorage.clear();

            console.log("Attempting login with:", { username, passwordLength: password.length });

            const response = await loginUser(username, password);
            console.log("Login response:", response);

            const { user, token } = response;

            // 驗證回應格式
            if (!user || !token) {
                throw new Error("Invalid response format from server");
            }

            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("token", token);
            onLogin(user);
            navigate("/");

        } catch (err: any) {
            console.error("Login error details:", err);

            // 根據不同錯誤類型顯示對應訊息
            if (err.response?.status === 401) {
                setError("帳號或密碼錯誤，請重新輸入");
            } else if (err.response?.status === 429) {
                setError("登入嘗試次數過多，請稍後再試");
            } else if (err.response?.status >= 500) {
                setError("伺服器錯誤，請稍後再試");
            } else if (err.message?.includes("Network")) {
                setError("網路連線問題，請檢查網路狀態");
            } else {
                setError(`登入失敗：${err.response?.data?.message || err.message || "還未註冊"}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 當用戶開始輸入時，清除錯誤訊息
    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
        if (error) setError("");
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        if (error) setError("");
    };

    // 清除所有快取和重新整理頁面
    const handleClearCache = () => {
        localStorage.clear();
        sessionStorage.clear();
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    caches.delete(name);
                });
            });
        }
        window.location.reload();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow w-80">
                <h1 className="text-2xl mb-4 font-bold">登入</h1>

                {error && (
                    <div className="mb-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        <div>{error}</div>
                        {error.includes("401") || error.includes("帳號或密碼錯誤") ? (
                            <div className="mt-2 text-sm">
                                <button
                                    type="button"
                                    onClick={handleClearCache}
                                    className="text-blue-600 underline hover:text-blue-800"
                                >
                                    清除快取並重新整理
                                </button>
                            </div>
                        ) : null}
                    </div>
                )}

                <input
                    placeholder="帳號"
                    value={username}
                    onChange={handleUsernameChange}
                    className="w-full p-2 mb-3 border rounded focus:border-blue-500 outline-none"
                    disabled={isLoading}
                    autoComplete="username"
                />
                <input
                    placeholder="密碼"
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    className="w-full p-2 mb-3 border rounded focus:border-blue-500 outline-none"
                    disabled={isLoading}
                    autoComplete="current-password"
                />
                <button
                    type="submit"
                    disabled={isLoading || !username.trim() || !password.trim()}
                    className={`w-full p-2 rounded text-white transition-colors ${isLoading || !username.trim() || !password.trim()
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                >
                    {isLoading ? "登入中..." : "登入"}
                </button>

                <p className="mt-3 text-sm">
                    還沒有帳號？ <Link to="/register" className="text-blue-500 hover:underline">註冊</Link>
                </p>
            </form>
        </div>
    );
};

export default LoginPage;