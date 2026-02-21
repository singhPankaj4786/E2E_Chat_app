import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { generateKeyPair } from '../utils/crypto';
import { savePrivateKey, setSessionKey } from '../utils/storage';
import { useKeyVault } from '../context/KeyContext'; 
import api from '../api/axios';

const Signup = () => {
    const navigate = useNavigate();
    const { setUnlockedKey } = useKeyVault(); 
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Heavy Crypto Operation
            console.log("1. Generating RSA Keys...");
            const { publicKeyString, privateKey } = await generateKeyPair();

            // 2. API Signup
            console.log("2. Sending Signup Request...");
            await api.post('/users/signup', {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                public_key: publicKeyString
            });

            // 3. Auto-Login Flow
            console.log("3. Attempting Auto-Login...");
            const loginData = new URLSearchParams();
            loginData.append('username', formData.email); 
            loginData.append('password', formData.password);

            const loginRes = await api.post('/users/login', loginData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const { access_token, user_id, username, public_key } = loginRes.data;

            // 4. Secure Key Storage
            console.log("4. Locking Private Key to IndexedDB...");
            await savePrivateKey(user_id, formData.password, privateKey);

            // 5. Memory Management
            console.log("5. Saving to Session RAM...");
            const exported = await window.crypto.subtle.exportKey("pkcs8", privateKey);
            const base64Key = btoa(String.fromCharCode(...new Uint8Array(exported)));
            
            setSessionKey(base64Key); 
            setUnlockedKey(privateKey); 

            localStorage.setItem('token', access_token);
            localStorage.setItem('username', username);
            localStorage.setItem('userId', user_id);
            localStorage.setItem('public_key', public_key);

            navigate('/dashboard');
        } catch (err) {
            console.error("FULL ERROR OBJECT:", err);
            const errorMsg = err.response?.data?.detail || err.message || "An unexpected error occurred";
            alert(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 p-4">
            <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md border border-gray-100">
                <h2 className="text-3xl font-black mb-2 text-center text-gray-900 tracking-tight">Create Account</h2>
                <p className="text-gray-400 text-center mb-8 text-sm font-medium">Join the secure conversation</p>
                
                <form onSubmit={handleSignup} className="space-y-5">
                    <input 
                        type="text" 
                        placeholder="Username" 
                        required 
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        onChange={e => setFormData({ ...formData, username: e.target.value })} 
                    />
                    <input 
                        type="email" 
                        placeholder="Email Address" 
                        required 
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        onChange={e => setFormData({ ...formData, email: e.target.value })} 
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        required 
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        onChange={e => setFormData({ ...formData, password: e.target.value })} 
                    />
                    
                    <button 
                        disabled={loading} 
                        className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {loading && (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {loading ? "Generating Secure Keys..." : "Create Secure Account"}
                    </button>
                </form>
                
                <p className="mt-8 text-center text-gray-500 text-sm font-medium">
                    Already have an account? <Link to="/login" className="text-blue-600 font-bold hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;