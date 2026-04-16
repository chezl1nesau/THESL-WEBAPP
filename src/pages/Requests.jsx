import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
    Plus, MessageSquare, Tag, Clock, CheckCircle, 
    AlertCircle, Filter, Loader2, Info, CheckCircle2
} from 'lucide-react';

export default function Requests({ token }) {
    const [requests, setRequests] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [type, setType] = useState('IT Support');
    const [filter, setFilter] = useState('All');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loadError, setLoadError] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setLoadError('');
        api.get('/api/requests', token)
            .then(res => res.json())
            .then(data => setRequests(data))
            .catch(err => {
                console.error(err);
                setLoadError('Failed to load requests');
            })
            .finally(() => setLoading(false));
    }, [token]);

    const filteredRequests = filter === 'All' 
        ? requests 
        : requests.filter(r => r.status === filter);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const payload = {
            title,
            type,
            status: 'Open',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
        
        try {
            setStatus({ type: 'info', message: 'Submitting request...' });
            const res = await api.post('/api/requests', payload, token);
            const newRequest = await res.json();
            setRequests([newRequest, ...requests]);
            setShowForm(false);
            setTitle('');
            setType('IT Support');
            setStatus({ type: 'success', message: 'Request submitted successfully!' });
            setTimeout(() => setStatus({ type: '', message: '' }), 3000);
        } catch(err) {
            console.error('Failed to submit request', err);
            setStatus({ type: 'error', message: 'Failed to submit request. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    const getTypeColor = (reqType) => {
        switch(reqType) {
            case 'IT Support': return { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' };
            case 'Facilities': return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
            case 'HR Inquiry': return { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' };
            case 'Payroll': return { color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
            default: return { color: 'var(--text-secondary)', bg: 'rgba(255,255,255,0.05)' };
        }
    };

    const getStatusIconInfo = (statusString) => {
        switch(statusString) {
            case 'Open': return { Icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
            case 'In Progress': return { Icon: Loader2, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', spin: true };
            case 'Resolved': return { Icon: CheckCircle2, color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
            default: return { Icon: Info, color: 'var(--text-light)', bg: 'rgba(255,255,255,0.05)' };
        }
    };

    return (
        <>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1>Internal Requests & Tickets</h1>
                    <p>Submit and track your requests efficiently</p>
                </div>
                <button 
                    className="btn btn-primary" 
                    onClick={() => setShowForm(v => !v)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={16} /> New Request
                </button>
            </div>

            {loadError && (
                <div style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.18)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={18} /> {loadError}
                </div>
            )}

            {status.message && (
                <div style={{ 
                    padding: '1rem', marginBottom: '1.5rem', borderRadius: '10px', 
                    background: status.type === 'success' ? 'rgba(16,185,129,0.1)' : status.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)', 
                    color: status.type === 'success' ? '#10b981' : status.type === 'error' ? '#ef4444' : '#60a5fa', 
                    border: `1px solid ${status.type === 'success' ? 'rgba(16,185,129,0.2)' : status.type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}`,
                    display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600
                }}>
                    {status.type === 'success' && <CheckCircle size={18} />}
                    {status.type === 'error' && <AlertCircle size={18} />}
                    {status.type === 'info' && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
                    {status.message}
                </div>
            )}

            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Total Requests</div>
                        <Tag size={18} color="var(--accent)" />
                    </div>
                    <div className="stat-value">{loading ? '—' : requests.length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Open</div>
                        <Clock size={18} color="#f59e0b" />
                    </div>
                    <div className="stat-value">{loading ? '—' : requests.filter(r => r.status === 'Open').length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">In Progress</div>
                        <Loader2 size={18} color="#3b82f6" />
                    </div>
                    <div className="stat-value">{loading ? '—' : requests.filter(r => r.status === 'In Progress').length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Resolved</div>
                        <CheckCircle2 size={18} color="#10b981" />
                    </div>
                    <div className="stat-value">{loading ? '—' : requests.filter(r => r.status === 'Resolved').length}</div>
                </div>
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(191,243,104,0.15)', background: 'rgba(191,243,104,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(191,243,104,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MessageSquare size={17} color="var(--accent)" />
                            </div>
                            <div>
                                <h3 className="card-title" style={{ margin: 0, fontSize: '0.975rem' }}>Submit New Request</h3>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-light)' }}>Please provide details to help us route your request.</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="grid-2" style={{ gap: '1.25rem', marginBottom: '1.25rem' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label>Request Title *</label>
                                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Broken chair in Meeting Room B" />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label>Department / Category *</label>
                                <select value={type} onChange={e => setType(e.target.value)}>
                                    <option value="IT Support">IT Support</option>
                                    <option value="Facilities">Facilities</option>
                                    <option value="HR Inquiry">HR Inquiry</option>
                                    <option value="Payroll">Payroll</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} onClick={() => setShowForm(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 140, justifyContent: 'center' }}>
                                {submitting ? <><Loader2 size={15} style={{animation: 'spin 1s linear infinite'}}/> Submitting...</> : <><Plus size={15}/> Submit Request</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'rgba(255,255,255,0.01)' }}>
                    <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Tag size={16} color="var(--text-secondary)"/> My Requests
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        {['All', 'Open', 'In Progress', 'Resolved'].map(f => (
                            <button 
                                key={f} 
                                onClick={() => setFilter(f)}
                                style={{
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '6px',
                                    border: 'none',
                                    fontSize: '0.75rem',
                                    fontWeight: filter === f ? 600 : 500,
                                    background: filter === f ? 'var(--accent)' : 'transparent',
                                    color: filter === f ? '#000' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} className="skeleton" style={{ height: 60, borderRadius: 10, width: '100%' }} />
                            ))}
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-light)' }}>
                            <MessageSquare size={40} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                            <p style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                {requests.length === 0 ? "You haven't submitted any requests yet." : `No requests match the "${filter}" filter.`}
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {filteredRequests.map(req => {
                                const typeStyle = getTypeColor(req.type);
                                const statusInfo = getStatusIconInfo(req.status);
                                const StatusIcon = statusInfo.Icon;
                                
                                return (
                                    <div key={req.id} style={{ 
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                        padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.015)', 
                                        borderRadius: '10px', border: '1px solid var(--border)',
                                        flexWrap: 'wrap', gap: '1rem'
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: 200 }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: 4, background: typeStyle.bg, color: typeStyle.color, fontWeight: 700 }}>{req.type}</span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={10} /> {req.date}</span>
                                            </div>
                                            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'white', fontWeight: 600 }}>{req.title}</h4>
                                        </div>
                                        <div style={{ 
                                            display: 'flex', alignItems: 'center', gap: '0.4rem', 
                                            padding: '0.35rem 0.65rem', borderRadius: '20px', 
                                            background: statusInfo.bg, color: statusInfo.color, 
                                            fontSize: '0.75rem', fontWeight: 600 
                                        }}>
                                            <StatusIcon size={14} style={{ animation: statusInfo.spin ? 'spin 1.5s linear infinite' : 'none' }} />
                                            {req.status}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
