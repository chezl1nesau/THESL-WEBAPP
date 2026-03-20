import React, { useState, useEffect } from 'react';

export default function AnnualLeave({ user }) {
    const [requests, setRequests] = useState([]);
    const [balances, setBalances] = useState({ annual_balance: 0, annual_used: 0 });
    const [showForm, setShowForm] = useState(false);
    
    // Form state
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');

    useEffect(() => {
        fetch('/api/leave/annual')
            .then(res => res.json())
             // For a real app we'd filter by user.email, but for demo we just show all or filter here
            .then(data => setRequests(data.filter(r => r.user_email === user.email)))
            .catch(err => console.error(err));
            
        fetch(`/api/user/balances?email=${user.email}`)
            .then(res => res.json())
            .then(data => setBalances(data))
            .catch(err => console.error(err));
    }, [user.email]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
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
            const res = await fetch('/api/leave/annual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const newRequest = await res.json();
            setRequests([newRequest, ...requests]);
            setShowForm(false);
            setStartDate('');
            setEndDate('');
            setReason('');
        } catch(err) {
            console.error('Failed to submit leave', err);
        }
    };

    return (
        <>
            <div className="page-header">
                <h1>Annual Leave</h1>
                <p>Request and track your annual leave</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Annual Leave Remaining</div>
                    <div className="stat-value">{balances.annual_balance} Days</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Used This Year</div>
                    <div className="stat-value">{balances.annual_used} Days</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Pending Requests</div>
                    <div className="stat-value">{requests.filter(r => r.status === 'Pending').length}</div>
                </div>
            </div>

            <div className="card">
                <div className="card-header" style={{ marginBottom: showForm ? '1.5rem' : '0' }}>
                    <h3 className="card-title">Request Annual Leave</h3>
                    {!showForm && (
                        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Request</button>
                    )}
                </div>
                
                {showForm && (
                    <form onSubmit={handleSubmit} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                        <div className="grid-2" style={{ gap: '1rem' }}>
                            <div className="form-group">
                                <label>Start Date</label>
                                <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>End Date</label>
                                <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Reason (Optional)</label>
                            <textarea rows="3" value={reason} onChange={e => setReason(e.target.value)} placeholder="Brief reason for leave..."></textarea>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn" style={{ background: 'var(--bg-main)', border: '1px solid var(--border)' }} onClick={() => setShowForm(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Submit Request</button>
                        </div>
                    </form>
                )}
            </div>

            <div className="card">
                <h3 className="card-title" style={{marginBottom: '1rem'}}>Annual Leave History</h3>
                
                {requests.length === 0 ? (
                    <div className="empty-state">No annual leave requests yet</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Submit Date</th>
                                <th>Dates</th>
                                <th>Reason</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(req => (
                                <tr key={req.id}>
                                    <td>{req.submitDate}</td>
                                    <td>{req.startDate} to {req.endDate} ({req.duration} days)</td>
                                    <td>{req.reason || '-'}</td>
                                    <td>
                                        <span className={`badge badge-${req.status === 'Pending' ? 'warning' : req.status === 'Rejected' ? 'danger' : 'success'}`}>
                                            {req.status}
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
