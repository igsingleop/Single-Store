import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, ArrowLeft, ShieldCheck, HelpCircle, AlertTriangle } from 'lucide-react';
import { getAdmins, registerAdmin } from '../utils/db';

export default function AuthPage({ onLoginSuccess }) {
  const [authTab, setAuthTab] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const users = await getAdmins();

    if (authTab === 'signup') {
      // Validate sign up
      if (!name || !email || !password || !confirmPassword) {
        setErrorMsg('Please fill in all fields.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }

      // Check if user already exists
      const userExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (userExists) {
        setErrorMsg('User with this email already exists.');
        return;
      }

      // Save user
      const newUser = { name, email: email.toLowerCase(), password };
      await registerAdmin(newUser);

      setSuccessMsg('Account registered successfully! Please log in.');
      setAuthTab('login');
      // Reset fields
      setName('');
      setPassword('');
      setConfirmPassword('');
    } else {
      // Validate login
      if (!email || !password) {
        setErrorMsg('Please enter both email and password.');
        return;
      }

      const matchUser = users.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (matchUser) {
        // Instantiate session
        const session = { email: matchUser.email, name: matchUser.name, time: Date.now() };
        localStorage.setItem('SINGLESTORE_ADMIN_SESSION', JSON.stringify(session));
        onLoginSuccess(session);
      } else {
        setErrorMsg('Invalid email or password.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-zinc-100 to-blue-100/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-indigo-950/20 text-zinc-800 dark:text-zinc-100 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      
      {/* Background Animated Gradient Blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            x: [0, 40, -40, 0],
            y: [0, -50, 30, 0],
            scale: [1, 1.15, 0.9, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-10 left-10 w-72 h-72 rounded-full bg-blue-500/10 dark:bg-blue-600/5 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -50, 50, 0],
            y: [0, 40, -40, 0],
            scale: [1, 0.85, 1.1, 1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-600/5 blur-3xl"
        />
      </div>

      {/* Main Auth Container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/20 dark:border-white/5 shadow-2xl relative z-10"
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <span className="font-outfit text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Single Store.
          </span>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-bold mt-1.5">
            Admin Portal Control
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-6">
          <button
            onClick={() => { setAuthTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${
              authTab === 'login'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-400 dark:text-zinc-500'
            }`}
          >
            Login Portal
          </button>
          <button
            onClick={() => { setAuthTab('signup'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${
              authTab === 'signup'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-400 dark:text-zinc-500'
            }`}
          >
            Register Admin
          </button>
        </div>

        {/* Error / Success Notifications */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl mb-4 border border-red-200 dark:border-red-900/50 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-xl mb-4 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Form */}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {authTab === 'signup' && (
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                Full Name
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4 h-4 text-zinc-400" />
              <input
                type="email"
                required
                placeholder="admin@singlestore.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-zinc-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {authTab === 'signup' && (
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* Action button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25 transition-all mt-6"
          >
            <span>{authTab === 'login' ? 'Access Panel' : 'Register Admin Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </form>

        {/* Demo Account Indicator */}
        {authTab === 'login' && (
          <div className="mt-6 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 text-[10px] text-zinc-400 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-500 shrink-0" />
            <span>
              Demo login credentials: <strong className="text-zinc-700 dark:text-zinc-300">admin@singlestore.in</strong> / <strong className="text-zinc-700 dark:text-zinc-300">admin123</strong>
            </span>
          </div>
        )}

        <hr className="my-6 border-zinc-200 dark:border-zinc-800" />

        {/* Return to Shop link */}
        <div className="text-center">
          <a
            href="http://localhost:5173/"
            className="inline-flex items-center space-x-1.5 text-xs text-zinc-400 dark:text-zinc-500 hover:text-blue-500 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Storefront</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
}


