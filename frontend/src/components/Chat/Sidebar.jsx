import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const Sidebar = ({ onSelectUser, activeUserId }) => {
    const [users, setUsers] = React.useState([]);

    React.useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get('/users/all');
                setUsers(res.data);
            } catch (err) {
                console.error("Could not fetch users:", err);
            }
        };
        fetchUsers();
    }, []);

    return (
        <div className="flex-1 overflow-y-auto">
            {users.map(user => (
                <div 
                    key={user.id} 
                    onClick={() => onSelectUser(user)}
                    className={`p-4 cursor-pointer flex items-center gap-3 transition-colors border-b ${
                        activeUserId === user.id ? 'bg-blue-50 border-r-4 border-blue-600' : 'hover:bg-gray-50'
                    }`}
                >
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                        {user.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{user.username}</p>
                        <p className="text-xs text-gray-400">
                            {user.public_key ? "🔒 Secure" : "⚠️ No Key"}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Sidebar;
