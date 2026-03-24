import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Dashboard, { ManagementDashboard } from './pages/Dashboard';
import Announcements from './pages/Announcements';
import AnnualLeave from './pages/AnnualLeave';
import SickLeave from './pages/SickLeave';
import LatenessTracker from './pages/LatenessTracker';
import Requests from './pages/Requests';
import Profile from './pages/Profile';
import Performance from './pages/Performance';
import Documents from './pages/Documents';
import CalendarPage from './pages/CalendarPage';
import UserManagement from './pages/UserManagement';
import ForgotPassword from './pages/ForgotPassword';
import './index.css';

function MainContent({ user, setUser, token, currentPage }) {
    return (
        <div className="main-content">
            {currentPage === 'dashboard' && <Dashboard user={user} token={token} />}
            {currentPage === 'announcements' && <Announcements user={user} token={token} />}
            {currentPage === 'annual-leave' && <AnnualLeave user={user} token={token} />}
            {currentPage === 'sick-leave' && <SickLeave user={user} token={token} />}
            {currentPage === 'lateness' && <LatenessTracker user={user} token={token} />}
            {currentPage === 'requests' && <Requests user={user} token={token} />}
            {currentPage === 'performance' && <Performance user={user} token={token} />}
            {currentPage === 'documents' && <Documents user={user} token={token} />}
            {currentPage === 'calendar' && <CalendarPage user={user} token={token} />}
            {currentPage === 'users' && user.role === 'admin' && <UserManagement token={token} />}
            {currentPage === 'profile' && <Profile user={user} setUser={setUser} token={token} />}
            {currentPage === 'admin' && user.role === 'admin' && <ManagementDashboard token={token} />}
        </div>
    );
}

function AuthenticatedApp({ user, setUser, token, onLogout }) {
    const [currentPage, setCurrentPage] = useState('dashboard');
    return (
        <div style={{ display: 'flex' }}>
            <Sidebar user={user} currentPage={currentPage} onNavigate={setCurrentPage} onLogout={onLogout} />
            <MainContent user={user} setUser={setUser} token={token} currentPage={currentPage} />
        </div>
    );
}

function App() {
    const savedUser = localStorage.getItem('thesl_hr_user');
    const savedToken = localStorage.getItem('thesl_hr_token');
    const [currentUser, setCurrentUser] = useState(() => (savedUser && savedToken ? JSON.parse(savedUser) : null));
    const [authToken, setAuthToken] = useState(() => (savedUser && savedToken ? savedToken : null));
    const [showLanding, setShowLanding] = useState(() => !(savedUser && savedToken));
    const navigate = useNavigate();

    const handleLogin = (user, token) => {
        setCurrentUser(user);
        setAuthToken(token);
        localStorage.setItem('thesl_hr_user', JSON.stringify(user));
        localStorage.setItem('thesl_hr_token', token);
        navigate('/'); // Go to home which will show AuthApp
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setAuthToken(null);
        localStorage.removeItem('thesl_hr_user');
        localStorage.removeItem('thesl_hr_token');
        setShowLanding(true);
        navigate('/');
    };

    return (
        <Routes>
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ForgotPassword />} />
            <Route path="/login" element={
                currentUser ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
            } />
            <Route path="/" element={
                currentUser ? (
                    <AuthenticatedApp user={currentUser} setUser={handleLogin} token={authToken} onLogout={handleLogout} />
                ) : (
                    showLanding ? <Landing onGoToLogin={() => setShowLanding(false)} /> : <Navigate to="/login" />
                )
            } />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

export default App;
