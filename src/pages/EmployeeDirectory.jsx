import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import AnimatedPage, { Skeleton } from '../components/AnimatedPage';
import { Search, Mail, Phone, Users, Filter, ChevronRight, User } from 'lucide-react';

export default function EmployeeDirectory({ token }) {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [teamFilter, setTeamFilter] = useState('All');

    useEffect(() => {
        setLoading(true);
        api.get('/api/admin/users', token)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setEmployees(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [token]);

    const teams = ['All', ...new Set(employees.map(e => e.team).filter(Boolean))];

    const filteredEmployees = employees.filter(e => {
        const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) || 
                             e.email.toLowerCase().includes(search.toLowerCase()) ||
                             (e.team && e.team.toLowerCase().includes(search.toLowerCase()));
        
        const matchesTeam = teamFilter === 'All' || e.team === teamFilter;
        
        return matchesSearch && matchesTeam;
    });

    return (
        <AnimatedPage>
            <div className="page-header">
                <h1>Employee Directory</h1>
                <p>Connect and collaborate with your colleagues</p>
            </div>

            <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                        <input 
                            type="text" 
                            placeholder="Search by name, email or team..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: '44px', width: '100%', height: '48px', borderRadius: '12px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <Filter size={18} color="var(--text-light)" />
                        <div className="filter-buttons" style={{ marginBottom: 0 }}>
                            {teams.map(team => (
                                <button 
                                    key={team}
                                    className={`filter-btn ${teamFilter === team ? 'active' : ''}`}
                                    onClick={() => setTeamFilter(team)}
                                    style={{ padding: '0.6rem 1rem' }}
                                >
                                    {team}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="card" style={{ height: '220px' }}>
                            <Skeleton circle className="mb-4" style={{ width: 64, height: 64 }} />
                            <Skeleton title className="mb-2" />
                            <Skeleton text className="mb-1" />
                            <Skeleton text style={{ width: '40%' }} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {filteredEmployees.map(emp => (
                        <div key={emp.email} className="card stat-card" style={{ padding: '1.5rem', cursor: 'default' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                <div style={{ 
                                    width: 64, height: 64, borderRadius: '16px', 
                                    background: 'var(--silver-gradient)', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.5rem', fontWeight: '800', color: '#050b16',
                                    boxShadow: '0 8px 16px rgba(191, 243, 104, 0.2)'
                                }}>
                                    {emp.avatar ? <img src={emp.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} /> : emp.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 style={{ marginBottom: '0.25rem', fontSize: '1.1rem' }}>{emp.name}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span className="badge badge-primary">{emp.role}</span>
                                        {emp.team && <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)' }}>{emp.team}</div>}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    <Mail size={16} />
                                    {emp.email}
                                </div>
                                {emp.phone && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                        <Phone size={16} />
                                        {emp.phone}
                                    </div>
                                )}
                            </div>

                            <div style={{ 
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                paddingTop: '1rem', borderTop: '1px solid var(--border-light)'
                            }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <a href={`mailto:${emp.email}`} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Email</a>
                                    <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderColor: 'var(--border)' }}>Profile</button>
                                </div>
                                <ChevronRight size={18} color="var(--text-light)" />
                            </div>
                        </div>
                    ))}

                    {filteredEmployees.length === 0 && (
                        <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem' }}>
                            <Users size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                            <p style={{ color: 'var(--text-light)' }}>No employees found for your search.</p>
                        </div>
                    )}
                </div>
            )}
        </AnimatedPage>
    );
}
