import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight } from 'lucide-react';

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

        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

        try {
            const endpoint = mfaRequired ? '/api/auth/2fa/login' : '/api/auth/login';
            const fullUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
            const body = mfaRequired 
                ? JSON.stringify({ email, code: mfaCode })
                : JSON.stringify({ email, password });

            // Retry logic with exponential backoff for network failures
            let lastError = null;
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    const res = await fetch(fullUrl, {
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
                    lastError = null;
                    break;
                } catch (err) {
                    lastError = err;
                    if (attempt < 2) {
                        // Show retrying message for attempts < 2
                        setError(`Connection issue - retrying... (attempt ${attempt + 1} of 3)`);
                        // Exponential backoff: 100ms, 200ms
                        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
                    }
                }
            }
            
            if (lastError) {
                setError('Unable to connect to server. Please check your internet connection and try again.');
            }
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
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    required
                                    disabled={isLoading}
                                    style={{ paddingLeft: '42px' }}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                Password
                                <Link to="/forgot-password" style={{ color: 'var(--accent)', fontSize: '0.75rem', textDecoration: 'none' }}>Forgot?</Link>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    disabled={isLoading}
                                    style={{ paddingLeft: '42px' }}
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '1rem', justifyContent: 'center'}} disabled={isLoading}>
                            {isLoading ? 'Signing In...' : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                                <div style={{ 
                                    width: 64, height: 64, borderRadius: '20px', 
                                    background: 'rgba(191, 243, 104, 0.1)', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center' 
                                }}>
                                    <ShieldCheck size={32} color="var(--accent)" />
                                </div>
                            </div>
                            <h3 style={{ color: 'white', marginBottom: '0.5rem', fontFamily: 'Outfit' }}>Two-Factor Auth</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                                Enter the 6-digit code from your app.
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
                                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.3em', background: 'rgba(255,255,255,0.05)' }}
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '1rem', justifyContent: 'center'}} disabled={isLoading}>
                            {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                        </button>
                        <button type="button" className="btn btn-link" style={{ width: '100%', marginTop: '1rem', color: 'var(--text-light)', fontSize: '0.875rem', background: 'transparent', border: 'none' }} onClick={() => setMfaRequired(false)}>
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
