import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

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
        annual_balance: 12,
        sick_balance: 8
    });
    const [status, setStatus] = useState({ type: '', message: '' });

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
            password: '', // Don't show password
            role: user.role,
            phone: user.phone || '',
            annual_balance: user.annual_balance,
            sick_balance: user.sick_balance
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
            annual_balance: 12,
            sick_balance: 8
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

    return (
        <div className="user-management">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>User Management</h1>
                    <p>Manage system users, roles, and leave balances.</p>
                </div>
                <button className="btn btn-primary" onClick={handleAdd}>+ Add User</button>
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
                            <th style={{ textAlign: 'right', padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading users...</td></tr>
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
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <button className="btn btn-secondary" style={{ marginRight: '0.5rem', padding: '0.25rem 0.75rem' }} onClick={() => handleEdit(user)}>Edit</button>
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
        </div>
    );
}
