import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import AnimatedPage, { Skeleton } from '../components/AnimatedPage';
import { Shield, Search, Calendar as CalendarIcon, User, Activity } from 'lucide-react';

export default function AuditLogs({ token }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        setLoading(true);
        api.get('/api/admin/audit-logs', token)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setLogs(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [token]);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.email.toLowerCase().includes(search.toLowerCase()) || 
                             log.action.toLowerCase().includes(search.toLowerCase()) ||
                             (log.details && log.details.toLowerCase().includes(search.toLowerCase()));
        
        if (filter === 'all') return matchesSearch;
        return matchesSearch && log.action.includes(filter.toUpperCase());
    });

    return (
        <AnimatedPage>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <Shield size={32} color="var(--accent)" />
                    <h1>Security Audit Traile</h1>
                </div>
                <p>Monitor system activity and compliance logs</p>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: '300px', marginBottom: 0 }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                            <input 
                                type="text" 
                                placeholder="Search by email, action or details..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                    </div>
                    <div className="filter-buttons" style={{ marginBottom: 0 }}>
                        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Activities</button>
                        <button className={`filter-btn ${filter === 'login' ? 'active' : ''}`} onClick={() => setFilter('login')}>Logins</button>
                        <button className={`filter-btn ${filter === 'leave' ? 'active' : ''}`} onClick={() => setFilter('leave')}>Leave Actions</button>
                    </div>
                </div>
            </div>

            <div className="card">
                {loading ? (
                    <div style={{ padding: '1rem' }}>
                        {[...Array(8)].map((_, i) => <Skeleton key={i} text className="mb-4" />)}
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="empty-state">
                        <Activity size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>No audit records found matching your criteria.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>User</th>
                                    <th>Action Type</th>
                                    <th>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map(log => (
                                    <tr key={log.id}>
                                        <td style={{ color: 'var(--text-light)', whiteSpace: 'nowrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <CalendarIcon size={14} />
                                                {new Date(log.created_at).toLocaleString()}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                                                <User size={14} color="var(--accent)" />
                                                {log.email}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${log.action.includes('FAILURE') ? 'danger' : log.action.includes('SUCCESS') ? 'success' : 'primary'}`}>
                                                {log.action.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td style={{ maxWidth: '400px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                            {log.details}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AnimatedPage>
    );
}
