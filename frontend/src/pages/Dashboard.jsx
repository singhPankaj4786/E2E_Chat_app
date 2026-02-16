import React, { useState } from 'react';
import Sidebar from '../components/Chat/Sidebar';
import ChatWindow from '../components/Chat/ChatWindow';
import usePresence from '../hooks/usePresence';

const Dashboard = () => {
    const [activeChat, setActiveChat] = useState(null);
    const onlineUsers = usePresence();

    return (
        <div className="flex h-[calc(100vh-64px)] bg-white overflow-hidden">
            <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
                <div className="p-4 border-b bg-white font-bold text-xl">Chats</div>
                <Sidebar 
                    onSelectUser={setActiveChat}
                    activeUserId={activeChat?.id}
                    onlineUsers={onlineUsers}
                />
            </div>

            <div className="flex-1 flex flex-col">
                {activeChat ? (
                    <ChatWindow recipient={activeChat} onlineUsers={onlineUsers} />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                        <p className="text-lg font-medium">Select a friend to chat securely</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
