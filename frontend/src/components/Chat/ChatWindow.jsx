import React, { useState, useEffect, useRef } from 'react';
import { encryptForBoth } from '../../utils/crypto';
import { checkVerificationStatus } from '../../utils/storage';
import VerificationModal from '../Auth/VerificationModal';

const ChatWindow = ({ recipient, onlineUsers, messages, sendMessage, sendTyping, isTyping, onVerifiedSuccess }) => {
    const [messageInput, setMessageInput] = useState("");
    const [verifyStatus, setVerifyStatus] = useState('unverified');
    const [showModal, setShowModal] = useState(false);
    const scrollRef = useRef(null);
    const myId = localStorage.getItem("userId");
    const myPublicKey = localStorage.getItem("public_key");

    const refreshStatus = async () => {
        if (!recipient || !myId) return;
        const status = await checkVerificationStatus(myId, recipient.id, recipient.public_key);
        
        // If they just verified, tell the dashboard to hide the system message
        if (status === 'verified' && verifyStatus === 'changed') {
            onVerifiedSuccess();
        }
        
        setVerifyStatus(status);
    };

    useEffect(() => {
        refreshStatus();
    }, [recipient?.id]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || verifyStatus === 'changed') return;
        try {
            const encryptedData = await encryptForBoth(messageInput, recipient.public_key, myPublicKey);
            sendMessage({
                recipient_id: recipient.id,
                ciphertext: encryptedData.ciphertext,
                iv: encryptedData.iv,
                encrypted_key_for_recipient: encryptedData.encrypted_key_for_recipient,
                encrypted_key_for_sender: encryptedData.encrypted_key_for_sender
            });
            setMessageInput("");
        } catch (err) { console.error("Encryption failed", err); }
    };

    const getStatusTheme = () => {
        switch (verifyStatus) {
            case 'verified':
                return {
                    bg: "bg-green-50", text: "text-green-700", border: "border-green-100",
                    iconColor: "text-green-600", label: "Identity Verified & Secure", isVerified: true
                };
            case 'changed':
                return {
                    bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200",
                    iconColor: "text-amber-600 animate-pulse", label: "Security Session Reset: Verification Required", isVerified: false
                };
            default:
                return {
                    bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200",
                    iconColor: "text-gray-300", label: "Encrypted, but identity not verified. Click name to verify.", isVerified: false
                };
        }
    };

    const theme = getStatusTheme();

    return (
        <div className="flex-1 flex flex-col h-full bg-white relative">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center h-16 bg-white shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {recipient?.username ? recipient.username[0].toUpperCase() : "?"}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setShowModal(true)}>
                            <h2 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors leading-none">
                                {recipient?.username}
                            </h2>
                            <div className={`relative flex items-center justify-center transition-all duration-300 ${theme.iconColor}`}>
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                                </svg>
                                {theme.isVerified && (
                                    <svg className="w-2 h-2 absolute text-white" viewBox="0 0 20 20" fill="currentColor" style={{ top: '45%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 h-4 mt-1">
                            {isTyping ? (
                                <span className="text-[11px] text-blue-500 font-medium animate-pulse">typing...</span>
                            ) : (
                                <div className="flex items-center gap-1">
                                    <span className={`w-2 h-2 rounded-full ${onlineUsers[recipient?.id] ? "bg-green-500" : "bg-gray-300"}`} />
                                    <span className="text-[11px] text-gray-500 font-medium">{onlineUsers[recipient?.id] ? "Active Now" : "Offline"}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-center p-2">
                <div className={`text-[11px] px-4 py-1.5 rounded-full border flex items-center gap-2 shadow-sm transition-all duration-300 ${theme.bg} ${theme.text} ${theme.border}`}>
                    <div className="relative flex items-center justify-center">
                        <svg className={`w-3.5 h-3.5 ${theme.iconColor}`} viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" /></svg>
                        {theme.isVerified && (
                            <svg className="w-1.5 h-1.5 absolute text-white" viewBox="0 0 20 20" fill="currentColor" style={{ top: '45%', left: '50%', transform: 'translate(-50%, -50%)' }}><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        )}
                    </div>
                    {theme.label}
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 bg-[#FDFDFD] flex flex-col gap-3">
                {messages.map((msg, idx) => {
                    if (msg.type === 'system') {
                        return (
                            <div key={msg.id || idx} className="flex flex-col items-center my-6 animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 max-w-sm text-center shadow-sm">
                                    <span className="text-xl mb-2 block">🛡️</span>
                                    <p className="text-[12px] text-gray-600 font-medium leading-relaxed">{msg.decrypted_content}</p>
                                    <button onClick={() => setShowModal(true)} className="mt-3 text-[11px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest border-t border-gray-100 pt-3 w-full">Re-verify Identity</button>
                                </div>
                            </div>
                        );
                    }
                    const isMe = msg.sender_id !== recipient?.id;
                    return (
                        <div key={msg.id || idx} className={`max-w-[75%] flex flex-col ${isMe ? "items-end self-end" : "items-start self-start"}`}>
                            <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm transition-all duration-200 ${isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-[#F1F3F4] text-gray-800 rounded-tl-none"}`}>
                                <p className="leading-relaxed">{msg.decrypted_content || "..."}</p>
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</span>
                        </div>
                    );
                })}
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSend} className="flex gap-3 items-center bg-gray-50 p-1.5 rounded-full border border-gray-200 focus-within:border-blue-300 transition-all">
                    <input 
                        type="text" value={messageInput} disabled={verifyStatus === 'changed'}
                        onChange={(e) => { setMessageInput(e.target.value); sendTyping(); }} 
                        className="flex-1 bg-transparent px-4 py-2 outline-none text-sm text-gray-700 disabled:cursor-not-allowed" 
                        placeholder={verifyStatus === 'changed' ? "Verify identity to resume chatting..." : "Aa"}
                    />
                    <button type="submit" className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 transition-all flex items-center justify-center w-10 h-10 shadow-md"><span className="text-lg">➤</span></button>
                </form>
            </div>
            {showModal && <VerificationModal recipient={recipient} onVerified={refreshStatus} onClose={() => setShowModal(false)} />}
        </div>
    );
};

export default ChatWindow;