import React, { useState, useRef } from 'react';
import { api } from '../utils/api';

export default function Profile({ user, setUser, token }) {
    const [activeTab, setActiveTab] = useState('profile');
    const [name, setName] = useState(user.name || '');
    const [phone, setPhone] = useState(user.phone || '');
    const [password, setPassword] = useState('');
    const [avatar, setAvatar] = useState(user.avatar || '');
    const [status, setStatus] = useState({ type: '', message: '' });
    
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isSettingUp, setIsSettingUp] = useState(false);
    const [tfaEnabled, setTfaEnabled] = useState(user.two_factor_enabled || false);

    const handleSetup2FA = async () => {
        setIsSettingUp(true);
        setStatus({ type: 'info', message: 'Generating 2FA secret...' });
        try {
            const res = await api.post('/api/auth/2fa/setup', {}, token);
            const data = await res.json();
            if (data.success) {
                setQrCode(data.qrCode);
                setSecret(data.secret);
                setStatus({ type: '', message: '' });
            } else {
                setStatus({ type: 'error', message: 'Failed to generate 2FA secret' });
                setIsSettingUp(false);
            }
        } catch {
            setStatus({ type: 'error', message: 'Server error' });
            setIsSettingUp(false);
        }
    };

    const handleVerify2FA = async () => {
        if (!verificationCode) return;
        setStatus({ type: 'info', message: 'Verifying code...' });
        try {
            const res = await api.post('/api/auth/2fa/verify-setup', {
                secret,
                code: verificationCode
            }, token);
            const data = await res.json();
            if (data.success) {
                setTfaEnabled(true);
                setIsSettingUp(false);
                setQrCode('');
                setSecret('');
                setVerificationCode('');
                setStatus({ type: 'success', message: '2FA enabled successfully!' });
            } else {
                setStatus({ type: 'error', message: data.message || 'Verification failed' });
            }
        } catch {
            setStatus({ type: 'error', message: 'Server error' });
        }
    };

    const handleDisable2FA = async () => {
        if (!window.confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) return;
        try {
            const res = await api.post('/api/auth/2fa/disable', {}, token);
            const data = await res.json();
            if (data.success) {
                setTfaEnabled(false);
                setStatus({ type: 'success', message: '2FA disabled successfully.' });
            }
        } catch {
            setStatus({ type: 'error', message: 'Server error' });
        }
    };

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
            const res = await api.put('/api/user/profile', {
                email: user.email,
                name,
                phone,
                password: password || undefined,
                avatar
            }, token);
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
        <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <div className="page-header">
                <h1>{activeTab === 'profile' ? 'Profile Settings' : 'Security Settings'}</h1>
                <p>Manage your account preferences and security.</p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <button 
                    className={`btn ${activeTab === 'profile' ? 'btn-primary' : ''}`} 
                    style={{ background: activeTab !== 'profile' ? 'transparent' : undefined, color: activeTab !== 'profile' ? 'var(--text-secondary)' : 'var(--bg-deep)' }}
                    onClick={() => setActiveTab('profile')}
                >
                    Profile
                </button>
                <button 
                    className={`btn ${activeTab === 'security' ? 'btn-primary' : ''}`} 
                    style={{ background: activeTab !== 'security' ? 'transparent' : undefined, color: activeTab !== 'security' ? 'var(--text-secondary)' : 'var(--bg-deep)' }}
                    onClick={() => setActiveTab('security')}
                >
                    Security 🛡️
                </button>
            </div>

            {status.message && (
                <div className={`alert alert-${status.type}`} style={{ marginBottom: '1.5rem' }}>
                    {status.message}
                </div>
            )}

            {activeTab === 'profile' ? (
                <div className="card glass-effect">
                    <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>Personal Information</h3>
                    
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: '0 0 150px' }}>
                                <div 
                                    style={{ 
                                        width: '150px', 
                                        height: '150px', 
                                        borderRadius: '16px', 
                                        backgroundColor: 'var(--bg-deep)', 
                                        border: '1px solid var(--border)',
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
                                    className="glass-effect"
                                >
                                    {!avatar && <span style={{ fontSize: '3rem' }}>👤</span>}
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.75rem', textAlign: 'center', padding: '0.5rem', backdropFilter: 'blur(4px)' }}>
                                        Change Photo
                                    </div>
                                </div>
                                <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept="image/*" />
                            </div>

                            <div style={{ flex: '1', minWidth: '300px' }}>
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input type="email" value={user.email} disabled />
                                    <small style={{ color: 'var(--text-light)' }}>Email cannot be changed</small>
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>New Password (leave blank to keep current)</label>
                                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                                    Save Profile Changes
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="card glass-effect">
                    <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>Security Controls</h3>
                    
                    <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h4 style={{ margin: 0, color: 'var(--accent-light)' }}>Two-Factor Authentication (2FA)</h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', margin: '0.5rem 0 0' }}>
                                    Add an extra layer of security to your account using an authenticator app.
                                </p>
                            </div>
                            <div>
                                {tfaEnabled ? (
                                    <span className="badge badge-success" style={{ padding: '0.5rem 1rem' }}>ACTIVE</span>
                                ) : (
                                    <span className="badge badge-warning" style={{ padding: '0.5rem 1rem' }}>DISABLED</span>
                                )}
                            </div>
                        </div>

                        {!tfaEnabled && !isSettingUp && (
                            <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={handleSetup2FA}>
                                Enable Two-Factor Auth 🛡️
                            </button>
                        )}

                        {isSettingUp && (
                            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                    {qrCode && (
                                        <div style={{ background: 'white', padding: '1rem', borderRadius: '12px' }}>
                                            <img src={qrCode} alt="2FA QR Code" style={{ width: '180px', height: '180px' }} />
                                        </div>
                                    )}
                                    <div style={{ flex: 1, minWidth: '250px' }}>
                                        <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>1. Scan QR Code</h4>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
                                            Scan this code with Google Authenticator or any TOTP app.
                                            <br />
                                            Manual secret: <strong style={{ color: 'var(--accent-light)' }}>{secret}</strong>
                                        </p>
                                        
                                        <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>2. Verify Code</h4>
                                        <div className="form-group">
                                            <input 
                                                type="text" 
                                                placeholder="Enter 6-digit code" 
                                                value={verificationCode}
                                                onChange={(e) => setVerificationCode(e.target.value)}
                                                maxLength={6}
                                                style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.2em' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <button className="btn btn-primary" onClick={handleVerify2FA}>Confirm Setup</button>
                                            <button className="btn" onClick={() => setIsSettingUp(false)}>Cancel</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {tfaEnabled && (
                            <button className="btn btn-danger" style={{ marginTop: '1.5rem' }} onClick={handleDisable2FA}>
                                Disable Two-Factor Auth
                            </button>
                        )}
                    </div>
                    
                    <div className="card" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <h4 style={{ margin: 0, color: '#60a5fa' }}>Session Management</h4>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', margin: '0.5rem 0 1rem' }}>
                            Your session will persist for 7 days unless you sign out.
                        </p>
                        <button className="btn" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }} onClick={() => alert('Feature coming soon')}>
                            Manage All Sessions
                        </button>
                    </div>

                    <div style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid var(--border)' }}>
                        <h4 style={{ margin: 0, color: '#f87171' }}>Account Deletion</h4>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', margin: '0.5rem 0 1rem' }}>
                            Please contact HR to initiate account deletion.
                        </p>
                        <button className="btn btn-danger" disabled>
                            Request Account Deletion
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
