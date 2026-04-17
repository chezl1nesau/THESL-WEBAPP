import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AnimatedPage, { Skeleton } from '../components/AnimatedPage';
import { api } from '../utils/api';
import { DEMO_ANNOUNCEMENTS } from '../data/mockData';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { 
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import { 
    Palmtree, 
    Stethoscope, 
    Clock, 
    FileClock, 
    Users, 
    ShieldCheck, 
    LifeBuoy, 
    Activity 
} from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip">
                <p className="custom-tooltip-label">{label}</p>
                <p className="custom-tooltip-value">{`${payload[0].value} Days`}</p>
            </div>
        );
    }
    return null;
};


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

const LEAVE_DATA = [
    { name: 'Jan', leave: 1 },
    { name: 'Feb', leave: 0 },
    { name: 'Mar', leave: 3 },
    { name: 'Apr', leave: 2 },
    { name: 'May', leave: 0 },
    { name: 'Jun', leave: 4 },
];

const ATTENDANCE_DATA = [
    { name: 'Present', value: 22, color: '#bff368' },
    { name: 'On Leave', value: 2, color: '#3b82f6' },
    { name: 'Sick', value: 1, color: '#ef4444' },
];

function CompanyCalendar({ token }) {
    const [events, setEvents] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        setError('');
        api.get('/api/calendar', token)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const formatted = data.map(e => ({
                        ...e,
                        start: new Date(e.start),
                        end: new Date(e.end)
                    }));
                    setEvents(formatted);
                } else {
                    console.warn('Calendar data is not an array:', data);
                    setEvents([]);
                }
            })
            .catch(err => {
                console.error(err);
                setError('Failed to load calendar');
            });
    }, [token]);

    return (
        <div className="card" style={{ marginBottom: '1.5rem', marginTop: '1.5rem' }}>
            <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>Company Event Calendar</h3>
            {error && (
                <div style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '8px', backgroundColor: '#fde8e8', color: '#9b1c1c' }}>
                    {error}
                </div>
            )}
            <div style={{ height: '450px' }}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    views={['month', 'week', 'agenda']}
                    eventPropGetter={(event) => {
                        let bg = 'rgba(191, 243, 104, 0.1)'; 
                        let color = '#bff368';
                        
                        if (event.type === 'leave') {
                            bg = 'rgba(59, 130, 246, 0.1)';
                            color = '#60a5fa';
                        } else if (event.type === 'sick') {
                            bg = 'rgba(239, 68, 68, 0.1)';
                            color = '#f87171';
                        }
                        
                        return { style: { backgroundColor: bg, color: color, border: `1px solid ${color}33`, fontWeight: '600', padding: '2px 5px', borderRadius: '4px' } };
                    }}
                />
            </div>
        </div>
    );
}

function ProfileStrength({ user }) {
    let score = 0;
    if (user.name) score += 20;
    if (user.email) score += 20;
    if (user.phone) score += 20;
    if (user.avatar) score += 20;
    if (user.team) score += 20;

    return (
        <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--silver-gradient)', border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ margin: 0, color: '#050b16', fontSize: '0.95rem', fontWeight: '800' }}>Profile Completeness</h4>
                <span style={{ color: '#050b16', fontWeight: '900', fontSize: '1rem' }}>{score}%</span>
            </div>
            <div style={{ width: '100%', height: '10px', background: 'rgba(5,11,22,0.1)', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(5,11,22,0.05)' }}>
                <div style={{ width: `${score}%`, height: '100%', background: '#050b16', borderRadius: 'inherit', transition: 'width 1s ease-out' }}></div>
            </div>
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: 'rgba(5,11,22,0.7)', fontWeight: '600' }}>
                {score < 100 ? 'Add your phone number and avatar to reach 100%' : 'Your profile is fully optimized!'}
            </p>
        </div>
    );
}

function MilestoneBadges({ lateness, compliments, kpis }) {
    const badges = [
        { 
            id: 'attendance', 
            label: 'Early Bird', 
            desc: 'Zero lateness this month', 
            icon: Clock, 
            active: lateness === 0,
            color: '#fbbf24'
        },
        { 
            id: 'recognition', 
            label: 'Team Star', 
            desc: 'Received a recognition', 
            icon: Activity, 
            active: compliments && compliments.length > 0,
            color: '#bff368'
        },
        { 
            id: 'performance', 
            label: 'Overachiever', 
            desc: 'KPI targets met', 
            icon: ShieldCheck, 
            active: kpis && kpis.length > 0,
            color: '#60a5fa'
        }
    ];

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Milestones & Badges</h3>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {badges.map(badge => (
                    <div key={badge.id} style={{ 
                        flex: '1 1 140px', padding: '1.25rem 1rem', borderRadius: '12px', 
                        background: badge.active ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)', 
                        border: '1px solid var(--border)', textAlign: 'center',
                        position: 'relative', overflow: 'hidden', opacity: badge.active ? 1 : 0.4
                    }}>
                        {badge.active && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: badge.color }}></div>}
                        <div style={{ 
                            width: 48, height: 48, borderRadius: '50%', background: `rgba(${badge.active ? '191,243,104' : '255,255,255'}, 0.1)`, 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' 
                        }}>
                            <badge.icon size={24} color={badge.active ? badge.color : 'var(--text-light)'} />
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>{badge.label}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>{badge.active ? 'Earned' : 'Locked'}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function EmployeeDashboard({ user, token }) {
    const [balances, setBalances] = useState({ annual_balance: 0, sick_balance: 0 });
    const [latenessCount, setLatenessCount] = useState(0);
    const [openRequestsCount, setOpenRequestsCount] = useState(0);
    const [recentActivity, setRecentActivity] = useState([]);
    const [compliments, setCompliments] = useState([]);
    const [kpiCount, setKpiCount] = useState(0);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        if (!token) return;
        
        const fetchDashboardData = async () => {
            try {
                const [balRes, latRes, reqRes, compRes, docRes] = await Promise.all([
                    api.get(`/api/user/balances?email=${user.email}`, token),
                    api.get('/api/lateness', token),
                    api.get('/api/requests', token),
                    api.get('/api/compliments', token),
                    api.get('/api/documents', token)
                ]);
                
                const balData = await balRes.json();
                const latData = await latRes.json();
                const reqData = await reqRes.json();
                const compData = await compRes.json();
                const docData = await docRes.json();
                
                setBalances(balData);
                
                // Process Lateness
                if (Array.isArray(latData)) {
                    const myLate = latData.filter(L => L.user_email === user.email);
                    const currentMonth = new Date().getMonth();
                    const thisMonthLate = myLate.filter(L => new Date(L.date).getMonth() === currentMonth);
                    setLatenessCount(thisMonthLate.length);
                }
                
                // Process Requests & Activity
                if (Array.isArray(reqData)) {
                    const pending = reqData.filter(r => r.status?.toLowerCase() === 'pending');
                    setOpenRequestsCount(pending.length);
                    setRecentActivity(reqData.slice(0, 3));
                }

                // Process Compliments (for badges)
                if (Array.isArray(compData)) {
                    setCompliments(compData.filter(c => c.recipient_email === user.email));
                }

                // Process KPIs (for badges)
                if (Array.isArray(docData)) {
                    setKpiCount(docData.filter(d => d.title.includes('[KPI]')).length);
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user.email, token]);

    return (
        <>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flex: 1, gap: '2rem' }}>
                    <div>
                        <h1>Welcome back, {user.name.split(' ')[0]}</h1>
                        <p>Here's your overview for today</p>
                    </div>
                    <div style={{ width: '100%', maxWidth: '300px' }}>
                        <ProfileStrength user={user} />
                    </div>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Annual Leave</div>
                        <Palmtree size={20} color="var(--accent)" />
                    </div>
                    <div className="stat-value">{loading ? <Skeleton text style={{width: 40, marginTop: 10}}/> : balances.annual_balance + ' Days'}</div>
                    <div className="stat-subtitle">Remaining this year</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Sick Leave</div>
                        <Stethoscope size={20} color="#fb7185" />
                    </div>
                    <div className="stat-value">{loading ? <Skeleton text style={{width: 40, marginTop: 10}}/> : balances.sick_balance + ' Days'}</div>
                    <div className="stat-subtitle">Remaining this year</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Late Instances</div>
                        <Clock size={20} color="#facc15" />
                    </div>
                    <div className="stat-value">{loading ? <Skeleton text style={{width: 30, marginTop: 10}}/> : latenessCount}</div>
                    <div className="stat-subtitle">This month</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Open Requests</div>
                        <FileClock size={20} color="#60a5fa" />
                    </div>
                    <div className="stat-value">{loading ? <Skeleton text style={{width: 30, marginTop: 10}}/> : openRequestsCount}</div>
                    <div className="stat-subtitle">Pending approval</div>
                </div>
            </div>

            <div className="grid-2">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Leave History</h3>
                    </div>
                    <div style={{ height: '240px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={LEAVE_DATA}>
                                <defs>
                                    <linearGradient id="colorLeave" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#bff368" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#bff368" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    itemStyle={{ color: '#bff368' }}
                                />
                                <Area type="monotone" dataKey="leave" stroke="#bff368" strokeWidth={3} fillOpacity={1} fill="url(#colorLeave)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Recent Activity</h3>
                    </div>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>Loading...</div>
                    ) : recentActivity.length === 0 ? (
                        <div className="empty-state">No recent activity</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {recentActivity.map((req, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border)', borderRadius: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(96,165,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <FileClock size={16} color="#60a5fa" />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{req.title || req.type}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{req.details || req.date}</div>
                                        </div>
                                    </div>
                                    <span className={`badge badge-${req.status?.toLowerCase() === 'pending' ? 'warning' : req.status?.toLowerCase() === 'resolved' || req.status === 'success' || req.status === 'Approved' ? 'success' : 'danger'}`}>
                                        {req.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
                <MilestoneBadges lateness={latenessCount} compliments={compliments} kpis={kpiCount} />
            </div>
        </>
    );
}

export function ManagementDashboard({ token }) {
    const [pending, setPending] = useState([]);
    const [compliments, setCompliments] = useState([]);
    const [error, setError] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(true);

    const fetchData = React.useCallback(async () => {
        setError('');
        try {
            const [pendingRes, complRes] = await Promise.all([
                api.get('/api/admin/pending', token),
                api.get('/api/compliments', token)
            ]);
            
            const pendingData = await pendingRes.json();
            const complData = await complRes.json();
            
            if (Array.isArray(pendingData)) setPending(pendingData);
            if (Array.isArray(complData)) setCompliments(complData);
        } catch (err) {
            console.error(err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAction = async (id, action) => {
        setStatus({ type: 'info', message: 'Processing...' });
        try {
            const res = await api.post('/api/admin/action', { id, action }, token);
            const data = await res.json();
            if (data.success) {
                setPending(data.pendingApprovals);
                setStatus({ type: 'success', message: 'Action completed successfully!' });
                setTimeout(() => setStatus({ type: '', message: '' }), 3000);
            } else {
                setStatus({ type: 'error', message: 'Action failed' });
            }
        } catch(err) {
            console.error('Failed to process action', err);
            setStatus({ type: 'error', message: 'Network error. Please try again.' });
        }
    };

    const approvedCompliments = compliments.filter(c => c.status === 'approved');
    const totalBonuses = approvedCompliments.reduce((sum, c) => sum + parseFloat(c.bonus_amount || 0), 0);
    const pendingComplimentsCount = compliments.filter(c => c.status === 'pending').length;

    return (
        <>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Management Dashboard</h1>
                    <p>Manage employees and performance recognitions</p>
                </div>
                <Link to="/analytics" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--silver-gradient)', color: '#05111d' }}>
                    <Activity size={18} /> View Live Analytics
                </Link>
            </div>

            {error && (
                <div style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '8px', backgroundColor: '#fde8e8', color: '#9b1c1c' }}>
                    {error}
                </div>
            )}

            {status.message && (
                <div style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '8px', backgroundColor: status.type === 'success' ? '#def7ec' : status.type === 'error' ? '#fde8e8' : '#e1effe', color: status.type === 'success' ? '#03543f' : status.type === 'error' ? '#9b1c1c' : '#1e429f' }}>
                    {status.message}
                </div>
            )}

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Total Recognition</div>
                        <Activity size={20} color="var(--accent)" />
                    </div>
                    <div className="stat-value">{loading ? <Skeleton text style={{width: 30, marginTop: 10}}/> : approvedCompliments.length}</div>
                    <div className="stat-subtitle">{loading ? <Skeleton text style={{width: 100, marginTop: 4}}/> : `${pendingComplimentsCount} awaiting approval`}</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Performance Bonuses</div>
                        <ShieldCheck size={20} color="#10b981" />
                    </div>
                    <div className="stat-value">{loading ? <Skeleton text style={{width: 60, marginTop: 10}}/> : `R ${totalBonuses.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`}</div>
                    <div className="stat-subtitle">Total paid to date</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Pending Reviews</div>
                        <ShieldCheck size={20} color="#60a5fa" />
                    </div>
                    <div className="stat-value">{loading ? <Skeleton text style={{width: 30, marginTop: 10}}/> : pending.length}</div>
                    <div className="stat-subtitle">Awaiting leave approvals</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Attendance Today</div>
                        <Users size={20} color="#fb7185" />
                    </div>
                    <div className="stat-value">{loading ? <Skeleton text style={{width: 50, marginTop: 10}}/> : '22 / 25'}</div>
                    <div className="stat-subtitle">Across all teams</div>
                </div>
            </div>

            <div className="grid-2">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Attendance Overview</h3>
                    </div>
                    <div style={{ height: '240px', width: '100%', display: 'flex', alignItems: 'center' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={ATTENDANCE_DATA}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {ATTENDANCE_DATA.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ marginLeft: '1rem' }}>
                            {ATTENDANCE_DATA.map(item => (
                                <div key={item.name} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.8125rem' }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, marginRight: '0.5rem' }} />
                                    <span style={{ color: 'var(--text-secondary)' }}>{item.name}: <strong>{item.value}</strong></span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Pending Approvals</h3>
                    </div>
                    {pending.length === 0 ? (
                        <div className="empty-state">No pending approvals at this time.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {pending.map(item => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border)', borderRadius: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 200 }}>
                                        <div style={{ width: 38, height: 38, borderRadius: '8px', background: 'rgba(96,165,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <ShieldCheck size={18} color="#60a5fa" />
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{item.name}</h4>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.2rem', display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                                <span className="badge badge-primary" style={{ padding: '0.15rem 0.5rem', fontSize: '0.65rem' }}>{item.type}</span>
                                                <span style={{color: 'var(--accent)', fontWeight: 600}}>{item.details || item.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn btn-primary" onClick={() => handleAction(item.id, 'Approve')} style={{ background: '#10b981', borderColor: '#10b981', padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Approve</button>
                                        <button className="btn btn-ghost" onClick={() => handleAction(item.id, 'Reject')} style={{ color: '#ef4444', border: '1px solid #ef4444', padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Reject</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default function Dashboard({ user, token }) {
    return (
        <AnimatedPage>
            <div style={{ paddingBottom: '2rem' }}>
                {user.role === 'admin' || user.role === 'manager' ? (
                    <ManagementDashboard token={token} />
                ) : (
                    <EmployeeDashboard user={user} token={token} />
                )}
                <CompanyCalendar token={token} />
            </div>
        </AnimatedPage>
    );
}
