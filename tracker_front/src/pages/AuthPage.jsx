import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authenticate } from '../services/api';

const AuthPage = ({ mode, onAuthenticated }) => {
    const isRegister = mode === 'register';
    const location = useLocation();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', remember: true });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const credentials = {
                ...(isRegister ? { name: form.name.trim() } : {}),
                email: form.email.trim(),
                password: form.password,
            };
            const result = await authenticate(mode, credentials);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            const storage = form.remember ? localStorage : sessionStorage;
            storage.setItem('token', result.token);
            storage.setItem('user', JSON.stringify(result.user));
            onAuthenticated(result.user);
            const destination = location.state?.from || '/';
            navigate(destination, { replace: true });
        } catch (authError) {
            setError(authError.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="auth-screen">
            <section className="auth-card">
                <Link to="/" className="auth-brand" aria-label="Pennywise home">
                    <span className="brand-mark" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none"><path d="M4 17.5 9 12l3.5 3.5L20 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M15.5 7H20v4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    <span>
                        <strong>Extra Penny</strong>
                        <small>PERSONAL FINANCE</small>
                    </span>
                </Link>

                <div className="auth-intro">
                    <p className="auth-eyebrow">{isRegister ? 'START BUILDING BETTER HABITS' : 'WELCOME BACK'}</p>
                    <h1>{isRegister ? 'Create your account' : 'Sign in to your account'}</h1>
                    <p>{isRegister ? 'Your finances, organized in one calm place.' : 'Pick up right where you left off.'}</p>
                </div>

                {error && <div className="auth-error" role="alert">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    {isRegister && (
                        <label className="auth-label">
                            Full name
                            <input
                                autoComplete="name"
                                className="form-control"
                                maxLength="80"
                                onChange={(event) => setForm({ ...form, name: event.target.value })}
                                placeholder="Your name"
                                required
                                value={form.name}
                            />
                        </label>
                    )}
                    <label className="auth-label">
                        Email address
                        <input
                            autoComplete="email"
                            className="form-control"
                            onChange={(event) => setForm({ ...form, email: event.target.value })}
                            placeholder="you@example.com"
                            required
                            type="email"
                            value={form.email}
                        />
                    </label>
                    <label className="auth-label">
                        Password
                        <input
                            autoComplete={isRegister ? 'new-password' : 'current-password'}
                            className="form-control"
                            minLength="6"
                            onChange={(event) => setForm({ ...form, password: event.target.value })}
                            placeholder="At least 6 characters"
                            required
                            type="password"
                            value={form.password}
                        />
                    </label>
                    <label className="auth-remember">
                        <input
                            checked={form.remember}
                            onChange={(event) => setForm({ ...form, remember: event.target.checked })}
                            type="checkbox"
                        />
                        Keep me signed in on this device
                    </label>
                    <button className="auth-submit" disabled={submitting} type="submit">
                        {submitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
                    </button>
                </form>

                <p className="auth-switch">
                    {isRegister ? 'Already have an account?' : 'New to Pennywise?'}{' '}
                    <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link>
                </p>
                <p className="auth-security">Your transactions are private to your account.</p>
            </section>
        </main>
    );
};

export default AuthPage;
