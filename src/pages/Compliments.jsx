import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { CheckCircle, Clock, Award, Filter, Calendar, Users, PlusCircle, Trash2 } from 'lucide-react';

const CATEGORIES = [
    { label: 'Sales Achievement', icon: '🏆', color: '#f39c12' },
    { label: 'Client Satisfaction', icon: '⭐', color: '#3498db' },
    { label: 'Team Leadership', icon: '👑', color: '#9b59b6' },
    { label: 'Innovation', icon: '💡', color: '#1abc9c' },
    { label: 'Above & Beyond', icon: '🚀', color: '#e74c3c' },
    { label: 'Perfect Attendance', icon: '✅', color: '#27ae60' },
    { label: 'Top Performer', icon: '🔥', color: '#e67e22' },
];

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

function getCategoryMeta(label) {
    return CATEGORIES.find(c => c.label === label) || { icon: '🎖️', color: '#7f8c8d' };
}

function formatCurrency(amount) {
    if (amount == null || amount === '') return null;
    return `R ${parseFloat(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Compliments({ user, token }) {
    const [compliments, setCompliments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);
    const [approving, setApproving] = useState(null);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [recipientEmail, setRecipientEmail] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0].label);
    const [comment, setComment] = useState('');
    const [bonusAmount, setBonusAmount] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [formStatus, setFormStatus] = useState({ type: '', message: '' });

    // Filters
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterEmployee, setFilterEmployee] = useState('All');
    const [filterPeriod, setFilterPeriod] = useState('All');
    const [activeTab, setActiveTab] = useState('Feed'); // 'Feed' or 'Pending'

    const fetchCompliments = useCallback(async () => {
        try {
            const res = await api.get('/api/compliments', token);
            const data = await res.json();
            setCompliments(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const fetchEmployees = useCallback(async () => {
        try {
            const res = await api.get('/api/users', token);
            const data = await res.json();
            setEmployees(data);
            if (data.length > 0) {
                setRecipientEmail(data[0].email);
                setRecipientName(data[0].name);
            }
        } catch (err) {
            console.error(err);
        }
    }, [token]);

    useEffect(() => {
        fetchCompliments();
        fetchEmployees();
    }, [fetchCompliments, fetchEmployees]);

    const handleEmployeeChange = (email) => {
        setRecipientEmail(email);
        const emp = employees.find(e => e.email === email);
        setRecipientName(emp?.name || '');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormStatus({ type: 'info', message: 'Submitting appreciation…' });
        try {
            const res = await api.post('/api/compliments', {
                recipient_email: recipientEmail,
                recipient_name: recipientName,
                category,
                message: comment,
                bonus_amount: bonusAmount !== '' ? parseFloat(bonusAmount) : null,
                period: `${selectedMonth} ${selectedYear}`
            }, token);

            if (res.ok) {
                const data = await res.json();
                const isApproved = data.status === 'approved';
                setFormStatus({ 
                    type: 'success', 
                    message: isApproved ? '✅ Appreciation posted immediately!' : '🕒 Submitted! Waiting for admin approval.' 
                });
                setComment('');
                setBonusAmount('');
                fetchCompliments();
                setTimeout(() => {
                    setFormStatus({ type: '', message: '' });
                    setShowForm(false);
                }, 3000);
            } else {
                const data = await res.json();
                setFormStatus({ type: 'error', message: data.message || 'Failed to submit.' });
            }
        } catch {
            setFormStatus({ type: 'error', message: 'Network error. Please try again.' });
        }
    };

    const handleApprove = async (id) => {
        setApproving(id);
        try {
            const res = await api.put(`/api/compliments/${id}/approve`, {}, token);
            if (res.ok) fetchCompliments();
            else alert('Failed to approve.');
        } catch {
            alert('Network error.');
        } finally {
            setApproving(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this recognition? This cannot be undone.')) return;
        setDeleting(id);
        try {
            const res = await api.delete(`/api/compliments/${id}`, token);
            if (res.ok) fetchCompliments();
            else alert('Failed to delete.');
        } catch {
            alert('Network error.');
        } finally {
            setDeleting(null);
        }
    };

    const canApprove = user.role === 'admin';
    
    // Stats for approved compliments only
    const approvedCompliments = compliments.filter(c => c.status === 'approved');
    const pendingCompliments = compliments.filter(c => c.status === 'pending');
    
    const myReceived = approvedCompliments.filter(c => c.recipient_email === user.email).length;
    const myTotalBonus = approvedCompliments
        .filter(c => c.recipient_email === user.email && c.bonus_amount)
        .reduce((sum, c) => sum + parseFloat(c.bonus_amount || 0), 0);

    const periods = [...new Set(compliments.map(c => c.period).filter(Boolean))];
    
    const filtered = (activeTab === 'Pending' ? pendingCompliments : approvedCompliments).filter(c => {
        const matchCat = filterCategory === 'All' || c.category === filterCategory;
        const matchEmp = filterEmployee === 'All' || c.recipient_email === filterEmployee;
        const matchPeriod = filterPeriod === 'All' || c.period === filterPeriod;
        return matchCat && matchEmp && matchPeriod;
    });

    const statusBg = { success: '#0596691a', error: '#dc26261a', info: '#2563eb1a' };
    const statusColor = { success: '#059669', error: '#dc2626', info: '#2563eb' };

    return (
        <div className="compliments-container">
            <div className="page-header">
                <h1>Compliments & Recognition</h1>
                <p>Recognize your colleagues' achievements and track performance-based rewards.</p>
            </div>

            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card stat-card">
                    <Award className="stat-icon" style={{ color: '#f59e0b' }} />
                    <div className="stat-value">{myReceived}</div>
                    <div className="stat-label">Recognitions Received</div>
                </div>
                {myTotalBonus > 0 && (
                    <div className="card stat-card">
                        <CheckCircle className="stat-icon" style={{ color: '#10b981' }} />
                        <div className="stat-value" style={{ fontSize: '1.4rem' }}>{formatCurrency(myTotalBonus)}</div>
                        <div className="stat-label">Total Bonuses Earned</div>
                    </div>
                )}
                <div className="card stat-card">
                    <Users className="stat-icon" style={{ color: 'var(--accent)' }} />
                    <div className="stat-value">{approvedCompliments.length}</div>
                    <div className="stat-label">Company-Wide Recognitions</div>
                </div>
            </div>

            {/* Log Compliment Button */}
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
                <button 
                    className={`btn ${showForm ? 'btn-outline' : 'btn-primary'}`} 
                    onClick={() => setShowForm(!showForm)}
                    style={{ padding: '0.75rem 2rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    {showForm ? 'Cancel Submission' : <><PlusCircle size={20} /> Log a Compliment</>}
                </button>
            </div>

            {/* Submission Form */}
            {showForm && (
                <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--accent-light)' }}>
                    <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>Send Appreciation</h3>
                    {formStatus.message && (
                        <div style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px', backgroundColor: statusBg[formStatus.type], color: statusColor[formStatus.type], border: `1px solid ${statusColor[formStatus.type]}33`, fontSize: '0.9rem' }}>
                            {formStatus.message}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                            <div className="form-group">
                                <label>Recipient Employee</label>
                                <select value={recipientEmail} onChange={e => handleEmployeeChange(e.target.value)} required>
                                    {employees.map(emp => (
                                        <option key={emp.email} value={emp.email}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select value={category} onChange={e => setCategory(e.target.value)} required>
                                    {CATEGORIES.map(c => (
                                        <option key={c.label} value={c.label}>{c.icon} {c.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Recognition Period</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} required style={{ flex: 2 }}>
                                        {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} required style={{ flex: 1 }}>
                                        {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Bonus Amount (Optional)</label>
                                <input type="number" step="0.01" min="0" placeholder="e.g. 500" value={bonusAmount} onChange={e => setBonusAmount(e.target.value)} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Recognition Comment</label>
                            <textarea 
                                rows="4" 
                                required 
                                placeholder="Describe the achievement..."
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2.5rem' }}>
                                Submit Appreciation
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Recognition Feed Controls */}
            <div className="card" style={{ marginBottom: '1.5rem', padding: '0.75rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                            className={`btn ${activeTab === 'Feed' ? 'btn-primary' : 'btn-ghost'}`} 
                            onClick={() => setActiveTab('Feed')}
                            style={{ padding: '0.4rem 1.25rem', fontSize: '0.9rem' }}
                        >
                            Approved Feed
                        </button>
                        {(canApprove || pendingCompliments.some(p => p.given_by_email === user.email)) && (
                            <button 
                                className={`btn ${activeTab === 'Pending' ? 'btn-primary' : 'btn-ghost'}`} 
                                onClick={() => setActiveTab('Pending')}
                                style={{ padding: '0.4rem 1.25rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                                {activeTab === 'Pending' ? <Clock size={16} /> : <Clock size={16} style={{ opacity: 0.6 }} />}
                                Pending {pendingCompliments.length > 0 && <span className="badge-count">{pendingCompliments.length}</span>}
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <Filter size={18} style={{ color: 'var(--text-light)' }} />
                        <select 
                            className="filter-select"
                            value={filterPeriod} 
                            onChange={e => setFilterPeriod(e.target.value)}
                        >
                            <option value="All">All Months</option>
                            {periods.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <select 
                            className="filter-select"
                            value={filterCategory} 
                            onChange={e => setFilterCategory(e.target.value)}
                        >
                            <option value="All">All Categories</option>
                            {CATEGORIES.map(c => <option key={c.label} value={c.label}>{c.icon} {c.label}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Recognition Stream */}
            <div className="recognition-stream" style={{ display: 'grid', gap: '1.5rem' }}>
                {loading ? (
                    <div className="empty-state">Loading recognition feed...</div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state card">
                        {activeTab === 'Feed' ? 'No recognitions found for this criteria.' : 'No pending recognitions to review.'}
                    </div>
                ) : (
                    filtered.map(comp => {
                        const meta = getCategoryMeta(comp.category);
                        return (
                            <div key={comp.id} className="card recognition-card" style={{ borderLeft: `5px solid ${meta.color}` }}>
                                <div className="card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div className="category-icon" style={{ backgroundColor: `${meta.color}15`, color: meta.color }}>
                                            {meta.icon}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{comp.recipient_name}</h4>
                                            <div className="recognition-meta">
                                                <span className="meta-item"><Calendar size={13} /> {comp.period}</span>
                                                <span className="meta-item" style={{ color: meta.color, fontWeight: 700 }}>{comp.category}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="recognition-rewards">
                                        {comp.bonus_amount && <div className="bonus-tag">{formatCurrency(comp.bonus_amount)}</div>}
                                        {comp.status === 'pending' && <span className="status-label pending">Pending</span>}
                                    </div>
                                </div>
                                <div className="recognition-content">
                                    <p style={{ fontStyle: 'italic', color: 'var(--text)', opacity: 0.9, lineHeight: '1.6' }}>
                                        "{comp.message}"
                                    </p>
                                </div>
                                <div className="card-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                                        Recognized by <strong>{comp.given_by}</strong> on {comp.date}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {comp.status === 'pending' && canApprove && (
                                            <button 
                                                className="btn btn-primary" 
                                                style={{ padding: '0.35rem 1rem', fontSize: '0.85rem' }}
                                                onClick={() => handleApprove(comp.id)}
                                                disabled={approving === comp.id}
                                            >
                                                {approving === comp.id ? 'Approving...' : 'Approve'}
                                            </button>
                                        )}
                                        {user.role === 'admin' && (
                                            <button 
                                                className="btn btn-ghost" 
                                                style={{ padding: '0.35rem 0.75rem', color: '#ef4444' }}
                                                onClick={() => handleDelete(comp.id)}
                                                disabled={deleting === comp.id}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <style>{`
                .stat-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 1.5rem;
                    text-align: center;
                    transition: transform 0.2s;
                }
                .stat-card:hover { transform: translateY(-5px); }
                .stat-icon { margin-bottom: 0.75rem; font-size: 2rem; }
                .stat-value { font-size: 2rem; font-weight: 800; color: var(--text); }
                .stat-label { font-size: 0.85rem; color: var(--text-light); margin-top: 0.25rem; }
                
                .badge-count {
                    background: #ef4444;
                    color: white;
                    border-radius: 50%;
                    padding: 0 6px;
                    font-size: 0.7rem;
                    min-width: 18px;
                    display: inline-block;
                    text-align: center;
                    font-weight: 700;
                }
                
                .category-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                }
                
                .recognition-meta {
                    display: flex;
                    gap: 0.75rem;
                    font-size: 0.8rem;
                    color: var(--text-light);
                    margin-top: 0.25rem;
                }
                .meta-item { display: flex; alignItems: center; gap: 0.3rem; }
                
                .bonus-tag {
                    background: #10b98120;
                    color: #10b981;
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-weight: 700;
                    font-size: 0.85rem;
                }
                
                .status-label.pending {
                    background: #f59e0b15;
                    color: #f59e0b;
                    padding: 0.2rem 0.6rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                
                .filter-select {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    color: var(--text);
                    padding: 0.4rem 0.75rem;
                    border-radius: 8px;
                    font-size: 0.85rem;
                }

                .recognition-card {
                    padding: 1.5rem;
                    transition: box-shadow 0.2s;
                }
                .recognition-card:hover {
                    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
                }
            `}</style>
        </div>
    );
}
