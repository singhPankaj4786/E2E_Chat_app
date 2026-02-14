import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  // Common styles for the Nav buttons to ensure they look identical
  const navBtnBase = "px-5 py-2 rounded-lg font-bold transition-all duration-200 shadow-sm";
  const activeClass = `${navBtnBase} bg-blue-600 text-white shadow-blue-200`;
  const inactiveClass = `${navBtnBase} text-gray-600 hover:text-blue-600 hover:bg-blue-50`;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        
        {/* Logo */}
        <div className="font-extrabold text-2xl tracking-tight text-blue-600">
          <NavLink to="/">SecureChat</NavLink>
        </div>
        
        <div className="flex items-center space-x-2">
          {!token ? (
            <>
              {/* Login Button */}
              <NavLink 
                to="/login" 
                className={({ isActive }) => isActive ? activeClass : inactiveClass}
              >
                Login
              </NavLink>

              {/* Sign Up Button */}
              <NavLink 
                to="/signup" 
                className={({ isActive }) => isActive ? activeClass : inactiveClass}
              >
                Sign Up
              </NavLink>
            </>
          ) : (
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-700 font-medium">{username}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600 font-bold transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;