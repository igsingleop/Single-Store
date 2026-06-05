import React, { useState, useEffect } from 'react';
import { Sun, Moon, ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';
import AuthPage from './components/admin/AuthPage';
import AdminPanel from './components/admin/AdminPanel';

export default function AdminApp() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    // Theme state
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('singlestore_theme');
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    // Check login session on load
    useEffect(() => {
        const savedSession = localStorage.getItem('SINGLESTORE_ADMIN_SESSION');
        if (savedSession) {
            setSession(JSON.parse(savedSession));
        }
        setLoading(false);
    }, []);

    // Sync theme
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('singlestore_theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const handleLoginSuccess = (userSession) => {
        setSession(userSession);
    };

    const handleLogout = () => {
        localStorage.removeItem('SINGLESTORE_ADMIN_SESSION');
        setSession(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 flex items-center justify-center text-sm font-bold text-zinc-500">
                Verifying Session...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-zinc-100 to-blue-100/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-indigo-950/20 text-zinc-800 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-300">

            {/* Admin Header */}
            {session && (
                <header className="sticky top-0 z-40 w-full glass-panel border-b px-6 py-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center space-x-2.5">
                        <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span className="font-outfit text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                            Single Store Admin.
                        </span>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Theme switcher */}
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-neo-out hover:shadow-neo-in transition-all"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                        </button>

                        {/* Back to Storefront link */}
                        <a
                            href="/"
                            className="text-xs font-bold bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 px-4 py-2.5 rounded-xl hover:shadow-neo-in shadow-neo-out flex items-center space-x-1.5 transition-all"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Back to Store</span>
                        </a>
                    </div>
                </header>
            )}

            {/* Main Content routing */}
            <main className="flex-1">
                {session ? (
                    <AdminPanel session={session} onLogout={handleLogout} />
                ) : (
                    <AuthPage onLoginSuccess={handleLoginSuccess} />
                )}
            </main>

            {/* Footer */}
            <footer className="py-6 border-t border-zinc-200/50 dark:border-zinc-800/50 text-center text-[10px] text-zinc-400 dark:text-zinc-500">
                &copy; {new Date().getFullYear()} SingleStore Control Centre. Authorized Access Only.
            </footer>
        </div>
    );
}
