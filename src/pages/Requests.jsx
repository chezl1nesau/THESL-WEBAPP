import React, { useState, useEffect } from 'react';

export default function Requests({ user }) {
    const [requests, setRequests] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [type, setType] = useState('IT Support');
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        fetch('/api/requests')
            .then(res => res.json())
            .then(data => setRequests(data))
            .catch(err => console.error(err));
    }, []);

    const filteredRequests = filter === 'All' 
        ? requests 
        : requests.filter(r => r.status === filter);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            title,
            type,
            status: 'Open',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
        
        try {
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const newRequest = await res.json();
            setRequests([newRequest, ...requests]);
            setShowForm(false);
            setTitle('');
            setType('IT Support');
        } catch(err) {
            console.error('Failed to submit request', err);
        }
    };

    return (
        <>
            <div className="page-header">
                <h1>Internal Requests & Tickets</h1>
                <p>Submit and track your requests</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Total Requests</div>
                    <div className="stat-value">{requests.length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Open</div>
                    <div className="stat-value">{requests.filter(r => r.status === 'Open').length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">In Progress</div>
                    <div className="stat-value">{requests.filter(r => r.status === 'In Progress').length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Resolved</div>
                    <div className="stat-value">{requests.filter(r => r.status === 'Resolved').length}</div>
                </div>
            </div>

            <div className="card">
                <div className="card-header" style={{ marginBottom: showForm ? '1rem' : '0' }}>
                    <h3 className="card-title">Submit New Request</h3>
                    {!showForm && (
                        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Request</button>
                    )}
                </div>

                {showForm && (
                    <form onSubmit={handleSubmit} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                        <div className="grid-2" style={{ gap: '1rem' }}>
                            <div className="form-group">
                                <label>Request Title</label>
                                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. IT Issue, Facilities..." />
                            </div>
                            <div className="form-group">
                                <label>Department / Type</label>
                                <select value={type} onChange={e => setType(e.target.value)}>
                                    <option value="IT Support">IT Support</option>
                                    <option value="Facilities">Facilities</option>
                                    <option value="HR Inquiry">HR Inquiry</option>
                                    <option value="Payroll">Payroll</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn" style={{ background: 'var(--bg-main)', border: '1px solid var(--border)' }} onClick={() => setShowForm(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Submit Request</button>
                        </div>
                    </form>
                )}
            </div>

            <div className="card">
                <h3 className="card-title" style={{marginBottom: '1rem'}}>My Requests</h3>
                <div className="filter-buttons">
                    {['All', 'Open', 'In Progress', 'Resolved'].map(f => (
                        <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                            {f}
                        </button>
                    ))}
                </div>

                {filteredRequests.length === 0 ? (
                    <div className="empty-state">No requests found</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Title</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.map(req => (
                                <tr key={req.id}>
                                    <td>{req.date}</td>
                                    <td>{req.type}</td>
                                    <td>{req.title}</td>
                                    <td>
                                        <span className={`badge badge-${
                                            req.status === 'Open' ? 'warning' : 
                                            req.status === 'In Progress' ? 'primary' : 'success'
                                        }`}>
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
