import React, { useState, useEffect, useRef } from 'react';
import { encryptForBoth } from '../../utils/crypto';

const ChatWindow = ({ recipient, onlineUsers, messages, sendMessage, sendTyping, isTyping }) => {
    const [messageInput, setMessageInput] = useState("");
    const scrollRef = useRef(null);
    const myPublicKey = localStorage.getItem("public_key");

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!messageInput.trim()) return;
        try {
            // E2EE logic remains identical to your original code
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
        <div className="flex-1 flex flex-col h-full bg-white text-sm">
            {/* Header: Fixed Typing UI */}
            <div className="p-4 border-b flex justify-between items-center h-16 bg-white z-10">
                <div className="flex flex-col">
                    <h2 className="font-bold text-gray-800 text-lg">{recipient?.username}</h2>
                    <div className="flex items-center gap-2">
                        {isTyping ? (
                            <span className="text-xs text-blue-500 font-medium animate-pulse italic">is typing...</span>
                        ) : (
                            <span className={`text-xs flex items-center gap-1 ${onlineUsers[recipient?.id] ? "text-green-500" : "text-gray-400"}`}>
                                <span className="text-[8px]">●</span> {onlineUsers[recipient?.id] ? "Online" : "Offline"}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 bg-[#f0f2f5] flex flex-col gap-2">
                {messages.map((msg, idx) => {
                    const isMe = msg.sender_id !== recipient.id;
                    return (
                        <div key={msg.id || idx} className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${
                            isMe ? "bg-blue-600 text-white self-end rounded-tr-none" : "bg-white text-gray-800 self-start rounded-tl-none border border-gray-200"
                        }`}>
                            <p>{msg.decrypted_content || "..."}</p>
                            <span className={`text-[10px] block mt-1 text-right ${isMe ? "text-blue-100" : "text-gray-400"}`}>
                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t flex gap-3 items-center">
                <input 
                    type="text" 
                    value={messageInput} 
                    onChange={(e) => { setMessageInput(e.target.value); sendTyping(); }} 
                    className="flex-1 p-3 bg-gray-100 border-none rounded-full px-5 focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="Secure message..."
                />
                <button type="submit" className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-all flex items-center justify-center w-12 h-12 shadow-md">
                    <span className="text-xl">➤</span>
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;