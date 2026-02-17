import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Auth/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import { useKeyVault } from './context/KeyContext';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const { unlockedKey, isVaultLoading } = useKeyVault();

  // 1. If still checking session storage, show a loader
  if (isVaultLoading) return <div className="flex items-center justify-center h-screen">Loading Secure Vault...</div>;

  // 2. If no token, go to login
  if (!token) return <Navigate to="/login" replace />;

  // 3. If token exists but vault is locked (not in session), go to login
  if (!unlockedKey) return <Navigate to="/login" replace />;
  
  return children;
};

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/signup" replace />} />
        <Route path="*" element={<Navigate to="/signup" replace />} />
      </Routes>
    </Router>
  );
}

export default App;