import React from 'react';

export default function Sidebar({ user, currentPage, onNavigate, onLogout }) {
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">THESL</div>
                <div className="sidebar-subtitle">HR Portal</div>
                <div className="sidebar-powered">
                    <span className="status-dot"></span>
                    Powered by SLVRCLD.com
                </div>
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
                <li className="nav-item">
                    <a href="#" className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
                       onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>
                        <span className="icon">📊</span> Dashboard
                    </a>
                </li>
                <li className="nav-item">
                    <a href="#" className={`nav-link ${currentPage === 'announcements' ? 'active' : ''}`}
                       onClick={(e) => { e.preventDefault(); onNavigate('announcements'); }}>
                        <span className="icon">📢</span> Announcements
                    </a>
                </li>
                <li className="nav-item">
                    <a href="#" className={`nav-link ${currentPage === 'documents' ? 'active' : ''}`}
                       onClick={(e) => { e.preventDefault(); onNavigate('documents'); }}>
                        <span className="icon">📁</span> Company Documents
                    </a>
                </li>
                <li className="nav-item">
                    <a href="#" className={`nav-link ${currentPage === 'calendar' ? 'active' : ''}`}
                       onClick={(e) => { e.preventDefault(); onNavigate('calendar'); }}>
                        <span className="icon">📅</span> Calendar
                    </a>
                </li>
                <li className="nav-item">
                    <a href="#" className={`nav-link ${currentPage === 'annual-leave' ? 'active' : ''}`}
                       onClick={(e) => { e.preventDefault(); onNavigate('annual-leave'); }}>
                        <span className="icon">🌴</span> Annual Leave
                    </a>
                </li>
                <li className="nav-item">
                    <a href="#" className={`nav-link ${currentPage === 'sick-leave' ? 'active' : ''}`}
                       onClick={(e) => { e.preventDefault(); onNavigate('sick-leave'); }}>
                        <span className="icon">🤒</span> Sick Leave
                    </a>
                </li>
                <li className="nav-item">
                    <a href="#" className={`nav-link ${currentPage === 'lateness' ? 'active' : ''}`}
                       onClick={(e) => { e.preventDefault(); onNavigate('lateness'); }}>
                        <span className="icon">⏱️</span> Lateness Tracker
                    </a>
                </li>
                <li className="nav-item">
                    <a href="#" className={`nav-link ${currentPage === 'requests' ? 'active' : ''}`}
                       onClick={(e) => { e.preventDefault(); onNavigate('requests'); }}>
                        <span className="icon">📜</span> My Requests
                    </a>
                </li>
                <li className="nav-item">
                    <a href="#" className={`nav-link ${currentPage === 'performance' ? 'active' : ''}`}
                       onClick={(e) => { e.preventDefault(); onNavigate('performance'); }}>
                        <span className="icon">📈</span> Performance
                    </a>
                </li>
                <li className="nav-item">
                    <a href="#" className={`nav-link ${currentPage === 'profile' ? 'active' : ''}`}
                       onClick={(e) => { e.preventDefault(); onNavigate('profile'); }}>
                        <span className="icon">👤</span> My Profile
                    </a>
                </li>
                {(user.role === 'admin' || user.role === 'manager') && (
                    <li className="nav-item">
                        <a href="#" className={`nav-link ${currentPage === 'admin' ? 'active' : ''}`}
                           onClick={(e) => { e.preventDefault(); onNavigate('admin'); }}>
                            <span className="icon">🛡️</span> Management Dashboard
                        </a>
                    </li>
                )}
                {user.role === 'admin' && (
                    <li className="nav-item">
                        <a href="#" className={`nav-link ${currentPage === 'users' ? 'active' : ''}`}
                           onClick={(e) => { e.preventDefault(); onNavigate('users'); }}>
                            <span className="icon">👥</span> User Management
                        </a>
                    </li>
                )}
            </ul>

            <button className="btn logout-btn" onClick={onLogout}>
                SIGN OUT
            </button>
        </div>
    );
}
