// src/components/Chat/ChatWindow.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { useChat } from '../../hooks/useChat';
import { encryptForRecipient, decryptMessage } from '../../utils/crypto';
import { getPrivateKey } from '../../utils/storage';

const ChatWindow = ({ recipient }) => {
    const [inputText, setInputText] = useState('');
    const [decryptedMessages, setDecryptedMessages] = useState([]);
    const scrollRef = useRef(null);

    const token = localStorage.getItem('token');
    const myId = parseInt(localStorage.getItem('userId'));
    const { messages, sendMessage } = useChat(token);

    // Scroll to bottom whenever messages change
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [decryptedMessages]);

    // Fetch and Decrypt History
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const res = await api.get(`/chat/history/${recipient.id}`);
                const privKey = await getPrivateKey();
                
                const decrypted = await Promise.all(res.data.map(async (msg) => {
                    try {
                        const packageData = JSON.parse(msg.encrypted_content);
                        const clearText = privKey ? await decryptMessage(packageData, privKey) : "[Encrypted]";
                        return { ...msg, clearText };
                    } catch { return { ...msg, clearText: "[Decryption Failed]" }; }
                }));
                setDecryptedMessages(decrypted);
            } catch (err) { console.error(err); }
        };
        loadHistory();
    }, [recipient.id]);

    // Handle incoming messages
    useEffect(() => {
        const handleNewMsg = async () => {
            const latest = messages[messages.length - 1];
            if (latest && (latest.sender_id === recipient.id || latest.sender_id === myId)) {
                const privKey = await getPrivateKey();
                try {
                    const clearText = await decryptMessage(JSON.parse(latest.encrypted_content), privKey);
                    setDecryptedMessages(prev => [...prev, { ...latest, clearText }]);
                } catch { setDecryptedMessages(prev => [...prev, { ...latest, clearText: "[Unreadable]" }]); }
            }
        };
        handleNewMsg();
    }, [messages]);

    const onSend = async (e) => {
        e.preventDefault();
    console.log("Recipient Data:", recipient); // <--- Check if public_key is here
    if (!recipient.public_key) {
        alert("Cannot encrypt: This user has no public key registered.");
        return;
    }
        try {
            const encryptedPackage = await encryptForRecipient(inputText, recipient.public_key);
            sendMessage(recipient.id, JSON.stringify(encryptedPackage));
            setInputText('');
        } catch (err) { alert("Failed to encrypt message."); }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    {recipient.username[0].toUpperCase()}
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">{recipient.username}</h3>
                    <p className="text-xs text-green-500 font-medium">● Secure Session Active</p>
                </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {decryptedMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender_id === myId ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm text-sm ${
                            msg.sender_id === myId ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border'
                        }`}>
                            {msg.clearText}
                        </div>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={onSend} className="p-4 bg-white border-t flex gap-2 items-center">
                <input 
                    className="flex-1 bg-gray-100 border-none rounded-full px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Type an encrypted message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                />
                <button type="submit" className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;