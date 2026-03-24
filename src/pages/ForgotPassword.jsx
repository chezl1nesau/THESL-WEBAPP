import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

export default function ForgotPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: 'info', message: 'Sending reset link...' });

        try {
            const res = await api.post('/api/auth/forgot-password', { email });
            const data = await res.json();
            setStatus({ type: 'success', message: data.message });
        } catch {
            setStatus({ type: 'error', message: 'Network error. Please check your connection and try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setStatus({ type: 'error', message: 'Passwords do not match' });
        }
        
        setLoading(true);
        setStatus({ type: 'info', message: 'Updating password...' });

        try {
            const res = await api.post('/api/auth/reset-password', { token, password });
            const data = await res.json();
            if (data.success) {
                setStatus({ type: 'success', message: 'Password updated! Redirecting to login...' });
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setStatus({ type: 'error', message: data.message });
            }
        } catch {
            setStatus({ type: 'error', message: 'Network error. Please check your connection and try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box glass-effect">
                <div className="login-logo">
                    <h1>THESL</h1>
                </div>

                <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: 'white' }}>
                    {token ? 'Reset Password' : 'Forgot Password'}
                </h2>
                <p style={{ textAlign: 'center', color: 'var(--text-light)', marginBottom: '2rem', fontSize: '0.875rem' }}>
                    {token 
                        ? 'Enter your new password below.' 
                        : 'Enter your email address and we\'ll send you a link to reset your password.'}
                </p>

                {status.message && (
                    <div className={`alert alert-${status.type}`} style={{ marginBottom: '1.5rem' }}>
                        {status.message}
                    </div>
                )}

                {!token ? (
                    <form onSubmit={handleForgotSubmit}>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                                placeholder="name@company.com"
                                disabled={loading}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                            <a href="/login" style={{ color: 'var(--accent-light)', fontSize: '0.875rem', textDecoration: 'none' }}>Back to Login</a>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleResetSubmit}>
                        <div className="form-group">
                            <label>New Password</label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                                placeholder="••••••••"
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input 
                                type="password" 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                required 
                                placeholder="••••••••"
                                disabled={loading}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Updating...' : 'Reset Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
