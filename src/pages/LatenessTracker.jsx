import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
    Clock, AlertCircle, CheckCircle, Clock3, TimerReset, 
    History, Loader2, Fingerprint, Calendar
} from 'lucide-react';

export default function LatenessTracker({ token }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [history, setHistory] = useState([]);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loadError, setLoadError] = useState('');
    const [loading, setLoading] = useState(true);
    const [loggingAction, setLoggingAction] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        setLoadError('');
        setLoading(true);
        api.get('/api/lateness', token)
            .then(res => res.json())
            .then(data => setHistory(data))
            .catch(err => {
                console.error(err);
                setLoadError('Failed to load lateness history');
            })
            .finally(() => setLoading(false));
    }, [token]);

    const handleArrival = async () => {
        const standardStart = new Date(currentTime);
        standardStart.setHours(8, 0, 0, 0);
        
        let latenessMinutes = 0;
        let statusText = 'On Time';
        
        if (currentTime > standardStart) {
            latenessMinutes = Math.floor((currentTime - standardStart) / (1000 * 60));
            statusText = latenessMinutes > 0 ? `Late by ${latenessMinutes}m` : 'On Time';
        }

        const payload = {
            time: currentTime.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true}),
            date: currentTime.toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'}),
            lateness: latenessMinutes,
            status: statusText
        };

        setLoggingAction(true);
        setStatus({ type: 'info', message: 'Logging arrival...' });

        try {
            const res = await api.post('/api/lateness', payload, token);
            const newRecord = await res.json();
            setHistory([newRecord, ...history]);
            setStatus({ type: 'success', message: `Arrival logged - ${statusText}` });
            setTimeout(() => setStatus({ type: '', message: '' }), 3000);
        } catch(err) {
            console.error('Failed to log arrival', err);
            setStatus({ type: 'error', message: 'Failed to log arrival. Please try again.' });
        } finally {
            setLoggingAction(false);
        }
    };

    const lateCount = history.filter(h => h.lateness > 0).length;
    const totalLateMinutes = history.reduce((sum, h) => sum + h.lateness, 0);
    const avgLate = lateCount > 0 ? Math.round(totalLateMinutes / lateCount) : 0;

    return (
        <>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1>Lateness Tracker</h1>
                    <p>Track your arrival times and monitor punctuality.</p>
                </div>
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
                        <div className="stat-label">Late Instances</div>
                        <AlertCircle size={18} color="#ef4444" />
                    </div>
                    <div className="stat-value">{loading ? '—' : lateCount}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Total Late Minutes</div>
                        <Clock size={18} color="#f59e0b" />
                    </div>
                    <div className="stat-value">{loading ? '—' : totalLateMinutes}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Average Late By</div>
                        <TimerReset size={18} color="#3b82f6" />
                    </div>
                    <div className="stat-value">{loading ? '—' : `${avgLate} min`}</div>
                </div>
            </div>

            <div className="card" style={{textAlign: 'center', padding: '4rem 2rem', marginBottom: '1.5rem', border: '1px solid rgba(191,243,104,0.15)', background: 'linear-gradient(135deg, rgba(191,243,104,0.05) 0%, rgba(0,0,0,0.2) 100%)' }}>
                <Clock3 size={48} color="var(--accent)" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
                <div style={{fontSize: '3.5rem', fontWeight: '800', lineHeight: 1, letterSpacing: '-1px', marginBottom: '0.75rem'}}>
                    {currentTime.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true})}
                </div>
                <div style={{color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Calendar size={18}/> {currentTime.toLocaleDateString('en-US', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}
                </div>
                <p style={{color: 'var(--text-light)', marginBottom: '2rem', fontSize: '0.9rem'}}>Standard Start Time: <strong>8:00 AM</strong></p>
                
                <button 
                    className="btn btn-primary" 
                    onClick={handleArrival} 
                    disabled={loggingAction}
                    style={{ padding: '1rem 2rem', fontSize: '1.1rem', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', borderRadius: '50px', boxShadow: '0 4px 15px rgba(191,243,104,0.15)' }}
                >
                    {loggingAction ? (
                        <><Loader2 size={20} style={{animation: 'spin 1s linear infinite'}}/> Processing...</>
                    ) : (
                        <><Fingerprint size={20}/> MARK ARRIVAL</>
                    )}
                </button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                    <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <History size={16} color="var(--text-secondary)"/> Arrival History
                    </h3>
                </div>
                
                <div style={{ padding: '1.5rem' }}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} className="skeleton" style={{ height: 60, borderRadius: 10, width: '100%' }} />
                            ))}
                        </div>
                    ) : history.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-light)' }}>
                            <History size={40} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                            <p style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                No arrival records yet.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {history.map(record => (
                                <div key={record.id} style={{ 
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                    padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.015)', 
                                    borderRadius: '10px', border: '1px solid var(--border)',
                                    flexWrap: 'wrap', gap: '1rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ 
                                            width: 38, height: 38, borderRadius: 8, 
                                            background: record.lateness > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {record.lateness > 0 ? <AlertCircle size={18} color="#ef4444" /> : <CheckCircle size={18} color="#10b981" />}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'white', fontWeight: 600 }}>
                                                {record.time}
                                            </h4>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.15rem' }}>
                                                {record.date}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ 
                                        display: 'flex', alignItems: 'center', gap: '0.4rem', 
                                        padding: '0.35rem 0.65rem', borderRadius: '20px', 
                                        background: record.lateness > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', 
                                        color: record.lateness > 0 ? '#ef4444' : '#10b981', 
                                        fontSize: '0.75rem', fontWeight: 600 
                                    }}>
                                        {record.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="spacing-bottom" style={{ height: '2rem' }}></div>
        </>
    );
}
