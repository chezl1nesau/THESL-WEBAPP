import React, { useState, useRef } from 'react';

export default function Profile({ user, setUser }) {
    const [name, setName] = useState(user.name || '');
    const [phone, setPhone] = useState(user.phone || '');
    const [password, setPassword] = useState('');
    const [avatar, setAvatar] = useState(user.avatar || '');
    const [status, setStatus] = useState({ type: '', message: '' });
    
    const fileInputRef = useRef(null);

    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result); // Base64 encoding
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: 'info', message: 'Saving changes...' });

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    name,
                    phone,
                    password: password || undefined,
                    avatar
                })
            });
            const data = await res.json();
            
            if (data.success) {
                setStatus({ type: 'success', message: 'Profile updated successfully!' });
                setUser(data.user); // Update global app state mapped via Sidebar
                setPassword(''); // clear password field
            } else {
                setStatus({ type: 'error', message: data.message || 'Update failed' });
            }
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: 'Network error occurred' });
        }
    };

    return (
        <>
            <div className="page-header">
                <h1>Account Settings</h1>
                <p>Manage your profile and preferences.</p>
            </div>

            <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h3 className="card-title" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>My Profile</h3>
                
                {status.message && (
                    <div style={{ padding: '0.75rem', marginBottom: '1.5rem', borderRadius: '4px', textAlign: 'center', backgroundColor: status.type === 'success' ? '#def7ec' : status.type === 'error' ? '#fde8e8' : '#e1effe', color: status.type === 'success' ? '#03543f' : status.type === 'error' ? '#9b1c1c' : '#1e429f' }}>
                        {status.message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                        <div 
                            style={{ 
                                width: '120px', 
                                height: '120px', 
                                borderRadius: '50%', 
                                backgroundColor: 'var(--bg-main)', 
                                border: '3px solid var(--accent-light)',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundImage: avatar ? `url(${avatar})` : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onClick={handleAvatarClick}
                            className="avatar-hover"
                        >
                            {!avatar && <span style={{ color: 'var(--text-light)', fontSize: '2rem' }}>👤</span>}
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.75rem', textAlign: 'center', padding: '0.25rem' }}>
                                Change
                            </div>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            style={{ display: 'none' }} 
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        <p style={{ marginTop: '0.5rem', color: 'var(--text-light)', fontSize: '0.875rem' }}>Click to upload a new profile picture</p>
                    </div>

                    <div className="form-group">
                        <label>Full Name</label>
                        <input type="text" required value={name} onChange={e => setName(e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" disabled value={user.email} style={{ backgroundColor: 'var(--bg-main)', cursor: 'not-allowed' }} />
                        <small style={{ color: 'var(--text-light)', marginTop: '0.25rem', display: 'block' }}>Email cannot be changed.</small>
                    </div>
                    
                    <div className="form-group">
                        <label>Phone Number</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 082 123 4567" />
                    </div>

                    <div className="form-group" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
                        <label>New Password (Leave blank to keep current)</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Save Changes</button>
                    </div>
                </form>
            </div>
        </>
    );
}
