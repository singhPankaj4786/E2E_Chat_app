import React, { useState, useEffect, useRef } from 'react';
import useChat from '../../hooks/useChat';
import api from '../../api/axios';

const ChatWindow = ({ recipient }) => {
    const [newMessage, setNewMessage] = useState("");
    const { messages, setMessages, sendMessage, isConnected } = useChat(recipient.id);
    const scrollRef = useRef(null);
    const myId = parseInt(localStorage.getItem('userId'));

    // 1. Fetch Plain Text History
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const res = await api.get(`/chat/history/${recipient.id}`);
                setMessages(res.data);
            } catch (err) {
                console.error("Failed to load history:", err);
            }
        };
        if (recipient.id) loadHistory();
    }, [recipient.id, setMessages]);

    // 2. Auto-scroll to bottom
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const onSend = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !isConnected) return;

        // Plain text payload for testing
        const payload = {
            recipient_id: recipient.id,
            content: newMessage, // Matches 'content' column in DB
            sender_id: myId
        };

        // Send via WebSocket for real-time delivery
        sendMessage(payload);

        // Update local UI immediately
        const localMsg = {
            id: Date.now(),
            sender_id: myId,
            content: newMessage,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, localMsg]);
        setNewMessage("");
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {recipient.username[0].toUpperCase()}
                </div>
                <div>
                    <h2 className="font-bold">{recipient.username}</h2>
                    <span className={`text-[10px] font-bold ${isConnected ? 'text-green-500' : 'text-gray-400'}`}>
                        {isConnected ? '● ONLINE' : '○ CONNECTING...'}
                    </span>
                </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender_id === myId ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm ${
                            msg.sender_id === myId ? 'bg-blue-600 text-white' : 'bg-white border'
                        }`}>
                            <p className="text-sm">{msg.content}</p>
                        </div>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            {/* Input */}
            <form onSubmit={onSend} className="p-4 border-t">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 p-3 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="submit" className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700">
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatWindow;