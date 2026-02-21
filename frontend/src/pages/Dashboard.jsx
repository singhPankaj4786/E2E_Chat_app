import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from '../components/Chat/Sidebar';
import ChatWindow from '../components/Chat/ChatWindow';
import usePresence from '../hooks/usePresence';
import useChat from '../hooks/useChat';
import api from '../api/axios';

const Dashboard = () => {
    const [users, setUsers] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({}); 
    const [resetUsers, setResetUsers] = useState({}); 

    const onlineUsers = usePresence(); 

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get("/users/all");
                const initialized = res.data.map(u => ({
                    ...u,
                    last_activity: u.last_message_time || new Date(0).toISOString()
                }));
                setUsers(initialized);
                
                const counts = {};
                res.data.forEach(u => counts[u.id] = u.unread_count || 0);
                setUnreadCounts(counts); // Initialize counts
            } catch (err) { console.error("Load users error", err); }
        };
        fetchUsers();
    }, []);

    const bumpUserToTop = useCallback((userId) => {
        setUsers(prevUsers => {
            const userIndex = prevUsers.findIndex(u => u.id === userId);
            if (userIndex === -1) return prevUsers;
            const updatedUsers = [...prevUsers];
            updatedUsers[userIndex] = { ...updatedUsers[userIndex], last_activity: new Date().toISOString() };
            return updatedUsers;
        });
    }, []);

    const handleSecurityAlert = useCallback((userId, newPublicKey) => {
        setResetUsers(prev => ({ ...prev, [userId]: true }));
        setActiveChat(prev => (prev?.id === userId ? { ...prev, public_key: newPublicKey } : prev));
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, public_key: newPublicKey } : u));
    }, []);

    const handleVerificationSuccess = useCallback((userId) => {
        setResetUsers(prev => {
            const newState = { ...prev };
            delete newState[userId];
            return newState;
        });
    }, []);

    const { messages, sendMessage, sendTyping, isTyping } = useChat(
        activeChat, 
        setUnreadCounts, // Correctly passed here
        handleSecurityAlert,
        bumpUserToTop 
    );

    return (
        <div className="flex h-[calc(100vh-64px)] bg-[#fdfdfd] overflow-hidden font-sans">
            <div className="w-[320px] flex flex-col bg-white border-r border-gray-100 z-20">
                <div className="px-6 py-6 font-black text-2xl tracking-tighter text-gray-800">Chats</div>
                <Sidebar 
                    users={users} 
                    onSelectUser={setActiveChat}
                    activeUserId={activeChat?.id}
                    onlineUsers={onlineUsers || {}}
                    unreadCounts={unreadCounts}
                />
            </div>

            <div className="flex-1 bg-white flex flex-col relative">
                {activeChat ? (
                    <ChatWindow 
                        key={`${activeChat.id}-${activeChat.public_key}`} 
                        recipient={activeChat} 
                        onlineUsers={onlineUsers || {}} 
                        messages={activeChat && resetUsers[activeChat.id] 
                            ? [...messages, { id: 'sys', type: 'system', decrypted_content: "Security Notice: Identity Reset." }] 
                            : messages
                        }
                        sendMessage={sendMessage}
                        sendTyping={sendTyping}
                        isTyping={isTyping}
                        onVerifiedSuccess={() => handleVerificationSuccess(activeChat.id)}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-[#f9fafb] text-gray-400 italic">
                        Select a contact to start chatting
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;