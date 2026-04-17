import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { Sparkles, Brain, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

export default function UserManagement({ token }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        password: '',
        role: 'employee',
        phone: '',
        annual_balance: 15,
        sick_balance: 10,
        team: ''
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [insights, setInsights] = useState(null);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [showInsightsModal, setShowInsightsModal] = useState(false);
    const [targetUser, setTargetUser] = useState(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/admin/users', token);
            const data = await res.json();
            setUsers(data);
            setStatus({ type: '', message: '' });
        } catch (err) {
            console.error('Failed to fetch users', err);
            setStatus({ type: 'error', message: 'Failed to load users. Please try again.' });
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            name: user.name,
            password: '', 
            role: user.role,
            phone: user.phone || '',
            annual_balance: user.annual_balance,
            sick_balance: user.sick_balance,
            team: user.team || ''
        });
        setShowModal(true);
    };

    const handleAdd = () => {
        setEditingUser(null);
        setFormData({
            email: '',
            name: '',
            password: '',
            role: 'employee',
            phone: '',
            annual_balance: 15,
            sick_balance: 10,
            team: ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: 'info', message: 'Processing...' });
        try {
            let res;
            if (editingUser) {
                res = await api.put(`/api/admin/users/${editingUser.email}`, formData, token);
            } else {
                res = await api.post('/api/admin/users', formData, token);
            }
            const data = await res.json();
            if (res.ok) {
                setStatus({ type: 'success', message: `User ${editingUser ? 'updated' : 'created'} successfully!` });
                setShowModal(false);
                fetchUsers();
            } else {
                setStatus({ type: 'error', message: data.message || 'Operation failed' });
            }
        } catch {
            setStatus({ type: 'error', message: 'Network error' });
        }
    };

    const handleDelete = async (email) => {
        if (!window.confirm(`Are you sure you want to delete ${email}?`)) return;
        setStatus({ type: 'info', message: 'Deleting user...' });
        try {
            const res = await api.delete(`/api/admin/users/${email}`, token);
            if (res.ok) {
                setStatus({ type: 'success', message: 'User deleted successfully!' });
                fetchUsers();
            } else {
                const data = await res.json();
                setStatus({ type: 'error', message: data.message || 'Delete failed' });
            }
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: 'Network error. Failed to delete user.' });
        }
    };

    const handleAccrueLeave = async () => {
        if (!window.confirm('Are you sure you want to trigger the automatic yearly leave accrual? This will add 15 Annual and 10 Sick days to ALL users.')) return;
        setStatus({ type: 'info', message: 'Accruing company-wide leave...' });
        try {
            const res = await api.post('/api/admin/accrue-leave', {}, token);
            const data = await res.json();
            if (res.ok) {
                setStatus({ type: 'success', message: data.message });
                fetchUsers();
            } else {
                setStatus({ type: 'error', message: data.message || 'Accrual failed' });
            }
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: 'Network error. Failed to trigger accrual.' });
        }
    };

    const handleViewInsights = async (user) => {
        setTargetUser(user);
        setShowInsightsModal(true);
        setLoadingInsights(true);
        setInsights(null);
        try {
            const res = await api.get(`/api/admin/insights/${user.email}`, token);
            const data = await res.json();
            if (data.success) {
                setInsights(data.insights);
            } else {
                setStatus({ type: 'error', message: data.message });
            }
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: 'Failed to generate insights' });
        } finally {
            setLoadingInsights(false);
        }
    };

    return (
        <div className="user-management">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>User Management</h1>
                    <p>Manage system users, roles, and leave balances.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-outline" style={{ borderColor: 'var(--border)' }} onClick={handleAccrueLeave}>📅 Trigger Yearly Accrual</button>
                    <button className="btn btn-primary" onClick={handleAdd}>+ Add User</button>
                </div>
            </div>

            {status.message && (
                <div style={{ 
                    padding: '1rem', 
                    marginBottom: '1rem', 
                    borderRadius: '8px',
                    backgroundColor: status.type === 'success' ? '#def7ec' : status.type === 'error' ? '#fde8e8' : '#e1effe',
                    color: status.type === 'success' ? '#03543f' : status.type === 'error' ? '#9b1c1c' : '#1e429f'
                }}>
                    {status.message}
                </div>
            )}

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-light)' }}>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Name</th>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Email</th>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Role</th>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Balances (A/S)</th>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Team</th>
                            <th style={{ textAlign: 'right', padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading users...</td></tr>
                        ) : users.map(user => (
                            <tr key={user.email} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                <td style={{ padding: '1rem' }}>
                                    <strong>{user.name}</strong>
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--text-light)' }}>{user.email}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ 
                                        padding: '0.25rem 0.5rem', 
                                        borderRadius: '4px', 
                                        fontSize: '0.75rem',
                                        backgroundColor: user.role === 'admin' ? '#fde8e8' : user.role === 'manager' ? '#e1effe' : '#def7ec',
                                        color: user.role === 'admin' ? '#9b1c1c' : user.role === 'manager' ? '#1e429f' : '#03543f',
                                        textTransform: 'uppercase',
                                        fontWeight: 'bold'
                                    }}>
                                        {user.role}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>{user.annual_balance} / {user.sick_balance}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: 'rgba(191,243,104,0.1)', color: 'var(--accent)' }}>{user.team || '—'}</span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                    <button 
                                        className="btn btn-secondary" 
                                        style={{ background: 'var(--silver-gradient)', color: '#05111d', border: 'none', padding: '0.25rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }} 
                                        onClick={() => handleViewInsights(user)}
                                    >
                                        <Sparkles size={14} /> Insights
                                    </button>
                                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem' }} onClick={() => handleEdit(user)}>Edit</button>
                                    <button className="btn btn-outline" style={{ color: '#e02424', borderColor: '#f8d7da', padding: '0.25rem 0.75rem' }} onClick={() => handleDelete(user.email)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
                        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
                            <div className="form-group">
                                <label>Email</label>
                                <input 
                                    type="email" 
                                    disabled={!!editingUser} 
                                    required 
                                    value={formData.email} 
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                            {!editingUser && (
                                <div className="form-group">
                                    <label>Temporary Password</label>
                                    <input 
                                        type="password" 
                                        required 
                                        value={formData.password} 
                                        onChange={e => setFormData({...formData, password: e.target.value})}
                                    />
                                </div>
                            )}
                            <div className="form-group">
                                <label>Full Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <select 
                                    value={formData.role} 
                                    onChange={e => setFormData({...formData, role: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                                >
                                    <option value="employee">Employee</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Team</label>
                                <select
                                    value={formData.team}
                                    onChange={e => setFormData({...formData, team: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                                >
                                    <option value="">— Select Team —</option>
                                    <option value="Requests">Requests</option>
                                    <option value="Opens">Opens</option>
                                    <option value="Settlements">Settlements</option>
                                    <option value="Management">Management</option>
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Annual Balance</label>
                                    <input type="number" value={formData.annual_balance} onChange={e => setFormData({...formData, annual_balance: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Sick Balance</label>
                                    <input type="number" value={formData.sick_balance} onChange={e => setFormData({...formData, sick_balance: e.target.value})} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showInsightsModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div className="card" style={{ width: '600px', background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(191,243,104,0.05) 0%, transparent 70%)', zIndex: 0 }}></div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: 50, height: 50, borderRadius: '12px', background: 'var(--silver-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#05111d' }}>
                                    <Brain size={28} />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>AI Employee Insights</h2>
                                    <p style={{ margin: 0, color: 'var(--accent)', fontSize: '0.9rem', fontWeight: 600 }}>Analyzing {targetUser?.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowInsightsModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
                        </div>

                        {loadingInsights ? (
                            <div style={{ padding: '4rem 0', textAlign: 'center' }}>
                                <div className="spinner" style={{ border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid var(--accent)', borderRadius: '50%', width: 40, height: 40, animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }}></div>
                                <p style={{ color: 'var(--text-light)' }}>Syncing performance data and leave history...</p>
                            </div>
                        ) : insights ? (
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                                            <AlertTriangle size={14} color={insights.burnout.risk === 'High' ? '#ef4444' : '#f59e0b'} />
                                            Wellness Status
                                        </div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: insights.burnout.risk === 'High' ? '#ef4444' : insights.burnout.risk === 'Medium' ? '#f59e0b' : '#10b981' }}>
                                            {insights.burnout.risk} Burnout Risk
                                        </div>
                                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-light)' }}>{insights.burnout.reason}</p>
                                    </div>

                                    <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                                            <TrendingUp size={14} color="var(--accent)" />
                                            Performance Pulse
                                        </div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                                            {insights.performance.totalAwards} Recognitions
                                        </div>
                                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-light)' }}>Latest: {insights.performance.latestAward}</p>
                                    </div>
                                </div>

                                <div style={{ padding: '1.5rem', borderRadius: '12px', background: 'rgba(191,243,104,0.05)', border: '1px solid rgba(191,243,104,0.2)', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontWeight: 800, fontSize: '0.9rem' }}>
                                        <Sparkles size={16} className="text-accent" />
                                        GENERATED SUMMARY
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.9)', whiteSpace: 'pre-wrap' }}>
                                        {insights.summary}
                                    </p>
                                </div>

                                <button 
                                    className="btn btn-primary" 
                                    style={{ width: '100%', padding: '1rem' }} 
                                    onClick={() => setShowInsightsModal(false)}
                                >
                                    Dismiss Insights
                                </button>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <p style={{ color: '#ef4444' }}>Error: Could not retrieve insights for this user.</p>
                                <button className="btn btn-secondary" onClick={() => setShowInsightsModal(false)}>Close</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
