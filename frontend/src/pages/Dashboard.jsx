import React, { useState } from 'react';
import Sidebar from '../components/Chat/Sidebar';
import ChatWindow from '../components/Chat/ChatWindow';
import usePresence from '../hooks/usePresence';
import useChat from '../hooks/useChat';

const Dashboard = () => {
    const [activeChat, setActiveChat] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({}); 
    
    // Global presence listener for green/gray status dots
    const onlineUsers = usePresence(); 

    // Global chat listener: Keeps unread counts updated even on this screen
    const { messages, sendMessage, sendTyping, isTyping } = useChat(activeChat, setUnreadCounts);

    return (
        <div className="flex h-[calc(100vh-64px)] bg-[#fdfdfd] overflow-hidden">
            {/* Sidebar Column: Using a soft shadow instead of a black border line */}
            <div className="w-[320px] flex flex-col bg-white z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="px-6 py-6 bg-white font-black text-2xl tracking-tighter text-gray-800">
                    Chats
                </div>
                <Sidebar 
                    onSelectUser={setActiveChat}
                    activeUserId={activeChat?.id}
                    onlineUsers={onlineUsers || {}}
                    unreadCounts={unreadCounts}
                    setUnreadCounts={setUnreadCounts}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-white flex flex-col relative">
                {activeChat ? (
                    <ChatWindow 
                        key={activeChat.id} 
                        recipient={activeChat} 
                        onlineUsers={onlineUsers || {}} 
                        messages={messages}
                        sendMessage={sendMessage}
                        sendTyping={sendTyping}
                        isTyping={isTyping}
                    />
                ) : (
                    /* Pleasant Empty State */
                    <div className="flex-1 flex flex-col items-center justify-center bg-[#f9fafb] text-gray-400">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                            <span className="text-4xl">🔐</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-700">Your Private Space</h2>
                        <p className="text-sm text-gray-500 mt-1">Select a contact to start an end-to-end encrypted chat</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;