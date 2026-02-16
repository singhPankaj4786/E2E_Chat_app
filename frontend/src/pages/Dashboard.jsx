import React, { useState } from 'react';
import Sidebar from '../components/Chat/Sidebar';
import ChatWindow from '../components/Chat/ChatWindow';
import usePresence from '../hooks/usePresence';
import useChat from '../hooks/useChat';

const Dashboard = () => {
    const [activeChat, setActiveChat] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({}); 
    const onlineUsers = usePresence(); // Global presence listener

    // LIFTED HOOK: Now listens for messages even when no chat is open
    const { messages, sendMessage, sendTyping, isTyping } = useChat(activeChat, setUnreadCounts);

    return (
        <div className="flex h-[calc(100vh-64px)] bg-white overflow-hidden">
            <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
                <div className="p-4 border-b bg-white font-bold text-xl text-gray-800">
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

            <div className="flex-1 flex flex-col">
                {activeChat ? (
                    <ChatWindow 
                        key={activeChat.id} 
                        recipient={activeChat} 
                        onlineUsers={onlineUsers || {}} 
                        // Passing hook states as props to maintain UI logic
                        messages={messages}
                        sendMessage={sendMessage}
                        sendTyping={sendTyping}
                        isTyping={isTyping}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                        <p className="text-lg font-medium text-blue-600">SecureChat E2EE</p>
                        <p className="text-sm italic">Select a user to start a secure conversation</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;