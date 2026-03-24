import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { api } from '../utils/api';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const EVENT_TYPES = ['event', 'news', 'policy'];

const typeColors = {
    event:  { bg: '#def7ec', color: '#03543f' },
    news:   { bg: '#e1effe', color: '#1e429f' },
    policy: { bg: '#fdf6b2', color: '#723b13' },
    leave:  { bg: '#e1effe', color: '#1e429f' },
    sick:   { bg: '#fde8e8', color: '#9b1c1c' },
};

const today = new Date();
const pad = (n) => String(n).padStart(2, '0');
const toDateValue = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function CalendarPage({ user, token }) {
    const [events, setEvents] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [form, setForm] = useState({
        title: '',
        type: 'event',
        content: '',
        date: toDateValue(today),
    });

    const loadEvents = useCallback(() => {
        api.get('/api/calendar', token)
            .then(res => res.json())
            .then(data => {
                setEvents(data.map(e => ({
                    ...e,
                    start: new Date(e.start),
                    end: new Date(e.end),
                })));
            })
            .catch(err => console.error(err));
    }, [token]);

    useEffect(() => { loadEvents(); }, [loadEvents]);

    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.post('/api/announcements', {
                type: form.type,
                title: form.title,
                content: form.content,
                date: form.date,
                author: user.name,
                pinned: 0,
            }, token);
            if (res.ok) {
                setSuccessMsg('Event added to the calendar!');
                setForm({ title: '', type: 'event', content: '', date: toDateValue(today) });
                setShowForm(false);
                loadEvents();
                setTimeout(() => setSuccessMsg(''), 3500);
            }
        } catch (err) {
            console.error('Failed to save event', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1>Company Calendar</h1>
                    <p>View approved leave, sick days, and company events</p>
                </div>
                {user.role === 'admin' && (
                    <button
                        id="add-calendar-event-btn"
                        className="btn btn-primary"
                        onClick={() => setShowForm(v => !v)}
                    >
                        {showForm ? '✕ Cancel' : '+ Add Event'}
                    </button>
                )}
            </div>

            {successMsg && (
                <div style={{
                    background: '#def7ec', color: '#03543f', border: '1px solid #a7f3d0',
                    borderRadius: '8px', padding: '0.875rem 1.25rem', marginBottom: '1.25rem',
                    fontWeight: 500
                }}>
                    ✓ {successMsg}
                </div>
            )}

            {showForm && user.role === 'admin' && (
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '16px',
                    padding: '2rem',
                    marginBottom: '1.5rem',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
                }}>
                    {/* Form header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.75rem' }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: '10px',
                            background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.2rem', flexShrink: 0
                        }}>📅</div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>New Calendar Event</div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>This will appear on the company calendar and in Announcements</div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Row 1: Title + Date */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Event Title <span style={{ color: 'var(--primary)' }}>*</span>
                                </label>
                                <input
                                    className="form-input"
                                    id="event-title"
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    placeholder="e.g. Year-End Function, Team Building Day…"
                                    required
                                    style={{ fontSize: '0.9375rem', padding: '0.75rem 1rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Date <span style={{ color: 'var(--primary)' }}>*</span>
                                </label>
                                <input
                                    className="form-input"
                                    id="event-date"
                                    type="date"
                                    name="date"
                                    value={form.date}
                                    onChange={handleChange}
                                    required
                                    style={{ fontSize: '0.9375rem', padding: '0.75rem 1rem' }}
                                />
                            </div>
                        </div>

                        {/* Row 2: Type pills */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Event Type
                            </label>
                            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                                {[
                                    { value: 'event', label: '🎉 Company Event', activeColor: '#03543f', activeBg: '#def7ec' },
                                    { value: 'news', label: '📢 News', activeColor: '#1e429f', activeBg: '#e1effe' },
                                    { value: 'policy', label: '📋 Policy', activeColor: '#723b13', activeBg: '#fdf6b2' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, type: opt.value }))}
                                        style={{
                                            padding: '0.5rem 1.1rem',
                                            borderRadius: '999px',
                                            border: form.type === opt.value ? `2px solid ${opt.activeColor}` : '2px solid var(--border-light)',
                                            background: form.type === opt.value ? opt.activeBg : 'transparent',
                                            color: form.type === opt.value ? opt.activeColor : 'var(--text-secondary)',
                                            fontWeight: form.type === opt.value ? 700 : 500,
                                            fontSize: '0.875rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.18s ease',
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Row 3: Description */}
                        <div style={{ marginBottom: '1.75rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Description <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                            </label>
                            <textarea
                                className="form-input"
                                id="event-description"
                                name="content"
                                value={form.content}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Add any details employees should know about this event…"
                                style={{ fontSize: '0.9375rem', padding: '0.75rem 1rem', resize: 'vertical' }}
                            />
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button type="button" className="btn" style={{ background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }} onClick={() => setShowForm(false)}>
                                Cancel
                            </button>
                            <button id="save-calendar-event-btn" className="btn btn-primary" type="submit" disabled={saving} style={{ minWidth: 140 }}>
                                {saving ? 'Saving…' : '✓ Save Event'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card">
                {/* Legend */}
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    {[
                        { label: 'Company Event', type: 'event' },
                        { label: 'Annual Leave', type: 'leave' },
                        { label: 'Sick Leave', type: 'sick' },
                    ].map(({ label, type }) => (
                        <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}>
                            <span style={{
                                display: 'inline-block', width: 12, height: 12, borderRadius: 3,
                                background: typeColors[type]?.bg, border: `1px solid ${typeColors[type]?.color}`
                            }} />
                            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                        </div>
                    ))}
                </div>

                <div style={{ height: '560px' }}>
                    <BigCalendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        views={['month', 'week', 'agenda']}
                        eventPropGetter={(event) => {
                            const c = typeColors[event.type] || typeColors.event;
                            return {
                                style: {
                                    backgroundColor: c.bg,
                                    color: c.color,
                                    border: 'none',
                                    fontWeight: '500',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                }
                            };
                        }}
                    />
                </div>
            </div>
        </>
    );
}
