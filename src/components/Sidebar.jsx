import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Megaphone, 
    Folder, 
    Calendar, 
    Palmtree, 
    Stethoscope, 
    Clock, 
    FileClock, 
    TrendingUp, 
    User, 
    ShieldCheck, 
    Users,
    LogOut,
    Menu,
    X
} from 'lucide-react';

export default function Sidebar({ user, onLogout, isOpen, onToggle }) {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { id: 'announcements', label: 'Announcements', icon: Megaphone, path: '/announcements' },
        { id: 'documents', label: 'Documents', icon: Folder, path: '/documents' },
        { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/calendar' },
        { id: 'annual-leave', label: 'Annual Leave', icon: Palmtree, path: '/annual-leave' },
        { id: 'sick-leave', label: 'Sick Leave', icon: Stethoscope, path: '/sick-leave' },
        { id: 'lateness', label: 'Lateness', icon: Clock, path: '/lateness' },
        { id: 'requests', label: 'Requests', icon: FileClock, path: '/requests' },
        { id: 'performance', label: 'Performance', icon: TrendingUp, path: '/performance' },
        { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
    ];

    if (user.role === 'admin' || user.role === 'manager') {
        navItems.push({ id: 'admin', label: 'Management', icon: ShieldCheck, path: '/admin' });
    }
    if (user.role === 'admin') {
        navItems.push({ id: 'users', label: 'Users', icon: Users, path: '/users' });
    }

    return (
        <>
            {/* Mobile Toggle Button */}
            <button 
                className="mobile-sidebar-toggle" 
                onClick={onToggle}
                style={{
                    position: 'fixed',
                    top: '1rem',
                    left: '1rem',
                    zIndex: 1000,
                    padding: '0.5rem',
                    borderRadius: '8px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    color: 'white',
                    display: 'none' // Controlled by CSS media queries
                }}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Backdrop for mobile */}
            {isOpen && (
                <div 
                    className="sidebar-backdrop" 
                    onClick={onToggle}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 998
                    }}
                />
            )}

            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">THESL</div>
                    <div className="sidebar-subtitle">Workforce OS</div>
                </div>

                <div className="user-info">
                    {user.avatar ? (
                        <div className="user-avatar" style={{ backgroundImage: `url(${user.avatar})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' }}></div>
                    ) : (
                        <div className="user-avatar">{user.name.split(' ').map(n => n[0]).join('')}</div>
                    )}
                    <div className="user-name">{user.name}</div>
                    <div className="user-role">{user.role}</div>
                </div>

                <ul className="nav-menu">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <li key={item.id} className="nav-item">
                                <NavLink 
                                    to={item.path} 
                                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                    onClick={() => { if(window.innerWidth < 768) onToggle(); }}
                                >
                                    <Icon size={18} strokeWidth={2} />
                                    <span>{item.label}</span>
                                </NavLink>
                            </li>
                        );
                    })}
                </ul>

                <button className="logout-btn" onClick={onLogout}>
                    <LogOut size={16} /> 
                    <span>SIGN OUT</span>
                </button>
            </div>
        </>
    );
}
