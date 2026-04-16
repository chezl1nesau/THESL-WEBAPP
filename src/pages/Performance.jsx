import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { 
    Target, Star, MessageSquare, TrendingUp, AlertCircle, CheckCircle, 
    Upload, FileSpreadsheet, Download, Loader2, CheckCircle2, User as UserIcon
} from 'lucide-react';

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
    // KPI state
    const [kpiFiles, setKpiFiles] = useState([]);
    const [kpiTitle, setKpiTitle] = useState('');
    const [kpiFile, setKpiFile] = useState(null);
    const [kpiStatus, setKpiStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(true);

    const fetchReviews = useCallback(() => {
        api.get(`/api/performance?email=${user.email}&role=${user.role}`, token)
            .then(res => res.json())
            .then(data => setReviews(data))
            .catch(err => console.error(err));
    }, [token, user.email, user.role]);

    const fetchKpis = useCallback(() => {
        api.get('/api/documents', token)
            .then(res => res.json())
            .then(data => {
                // Employees only see items with [KPI] and their name (handled by backend now, but extra safety here)
                setKpiFiles(data.filter(d => d.title.toUpperCase().includes('[KPI]')));
            })
            .catch(err => console.error(err));
    }, [token]);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchReviews(), fetchKpis()]).finally(() => setLoading(false));

        if (user.role === 'admin' || user.role === 'manager') {
            api.get('/api/users', token)
                .then(res => res.json())
                .then(data => {
                    setEmployees(data);
                    if(data.length > 0) setInitEmail(data[0].email);
                })
                .catch(err => console.error(err));
        }
    }, [fetchReviews, fetchKpis, user.role, token]);

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





    const handleUploadKPI = async (e) => {
        e.preventDefault();
        if (!kpiFile) return;

        const formData = new FormData();
        formData.append('title', `[KPI] ${kpiTitle}`);
        formData.append('file', kpiFile);

        setKpiStatus({ type: 'info', message: 'Uploading KPI...' });

        try {
            const res = await api.upload('/api/documents/upload', formData, token);
            if (res.ok) {
                setKpiStatus({ type: 'success', message: 'KPI sheet uploaded successfully!' });
                setKpiTitle('');
                setKpiFile(null);
                const fileInput = document.getElementById('kpi-file-upload');
                if (fileInput) fileInput.value = '';
                fetchKpis();
                setTimeout(() => setKpiStatus({ type: '', message: '' }), 3000);
            } else {
                setKpiStatus({ type: 'error', message: 'Upload failed' });
            }
        } catch(err) {
            console.error(err);
            setKpiStatus({ type: 'error', message: 'Network error. Please try again.' });
        }
    };

    const handleDownloadKpi = (filename) => {
        window.open(`${api.defaults.baseURL}/api/documents/download/${filename}`, '_blank');
    };

    const handleDeleteKpi = async (id) => {
        if (!window.confirm('Delete this KPI sheet?')) return;
        try {
            const res = await api.delete(`/api/documents/${id}`, token);
            if (res.ok) fetchKpis();
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusStyle = (status) => {
        if (status === 'Completed') return { bg: 'rgba(16,185,129,0.1)', color: '#10b981', Icon: CheckCircle2 };
        if (status === 'Awaiting Manager') return { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', Icon: Star };
        if (status === 'Awaiting Employee') return { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', Icon: MessageSquare };
        return { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', Icon: TrendingUp };
    };

    const averageRating = reviews.filter(r => r.user_email === user.email && r.status === 'Completed').reduce((acc, curr) => acc + curr.rating, 0) / (reviews.filter(r => r.user_email === user.email && r.status === 'Completed').length || 1);

    return (
        <>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1>Performance & 1-on-1s</h1>
                    <p>Quarterly goal tracking, evaluations, and manager feedback.</p>
                </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Pending Reviews</div>
                        <MessageSquare size={18} color="#3b82f6" />
                    </div>
                    <div className="stat-value">{loading ? '—' : reviews.filter(r => r.status === 'Awaiting Employee' && r.user_email === user.email).length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Average Rating</div>
                        <Star size={18} color="#f59e0b" />
                    </div>
                    <div className="stat-value">{loading ? '—' : (isNaN(averageRating) || averageRating === 0 ? '-' : averageRating.toFixed(1))}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">KPI Sheets</div>
                        <Target size={18} color="#10b981" />
                    </div>
                    <div className="stat-value">{loading ? '—' : kpiFiles.length}</div>
                </div>
            </div>

            {(user.role === 'admin' || user.role === 'manager') && (
                <>
                    <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(191,243,104,0.15)', background: 'rgba(191,243,104,0.02)' }}>
                        <h3 className="card-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingUp size={16} color="var(--accent)" /> Initiate New Review
                        </h3>
                        <form onSubmit={handleInitReview} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div className="form-group" style={{ flex: '1 1 200px', margin: 0 }}>
                                <label>Employee</label>
                                <select value={initEmail} onChange={e => setInitEmail(e.target.value)} required>
                                    {employees.map(emp => (
                                        <option key={emp.email} value={emp.email}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: '1 1 200px', margin: 0 }}>
                                <label>Review Period (e.g. 2026 Q1)</label>
                                <input type="text" required value={initPeriod} onChange={e => setInitPeriod(e.target.value)} placeholder="2026 Q1" />
                            </div>
                            <button className="btn btn-primary" type="submit" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <UserIcon size={16}/> Assign
                            </button>
                        </form>
                    </div>

                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <h3 className="card-title" style={{ marginBottom: '1rem' }}>Awaiting My Feedback</h3>
                        {reviews.filter(r => r.status === 'Awaiting Manager' && (user.role === 'admin' || r.manager_email === user.email)).length === 0 ? (
                            <div className="empty-state">
                                <CheckCircle size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                                <p>You have no pending reviews to close out.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {reviews.filter(r => r.status === 'Awaiting Manager' && (user.role === 'admin' || r.manager_email === user.email)).map(r => (
                                    <div key={r.id} style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '10px', background: 'rgba(255,255,255,0.015)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            <strong style={{ fontSize: '1.05rem' }}>{r.user_name} ({r.period})</strong>
                                            <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '20px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontWeight: 600 }}>Awaiting Manager</span>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #3b82f6', color: 'var(--text-secondary)' }}>
                                            <strong style={{ color: 'white', display: 'block', marginBottom: '0.35rem' }}>Self Assessment:</strong>{r.self_assessment}
                                        </div>
                                        
                                        {activeManagerFeedback?.id === r.id ? (
                                            <div>
                                                <textarea style={{ width: '100%', marginBottom: '1rem', background: 'rgba(0,0,0,0.2)' }} rows="3" placeholder="Write constructive feedback..." value={feedbackText} onChange={e => setFeedbackText(e.target.value)}></textarea>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <label style={{ fontWeight: 600 }}>Rating (1-5):</label>
                                                        <input type="number" min="1" max="5" value={feedbackRating} onChange={e => setFeedbackRating(parseInt(e.target.value))} style={{ width: '80px', padding: '0.5rem', background: 'rgba(0,0,0,0.2)' }} />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button className="btn" onClick={() => setActiveManagerFeedback(null)} style={{background: 'transparent', border:'1px solid var(--border)'}}>Cancel</button>
                                                        <button className="btn btn-primary" onClick={handleManagerSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <CheckCircle2 size={16}/> Complete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <button className="btn btn-primary" onClick={() => {setActiveManagerFeedback(r); setFeedbackText(''); setFeedbackRating(5);}} style={{ width: '100%' }}>Write Feedback</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #3b82f6' }}>
                <h3 className="card-title" style={{ marginBottom: '1rem' }}>Action Required</h3>
                {reviews.filter(r => r.status === 'Awaiting Employee' && r.user_email === user.email).length === 0 ? (
                    <p style={{color: 'var(--text-light)', fontSize: '0.9rem'}}>You have no pending performance reviews to self-assess.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {reviews.filter(r => r.status === 'Awaiting Employee' && r.user_email === user.email).map(r => (
                            <div key={r.id} style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '10px', background: 'rgba(255,255,255,0.01)' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <strong style={{ fontSize: '1.05rem', display: 'block', marginBottom: '0.2rem' }}>{r.period} Self-Assessment</strong>
                                    <p style={{fontSize: '0.8rem', color: 'var(--text-subtitle)'}}>Assigned by <span style={{ color: 'var(--accent)' }}>{r.manager_email}</span> on {r.date}</p>
                                </div>
                                
                                {activeSelfAssessment?.id === r.id ? (
                                    <div>
                                        <textarea style={{ width: '100%', marginBottom: '1rem' }} rows="5" placeholder="Detail your accomplishments, challenges, and goals for the next period..." value={selfAssessmentText} onChange={e => setSelfAssessmentText(e.target.value)}></textarea>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button className="btn" onClick={() => setActiveSelfAssessment(null)} style={{background: 'transparent', border:'1px solid var(--border)'}}>Cancel</button>
                                            <button className="btn btn-primary" onClick={handleEmployeeSubmit}>Submit Assessment</button>
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

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 className="card-title" style={{ marginBottom: '1rem' }}>My Completed Reviews</h3>
                {reviews.filter(r => r.status !== 'Awaiting Employee' && r.user_email === user.email).length === 0 ? (
                    <div className="empty-state">
                        <TrendingUp size={32} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                        <p>No historical reviews</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {reviews.filter(r => r.status !== 'Awaiting Employee' && r.user_email === user.email).map(r => {
                            const { bg, color, Icon } = getStatusStyle(r.status);
                            return (
                                <div key={r.id} style={{ 
                                    padding: '1rem', border: '1px solid var(--border)', borderRadius: '10px', background: 'rgba(255,255,255,0.015)',
                                    display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start', justifyContent: 'space-between'
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: 200 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <strong style={{ fontSize: '1rem' }}>{r.period}</strong>
                                            {r.status === 'Completed' && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.15rem 0.5rem', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}><Star size={10} /> {r.rating}/5</span>
                                            )}
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-light)', lineHeight: 1.4 }}>
                                            {r.status === 'Completed' ? `Manager Feedback: "${r.manager_feedback}"` : 'Your review is currently awaiting manager feedback.'}
                                        </p>
                                    </div>
                                    <div style={{ padding: '0.3rem 0.6rem', borderRadius: '20px', background: bg, color: color, fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Icon size={14} /> {r.status}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Target size={18} color="var(--accent)" /> KPI Sheets & Results
                    </h3>
                </div>

                {(user.role === 'admin' || user.role === 'manager') && (
                    <div style={{ marginBottom: '1.5rem', padding: '1.25rem', borderRadius: '10px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border)' }}>
                        <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-subtitle)' }}>Upload KPI Results (Excel/CSV)</h4>
                        {kpiStatus.message && (
                            <div style={{ 
                                padding: '0.75rem', marginBottom: '1rem', borderRadius: '8px', 
                                backgroundColor: kpiStatus.type === 'success' ? 'rgba(16,185,129,0.1)' : kpiStatus.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)', 
                                color: kpiStatus.type === 'success' ? '#10b981' : kpiStatus.type === 'error' ? '#ef4444' : '#60a5fa',
                                display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', border: `1px solid ${kpiStatus.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
                            }}>
                                {kpiStatus.type === 'info' ? <Loader2 size={16} style={{animation: 'spin 1s linear infinite'}}/> : <CheckCircle size={16} />} 
                                {kpiStatus.message}
                            </div>
                        )}
                        <form onSubmit={handleUploadKPI} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div className="form-group" style={{ flex: '1 1 200px', margin: 0 }}>
                                <label>Description / Employee Name</label>
                                <input type="text" value={kpiTitle} onChange={e => setKpiTitle(e.target.value)} required placeholder="e.g. Q1 Sales Targets - John Doe" />
                            </div>
                            <div className="form-group" style={{ flex: '1 1 250px', margin: 0 }}>
                                <label>Excel Sheet (.xlsx, .csv)</label>
                                <input id="kpi-file-upload" type="file" onChange={e => setKpiFile(e.target.files[0])} accept=".xlsx,.xls,.csv" required style={{ padding: '0.4rem', background: 'rgba(0,0,0,0.2)' }} />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}>
                                <Upload size={16} /> Upload Result
                            </button>
                        </form>
                    </div>
                )}

                {kpiFiles.length === 0 ? (
                    <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                        <FileSpreadsheet size={40} style={{ opacity: 0.15, marginBottom: '1rem' }} />
                        <p>No KPI sheets have been uploaded yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {kpiFiles.map(file => (
                            <div key={file.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border)', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '8px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FileSpreadsheet size={20} color="#10b981" />
                                    </div>
                                    <div>
                                        <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '0.2rem' }}>{file.title.replace('[KPI] ', '')}</strong>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'flex', gap: '0.5rem' }}>
                                            <span>{file.date}</span> &bull; <span>{Math.round(file.size / 1024)} KB</span>
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => handleDownloadKpi(file.filename)}>
                                        <Download size={14} /> Download
                                    </button>
                                    {(user.role === 'admin' || user.role === 'manager') && (
                                        <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem', border: 'none' }} onClick={() => handleDeleteKpi(file.id)}>
                                            <TrendingUp size={14} style={{transform: 'rotate(45deg)'}} /> Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="spacing-bottom" style={{ height: '2rem' }}></div>
        </>
    );
}
