import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
    CalendarDays, Sun, Clock, CheckCircle, AlertCircle, 
    Calendar, Loader2, Info, Plus, CalendarRange, CheckCircle2
} from 'lucide-react';

export default function AnnualLeave({ user, token }) {
    const [requests, setRequests] = useState([]);
    const [balances, setBalances] = useState({ annual_balance: 0, annual_used: 0 });
    const [showForm, setShowForm] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loadError, setLoadError] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Form state
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');

    useEffect(() => {
        setLoadError('');
        setLoading(true);

        Promise.all([
            api.get('/api/leave/annual', token).then(res => res.json()),
            api.get(`/api/user/balances?email=${user.email}`, token).then(res => res.json())
        ])
        .then(([leaveData, balanceData]) => {
            setRequests(leaveData.filter(r => r.user_email === user.email));
            setBalances(balanceData);
        })
        .catch(err => {
            console.error(err);
            setLoadError('Failed to load annual leave data');
        })
        .finally(() => setLoading(false));
    }, [user.email, token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        
        const d1 = new Date(startDate);
        const d2 = new Date(endDate);
        const duration = Math.max(1, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);

        const payload = {
            user_email: user.email,
            name: user.name,
            startDate,
            endDate,
            duration,
            reason,
            status: 'Pending',
            submitDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
        
        try {
            setStatus({ type: 'info', message: 'Submitting request...' });
            const res = await api.post('/api/leave/annual', payload, token);
            const newRequest = await res.json();
            setRequests([newRequest, ...requests]);
            setShowForm(false);
            setStartDate('');
            setEndDate('');
            setReason('');
            setStatus({ type: 'success', message: 'Leave request submitted successfully!' });
            setTimeout(() => setStatus({ type: '', message: '' }), 3000);
        } catch(err) {
            console.error('Failed to submit leave', err);
            setStatus({ type: 'error', message: 'Failed to submit leave request. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusIconInfo = (statusString) => {
        switch(statusString) {
            case 'Pending': return { Icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
            case 'Approved': return { Icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
            case 'Rejected': return { Icon: AlertCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
            default: return { Icon: Info, color: 'var(--text-light)', bg: 'rgba(255,255,255,0.05)' };
        }
    };

    return (
        <>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1>Annual Leave</h1>
                    <p>Request time off and track your annual leave balances</p>
                </div>
                {!showForm && (
                    <button 
                        className="btn btn-primary" 
                        onClick={() => setShowForm(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Plus size={16} /> Request Leave
                    </button>
                )}
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

            <div className="stats-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Annual Leave Remaining</div>
                        <CalendarDays size={18} color="#10b981" />
                    </div>
                    <div className="stat-value">{loading ? '—' : `${balances.annual_balance} Days`}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Used This Year</div>
                        <Sun size={18} color="#f59e0b" />
                    </div>
                    <div className="stat-value">{loading ? '—' : `${balances.annual_used} Days`}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Pending Requests</div>
                        <Clock size={18} color="#3b82f6" />
                    </div>
                    <div className="stat-value">{loading ? '—' : requests.filter(r => r.status === 'Pending').length}</div>
                </div>
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(191,243,104,0.15)', background: 'rgba(191,243,104,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(191,243,104,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Sun size={17} color="var(--accent)" />
                        </div>
                        <div>
                            <h3 className="card-title" style={{ margin: 0, fontSize: '0.975rem' }}>Request Annual Leave</h3>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-light)' }}>Plan your time off.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="grid-2" style={{ gap: '1.25rem', marginBottom: '1.25rem' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label>Start Date *</label>
                                <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label>End Date *</label>
                                <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                            <label>Reason (Optional)</label>
                            <textarea rows="3" value={reason} onChange={e => setReason(e.target.value)} placeholder="Brief reason for leave..." style={{ resize: 'vertical' }}></textarea>
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
                        <CalendarRange size={16} color="var(--text-secondary)"/> Annual Leave History
                    </h3>
                </div>
                
                <div style={{ padding: '1.5rem' }}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} className="skeleton" style={{ height: 60, borderRadius: 10, width: '100%' }} />
                            ))}
                        </div>
                    ) : requests.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-light)' }}>
                            <CalendarRange size={40} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                            <p style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                No annual leave requests yet.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {requests.map(req => {
                                const statusInfo = getStatusIconInfo(req.status);
                                const StatusIcon = statusInfo.Icon;
                                
                                return (
                                    <div key={req.id} style={{ 
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                        padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.015)', 
                                        borderRadius: '10px', border: '1px solid var(--border)',
                                        flexWrap: 'wrap', gap: '1rem'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 200 }}>
                                            <div style={{ 
                                                width: 38, height: 38, borderRadius: 8, 
                                                background: 'rgba(191,243,104,0.1)', 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <Sun size={18} color="var(--accent)" />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'white', fontWeight: 600 }}>
                                                    {req.duration} Day{req.duration > 1 ? 's' : ''} Leave
                                                </h4>
                                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)' }}><Calendar size={11} /> {req.startDate} to {req.endDate}</span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Submitted: {req.submitDate}</span>
                                                    {req.reason && <span style={{ fontStyle: 'italic', opacity: 0.7 }}>"{req.reason}"</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ 
                                            display: 'flex', alignItems: 'center', gap: '0.4rem', 
                                            padding: '0.35rem 0.65rem', borderRadius: '20px', 
                                            background: statusInfo.bg, color: statusInfo.color, 
                                            fontSize: '0.75rem', fontWeight: 600 
                                        }}>
                                            <StatusIcon size={14} />
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
