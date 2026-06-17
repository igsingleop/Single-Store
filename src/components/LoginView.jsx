import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff, Sparkles, User } from 'lucide-react';
import { loginWithEmail, registerWithEmail, loginWithGoogle } from '../utils/auth';
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
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          throw new Error("Please enter your display name.");
        }
        const user = await registerWithEmail(name, email, password);
        setSuccessMsg('Account created successfully! Welcome to Single Store.');
        if (onLoginSuccess) onLoginSuccess(user);
        setTimeout(() => setView('home'), 1000);
      } else {
        // Sign in mode: check if credentials match any admin first
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
        setTimeout(() => setView('home'), 800);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      setSuccessMsg('Successfully signed in with Google!');
      if (onLoginSuccess) onLoginSuccess(user);
      setTimeout(() => setView('home'), 800);
    } catch (error) {
      console.error(error);
      setErrorMsg(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-6 py-12 relative">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full bg-blue-500/10 dark:bg-blue-600/5 blur-2xl animate-blob-1" />
        <div className="absolute -bottom-10 -right-10 w-64 h-64 rounded-full bg-indigo-500/10 dark:bg-indigo-600/5 blur-2xl animate-blob-2" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full glass-panel p-8 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-2xl relative z-10"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Premium Art Gallery</span>
          </div>
          <h2 className="font-outfit text-3xl font-extrabold text-zinc-900 dark:text-white">
            {mode === 'signin' ? 'Welcome Back.' : 'Join Single Store.'}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {mode === 'signin' 
              ? 'Sign in to access your posters, wishlist, and profile orders' 
              : 'Create an account to track shipments, save custom sizes, and seed wishlists'}
          </p>
        </div>

        <div className="flex bg-zinc-150/50 dark:bg-zinc-900/40 rounded-2xl p-1 mb-6 border border-zinc-200/30 dark:border-zinc-800/40">
          <button
            onClick={() => {
              setMode('signin');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
              mode === 'signin'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-zinc-550 hover:text-zinc-700 dark:hover:text-zinc-350'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setMode('signup');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
              mode === 'signup'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-zinc-550 hover:text-zinc-700 dark:hover:text-zinc-350'
            }`}
          >
            Create Account
          </button>
        </div>

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

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-1.5"
            >
              <label className="text-[10px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-widest block">
                Full Name
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-4.5 h-4.5 text-zinc-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all font-medium"
                />
              </div>
            </motion.div>
          )}

          <div>
            <label className="text-[10px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-widest block mb-1.5">
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
              <label className="text-[10px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-widest block">
                Password
              </label>
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
                className="absolute right-3 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25 transition-all mt-6 ${
              loading ? 'opacity-80 cursor-not-allowed' : ''
            }`}
          >
            <span>{loading ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </motion.button>
        </form>

        <div className="relative flex items-center justify-center my-6">
          <div className="border-t border-zinc-200/60 dark:border-zinc-800/80 w-full" />
          <span className="absolute bg-[#eff2f7] dark:bg-[#1b1c20] px-3 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
            Or continue with
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-bold text-xs flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300"
        >
          <svg className="w-4 h-4 mr-2.5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.53 14.98 1 12 1 7.35 1 3.37 3.68 1.43 7.62l3.83 2.97C6.18 7.37 8.87 5.04 12 5.04z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.44-1.09 2.67-2.33 3.51l3.63 2.82c2.13-1.97 3.36-4.87 3.36-8.48z"
            />
            <path
              fill="#FBBC05"
              d="M5.26 14.25c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3L1.43 6.68C.52 8.49 0 10.19 0 12s.52 3.51 1.43 5.32l3.83-3.07z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.63-2.82c-1.01.68-2.31 1.09-3.96 1.09-3.13 0-5.82-2.33-6.77-5.55L1.77 15.78C3.71 19.82 7.69 23 12 23z"
            />
          </svg>
          <span>Sign In with Google</span>
        </motion.button>
      </motion.div>
    </div>
  );
}
