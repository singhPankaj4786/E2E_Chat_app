import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/axios";

const Sidebar = ({ onSelectUser, activeUserId, onlineUsers }) => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/users/all");
        setUsers(res.data);
      } catch (err) {
        console.error("Could not fetch users:", err);
      }
    };
    fetchUsers();
  }, []);

  // Filter logic: Derived state ensures real-time updates without breaking history/keys
  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return users;
    return users.filter((user) =>
      user.username.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search Input Section */}
      <div className="p-3 border-b bg-white">
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 pl-9 bg-gray-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >✕</button>
          )}
        </div>
      </div>

      {/* Scrollable Users List */}
      <div className="flex-1 overflow-y-auto">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => onSelectUser(user)} // Initiates chat
              className={`p-4 cursor-pointer flex items-center gap-3 transition-colors border-b ${
                activeUserId === user.id
                  ? "bg-blue-50 border-r-4 border-blue-600"
                  : "hover:bg-gray-50"
              }`}
            >
              {/* Avatar with Presence Indicator */}
              <div className="relative">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  {user.username[0].toUpperCase()}
                </div>
                {/* Dot remains reactive to WebSocket updates via onlineUsers prop */}
                <span 
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    onlineUsers[user.id] ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              </div>

              {/* User Identity and Status Text */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{user.username}</p>
                <p className={`text-xs font-medium ${
                  onlineUsers[user.id] ? "text-green-500" : "text-gray-400"
                }`}>
                  {onlineUsers[user.id] ? "● Online" : "○ Offline"}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-400 text-sm italic">
            No users found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;