import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useKeyVault } from '../context/KeyContext';
import { generateKeyPair } from '../utils/crypto';
import { savePrivateKey, setSessionKey } from '../utils/storage';

const Login = () => {
    const navigate = useNavigate();
    const { unlockVault, setUnlockedKey } = useKeyVault();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [showResetOptions, setShowResetOptions] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);

    // Inside Login.jsx -> handleLogin
const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        // 1. Standard OAuth2 Form Data
        const loginData = new URLSearchParams();
        loginData.append('username', email); 
        loginData.append('password', password);

        // 2. Initial Login Request
        const res = await api.post('/users/login', loginData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const { access_token, username, user_id, public_key: serverPublicKey } = res.data;

        // 3. CASE A: Identity Reset Flow
        if (showResetOptions && confirmReset) {
            const { publicKeyString, privateKey } = await generateKeyPair();

            // Explicitly pass token to avoid 401
            await api.post('/users/update-public-key', 
                { public_key: publicKeyString },
                { headers: { Authorization: `Bearer ${access_token}` } }
            );

            await savePrivateKey(user_id, password, privateKey);
            localStorage.setItem('public_key', publicKeyString);
            setUnlockedKey(privateKey); // From useKeyVault
        } 
        // 4. CASE B: Standard Login Flow
        else {
            const success = await unlockVault(user_id, password);
            if (!success) {
                setLoading(false);
                return alert("Local vault not found. If you are on a new device, use 'Reset Identity'.");
            }
            localStorage.setItem('public_key', serverPublicKey);
        }

        // 5. Finalize Session
        localStorage.setItem('token', access_token);
        localStorage.setItem('username', username);
        localStorage.setItem('userId', user_id);
        
        navigate('/dashboard');

    } catch (err) {
        console.error("LOGIN_ERROR_DETAIL:", err.response?.status, err.response?.data);
        const detail = err.response?.data?.detail || "Connection failed. Check server.";
        alert(detail);
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 p-4">
            <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md border border-gray-100">
                <h2 className="text-3xl font-black mb-2 text-center text-gray-900 tracking-tight">Welcome Back</h2>
                <p className="text-gray-400 text-center mb-8 text-sm font-medium">Log in to your secure vault</p>
                
                <form onSubmit={handleLogin} className="space-y-5">
                    <input type="email" placeholder="Email Address" required className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        onChange={e => setEmail(e.target.value)} />
                    <input type="password" placeholder="Password" required className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        onChange={e => setPassword(e.target.value)} />
                    
                    {/* Identity Reset UI */}
                    <div className="pt-2">
                        {!showResetOptions ? (
                            <button type="button" onClick={() => setShowResetOptions(true)} className="text-xs font-bold text-blue-500 hover:text-blue-700 transition-colors">
                                Lost your secure vault?
                            </button>
                        ) : (
                            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 space-y-3">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input type="checkbox" checked={confirmReset} onChange={e => setConfirmReset(e.target.checked)} className="mt-1 w-4 h-4 accent-red-600" />
                                    <span className="text-[11px] text-red-800 leading-tight font-medium">
                                        I understand that resetting my identity is permanent and old messages will be lost.
                                    </span>
                                </label>
                                <button type="button" onClick={() => {setShowResetOptions(false); setConfirmReset(false);}} className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Cancel Reset</button>
                            </div>
                        )}
                    </div>

                    <button disabled={loading} className={`w-full p-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${confirmReset ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white disabled:opacity-70`}>
                        {loading && (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {loading ? "Processing..." : confirmReset ? "Reset & Login" : "Login"}
                    </button>
                </form>
                
                <p className="mt-8 text-center text-gray-500 text-sm font-medium">
                    New here? <Link to="/signup" className="text-blue-600 font-bold hover:underline">Create Account</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;