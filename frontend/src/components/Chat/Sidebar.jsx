import React, { useMemo, useState } from "react";

const Sidebar = ({ users, onSelectUser, activeUserId, onlineUsers, unreadCounts }) => {
  const [searchQuery, setSearchQuery] = useState("");

  // 🔄 WHATSAPP SORTING: Strictly re-order based on the activity timestamp
  const sortedAndFilteredUsers = useMemo(() => {
    return [...users]
      .filter(u => u.username?.toLowerCase().includes(searchQuery.toLowerCase().trim()))
      .sort((a, b) => {
          const dateA = new Date(a.last_activity || 0);
          const dateB = new Date(b.last_activity || 0);
          return dateB - dateA; // Newest activity moves to the top
      });
  }, [users, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* Search Header */}
      <div className="p-4 bg-white border-b border-gray-100">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full py-2.5 pl-10 pr-10 bg-gray-100 rounded-2xl text-sm border-none focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none" 
          />
          <span className="absolute left-3.5 top-3 text-gray-400 group-focus-within:text-blue-500 transition-colors">🔍</span>
          {searchQuery && (
            <button 
                onClick={() => setSearchQuery("")} 
                className="absolute right-3 top-2.5 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-all"
            >
                ✕
            </button>
          )}
        </div>
      </div>

      {/* 📜 Scrollable User List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
        {sortedAndFilteredUsers.length > 0 ? (
          sortedAndFilteredUsers.map(u => (
            <div 
              key={u.id} 
              onClick={() => onSelectUser(u)} 
              className={`group relative p-3.5 cursor-pointer flex items-center gap-4 rounded-2xl transition-all duration-300 ${
                  activeUserId === u.id 
                  ? "bg-blue-50 shadow-sm" 
                  : "hover:bg-gray-50 active:scale-[0.98]"
              }`}
            >
              {/* Avatar Section */}
              <div className="relative flex-shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm transition-transform duration-300 group-hover:scale-105 ${
                  activeUserId === u.id ? "bg-blue-600 text-white" : "bg-gray-100 text-blue-600"
                }`}>
                    {u.username ? u.username[0].toUpperCase() : "?"}
                </div>
                {/* Presence Dot */}
                <span className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm transition-colors duration-300 ${
                  onlineUsers[u.id] ? "bg-green-500" : "bg-gray-300"
                }`} />
              </div>
              
              {/* User Identity & Unread Counts */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className={`font-semibold truncate transition-colors ${
                    activeUserId === u.id ? "text-blue-900" : "text-gray-900"
                  }`}>
                    {u.username}
                  </span>
                  
                  {/* 🚀 REACTIVE UNREAD BADGE */}
                  {unreadCounts[u.id] > 0 && (
                    <span className="flex items-center justify-center bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] shadow-sm animate-pulse">
                      {unreadCounts[u.id]}
                    </span>
                  )}
                </div>

                <p className={`text-[12px] font-medium transition-colors ${
                  onlineUsers[u.id] ? "text-green-600" : "text-gray-400"
                }`}>
                  {onlineUsers[u.id] ? "Active Now" : "Offline"}
                </p>
              </div>

              {/* Selection indicator line */}
              {activeUserId === u.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center mt-10 text-gray-400 space-y-2">
             <span className="text-2xl opacity-50">👤</span>
             <p className="text-sm italic font-medium">No contacts found</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 20px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #d1d5db; }
      `}</style>
    </div>
  );
};

export default Sidebar;