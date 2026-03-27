import { Bell, Newspaper, ScrollText, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { api } from '../utils/api';

export default function Announcements({ token }) {
    const [announcements, setAnnouncements] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        setLoadError('');
        api.get('/api/announcements', token)
            .then(res => res.json())
            .then(data => setAnnouncements(data))
            .catch(err => {
                console.error(err);
                setLoadError('Failed to load announcements');
            });
    }, [token]);

    const filteredAnnouncements = filter === 'all' 
        ? announcements 
        : announcements.filter(a => a.type === filter);

    return (
        <>
            <div className="page-header">
                <h1>Company Announcements</h1>
                <p>Stay updated with the latest company news and events</p>
            </div>

            {loadError && (
                <div style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '8px', backgroundColor: '#fde8e8', color: '#9b1c1c' }}>
                    {loadError}
                </div>
            )}

            <div className="card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                    <Filter size={18} color="var(--text-light)" />
                    <div className="filter-buttons" style={{ margin: 0 }}>
                        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Insights</button>
                        <button className={`filter-btn ${filter === 'news' ? 'active' : ''}`} onClick={() => setFilter('news')}>Company News</button>
                        <button className={`filter-btn ${filter === 'policy' ? 'active' : ''}`} onClick={() => setFilter('policy')}>Policy Updates</button>
                        <button className={`filter-btn ${filter === 'event' ? 'active' : ''}`} onClick={() => setFilter('event')}>Events</button>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '1.25rem' }}>
                    {filteredAnnouncements.map(announcement => (
                        <div key={announcement.id} style={{
                            padding: '1.75rem',
                            borderRadius: '16px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid var(--border)',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden'
                        }} className="announcement-item">
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: '12px',
                                    background: announcement.type === 'event' ? 'rgba(59, 130, 246, 0.1)' : announcement.type === 'policy' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(191, 243, 104, 0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {announcement.type === 'event' ? <CalendarIcon size={22} color="#60a5fa" /> : 
                                     announcement.type === 'policy' ? <ScrollText size={22} color="#facc15" /> : 
                                     <Newspaper size={22} color="var(--accent)" />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'white', margin: 0 }}>{announcement.title}</h3>
                                        <span className={`badge badge-${announcement.type === 'event' ? 'primary' : 'warning'}`} style={{ fontSize: '0.65rem' }}>
                                            {announcement.type}
                                        </span>
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: '1.7', marginBottom: '1.25rem', maxWidth: '90%' }}>
                                        {announcement.content}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--silver-gradient)', color: '#05101f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '800' }}>
                                            {announcement.author?.[0] || 'A'}
                                        </div>
                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-light)', fontWeight: '500' }}>
                                            {announcement.author} · {new Date(announcement.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
