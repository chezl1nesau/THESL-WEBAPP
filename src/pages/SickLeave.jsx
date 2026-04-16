import React, { useState, useRef, useEffect } from 'react';
import { api } from '../utils/api';
import { 
    Thermometer, Upload, Clock, CheckCircle, AlertCircle, FileText, 
    Calendar, Loader2, Info, Plus, Image as ImageIcon, CheckCircle2, ShieldAlert
} from 'lucide-react';

export default function SickLeave({ user, token }) {
    const [requests, setRequests] = useState([]);
    const [balances, setBalances] = useState({ sick_balance: 0, sick_used: 0 });
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState({ type: '', message: '' });
    const fileInputRef = useRef(null);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.get('/api/leave/sick', token).then(res => res.json()),
            api.get(`/api/user/balances?email=${user.email}`, token).then(res => res.json())
        ])
        .then(([leaveData, balanceData]) => {
            setRequests(leaveData.filter(r => r.user_email === user.email));
            setBalances(balanceData);
        })
        .catch(err => {
            console.error(err);
            setStatus({ type: 'error', message: 'Failed to load sick leave data.' });
        })
        .finally(() => setLoading(false));
    }, [user.email, token]);

    const postToApi = async (payload) => {
        try {
            const res = await api.post('/api/leave/sick', payload, token);
            const newReq = await res.json();
            setRequests([newReq, ...requests]);
            return true;
        } catch(err) {
            console.error('Failed to submit sick leave', err);
            return false;
        }
    };
    
    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setStatus({ type: 'info', message: 'Uploading certificate...' });
            const newCert = {
                user_email: user.email,
                name: user.name,
                type: 'Certificate Upload',
                duration: 0,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                fileName: file.name,
                status: 'Uploaded'
            };
            const success = await postToApi(newCert);
            if (success) {
                setStatus({ type: 'success', message: `Certificate ${file.name} uploaded successfully!` });
                setTimeout(() => setStatus({ type: '', message: '' }), 3000);
            } else {
                setStatus({ type: 'error', message: 'Failed to upload certificate.' });
            }
        }
    };

    const [requestDate, setRequestDate] = useState('');
    const [requestDuration, setRequestDuration] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    const handleRequestSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        const newReq = {
            user_email: user.email,
            name: user.name,
            type: 'Sick Leave Request',
            duration: requestDuration,
            date: requestDate,
            fileName: '-',
            status: 'Pending'
        };
        const success = await postToApi(newReq);
        setSubmitting(false);
        if (success) {
            setShowForm(false);
            setRequestDate('');
            setRequestDuration(1);
            setStatus({ type: 'success', message: 'Sick leave requested successfully!' });
            setTimeout(() => setStatus({ type: '', message: '' }), 3000);
        } else {
            setStatus({ type: 'error', message: 'Failed to request sick leave.' });
        }
    };

    const getStatusIconInfo = (statusString) => {
        switch(statusString) {
            case 'Pending': return { Icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
            case 'Uploaded': return { Icon: CheckCircle2, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' };
            case 'Approved': return { Icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
            case 'Rejected': return { Icon: AlertCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
            default: return { Icon: Info, color: 'var(--text-light)', bg: 'rgba(255,255,255,0.05)' };
        }
    };

    return (
        <>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1>Sick Leave</h1>
                    <p>Request sick leave and securely upload medical certificates</p>
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
                        <div className="stat-label">Sick Leave Remaining</div>
                        <Thermometer size={18} color="#10b981" />
                    </div>
                    <div className="stat-value">{loading ? '—' : `${balances.sick_balance} Days`}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Used This Year</div>
                        <Clock size={18} color="#f59e0b" />
                    </div>
                    <div className="stat-value">{loading ? '—' : `${balances.sick_used} Days`}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Certificates</div>
                        <FileText size={18} color="#3b82f6" />
                    </div>
                    <div className="stat-value">{loading ? '—' : requests.filter(r => r.type === 'Certificate Upload').length}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {showForm && (
                     <div className="card" style={{ border: '1px solid rgba(191,243,104,0.15)', background: 'rgba(191,243,104,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(191,243,104,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Thermometer size={17} color="var(--accent)" />
                            </div>
                            <div>
                                <h3 className="card-title" style={{ margin: 0, fontSize: '0.975rem' }}>Request Sick Leave</h3>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-light)' }}>Log your sick days for approval.</p>
                            </div>
                        </div>

                        <form onSubmit={handleRequestSubmit}>
                            <div className="grid-2" style={{ gap: '1.25rem', marginBottom: '1.25rem' }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label>Date of Illness *</label>
                                    <input type="date" required value={requestDate} onChange={e => setRequestDate(e.target.value)} />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label>Duration (Days) *</label>
                                    <input type="number" min="1" max="10" required value={requestDuration} onChange={e => setRequestDuration(parseInt(e.target.value))} />
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.25rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.75rem', color: '#fcd34d' }}>
                                <ShieldAlert size={14} style={{ flexShrink: 0 }} />
                                If duration is more than 2 days, a medical certificate is required by HR.
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
                            <Clock size={16} color="var(--text-secondary)"/> Sick Leave History
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Need to upload a medical certificate?</span>
                            <button 
                                className="btn"
                                onClick={handleUploadClick}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '6px',
                                    border: '1px dashed var(--accent)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    background: 'rgba(191,243,104,0.05)',
                                    color: 'var(--accent)',
                                    cursor: 'pointer'
                                }}
                            >
                                <Upload size={14} /> Upload Cert
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                style={{ display: 'none' }} 
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileChange}
                            />
                        </div>
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
                                <Thermometer size={40} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                                <p style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                    No sick leave records or certificates found.
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {requests.map(req => {
                                    const isUpload = req.type === 'Certificate Upload';
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
                                                    background: isUpload ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)', 
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    {isUpload ? <FileText size={18} color="#3b82f6" /> : <Thermometer size={18} color="#ef4444" />}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'white', fontWeight: 600 }}>
                                                        {isUpload ? 'Medical Certificate' : `Sick Leave (${req.duration} day${req.duration > 1 ? 's' : ''})`}
                                                    </h4>
                                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={11} /> {req.date}</span>
                                                        {isUpload && req.fileName !== '-' && (
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)' }}><ImageIcon size={11} /> {req.fileName}</span>
                                                        )}
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
            </div>
        </>
    );
}
