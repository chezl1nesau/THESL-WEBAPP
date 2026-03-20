import React, { useState, useEffect } from 'react';
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
import './index.css';

function MainContent({ user, setUser, currentPage }) {
    return (
        <div className="main-content">
            {currentPage === 'dashboard' && <Dashboard user={user} />}
            {currentPage === 'announcements' && <Announcements user={user} />}
            {currentPage === 'annual-leave' && <AnnualLeave user={user} />}
            {currentPage === 'sick-leave' && <SickLeave user={user} />}
            {currentPage === 'lateness' && <LatenessTracker user={user} />}
            {currentPage === 'requests' && <Requests user={user} />}
            {currentPage === 'performance' && <Performance user={user} />}
            {currentPage === 'documents' && <Documents user={user} />}
            {currentPage === 'calendar' && <CalendarPage user={user} />}
            {currentPage === 'profile' && <Profile user={user} setUser={setUser} />}
            {currentPage === 'admin' && user.role === 'admin' && <ManagementDashboard />}
        </div>
    );
}

function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [currentPage, setCurrentPage] = useState('dashboard');
    // Always show landing first; skip only if already logged in from localStorage
    const [showLanding, setShowLanding] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('thesl_hr_user');
        if (savedUser) {
            setCurrentUser(JSON.parse(savedUser));
            setShowLanding(false); // already logged in, go straight to app
        }
    }, []);

    const handleLogin = (user) => {
        setCurrentUser(user);
        localStorage.setItem('thesl_hr_user', JSON.stringify(user));
    };

    const handleLogout = () => {
        setCurrentUser(null);
        localStorage.removeItem('thesl_hr_user');
        setCurrentPage('dashboard');
        setShowLanding(true); // go back to landing after logout
    };

    // Show landing if not yet dismissed AND not already authenticated
    if (showLanding && !currentUser) {
        return <Landing onGoToLogin={() => setShowLanding(false)} />;
    }

    if (!currentUser) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar user={currentUser} currentPage={currentPage} onNavigate={setCurrentPage} onLogout={handleLogout} />
            <MainContent user={currentUser} setUser={handleLogin} currentPage={currentPage} />
        </div>
    );
}

export default App;
