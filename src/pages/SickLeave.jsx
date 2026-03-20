import React, { useState, useRef, useEffect } from 'react';

export default function SickLeave({ user }) {
    const [requests, setRequests] = useState([]);
    const [balances, setBalances] = useState({ sick_balance: 0, sick_used: 0 });
    const [showForm, setShowForm] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetch('/api/leave/sick')
            .then(res => res.json())
            .then(data => setRequests(data.filter(r => r.user_email === user.email)))
            .catch(err => console.error(err));
            
        fetch(`/api/user/balances?email=${user.email}`)
            .then(res => res.json())
            .then(data => setBalances(data))
            .catch(err => console.error(err));
    }, [user.email]);

    const postToApi = async (payload) => {
        try {
            const res = await fetch('/api/leave/sick', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const newReq = await res.json();
            setRequests([newReq, ...requests]);
        } catch(err) {
            console.error('Failed to submit sick leave', err);
        }
    };
    
    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const newCert = {
                user_email: user.email,
                name: user.name,
                type: 'Certificate Upload',
                duration: 0,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                fileName: file.name,
                status: 'Uploaded'
            };
            postToApi(newCert);
            alert(`Certificate ${file.name} uploaded successfully!`);
        }
    };

    const [requestDate, setRequestDate] = useState('');
    const [requestDuration, setRequestDuration] = useState(1);

    const handleRequestSubmit = (e) => {
        if (e) e.preventDefault();
        const newReq = {
            user_email: user.email,
            name: user.name,
            type: 'Sick Leave Request',
            duration: requestDuration,
            date: requestDate,
            fileName: '-',
            status: 'Pending'
        };
        postToApi(newReq);
        setShowForm(false);
        setRequestDate('');
        setRequestDuration(1);
    };

    return (
        <>
            <div className="page-header">
                <h1>Sick Leave</h1>
                <p>Request sick leave and upload medical certificates</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Sick Leave Remaining</div>
                    <div className="stat-value">{balances.sick_balance} Days</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Used This Year</div>
                    <div className="stat-value">{balances.sick_used} Days</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Certificates Uploaded</div>
                    <div className="stat-value">{requests.filter(r => r.type === 'Certificate Upload').length}</div>
                </div>
            </div>

            <div className="grid-2">
                <div className="card">
                    <div className="card-header" style={{ marginBottom: showForm ? '1rem' : '0' }}>
                        <h3 className="card-title">Request Sick Leave</h3>
                        {!showForm && (
                            <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Request</button>
                        )}
                    </div>
                    {showForm && (
                        <form onSubmit={handleRequestSubmit} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                            <div className="form-group">
                                <label>Date of Illness</label>
                                <input type="date" required value={requestDate} onChange={e => setRequestDate(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Duration (Days)</label>
                                <input type="number" min="1" max="10" required value={requestDuration} onChange={e => setRequestDuration(parseInt(e.target.value))} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn" style={{ background: 'var(--bg-main)', border: '1px solid var(--border)' }} onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Submit Request</button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="card">
                    <h3 className="card-title" style={{marginBottom: '1rem'}}>Upload Medical Certificate</h3>
                    <div 
                        style={{textAlign: 'center', padding: '2rem', background: 'var(--bg-main)', borderRadius: '6px', cursor: 'pointer', border: '2px dashed var(--border)'}}
                        onClick={handleUploadClick}
                    >
                        <p style={{color: 'var(--text-secondary)', fontWeight: '600'}}>Click to Upload Certificate</p>
                        <p style={{fontSize: '0.8125rem', color: 'var(--text-light)', marginTop: '0.5rem'}}>PDF, JPG, PNG (Max 10MB)</p>
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                    />
                </div>
            </div>

            <div className="card">
                <h3 className="card-title" style={{marginBottom: '1rem'}}>Sick Leave History</h3>
                
                {requests.length === 0 ? (
                    <div className="empty-state">No sick leave records yet</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Details</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(req => (
                                <tr key={req.id}>
                                    <td>{req.date}</td>
                                    <td>{req.type}</td>
                                    <td>{req.fileName}</td>
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
