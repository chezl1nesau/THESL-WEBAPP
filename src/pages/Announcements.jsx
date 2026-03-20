import React, { useState, useEffect } from 'react';

export default function Announcements({ user }) {
    const [announcements, setAnnouncements] = useState([]);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetch('/api/announcements')
            .then(res => res.json())
            .then(data => setAnnouncements(data))
            .catch(err => console.error(err));
    }, []);

    const filteredAnnouncements = filter === 'all' 
        ? announcements 
        : announcements.filter(a => a.type === filter);

    return (
        <>
            <div className="page-header">
                <h1>Company Announcements</h1>
                <p>Stay updated with the latest company news and events</p>
            </div>

            <div className="card">
                <div className="filter-buttons">
                    <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
                    <button className={`filter-btn ${filter === 'news' ? 'active' : ''}`} onClick={() => setFilter('news')}>News</button>
                    <button className={`filter-btn ${filter === 'policy' ? 'active' : ''}`} onClick={() => setFilter('policy')}>Policies</button>
                    <button className={`filter-btn ${filter === 'event' ? 'active' : ''}`} onClick={() => setFilter('event')}>Events</button>
                </div>

                {filteredAnnouncements.map(announcement => (
                    <div key={announcement.id} style={{
                        padding: '1.25rem',
                        marginBottom: '1rem',
                        borderLeft: `3px solid ${announcement.type === 'event' ? 'var(--primary)' : 'var(--warning)'}`,
                        borderRadius: '6px',
                        background: 'var(--bg-main)'
                    }}>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                            <strong style={{fontSize: '1rem'}}>{announcement.title}</strong>
                            <span className={`badge badge-${announcement.type === 'event' ? 'primary' : 'warning'}`}>
                                {announcement.type}
                            </span>
                        </div>
                        <p style={{color: 'var(--text-secondary)', marginBottom: '0.5rem'}}>{announcement.content}</p>
                        <div style={{fontSize: '0.8125rem', color: 'var(--text-light)'}}>
                            {new Date(announcement.date).toLocaleDateString()} · By {announcement.author}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
