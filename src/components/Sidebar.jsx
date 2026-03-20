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
                        Dashboard
                    </a>
                </li>
                <li className="nav-item">
                    <a href="#" className={`nav-link ${currentPage === 'announcements' ? 'active' : ''}`}
                       onClick={(e) => { e.preventDefault(); onNavigate('announcements'); }}>
                        Announcements
                    </a>
                </li>
                <li className="nav-item">
                    <a href="#" className={`nav-link ${currentPage === 'documents' ? 'active' : ''}`}
                       onClick={(e) => { e.preventDefault(); onNavigate('documents'); }}>
                        Company Documents
                    </a>
                </li>
                <li className="nav-item">
                    <a href="#" className={`nav-link ${currentPage === 'calendar' ? 'active' : ''}`}
                       onClick={(e) => { e.preventDefault(); onNavigate('calendar'); }}>
                        Calendar
                    </a>
                </li>
                <li className="nav-item">
                    <a href="#" className={`nav-link ${currentPage === 'annual-leave' ? 'active' : ''}`}
                       onClick={(e) => { e.preventDefault(); onNavigate('annual-leave'); }}>
                        Annual Leave
                    </a>
                </li>
                <li className="nav-item">
                    <a href="#" className={`nav-link ${currentPage === 'sick-leave' ? 'active' : ''}`}
                       onClick={(e) => { e.preventDefault(); onNavigate('sick-leave'); }}>
                        Sick Leave
                    </a>
                </li>
                <li className="nav-item">
                    <a href="#" className={`nav-link ${currentPage === 'lateness' ? 'active' : ''}`}
                       onClick={(e) => { e.preventDefault(); onNavigate('lateness'); }}>
                        Lateness Tracker
                    </a>
                </li>
                <li className="nav-item">
                    <a href="#" className={`nav-link ${currentPage === 'requests' ? 'active' : ''}`}
                       onClick={(e) => { e.preventDefault(); onNavigate('requests'); }}>
                        My Requests
                    </a>
                </li>
                <li className="nav-item">
                    <a href="#" className={`nav-link ${currentPage === 'performance' ? 'active' : ''}`}
                       onClick={(e) => { e.preventDefault(); onNavigate('performance'); }}>
                        Performance
                    </a>
                </li>
                <li className="nav-item">
                    <a href="#" className={`nav-link ${currentPage === 'profile' ? 'active' : ''}`}
                       onClick={(e) => { e.preventDefault(); onNavigate('profile'); }}>
                        My Profile
                    </a>
                </li>
                {user.role === 'admin' && (
                    <li className="nav-item">
                        <a href="#" className={`nav-link ${currentPage === 'admin' ? 'active' : ''}`}
                           onClick={(e) => { e.preventDefault(); onNavigate('admin'); }}>
                            Admin Panel
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
