import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const loginData = new URLSearchParams();
            loginData.append('username', email); 
            loginData.append('password', password);

            const res = await api.post('/users/login', loginData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            console.log("Login response:", res.data);
                localStorage.setItem('token', res.data.access_token);
            localStorage.setItem('username', res.data.username);
            localStorage.setItem('userId', res.data.user_id);
            localStorage.setItem('public_key', res.data.public_key);


            navigate('/dashboard');
        } catch (err) {
            console.error("LOGIN_ERROR:", err.response?.data);
            alert(err.response?.data?.detail || "Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 p-4">
            <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
                <h2 className="text-3xl font-extrabold mb-2 text-center text-gray-900">Welcome Back</h2>
                <p className="text-gray-500 text-center mb-8 text-sm italic">Log in to access your secure chats</p>
                <form onSubmit={handleLogin} className="space-y-6">
                    <input type="email" placeholder="Email Address" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        onChange={e => setEmail(e.target.value)} />
                    <input type="password" placeholder="Password" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        onChange={e => setPassword(e.target.value)} />
                    <button disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50">
                        {loading ? "Verifying..." : "Login"}
                    </button>
                </form>
                <p className="mt-6 text-center text-gray-600 text-sm">
                    Don't have an account? <Link to="/signup" className="text-blue-600 font-bold hover:underline">Sign Up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;