import React, { useState, useEffect } from 'react';
import { DEMO_ANNOUNCEMENTS } from '../data/mockData';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

function CompanyCalendar() {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        fetch('/api/calendar')
            .then(res => res.json())
            .then(data => {
                const formatted = data.map(e => ({
                    ...e,
                    start: new Date(e.start),
                    end: new Date(e.end)
                }));
                setEvents(formatted);
            })
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="card" style={{ marginBottom: '1.5rem', marginTop: '1.5rem' }}>
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>Company Event Calendar</h3>
            <div style={{ height: '450px' }}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    views={['month', 'week', 'agenda']}
                    eventPropGetter={(event) => {
                        let bg = '#def7ec'; // default for events
                        let color = '#03543f';
                        
                        if (event.type === 'leave') {
                            bg = '#e1effe';
                            color = '#1e429f';
                        } else if (event.type === 'sick') {
                            bg = '#fde8e8';
                            color = '#9b1c1c';
                        }
                        
                        return { style: { backgroundColor: bg, color: color, border: 'none', fontWeight: '500', padding: '2px 5px', borderRadius: '4px' } };
                    }}
                />
            </div>
        </div>
    );
}

function EmployeeDashboard({ user }) {
    return (
        <>
            <div className="page-header">
                <h1>Welcome back, {user.name.split(' ')[0]}</h1>
                <p>Here's your overview for today</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Annual Leave Remaining</div>
                    <div className="stat-value">12 Days</div>
                    <div className="stat-subtitle">Remaining this year</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Sick Leave Remaining</div>
                    <div className="stat-value">8 Days</div>
                    <div className="stat-subtitle">Remaining this year</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Late Instances</div>
                    <div className="stat-value">2</div>
                    <div className="stat-subtitle">This month</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Open Requests</div>
                    <div className="stat-value">1</div>
                    <div className="stat-subtitle">Pending approval</div>
                </div>
            </div>

            <div className="grid-2">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Recent Activity</h3>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Action</th>
                                <th>Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Leave Request - Annual</td>
                                <td>Mar 15, 2026</td>
                                <td><span className="badge badge-warning">Pending</span></td>
                            </tr>
                            <tr>
                                <td>Sick Leave Certificate</td>
                                <td>Mar 14, 2026</td>
                                <td><span className="badge badge-success">Uploaded</span></td>
                            </tr>
                            <tr>
                                <td>IT Support Ticket</td>
                                <td>Mar 12, 2026</td>
                                <td><span className="badge badge-success">Resolved</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Latest Announcements</h3>
                    </div>
                    {DEMO_ANNOUNCEMENTS.map(announcement => (
                        <div key={announcement.id} style={{marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                                <strong>{announcement.title}</strong>
                                <span className={`badge badge-${announcement.type === 'event' ? 'primary' : 'warning'}`}>
                                    {announcement.type}
                                </span>
                            </div>
                            <p style={{fontSize: '0.875rem', color: 'var(--text-secondary)'}}>
                                {announcement.content.substring(0, 100)}...
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

export function ManagementDashboard() {
    const [pending, setPending] = useState([]);

    useEffect(() => {
        fetch('/api/admin/pending')
            .then(res => res.json())
            .then(data => setPending(data))
            .catch(err => console.error(err));
    }, []);

    const handleAction = async (id, action) => {
        try {
            const res = await fetch('/api/admin/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action })
            });
            const data = await res.json();
            if (data.success) {
                setPending(data.pendingApprovals);
            }
        } catch(err) {
            console.error('Failed to process action', err);
        }
    };

    return (
        <>
            <div className="page-header">
                <h1>Admin Panel</h1>
                <p>Manage employees and approvals</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Total Employees</div>
                    <div className="stat-value">42</div>
                    <div className="stat-subtitle">Across all departments</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Pending Approvals</div>
                    <div className="stat-value">{pending.length}</div>
                    <div className="stat-subtitle">Awaiting action</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Open Tickets</div>
                    <div className="stat-value">5</div>
                    <div className="stat-subtitle">Support requests</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Present Today</div>
                    <div className="stat-value">38</div>
                    <div className="stat-subtitle">90% attendance</div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Pending Approvals</h3>
                </div>
                {pending.length === 0 ? (
                    <div className="empty-state">No pending approvals at this time.</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Type</th>
                                <th>Details</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pending.map(item => (
                                <tr key={item.id}>
                                    <td>{item.name}</td>
                                    <td><span className="badge badge-primary">{item.type}</span></td>
                                    <td>{item.details}</td>
                                    <td>{item.date}</td>
                                    <td>
                                        <button className="btn btn-success" style={{marginRight: '0.5rem'}} onClick={() => handleAction(item.id, 'Approve')}>Approve</button>
                                        <button className="btn btn-danger" onClick={() => handleAction(item.id, 'Reject')}>Reject</button>
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

export default function Dashboard({ user }) {
    return (
        <div style={{ paddingBottom: '2rem' }}>
            {user.role === 'admin' ? <ManagementDashboard /> : <EmployeeDashboard user={user} />}
            <CompanyCalendar />
        </div>
    );
}
