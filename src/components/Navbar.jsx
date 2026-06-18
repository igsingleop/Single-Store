import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, ShoppingBag, Search, Menu, X, Heart, User } from 'lucide-react';

export default function Navbar({
  currentView,
  setView,
  theme,
  toggleTheme,
  cartCount,
  toggleCart,
  searchQuery,
  setSearchQuery,
  wishlistCount,
  user = null
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial scroll position
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`sticky top-0 z-40 w-full glass-header flex items-center justify-between shadow-sm px-4 md:px-6 ${
      isScrolled ? 'py-2 md:py-2.5 scrolled' : 'py-3.5 md:py-4.5'
    }`}>
      {/* Brand Logo */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center space-x-2 cursor-pointer"
        onClick={() => setView('home')}
      >
        <span className="font-outfit text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
          Single Store.
        </span>
      </motion.div>

      {/* Navigation Links - Desktop */}
      <div className="hidden md:flex items-center space-x-8">
        <button
          onClick={() => setView('home')}
          className={`font-medium transition-colors ${
            currentView === 'home'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-zinc-600 dark:text-zinc-300 hover:text-blue-500'
          }`}
        >
          Home
        </button>
        <button
          onClick={() => setView('shop')}
          className={`font-medium transition-colors ${
            currentView === 'shop'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-zinc-600 dark:text-zinc-300 hover:text-blue-500'
          }`}
        >
          Shop All
        </button>

      </div>

      {/* Search Input - Desktop */}
      <div className="hidden lg:flex items-center relative max-w-xs w-full mx-4">
        <Search className="absolute left-3 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search posters..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm rounded-full bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all text-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        {/* Search Toggle for mobile */}
        <div className="lg:hidden relative mr-1">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-28 sm:w-40 pl-8 pr-2 py-1.5 text-xs rounded-full bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-100"
          />
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-400" />
        </div>

        {/* Theme Switcher Button (Neomorphic) */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="hidden md:flex p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-neo-out hover:shadow-neo-in transition-all duration-300"
          aria-label="Toggle theme"
        >
          <motion.div
            animate={{ rotate: theme === 'dark' ? 180 : 0 }}
            transition={{ duration: 0.5, type: 'spring' }}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
          </motion.div>
        </motion.button>

        {/* Wishlist Trigger (Neomorphic + Badge) */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setView(currentView === 'wishlist' ? 'home' : 'wishlist')}
          className={`hidden md:flex p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-neo-out hover:shadow-neo-in relative transition-all duration-300 ${
            currentView === 'wishlist' ? 'text-rose-500' : 'text-zinc-700 dark:text-zinc-200'
          }`}
          aria-label="Wishlist"
        >
          <Heart className={`w-5 h-5 ${currentView === 'wishlist' ? 'fill-rose-500 text-rose-500' : ''}`} />
          <AnimatePresence>
            {wishlistCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md"
              >
                {wishlistCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Cart Trigger (Neomorphic + Badge) */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={toggleCart}
          className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-neo-out hover:shadow-neo-in relative transition-all duration-300"
          aria-label="Shopping Cart"
        >
          <ShoppingBag className="w-5 h-5" />
          <AnimatePresence>
            {cartCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md"
              >
                {cartCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Profile Trigger (Neomorphic) */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const isAlreadyOnProfile = currentView === 'account' || currentView === 'login';
            setView(isAlreadyOnProfile ? 'home' : (user ? 'account' : 'login'));
          }}
          className={`hidden md:flex p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-neo-out hover:shadow-neo-in transition-all duration-300 ${
            currentView === 'account' || currentView === 'login' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-200'
          }`}
          aria-label="Profile"
        >
          <User className="w-5 h-5" />
        </motion.button>

        {/* Mobile menu toggle */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2.5 md:hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-neo-out transition-all"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </motion.button>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 w-full glass-panel border-b p-6 flex flex-col space-y-4 md:hidden shadow-lg"
          >
            <button
              onClick={() => { setView('home'); setIsMobileMenuOpen(false); }}
              className={`text-left py-2 font-medium border-b border-zinc-100 dark:border-zinc-800 ${
                currentView === 'home' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => { setView('shop'); setIsMobileMenuOpen(false); }}
              className={`text-left py-2 font-medium border-b border-zinc-100 dark:border-zinc-800 ${
                currentView === 'shop' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'
              }`}
            >
              Shop All
            </button>
            <button
              onClick={() => { setView(currentView === 'wishlist' ? 'home' : 'wishlist'); setIsMobileMenuOpen(false); }}
              className={`text-left py-2 font-medium border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between ${
                currentView === 'wishlist' ? 'text-rose-500' : 'text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <span>Wishlist</span>
              {wishlistCount > 0 && (
                <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] rounded-full font-bold">
                  {wishlistCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                const isAlreadyOnProfile = currentView === 'account' || currentView === 'login';
                setView(isAlreadyOnProfile ? 'home' : (user ? 'account' : 'login'));
                setIsMobileMenuOpen(false);
              }}
              className={`text-left py-2 font-medium border-b border-zinc-100 dark:border-zinc-800 ${
                currentView === 'account' || currentView === 'login' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'
              }`}
            >
              {user ? 'My Profile' : 'Login / Account'}
            </button>
            <div className="flex items-center justify-between py-2.5 border-b border-zinc-100 dark:border-zinc-800">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Theme</span>
              <button
                onClick={toggleTheme}
                className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-neo-out hover:shadow-neo-in transition-colors duration-300"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold">Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-semibold">Dark Mode</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
