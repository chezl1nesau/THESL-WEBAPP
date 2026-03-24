import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mfaCode, setMfaCode] = useState('');
    const [mfaRequired, setMfaRequired] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const endpoint = mfaRequired ? '/api/auth/2fa/login' : '/api/auth/login';
            const body = mfaRequired 
                ? JSON.stringify({ email, code: mfaCode })
                : JSON.stringify({ email, password });

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body
            });
            const data = await res.json();
            
            if (data.success) {
                if (data.mfaRequired) {
                    setMfaRequired(true);
                } else {
                    onLogin(data.user, data.token);
                }
            } else {
                setError(data.message || 'Invalid email or password');
            }
        } catch {
            setError('Failed to connect to the server');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box glass-effect">
                <div className="login-logo">
                    <h1>THESL</h1>
                    <p style={{ color: 'var(--text-light)', marginTop: '0.5rem' }}>HR Portal Management</p>
                </div>

                {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

                {!mfaRequired ? (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                Password
                                <Link to="/forgot-password" style={{ color: 'var(--accent-light)', fontSize: '0.75rem', textDecoration: 'none' }}>Forgot Password?</Link>
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '1rem'}} disabled={isLoading}>
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <Link to="/forgot-password" style={{ color: 'var(--text-light)', fontSize: '0.875rem', textDecoration: 'none' }}>
                                Forgot your password?
                            </Link>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
                            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Two-Factor Auth</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                                Enter the 6-digit code from your authenticator app.
                            </p>
                        </div>
                        <div className="form-group">
                            <input
                                type="text"
                                value={mfaCode}
                                onChange={(e) => setMfaCode(e.target.value)}
                                placeholder="000000"
                                maxLength={6}
                                required
                                disabled={isLoading}
                                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.3em' }}
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '1rem'}} disabled={isLoading}>
                            {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                        </button>
                        <button type="button" className="btn btn-link" style={{ width: '100%', marginTop: '1rem', color: 'var(--text-light)', fontSize: '0.875rem' }} onClick={() => setMfaRequired(false)}>
                            Back to Login
                        </button>
                    </form>
                )}

                <div className="demo-credentials" style={{ marginTop: '2.5rem', opacity: 0.6 }}>
                    <p style={{ fontSize: '0.75rem', margin: 0 }}>
                        <span className="status-dot"></span> Powered by SLVRCLD.com Enterprise Security
                    </p>
                </div>
            </div>
        </div>
    );
}
