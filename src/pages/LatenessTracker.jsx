import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function LatenessTracker({ token }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [history, setHistory] = useState([]);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        setLoadError('');
        api.get('/api/lateness', token)
            .then(res => res.json())
            .then(data => setHistory(data))
            .catch(err => {
                console.error(err);
                setLoadError('Failed to load lateness history');
            });
    }, [token]);

    const handleArrival = async () => {
        const standardStart = new Date(currentTime);
        standardStart.setHours(9, 0, 0, 0);
        
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

        try {
            setStatus({ type: 'info', message: 'Logging arrival...' });
            const res = await api.post('/api/lateness', payload, token);
            const newRecord = await res.json();
            setHistory([newRecord, ...history]);
            setStatus({ type: 'success', message: `Arrival logged - ${statusText}` });
            setTimeout(() => setStatus({ type: '', message: '' }), 3000);
        } catch(err) {
            console.error('Failed to log arrival', err);
            setStatus({ type: 'error', message: 'Failed to log arrival. Please try again.' });
        }
    };

    const lateCount = history.filter(h => h.lateness > 0).length;
    const totalLateMinutes = history.reduce((sum, h) => sum + h.lateness, 0);
    const avgLate = lateCount > 0 ? Math.round(totalLateMinutes / lateCount) : 0;

    return (
        <>
            <div className="page-header">
                <h1>Lateness Tracker</h1>
                <p>Track your arrival times and lateness</p>
            </div>

            {loadError && (
                <div style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '8px', backgroundColor: '#fde8e8', color: '#9b1c1c' }}>
                    {loadError}
                </div>
            )}

            {status.message && (
                <div style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '8px', backgroundColor: status.type === 'success' ? '#def7ec' : status.type === 'error' ? '#fde8e8' : '#e1effe', color: status.type === 'success' ? '#03543f' : status.type === 'error' ? '#9b1c1c' : '#1e429f' }}>
                    {status.message}
                </div>
            )}

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Late Instances</div>
                    <div className="stat-value">{lateCount}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Total Late Minutes</div>
                    <div className="stat-value">{totalLateMinutes}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Average Late By</div>
                    <div className="stat-value">{avgLate} min</div>
                </div>
            </div>

            <div className="card" style={{textAlign: 'center', padding: '3rem'}}>
                <div style={{fontSize: '3rem', fontWeight: '700', marginBottom: '1rem'}}>
                    {currentTime.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true})}
                </div>
                <div style={{color: 'var(--text-secondary)', marginBottom: '1.5rem'}}>
                    {currentTime.toLocaleDateString('en-US', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}
                </div>
                <p style={{color: 'var(--text-secondary)', marginBottom: '1.5rem'}}>Standard Start Time: 9:00 AM</p>
                <button className="btn btn-primary" onClick={handleArrival}>MARK ARRIVAL</button>
            </div>

            <div className="card">
                <h3 className="card-title">Arrival History</h3>
                {history.length === 0 ? (
                    <div className="empty-state">No arrival records yet</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Arrival Time</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map(record => (
                                <tr key={record.id}>
                                    <td>{record.date}</td>
                                    <td>{record.time}</td>
                                    <td>
                                        <span className={`badge badge-${record.lateness > 0 ? 'danger' : 'success'}`}>
                                            {record.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}
