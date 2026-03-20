import React, { useState, useEffect } from 'react';

export default function LatenessTracker({ user }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetch('/api/lateness')
            .then(res => res.json())
            .then(data => setHistory(data))
            .catch(err => console.error(err));
    }, []);

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
            const res = await fetch('/api/lateness', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const newRecord = await res.json();
            setHistory([newRecord, ...history]);
        } catch(err) {
            console.error('Failed to log arrival', err);
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
