import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, ShoppingBag, User, Search, Menu, X } from 'lucide-react';

export default function Navbar({
  currentView,
  setView,
  theme,
  toggleTheme,
  cartCount,
  toggleCart,
  searchQuery,
  setSearchQuery
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b px-6 py-4 flex items-center justify-between shadow-sm">
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
        <button
          onClick={() => setView('account')}
          className={`font-medium transition-colors ${
            currentView === 'account'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-zinc-600 dark:text-zinc-300 hover:text-blue-500'
          }`}
        >
          My Account
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
          className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-neo-out hover:shadow-neo-in transition-all duration-300"
          aria-label="Toggle theme"
        >
          <motion.div
            animate={{ rotate: theme === 'dark' ? 180 : 0 }}
            transition={{ duration: 0.5, type: 'spring' }}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
          </motion.div>
        </motion.button>

        {/* Account Button (Neomorphic) */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setView('account')}
          className={`p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-neo-out hover:shadow-neo-in transition-all duration-300 ${
            currentView === 'account' ? 'text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20' : 'text-zinc-700 dark:text-zinc-200'
          }`}
          aria-label="Account"
        >
          <User className="w-5 h-5" />
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
            className="absolute top-[73px] left-0 w-full glass-panel border-b p-6 flex flex-col space-y-4 md:hidden shadow-lg"
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
              onClick={() => { setView('account'); setIsMobileMenuOpen(false); }}
              className={`text-left py-2 font-medium border-b border-zinc-100 dark:border-zinc-800 ${
                currentView === 'account' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'
              }`}
            >
              My Account
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
