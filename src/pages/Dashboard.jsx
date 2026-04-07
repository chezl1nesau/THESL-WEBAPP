import AnimatedPage from '../components/AnimatedPage';

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

// ... existing code (localizer, etc.) unchanged ...
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

function EmployeeDashboard({ user, token }) {
    const [balances, setBalances] = useState({ annual_balance: 15, sick_balance: 10 });
    
    useEffect(() => {
        if (!token) return;
        api.get(`/api/user/balances?email=${user.email}`, token)
            .then(res => res.json())
            .then(data => setBalances(data))
            .catch(console.error);
    }, [user.email, token]);

    return (
        <>
            <div className="page-header">
                <h1>Welcome back, {user.name.split(' ')[0]}</h1>
                <p>Here's your overview for today</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Annual Leave</div>
                        <Palmtree size={20} color="var(--accent)" />
                    </div>
                    <div className="stat-value">{balances.annual_balance} Days</div>
                    <div className="stat-subtitle">Remaining this year</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Sick Leave</div>
                        <Stethoscope size={20} color="#fb7185" />
                    </div>
                    <div className="stat-value">{balances.sick_balance} Days</div>
                    <div className="stat-subtitle">Remaining this year</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Late Instances</div>
                        <Clock size={20} color="#facc15" />
                    </div>
                    <div className="stat-value">2</div>
                    <div className="stat-subtitle">This month</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Open Requests</div>
                        <FileClock size={20} color="#60a5fa" />
                    </div>
                    <div className="stat-value">1</div>
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
            </div>
        </>
    );
}

export function ManagementDashboard({ token }) {
    const [pending, setPending] = useState([]);
    const [compliments, setCompliments] = useState([]);
    const [error, setError] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });

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
            <div className="page-header">
                <h1>Management Dashboard</h1>
                <p>Manage employees and performance recognitions</p>
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
                    <div className="stat-value">{approvedCompliments.length}</div>
                    <div className="stat-subtitle">{pendingComplimentsCount} awaiting approval</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Performance Bonuses</div>
                        <ShieldCheck size={20} color="#10b981" />
                    </div>
                    <div className="stat-value">R {totalBonuses.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}</div>
                    <div className="stat-subtitle">Total paid to date</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Pending Reviews</div>
                        <ShieldCheck size={20} color="#60a5fa" />
                    </div>
                    <div className="stat-value">{pending.length}</div>
                    <div className="stat-subtitle">Awaiting leave approvals</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Attendance Today</div>
                        <Users size={20} color="#fb7185" />
                    </div>
                    <div className="stat-value">22 / 25</div>
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
                        <table>
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Type</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pending.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.name}</td>
                                        <td><span className="badge badge-primary">{item.type}</span></td>
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
