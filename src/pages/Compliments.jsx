import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

const CATEGORIES = [
    { label: 'Sales Achievement', icon: '🏆', color: '#f39c12' },
    { label: 'Client Satisfaction', icon: '⭐', color: '#3498db' },
    { label: 'Team Leadership', icon: '👑', color: '#9b59b6' },
    { label: 'Innovation', icon: '💡', color: '#1abc9c' },
    { label: 'Above & Beyond', icon: '🚀', color: '#e74c3c' },
    { label: 'Perfect Attendance', icon: '✅', color: '#27ae60' },
    { label: 'Top Performer', icon: '🔥', color: '#e67e22' },
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
    const [showForm, setShowForm] = useState(false);

    // Give-compliment form state
    const [recipientEmail, setRecipientEmail] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0].label);
    const [comment, setComment] = useState('');
    const [bonusAmount, setBonusAmount] = useState('');
    const [formStatus, setFormStatus] = useState({ type: '', message: '' });

    // Inline reply state  { [complimentId]: text }
    const [replyText, setReplyText] = useState({});
    const [replyOpen, setReplyOpen] = useState({});
    const [replyStatus, setReplyStatus] = useState({});

    // Filters
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterEmployee, setFilterEmployee] = useState('All');

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

    useEffect(() => {
        fetchCompliments();
        if (user.role === 'admin' || user.role === 'manager') {
            api.get('/api/users', token)
                .then(r => r.json())
                .then(data => {
                    setEmployees(data);
                    if (data.length > 0) {
                        setRecipientEmail(data[0].email);
                        setRecipientName(data[0].name);
                    }
                })
                .catch(err => console.error(err));
        }
    }, [fetchCompliments, user.role, token]);

    const handleEmployeeChange = (email) => {
        setRecipientEmail(email);
        const emp = employees.find(e => e.email === email);
        setRecipientName(emp?.name || '');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormStatus({ type: 'info', message: 'Submitting…' });
        try {
            const res = await api.post('/api/compliments', {
                recipient_email: recipientEmail,
                recipient_name: recipientName,
                category,
                message: comment,
                bonus_amount: bonusAmount !== '' ? parseFloat(bonusAmount) : null,
            }, token);

            if (res.ok) {
                setFormStatus({ type: 'success', message: '✅ Compliment sent successfully!' });
                setComment('');
                setBonusAmount('');
                setCategory(CATEGORIES[0].label);
                fetchCompliments();
                setTimeout(() => {
                    setFormStatus({ type: '', message: '' });
                    setShowForm(false);
                }, 2000);
            } else {
                const data = await res.json();
                setFormStatus({ type: 'error', message: data.message || 'Failed to submit.' });
            }
        } catch {
            setFormStatus({ type: 'error', message: 'Network error. Please try again.' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this compliment? This cannot be undone.')) return;
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

    const toggleReply = (id, existingComment) => {
        setReplyOpen(prev => ({ ...prev, [id]: !prev[id] }));
        if (!replyText[id]) {
            setReplyText(prev => ({ ...prev, [id]: existingComment || '' }));
        }
    };

    const handleReplySubmit = async (id) => {
        const text = (replyText[id] || '').trim();
        if (!text) return;
        setReplyStatus(prev => ({ ...prev, [id]: 'saving' }));
        try {
            const res = await api.put(`/api/compliments/${id}/comment`, { recipient_comment: text }, token);
            if (res.ok) {
                setReplyStatus(prev => ({ ...prev, [id]: 'saved' }));
                setReplyOpen(prev => ({ ...prev, [id]: false }));
                fetchCompliments();
                setTimeout(() => setReplyStatus(prev => ({ ...prev, [id]: '' })), 2000);
            } else {
                setReplyStatus(prev => ({ ...prev, [id]: 'error' }));
            }
        } catch {
            setReplyStatus(prev => ({ ...prev, [id]: 'error' }));
        }
    };

    const canGive = user.role === 'admin' || user.role === 'manager';
    const myCompliments = compliments.filter(c => c.recipient_email === user.email);
    const allCompliments = canGive ? compliments : myCompliments;

    const filtered = allCompliments.filter(c => {
        const matchCat = filterCategory === 'All' || c.category === filterCategory;
        const matchEmp = filterEmployee === 'All' || c.recipient_email === filterEmployee;
        return matchCat && matchEmp;
    });

    const totalBonus = myCompliments
        .filter(c => c.bonus_amount)
        .reduce((sum, c) => sum + parseFloat(c.bonus_amount || 0), 0);

    const totalGiven = compliments.filter(c => c.given_by_email === user.email).length;
    const statusBg = { success: '#def7ec', error: '#fde8e8', info: '#e1effe' };
    const statusColor = { success: '#03543f', error: '#9b1c1c', info: '#1e429f' };

    return (
        <>
            <div className="page-header">
                <h1>Compliments & Recognition</h1>
                <p>Performance-based recognition, commissions, and employee spotlight.</p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🎖️</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent)' }}>{myCompliments.length}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>My Compliments Received</div>
                </div>
                {totalBonus > 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>💰</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#27ae60' }}>{formatCurrency(totalBonus)}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Total Bonuses Earned</div>
                    </div>
                )}
                {canGive && (
                    <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🤝</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f39c12' }}>{totalGiven}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Compliments Given</div>
                    </div>
                )}
                <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🏅</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#9b59b6' }}>{compliments.length}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Company-Wide Total</div>
                </div>
            </div>

            {/* Give Compliment – Manager/Admin */}
            {canGive && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showForm ? '1.25rem' : 0 }}>
                        <h3 className="card-title" style={{ margin: 0 }}>Give a Compliment</h3>
                        <button
                            className="btn btn-primary"
                            style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
                            onClick={() => setShowForm(!showForm)}
                        >
                            {showForm ? 'Cancel' : '＋ New Compliment'}
                        </button>
                    </div>

                    {showForm && (
                        <>
                            {formStatus.message && (
                                <div style={{ padding: '0.75rem', marginBottom: '1rem', borderRadius: '6px', backgroundColor: statusBg[formStatus.type], color: statusColor[formStatus.type] }}>
                                    {formStatus.message}
                                </div>
                            )}
                            <form onSubmit={handleSubmit}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label>Employee *</label>
                                        <select value={recipientEmail} onChange={e => handleEmployeeChange(e.target.value)} required>
                                            {employees.map(emp => (
                                                <option key={emp.email} value={emp.email}>{emp.name} ({emp.email})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label>Recognition Category *</label>
                                        <select value={category} onChange={e => setCategory(e.target.value)} required>
                                            {CATEGORIES.map(c => (
                                                <option key={c.label} value={c.label}>{c.icon} {c.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label>Bonus / Commission (ZAR, optional)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="e.g. 500.00"
                                            value={bonusAmount}
                                            onChange={e => setBonusAmount(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* ── COMMENT FIELD ── */}
                                <div className="form-group" style={{ margin: '0 0 1rem' }}>
                                    <label>Comment *</label>
                                    <textarea
                                        rows="4"
                                        required
                                        placeholder="Write your comment — describe what this employee did to deserve this recognition…"
                                        value={comment}
                                        onChange={e => setComment(e.target.value)}
                                        style={{ width: '100%', resize: 'vertical' }}
                                    />
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <button type="submit" className="btn btn-primary" style={{ padding: '0.7rem 2rem' }}>
                                        🎉 Send Recognition
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            )}

            {/* Category breakdown */}
            {compliments.length > 0 && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 className="card-title" style={{ marginBottom: '1rem' }}>Recognition Breakdown</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                        {CATEGORIES.map(cat => {
                            const count = compliments.filter(c => c.category === cat.label).length;
                            if (!count) return null;
                            return (
                                <div key={cat.label} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem',
                                    borderRadius: '24px', border: `1px solid ${cat.color}44`, background: `${cat.color}11`, color: cat.color, fontWeight: 600, fontSize: '0.85rem'
                                }}>
                                    <span>{cat.icon}</span>
                                    <span>{cat.label}</span>
                                    <span style={{ background: cat.color, color: 'white', borderRadius: '12px', padding: '0 6px', fontSize: '0.75rem', minWidth: '20px', textAlign: 'center' }}>{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Feed */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h3 className="card-title" style={{ margin: 0 }}>
                        {canGive ? 'Recognition Feed' : 'My Recognition'}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                            style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text)', fontSize: '0.85rem' }}>
                            <option value="All">All Categories</option>
                            {CATEGORIES.map(c => <option key={c.label} value={c.label}>{c.icon} {c.label}</option>)}
                        </select>
                        {canGive && (
                            <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}
                                style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text)', fontSize: '0.85rem' }}>
                                <option value="All">All Employees</option>
                                {employees.map(e => <option key={e.email} value={e.email}>{e.name}</option>)}
                            </select>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="empty-state">Loading…</div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        {compliments.length === 0
                            ? 'No compliments have been given yet. Be the first to recognise a team member! 🌟'
                            : 'No compliments match your filters.'}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {filtered.map(c => {
                            const meta = getCategoryMeta(c.category);
                            const isRecipient = c.recipient_email === user.email;
                            const isReplying = replyOpen[c.id];

                            return (
                                <div key={c.id} style={{
                                    padding: '1.25rem',
                                    borderRadius: '10px',
                                    border: `1px solid ${meta.color}33`,
                                    background: `linear-gradient(135deg, ${meta.color}08 0%, var(--bg-main) 60%)`,
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    {/* Accent bar */}
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: meta.color }} />

                                    {/* Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ fontSize: '1.75rem' }}>{meta.icon}</span>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>{c.recipient_name}</div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>{c.recipient_email}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: `${meta.color}22`, color: meta.color }}>
                                                {c.category}
                                            </span>
                                            {c.bonus_amount && (
                                                <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, background: '#def7ec', color: '#03543f' }}>
                                                    💰 {formatCurrency(c.bonus_amount)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Manager's comment */}
                                    <div style={{ margin: '0 0 0.75rem', padding: '0.75rem 1rem', background: 'var(--card-bg, rgba(255,255,255,0.04))', borderRadius: '6px', borderLeft: `3px solid ${meta.color}` }}>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Comment from {c.given_by}</div>
                                        <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text)', lineHeight: '1.6', fontStyle: 'italic' }}>
                                            "{c.message}"
                                        </p>
                                    </div>

                                    {/* Employee's reply comment */}
                                    {c.recipient_comment && !isReplying && (
                                        <div style={{ margin: '0 0 0.75rem', padding: '0.65rem 1rem', background: `${meta.color}10`, borderRadius: '6px', borderLeft: `3px solid ${meta.color}88` }}>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                💬 {c.recipient_name}'s response
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text)', lineHeight: '1.5' }}>
                                                {c.recipient_comment}
                                            </p>
                                        </div>
                                    )}

                                    {/* Inline reply box – only for the recipient */}
                                    {isRecipient && isReplying && (
                                        <div style={{ marginBottom: '0.75rem' }}>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginBottom: '0.4rem' }}>Your comment / response:</div>
                                            <textarea
                                                rows="3"
                                                value={replyText[c.id] || ''}
                                                onChange={e => setReplyText(prev => ({ ...prev, [c.id]: e.target.value }))}
                                                placeholder="Write your response to this recognition…"
                                                style={{ width: '100%', resize: 'vertical', marginBottom: '0.5rem' }}
                                            />
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    className="btn"
                                                    style={{ background: 'transparent', border: '1px solid var(--border)', fontSize: '0.82rem', padding: '0.4rem 0.9rem' }}
                                                    onClick={() => setReplyOpen(prev => ({ ...prev, [c.id]: false }))}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ fontSize: '0.82rem', padding: '0.4rem 1rem' }}
                                                    onClick={() => handleReplySubmit(c.id)}
                                                    disabled={replyStatus[c.id] === 'saving'}
                                                >
                                                    {replyStatus[c.id] === 'saving' ? 'Saving…' : 'Save Comment'}
                                                </button>
                                            </div>
                                            {replyStatus[c.id] === 'error' && (
                                                <p style={{ color: '#e74c3c', fontSize: '0.8rem', marginTop: '0.4rem' }}>Failed to save. Try again.</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                                            Recognised by <strong>{c.given_by}</strong> · {c.date}
                                        </span>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {/* Reply button for recipient */}
                                            {isRecipient && !isReplying && (
                                                <button
                                                    className="btn"
                                                    style={{ background: 'transparent', border: `1px solid ${meta.color}66`, color: meta.color, fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}
                                                    onClick={() => toggleReply(c.id, c.recipient_comment)}
                                                >
                                                    💬 {c.recipient_comment ? 'Edit Comment' : 'Add Comment'}
                                                </button>
                                            )}
                                            {user.role === 'admin' && (
                                                <button
                                                    className="btn"
                                                    style={{ background: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}
                                                    onClick={() => handleDelete(c.id)}
                                                    disabled={deleting === c.id}
                                                >
                                                    {deleting === c.id ? '…' : '🗑 Delete'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {filtered.length > 0 && (
                    <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-light)', textAlign: 'right' }}>
                        Showing {filtered.length} of {allCompliments.length} recognition{allCompliments.length !== 1 ? 's' : ''}
                    </p>
                )}
            </div>
        </>
    );
}
