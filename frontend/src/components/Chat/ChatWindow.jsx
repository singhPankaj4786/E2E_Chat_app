import React, { useState, useEffect, useRef } from 'react';
import { encryptForBoth } from '../../utils/crypto';

const ChatWindow = ({ recipient, onlineUsers, messages, sendMessage, sendTyping, isTyping }) => {
    const [messageInput, setMessageInput] = useState("");
    const scrollRef = useRef(null);
    const myPublicKey = localStorage.getItem("public_key");

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!messageInput.trim()) return;
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

    return (
        <div className="flex-1 flex flex-col h-full bg-white">
            {/* Header: Minimalist and Clean */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center h-16 bg-white shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {recipient?.username[0].toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                        <h2 className="font-semibold text-gray-800">{recipient?.username}</h2>
                        <div className="flex items-center gap-1.5 h-4">
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

            {/* Chat Area: Modern Bubble Design */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 bg-[#FDFDFD] flex flex-col gap-3">
                {messages.map((msg, idx) => {
                    const isMe = msg.sender_id !== recipient.id;
                    return (
                        <div key={msg.id || idx} className={`max-w-[75%] flex flex-col ${isMe ? "items-end self-end" : "items-start self-start"}`}>
                            <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm transition-all duration-200 ${
                                isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-[#F1F3F4] text-gray-800 rounded-tl-none"
                            }`}>
                                <p className="leading-relaxed">{msg.decrypted_content || "..."}</p>
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1 px-1">
                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Input Bar: Sleek and Floating style */}
            <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSend} className="flex gap-3 items-center bg-gray-50 p-1.5 rounded-full border border-gray-200 focus-within:border-blue-300 transition-all">
                    <input 
                        type="text" 
                        value={messageInput} 
                        onChange={(e) => { setMessageInput(e.target.value); sendTyping(); }} 
                        className="flex-1 bg-transparent border-none px-4 py-2 outline-none text-sm text-gray-700" 
                        placeholder="Aa"
                    />
                    <button type="submit" className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 transition-all flex items-center justify-center w-10 h-10 shadow-md transform active:scale-95">
                        <span className="text-lg">➤</span>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;