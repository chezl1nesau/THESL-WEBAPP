import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export default function Performance({ user, token }) {
    const [reviews, setReviews] = useState([]);
    const [employees, setEmployees] = useState([]);
    // Init state for Admin
    const [initEmail, setInitEmail] = useState('');
    const [initPeriod, setInitPeriod] = useState('');
    // Assessment state for Employee
    const [activeSelfAssessment, setActiveSelfAssessment] = useState(null);
    const [selfAssessmentText, setSelfAssessmentText] = useState('');
    // Feedback state for Manager
    const [activeManagerFeedback, setActiveManagerFeedback] = useState(null);
    const [feedbackText, setFeedbackText] = useState('');
    const [feedbackRating, setFeedbackRating] = useState(5);

    const fetchReviews = useCallback(() => {
        api.get(`/api/performance?email=${user.email}&role=${user.role}`, token)
            .then(res => res.json())
            .then(data => setReviews(data))
            .catch(err => console.error(err));
    }, [token, user.email, user.role]);

    useEffect(() => {
        fetchReviews();
        if (user.role === 'admin') {
            api.get('/api/users', token)
                .then(res => res.json())
                .then(data => {
                    setEmployees(data);
                    if(data.length > 0) setInitEmail(data[0].email);
                })
                .catch(err => console.error(err));
        }
    }, [fetchReviews, user.role, token]);

    const handleInitReview = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/performance/init', {
                user_email: initEmail,
                manager_email: user.email,
                period: initPeriod,
                date: new Date().toLocaleDateString('en-US')
            }, token);
            setInitPeriod('');
            fetchReviews();
        } catch(err) {
            console.error('Failed to init review', err);
        }
    };

    const handleEmployeeSubmit = async () => {
        try {
            await api.put('/api/performance/employee', {
                id: activeSelfAssessment.id,
                self_assessment: selfAssessmentText
            }, token);
            setActiveSelfAssessment(null);
            setSelfAssessmentText('');
            fetchReviews();
        } catch (err) {
            console.error(err);
        }
    };

    const handleManagerSubmit = async () => {
        try {
            await api.put('/api/performance/manager', {
                id: activeManagerFeedback.id,
                manager_feedback: feedbackText,
                rating: feedbackRating
            }, token);
            setActiveManagerFeedback(null);
            setFeedbackText('');
            setFeedbackRating(5);
            fetchReviews();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <>
            <div className="page-header">
                <h1>Performance & 1-on-1s</h1>
                <p>Quarterly goal tracking and manager feedback.</p>
            </div>

            {user.role === 'admin' ? (
                <>
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <h3 className="card-title" style={{ marginBottom: '1rem' }}>Initiate New Review</h3>
                        <form onSubmit={handleInitReview} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label>Employee</label>
                                <select value={initEmail} onChange={e => setInitEmail(e.target.value)} required>
                                    {employees.map(emp => (
                                        <option key={emp.email} value={emp.email}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label>Review Period (e.g. 2026 Q1)</label>
                                <input type="text" required value={initPeriod} onChange={e => setInitPeriod(e.target.value)} />
                            </div>
                            <button className="btn btn-primary" type="submit">Assign Review</button>
                        </form>
                    </div>

                    {/* Action Required: Manager Feedback */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <h3 className="card-title" style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Awaiting My Feedback</h3>
                        {reviews.filter(r => r.status === 'Awaiting Manager').length === 0 ? (
                            <p style={{color: 'var(--text-light)'}}>You have no pending reviews to close out.</p>
                        ) : (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {reviews.filter(r => r.status === 'Awaiting Manager').map(r => (
                                    <div key={r.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '6px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <strong>{r.user_name} ({r.period})</strong>
                                            <span className="badge badge-warning">Awaiting Manager</span>
                                        </div>
                                        <div style={{ fontSize: '0.9rem', marginBottom: '1rem', background: 'var(--bg-main)', padding: '0.75rem', borderRadius: '4px' }}>
                                            <strong>Self Assessment:</strong><br/>{r.self_assessment}
                                        </div>
                                        
                                        {activeManagerFeedback?.id === r.id ? (
                                            <div>
                                                <textarea style={{ width: '100%', marginBottom: '0.5rem' }} rows="3" placeholder="Manager Feedback..." value={feedbackText} onChange={e => setFeedbackText(e.target.value)}></textarea>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <label style={{ marginRight: '0.5rem' }}>Rating (1-5):</label>
                                                        <input type="number" min="1" max="5" value={feedbackRating} onChange={e => setFeedbackRating(parseInt(e.target.value))} style={{ width: '60px' }} />
                                                    </div>
                                                    <div>
                                                        <button className="btn btn-primary" onClick={handleManagerSubmit} style={{marginLeft: '0.5rem'}}>Complete</button>
                                                        <button className="btn" onClick={() => setActiveManagerFeedback(null)} style={{marginLeft: '0.5rem', background: 'transparent', border:'1px solid var(--border)'}}>Cancel</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <button className="btn btn-primary" onClick={() => {setActiveManagerFeedback(r); setFeedbackText(''); setFeedbackRating(5);}}>Write Feedback</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* All Reviews Log */}
                    <div className="card">
                        <h3 className="card-title" style={{ marginBottom: '1rem' }}>Master Review Log</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Period</th>
                                    <th>Rating</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviews.filter(r => r.status !== 'Awaiting Manager').map(r => (
                                    <tr key={r.id}>
                                        <td>{r.user_name}</td>
                                        <td>{r.period}</td>
                                        <td>{r.status === 'Completed' ? `${r.rating}/5` : '-'}</td>
                                        <td><span className={`badge badge-${r.status === 'Completed' ? 'success' : 'warning'}`}>{r.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <>
                    {/* Employee Dashboard */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <h3 className="card-title" style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Action Required</h3>
                        {reviews.filter(r => r.status === 'Awaiting Employee').length === 0 ? (
                            <p style={{color: 'var(--text-light)'}}>You have no pending performance reviews.</p>
                        ) : (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {reviews.filter(r => r.status === 'Awaiting Employee').map(r => (
                                    <div key={r.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '6px' }}>
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <strong>{r.period} Self-Assessment</strong>
                                            <p style={{fontSize: '0.85rem', color: 'var(--text-light)'}}>Assigned by {r.manager_email} on {r.date}</p>
                                        </div>
                                        
                                        {activeSelfAssessment?.id === r.id ? (
                                            <div>
                                                <textarea style={{ width: '100%', marginBottom: '0.5rem' }} rows="4" placeholder="Detail your accomplishments and goals..." value={selfAssessmentText} onChange={e => setSelfAssessmentText(e.target.value)}></textarea>
                                                <div style={{ textAlign: 'right' }}>
                                                    <button className="btn" onClick={() => setActiveSelfAssessment(null)} style={{background: 'transparent', border:'1px solid var(--border)'}}>Cancel</button>
                                                    <button className="btn btn-primary" onClick={handleEmployeeSubmit} style={{marginLeft: '0.5rem'}}>Submit Assessment</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button className="btn btn-primary" onClick={() => {setActiveSelfAssessment(r); setSelfAssessmentText('');}}>Start Self-Assessment</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <h3 className="card-title" style={{ marginBottom: '1rem' }}>My Completed & In-Progress Reviews</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Period</th>
                                    <th>Status</th>
                                    <th>Rating</th>
                                    <th>Feedback</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviews.filter(r => r.status !== 'Awaiting Employee').map(r => (
                                    <tr key={r.id}>
                                        <td>{r.period}</td>
                                        <td><span className={`badge badge-${r.status === 'Completed' ? 'success' : 'warning'}`}>{r.status}</span></td>
                                        <td>{r.status === 'Completed' ? `${r.rating}/5` : '-'}</td>
                                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {r.status === 'Completed' ? r.manager_feedback : 'Awaiting Manager'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </>
    );
}
