import React, { useEffect, useState } from 'react';
import './App.css';
import Layout from './components/Layout.jsx';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import AuthPage from './pages/AuthPage.jsx';
import { clearApiToken, getApiToken, getCurrentUser } from './services/api.js';

function App() {
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
        } catch {
            return null;
        }
    });
    const [authReady, setAuthReady] = useState(() => !getApiToken());
    const navigate = useNavigate();
    const location = useLocation();

    function clearAuth() {
        clearApiToken();
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        setUser(null);
    }

    useEffect(() => {
        if (!getApiToken()) return undefined;
        let active = true;
        getCurrentUser()
            .then((currentUser) => {
                if (active) {
                    setUser(currentUser);
                    const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
                    storage.setItem('user', JSON.stringify(currentUser));
                }
            })
            .catch((error) => {
                if (!active) return;
                if (/401|token|user not found/i.test(error.message)) {
                    clearAuth();
                }
            })
            .finally(() => {
                if (active) setAuthReady(true);
            });
        return () => { active = false; };
    }, []);

    const handleLogout = () => {
        clearAuth();
        navigate('/login', { replace: true });
    };

    return (
        <Routes>
            <Route
                path="/login"
                element={user ? <Navigate to="/" replace /> : <AuthPage mode="login" onAuthenticated={setUser} />}
            />
            <Route
                path="/register"
                element={user ? <Navigate to="/" replace /> : <AuthPage mode="register" onAuthenticated={setUser} />}
            />
            <Route
                path="/"
                element={
                    authReady
                        ? user
                            ? <Layout user={user} onLogout={handleLogout} />
                            : <Navigate to="/login" replace state={{ from: location.pathname }} />
                        : <div className="auth-loading" role="status">Connecting to your account…</div>
                }
            >
                <Route index element={<Dashboard />} />
            </Route>
            <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
        </Routes>
    );
}

export default App;