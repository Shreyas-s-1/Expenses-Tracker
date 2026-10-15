import { useNavigate } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const displayName = user?.name || 'Personal workspace';

    return (
        <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
                <button className="flex items-center gap-3 text-left" onClick={() => navigate('/')} aria-label="Go to dashboard">
                    <span className="brand-mark" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none"><path d="M4 17.5 9 12l3.5 3.5L20 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M15.5 7H20v4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    <span>
                        <span className="block text-lg font-bold tracking-tight text-slate-900">Extra Penny</span>
                        <span className="block text-[11px] font-medium tracking-wide text-slate-500">PERSONAL FINANCE</span>
                    </span>
                </button>
                <div className="flex items-center gap-3">
                    <span className="hidden text-sm text-slate-500 sm:block">{displayName}</span>
                    {user ? (
                        <button onClick={onLogout} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50">Sign out</button>
                    ) : (
                        <span className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> =
                        </span>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;