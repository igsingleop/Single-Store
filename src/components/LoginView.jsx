import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff, Sparkles, HelpCircle } from 'lucide-react';
import { loginWithEmail, registerWithEmail, loginWithGoogle } from '../utils/auth';
import { isFirebaseConfigured } from '../utils/firebase';
import { getAdmins } from '../utils/db';

// Helper to convert Firebase auth errors into user-friendly messages
const getFriendlyErrorMessage = (error) => {
  if (!error) return 'Authentication failed. Please check your credentials.';

  const code = error.code || '';
  const message = error.message || '';

  // Check code first
  if (code) {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Incorrect email or password. Please try again.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/too-many-requests':
        return 'Too many unsuccessful login attempts. Please try again later.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please sign in instead.';
      case 'auth/weak-password':
        return 'The password is too weak. Please use at least 6 characters.';
      case 'auth/popup-closed-by-user':
        return 'The sign-in window was closed before completing authentication.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again.';
      case 'auth/unauthorized-domain':
        return `This domain (${window.location.hostname}) is not authorized in Firebase. Please add it to your Firebase Console.`;
      default:
        break;
    }
  }

  // If code wasn't matched but message contains the code pattern
  if (typeof message === 'string') {
    if (message.includes('auth/invalid-credential') || 
        message.includes('auth/wrong-password') || 
        message.includes('auth/user-not-found')) {
      return 'Incorrect email or password. Please try again.';
    }
    if (message.includes('auth/invalid-email')) {
      return 'Please enter a valid email address.';
    }
    if (message.includes('auth/user-disabled')) {
      return 'This account has been disabled. Please contact support.';
    }
    if (message.includes('auth/too-many-requests')) {
      return 'Too many unsuccessful login attempts. Please try again later.';
    }
    if (message.includes('auth/email-already-in-use')) {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (message.includes('auth/weak-password')) {
      return 'The password is too weak. Please use at least 6 characters.';
    }
    if (message.includes('auth/popup-closed-by-user')) {
      return 'The sign-in window was closed before completing authentication.';
    }
    if (message.includes('auth/network-request-failed')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    
    // Clean up Firebase: Error (auth/xxx) messages into "xxx"
    if (message.startsWith('Firebase: Error (')) {
      const match = message.match(/\(([^)]+)\)/);
      if (match && match[1]) {
        return match[1].replace('auth/', '').replace(/-/g, ' ');
      }
    }
  }

  return error.message || 'Authentication failed. Please check your credentials.';
};

export default function LoginView({ setView, onLoginSuccess, onAdminLogin }) {
  const [authTab, setAuthTab] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, text: '', color: 'bg-zinc-200 dark:bg-zinc-800' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    
    switch (score) {
      case 1: return { score: 20, text: 'Very Weak', color: 'bg-red-500' };
      case 2: return { score: 40, text: 'Weak', color: 'bg-orange-500' };
      case 3: return { score: 60, text: 'Fair', color: 'bg-yellow-500' };
      case 4: return { score: 80, text: 'Good', color: 'bg-blue-500' };
      case 5: return { score: 100, text: 'Strong', color: 'bg-emerald-500' };
      default: return { score: 20, text: 'Very Weak', color: 'bg-red-500' };
    }
  };

  const strength = getPasswordStrength(password);

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      setSuccessMsg('Google sign-in successful!');
      if (onLoginSuccess) onLoginSuccess(user);
      setTimeout(() => setView('account'), 800);
    } catch (error) {
      console.error(error);
      setErrorMsg(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (authTab === 'signup') {
        if (!name.trim()) throw new Error('Please enter your name.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');
        if (password !== confirmPassword) throw new Error('Passwords do not match.');

        const user = await registerWithEmail(name, email, password);
        setSuccessMsg('Account created successfully! Welcome.');
        if (onLoginSuccess) onLoginSuccess(user);
        setTimeout(() => setView('account'), 800);
      } else {
        // Check if credentials match any admin
        const admins = await getAdmins();
        const matchAdmin = admins.find(
          u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
        );
        if (matchAdmin) {
          const session = { email: matchAdmin.email, name: matchAdmin.name, time: Date.now() };
          localStorage.setItem('SINGLESTORE_ADMIN_SESSION', JSON.stringify(session));
          setSuccessMsg('Admin login successful! Redirecting to admin panel...');
          if (onAdminLogin) {
            onAdminLogin(session);
          }
          return;
        }

        const user = await loginWithEmail(email, password);
        setSuccessMsg('Successfully signed in!');
        if (onLoginSuccess) onLoginSuccess(user);
        setTimeout(() => setView('account'), 800);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-6 py-12 relative">
      {/* Background Blobs for Premium Aesthetic */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            x: [0, 20, -20, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.1, 0.9, 1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-10 -left-10 w-48 h-48 rounded-full bg-blue-500/10 dark:bg-blue-600/5 blur-2xl"
        />
        <motion.div
          animate={{
            x: [0, -20, 20, 0],
            y: [0, 30, -20, 0],
            scale: [1, 0.9, 1.1, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-10 -right-10 w-64 h-64 rounded-full bg-indigo-500/10 dark:bg-indigo-600/5 blur-2xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full glass-panel p-8 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-2xl relative z-10"
      >
        {/* Brand/Heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Store Customer Access</span>
          </div>
          <h2 className="font-outfit text-3xl font-extrabold text-zinc-950 dark:text-white">
            Welcome to SingleStore
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Access your orders, track shipments, and check out faster
          </p>
        </div>

        {/* Form Tab Toggles */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-6">
          <button
            onClick={() => { setAuthTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${
              authTab === 'login'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setAuthTab('signup'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${
              authTab === 'signup'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Notifications */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-2xl mb-5 border border-rose-200/50 dark:border-rose-900/40 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-2xl mb-5 border border-emerald-200/50 dark:border-emerald-900/40 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authTab === 'signup' && (
            <div>
              <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block mb-1.5">
                Full Name
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-4.5 h-4.5 text-zinc-400" />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block mb-1.5">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4.5 h-4.5 text-zinc-400" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block">
                Password
              </label>
              {authTab === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    if (isFirebaseConfigured) {
                      alert("Password reset instruction has been sent to your email (if configured in Firebase).");
                    } else {
                      alert("Forgot password simulation: Check console. Standard recovery simulated.");
                    }
                  }}
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4.5 h-4.5 text-zinc-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Strength Meter */}
            {authTab === 'signup' && password.length > 0 && (
              <div className="mt-2.5">
                <div className="flex items-center justify-between text-[9px] font-bold text-zinc-400 mb-1">
                  <span>Password Strength:</span>
                  <span style={{ color: strength.color.includes('bg-') ? undefined : strength.color }} className="font-extrabold uppercase">
                    {strength.text}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-850 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${strength.score}%` }}
                    className={`h-full ${strength.color} transition-all duration-300`}
                  />
                </div>
              </div>
            )}
          </div>

          {authTab === 'signup' && (
            <div>
              <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block mb-1.5">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4.5 h-4.5 text-zinc-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Action button */}
          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25 transition-all mt-6 ${
              loading ? 'opacity-80 cursor-not-allowed' : ''
            }`}
          >
            <span>{loading ? 'Authenticating...' : authTab === 'login' ? 'Sign In' : 'Create Account'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-250 dark:border-zinc-800"></div>
          </div>
          <span className="relative px-3 bg-white dark:bg-zinc-900 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Or Continue With
          </span>
        </div>

        {/* Google Sign-in */}
        <motion.button
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          onClick={handleGoogleSignIn}
          disabled={loading}
          type="button"
          className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 font-bold text-sm flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          <span>Google Sign In</span>
        </motion.button>

        {/* Demo Indicator */}
        {!isFirebaseConfigured && (
          <div className="mt-6 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-[10px] text-zinc-500 flex items-start gap-2.5 leading-relaxed">
            <HelpCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-zinc-700 dark:text-zinc-300 block mb-0.5">Simulated Auth Mode Active</span>
              Firebase credentials are not set. Clicking Google Sign In will automatically log you in as <strong className="text-blue-600 dark:text-blue-400">Alex Jones (alex.jones@gmail.com)</strong>. Or, create a simulated credentials account above.
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
