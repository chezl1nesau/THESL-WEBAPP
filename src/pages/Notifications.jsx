import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { Bell, Check, Trash2, Clock, Calendar, Award, Megaphone, ShieldCheck } from 'lucide-react';

export default function Notifications({ user, token }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await api.get('/api/notifications', token);
            const data = await res.json();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const markAsRead = async (id) => {
        try {
            const res = await api.put(`/api/notifications/${id}/read`, {}, token);
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const markAllAsRead = async () => {
        try {
            const res = await api.put('/api/notifications/read-all', {}, token);
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <ShieldCheck size={18} color="#10b981" />;
            case 'award': return <Award size={18} color="#f59e0b" />;
            case 'info': return <Megaphone size={18} color="#3b82f6" />;
            case 'error': return <Trash2 size={18} color="#ef4444" />;
            default: return <Bell size={18} color="var(--text-light)" />;
        }
    };

    return (
        <div className="notifications-container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Notifications</h1>
                    <p>Stay updated with your latest alerts and activities.</p>
                </div>
                {notifications.some(n => !n.is_read) && (
                    <button className="btn btn-outline" onClick={markAllAsRead} style={{ fontSize: '0.8rem' }}>
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="card" style={{ padding: '0.5rem' }}>
                {loading ? (
                    <div className="empty-state">Loading your alerts...</div>
                ) : notifications.length === 0 ? (
                    <div className="empty-state">You have no notifications yet.</div>
                ) : (
                    <div className="notification-list">
                        {notifications.map(noti => (
                            <div 
                                key={noti.id} 
                                className={`notification-item ${noti.is_read ? '' : 'unread'}`}
                                style={{
                                    padding: '1.25rem',
                                    borderBottom: '1px solid var(--border)',
                                    display: 'flex',
                                    gap: '1rem',
                                    alignItems: 'flex-start',
                                    transition: 'background 0.2s',
                                    position: 'relative'
                                }}
                            >
                                <div className="notification-icon" style={{ marginTop: '0.2rem' }}>
                                    {getIcon(noti.type)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: noti.is_read ? 600 : 800 }}>{noti.title}</h4>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <Clock size={12} /> {new Date(noti.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: noti.is_read ? 'var(--text-secondary)' : 'var(--text-primary)', lineHeight: '1.5' }}>
                                        {noti.message}
                                    </p>
                                </div>
                                {!noti.is_read && (
                                    <button 
                                        onClick={() => markAsRead(noti.id)}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: '0.25rem' }}
                                        title="Mark as read"
                                    >
                                        <Check size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .notification-item.unread {
                    background: rgba(191, 243, 104, 0.03);
                }
                .notification-item.unread::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 3px;
                    background: var(--accent);
                }
            `}</style>
        </div>
    );
}
