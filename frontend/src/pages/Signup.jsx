import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { generateKeyPair } from '../utils/crypto';
import { savePrivateKey, setSessionKey } from '../utils/storage';
import { useKeyVault } from '../context/KeyContext'; // Import vault hook
import api from '../api/axios';

const Signup = () => {
    const navigate = useNavigate();
    const { setUnlockedKey } = useKeyVault(); // To unlock vault in RAM immediately
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        console.log("1. Generating RSA Keys...");
        const { publicKeyString, privateKey } = await generateKeyPair();

        console.log("2. Sending Signup Request...");
        await api.post('/users/signup', {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            public_key: publicKeyString
        });

        console.log("3. Attempting Auto-Login...");
        const loginData = new URLSearchParams();
        loginData.append('username', formData.email); 
        loginData.append('password', formData.password);

        const loginRes = await api.post('/users/login', loginData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const { access_token, user_id, username, public_key } = loginRes.data;
        console.log("Login Success, User ID:", user_id);

        // --- THE CRITICAL PART ---
        console.log("4. Locking Private Key to IndexedDB...");
        await savePrivateKey(user_id, formData.password, privateKey);

        console.log("5. Saving to Session RAM...");
        const exported = await window.crypto.subtle.exportKey("pkcs8", privateKey);
        const base64Key = btoa(String.fromCharCode(...new Uint8Array(exported)));
        
        setSessionKey(base64Key); // Survive Refresh
        setUnlockedKey(privateKey); // Instant RAM Access

        localStorage.setItem('token', access_token);
        localStorage.setItem('username', username);
        localStorage.setItem('userId', user_id);
        localStorage.setItem('public_key', public_key);

        console.log("6. Redirecting...");
        navigate('/dashboard');
    } catch (err) {
        // Detailed error logging to fix the 'undefined' issue
        console.error("FULL ERROR OBJECT:", err);
        const errorMsg = err.response?.data?.detail || err.message || "An unexpected error occurred";
        alert(errorMsg);
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