import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/axios";

const Sidebar = ({ onSelectUser, activeUserId, onlineUsers, unreadCounts, setUnreadCounts }) => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    api.get("/users/all").then(res => {
      setUsers(res.data);
      const counts = {};
      res.data.forEach(u => counts[u.id] = u.unread_count || 0);
      setUnreadCounts(counts);
    });
  }, [setUnreadCounts]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => u.username?.toLowerCase().includes(searchQuery.toLowerCase().trim()));
  }, [users, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-white border-r">
      {/* Search with Clear Button */}
      <div className="p-4 border-b">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full p-2.5 pl-9 pr-9 bg-gray-100 rounded-xl text-sm border border-transparent focus:border-blue-400 focus:bg-white outline-none transition-all" 
          />
          <span className="absolute left-3 top-3 text-gray-400">🔍</span>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200"
            >✕</button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredUsers.map(u => (
          <div 
            key={u.id} 
            onClick={() => onSelectUser(u)} 
            className={`mx-2 my-1 p-3 cursor-pointer flex items-center gap-3 rounded-xl transition-all border ${
                activeUserId === u.id 
                ? "bg-blue-50 border-blue-200 shadow-sm" 
                : "hover:bg-gray-50 border-transparent"
            }`}
          >
            <div className="relative w-12 h-12 flex-shrink-0">
                <div className="w-full h-full bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-sm">
                    {u.username[0].toUpperCase()}
                </div>
                <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${onlineUsers[u.id] ? "bg-green-500" : "bg-gray-300"}`} />
            </div>
            
            <div className="flex-1 overflow-hidden">
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-bold text-gray-800 truncate">{u.username}</span>
                {unreadCounts[u.id] > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                    {unreadCounts[u.id]}
                  </span>
                )}
              </div>
              <p className={`text-[11px] font-medium ${onlineUsers[u.id] ? "text-green-600" : "text-gray-400"}`}>
                {onlineUsers[u.id] ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <p className="text-center text-gray-400 mt-10 text-sm">No users found</p>
        )}
      </div>
    </div>
  );
};

export default Sidebar;