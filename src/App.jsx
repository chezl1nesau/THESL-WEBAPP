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
import Compliments from './pages/Compliments';
import CalendarPage from './pages/CalendarPage';
import UserManagement from './pages/UserManagement';
import ForgotPassword from './pages/ForgotPassword';
import Notifications from './pages/Notifications';
import './index.css';

function PageWrapper({ children }) {
    return (
        <div className="main-content">
            {children}
        </div>
    );
}

function AuthenticatedApp({ user, setUser, token, onLogout }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    return (
        <div style={{ display: 'flex' }}>
            <Sidebar 
                user={user} 
                onLogout={onLogout} 
                isOpen={isSidebarOpen} 
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
            />
            <Routes>
                <Route path="dashboard" element={<PageWrapper><Dashboard user={user} token={token} /></PageWrapper>} />
                <Route path="announcements" element={<PageWrapper><Announcements user={user} token={token} /></PageWrapper>} />
                <Route path="annual-leave" element={<PageWrapper><AnnualLeave user={user} token={token} /></PageWrapper>} />
                <Route path="sick-leave" element={<PageWrapper><SickLeave user={user} token={token} /></PageWrapper>} />
                <Route path="lateness" element={<PageWrapper><LatenessTracker user={user} token={token} /></PageWrapper>} />
                <Route path="requests" element={<PageWrapper><Requests user={user} token={token} /></PageWrapper>} />
                <Route path="performance" element={<PageWrapper><Performance user={user} token={token} /></PageWrapper>} />
                <Route path="documents" element={<PageWrapper><Documents user={user} token={token} /></PageWrapper>} />
                <Route path="compliments" element={<PageWrapper><Compliments user={user} token={token} /></PageWrapper>} />
                <Route path="calendar" element={<PageWrapper><CalendarPage user={user} token={token} /></PageWrapper>} />
                <Route path="users" element={user.role === 'admin' ? <PageWrapper><UserManagement token={token} /></PageWrapper> : <Navigate to="/dashboard" />} />
                <Route path="profile" element={<PageWrapper><Profile user={user} setUser={setUser} token={token} /></PageWrapper>} />
                <Route path="notifications" element={<PageWrapper><Notifications user={user} token={token} /></PageWrapper>} />
                <Route path="admin" element={user.role === 'admin' ? <PageWrapper><ManagementDashboard token={token} /></PageWrapper> : <Navigate to="/dashboard" />} />
                <Route index element={<Navigate to="dashboard" />} />
                <Route path="*" element={<Navigate to="dashboard" />} />
            </Routes>
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
            <Route path="/*" element={
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
