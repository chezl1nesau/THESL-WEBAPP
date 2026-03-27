import React from 'react';
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
    LogOut
} from 'lucide-react';

export default function Sidebar({ user, currentPage, onNavigate, onLogout }) {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'announcements', label: 'Announcements', icon: Megaphone },
        { id: 'documents', label: 'Documents', icon: Folder },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
        { id: 'annual-leave', label: 'Annual Leave', icon: Palmtree },
        { id: 'sick-leave', label: 'Sick Leave', icon: Stethoscope },
        { id: 'lateness', label: 'Lateness', icon: Clock },
        { id: 'requests', label: 'Requests', icon: FileClock },
        { id: 'performance', label: 'Performance', icon: TrendingUp },
        { id: 'profile', label: 'Profile', icon: User },
    ];

    if (user.role === 'admin' || user.role === 'manager') {
        navItems.push({ id: 'admin', label: 'Management', icon: ShieldCheck });
    }
    if (user.role === 'admin') {
        navItems.push({ id: 'users', label: 'Users', icon: Users });
    }

    return (
        <div className="sidebar">
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
                            <a href="#" className={`nav-link ${currentPage === item.id ? 'active' : ''}`}
                               onClick={(e) => { e.preventDefault(); onNavigate(item.id); }}>
                                <Icon size={18} strokeWidth={2} />
                                <span>{item.label}</span>
                            </a>
                        </li>
                    );
                })}
            </ul>

            <button className="logout-btn" onClick={onLogout}>
                <LogOut size={16} /> 
                <span>SIGN OUT</span>
            </button>
        </div>
    );
}
