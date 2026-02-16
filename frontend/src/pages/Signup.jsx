import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { generateKeyPair } from '../utils/crypto';
import { savePrivateKey } from '../utils/storage';
import api from '../api/axios';

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Generate RSA Keys for End-to-End Encryption
            const { publicKeyString, privateKey } = await generateKeyPair();
            await savePrivateKey(privateKey);

            // 2. Register User (JSON payload)
            const signupPayload = {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                public_key: publicKeyString
            };
            await api.post('/users/signup', signupPayload);

            // 3. Auto-Login (Form-data payload to fix 422 error)
            const loginData = new URLSearchParams();
            loginData.append('username', formData.email); 
            loginData.append('password', formData.password);

            const loginRes = await api.post('/users/login', loginData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            // 4. Save Session and Redirect
            localStorage.setItem('token', loginRes.data.access_token);
            localStorage.setItem('username', loginRes.data.username);
            localStorage.setItem('userId', loginRes.data.user_id);
            localStorage.setItem('public_key', loginRes.data.public_key);

            navigate('/dashboard');
        } catch (err) {
            console.error("SIGNUP_FLOW_ERROR:", err.response?.data);
            const errorMsg = err.response?.data?.detail;
            alert(Array.isArray(errorMsg) ? "Validation error. Check console." : errorMsg || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 p-4">
            <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
                <h2 className="text-3xl font-extrabold mb-2 text-center text-gray-900">Create Account</h2>
                <p className="text-gray-500 text-center mb-8 text-sm italic">Join the secure conversation</p>
                <form onSubmit={handleSignup} className="space-y-5">
                    <input type="text" placeholder="Username" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        onChange={e => setFormData({ ...formData, username: e.target.value })} />
                    <input type="email" placeholder="Email" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    <input type="password" placeholder="Password" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        onChange={e => setFormData({ ...formData, password: e.target.value })} />
                    <button disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 mt-2 disabled:opacity-50">
                        {loading ? "Generating Keys..." : "Sign Up"}
                    </button>
                </form>
                <p className="mt-6 text-center text-gray-600 text-sm">
                    Already have an account? <Link to="/login" className="text-blue-600 font-bold hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;