import React, { useState } from 'react';
import Sidebar from '../components/Chat/Sidebar';
import ChatWindow from '../components/Chat/ChatWindow';
import usePresence from '../hooks/usePresence';

const Dashboard = () => {
    const [activeChat, setActiveChat] = useState(null);
    const onlineUsers = usePresence(); // Hook manages the WebSocket connection

    return (
        <div className="flex h-[calc(100vh-64px)] bg-white overflow-hidden">
            {/* Sidebar Container: flex-col ensures search bar stays top-fixed */}
            <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
                <div className="p-4 border-b bg-white font-bold text-xl text-gray-800">
                    Chats
                </div>
                <Sidebar 
                    onSelectUser={setActiveChat}
                    activeUserId={activeChat?.id}
                    onlineUsers={onlineUsers} // Real-time presence data
                />
            </div>

            {/* Chat Window Area */}
            <div className="flex-1 flex flex-col">
                {activeChat ? (
                    <ChatWindow 
                        recipient={activeChat} 
                        onlineUsers={onlineUsers} 
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                        <div className="text-4xl mb-4">💬</div>
                        <p className="text-lg font-medium">Select a friend to chat securely</p>
                        <p className="text-sm">Your messages are end-to-end encrypted.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;