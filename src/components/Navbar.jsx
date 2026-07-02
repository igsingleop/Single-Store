import { useState, useEffect, useRef } from 'react';
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
  user = null,
  posters = [],
  onSelectPoster
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [inputValue, setInputValue] = useState(searchQuery);
  const [showDropdown, setShowDropdown] = useState(false);

  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setSearchQuery(inputValue);
      setShowDropdown(false);
    }
  };

  const handleSearchSubmit = () => {
    setSearchQuery(inputValue);
    setShowDropdown(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutsideDesktop = desktopSearchRef.current && !desktopSearchRef.current.contains(event.target);
      const clickedOutsideMobile = mobileSearchRef.current && !mobileSearchRef.current.contains(event.target);
      if (clickedOutsideDesktop && clickedOutsideMobile) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDownGlobal = (e) => {
      if (e.key === 'Escape') {
        setShowDropdown(false);
      }
    };
    window.addEventListener('keydown', handleKeyDownGlobal);
    return () => window.removeEventListener('keydown', handleKeyDownGlobal);
  }, []);

  const suggestions = (posters || []).filter(poster => {
    if (!inputValue || inputValue.trim() === '') return false;
    const query = inputValue.toLowerCase();
    return (
      (poster.title && poster.title.toLowerCase().includes(query)) ||
      (poster.category && poster.category.toLowerCase().includes(query)) ||
      (poster.description && poster.description.toLowerCase().includes(query))
    );
  }).slice(0, 5);

  const handleSelectSuggestion = (poster) => {
    if (onSelectPoster) {
      onSelectPoster(poster.id);
    }
    setShowDropdown(false);
    setInputValue(poster.title);
  };

  const renderSuggestionsDropdown = (isMobile = false) => {
    if (!showDropdown || !inputValue || inputValue.trim() === '') return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={`absolute right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-xl transition-all ${
            isMobile ? 'top-full w-48 sm:w-56' : 'top-full left-0'
          }`}
        >
          {suggestions.length > 0 ? (
            <div className="py-1">
              <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-zinc-150 dark:border-zinc-800">
                Suggestions
              </div>
              <ul className="max-h-[240px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {suggestions.map((poster) => (
                  <li key={poster.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectSuggestion(poster)}
                      className="w-full px-3 py-2 flex items-center space-x-2.5 text-left hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors duration-150 group"
                    >
                      <img
                        src={poster.image || 'https://via.placeholder.com/60?text=Poster'}
                        alt={poster.title}
                        className="w-7 h-9 object-cover rounded border border-zinc-200/50 dark:border-zinc-800 bg-zinc-50"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-outfit text-xs font-bold text-zinc-850 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {poster.title}
                        </h4>
                        <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500">
                          {poster.category}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-inter text-[10px] font-extrabold text-zinc-900 dark:text-white block">
                          Rs. {parseFloat(poster.discountPrice || poster.price).toFixed(2)}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="p-1.5 border-t border-zinc-150 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/20">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery(inputValue);
                    setShowDropdown(false);
                  }}
                  className="w-full py-1 text-center text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
                >
                  See all results
                </button>
              </div>
            </div>
          ) : (
            <div className="px-3 py-4 text-center text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
              No matching posters
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

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
      <motion.a
        href="/"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center space-x-2 cursor-pointer"
        onClick={(e) => {
          e.preventDefault();
          setView('home');
        }}
      >
        <span className="font-outfit text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
          Single Store.
        </span>
      </motion.a>

      {/* Navigation Links - Desktop */}
      <div className="hidden md:flex items-center space-x-8">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setView('home');
          }}
          className={`font-medium transition-colors ${
            currentView === 'home'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-zinc-600 dark:text-zinc-300 hover:text-blue-500'
          }`}
        >
          Home
        </a>
        <a
          href="/shop"
          onClick={(e) => {
            e.preventDefault();
            setView('shop');
          }}
          className={`font-medium transition-colors ${
            currentView === 'shop'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-zinc-600 dark:text-zinc-300 hover:text-blue-500'
          }`}
        >
          Shop All
        </a>
        <a
          href="/faq"
          onClick={(e) => {
            e.preventDefault();
            setView('faq');
          }}
          className={`font-medium transition-colors ${
            currentView === 'faq'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-zinc-600 dark:text-zinc-300 hover:text-blue-500'
          }`}
        >
          FAQs
        </a>
      </div>

      {/* Search Input - Desktop */}
      <div ref={desktopSearchRef} className="hidden lg:flex items-center relative max-w-xs w-full mx-4">
        <Search 
          className="absolute left-3 w-4 h-4 text-zinc-400 cursor-pointer hover:text-blue-500 transition-colors" 
          onClick={handleSearchSubmit}
        />
        <input
          type="text"
          placeholder="Search posters..."
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-4 py-2 text-sm rounded-full bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all text-zinc-800 dark:text-zinc-100"
        />
        {renderSuggestionsDropdown(false)}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        {/* Search Toggle for mobile */}
        <div ref={mobileSearchRef} className="lg:hidden relative mr-1">
          <input
            type="text"
            placeholder="Search..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            className="w-28 sm:w-40 pl-8 pr-2 py-1.5 text-xs rounded-full bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-100"
          />
          <Search 
            className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-400 cursor-pointer hover:text-blue-500 transition-colors" 
            onClick={handleSearchSubmit}
          />
          {renderSuggestionsDropdown(true)}
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
        <motion.a
          href="/wishlist"
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.preventDefault();
            setView(currentView === 'wishlist' ? 'home' : 'wishlist');
          }}
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
        </motion.a>

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
        <motion.a
          href={user ? "/account" : "/login"}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.preventDefault();
            const isAlreadyOnProfile = currentView === 'account' || currentView === 'login';
            setView(isAlreadyOnProfile ? 'home' : (user ? 'account' : 'login'));
          }}
          className={`hidden md:flex p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-neo-out hover:shadow-neo-in transition-all duration-300 ${
            currentView === 'account' || currentView === 'login' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-200'
          }`}
          aria-label="Profile"
        >
          <User className="w-5 h-5" />
        </motion.a>

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
            <a
              href="/"
              onClick={(e) => { e.preventDefault(); setView('home'); setIsMobileMenuOpen(false); }}
              className={`text-left py-2 font-medium border-b border-zinc-100 dark:border-zinc-800 ${
                currentView === 'home' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'
              }`}
            >
              Home
            </a>
            <a
              href="/shop"
              onClick={(e) => { e.preventDefault(); setView('shop'); setIsMobileMenuOpen(false); }}
              className={`text-left py-2 font-medium border-b border-zinc-100 dark:border-zinc-800 ${
                currentView === 'shop' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'
              }`}
            >
              Shop All
            </a>
            <a
              href="/faq"
              onClick={(e) => { e.preventDefault(); setView('faq'); setIsMobileMenuOpen(false); }}
              className={`text-left py-2 font-medium border-b border-zinc-100 dark:border-zinc-800 ${
                currentView === 'faq' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'
              }`}
            >
              FAQs
            </a>
            <a
              href="/wishlist"
              onClick={(e) => { e.preventDefault(); setView(currentView === 'wishlist' ? 'home' : 'wishlist'); setIsMobileMenuOpen(false); }}
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
            </a>
            <a
              href={user ? '/account' : '/login'}
              onClick={(e) => {
                e.preventDefault();
                const isAlreadyOnProfile = currentView === 'account' || currentView === 'login';
                setView(isAlreadyOnProfile ? 'home' : (user ? 'account' : 'login'));
                setIsMobileMenuOpen(false);
              }}
              className={`text-left py-2 font-medium border-b border-zinc-100 dark:border-zinc-800 ${
                currentView === 'account' || currentView === 'login' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'
              }`}
            >
              {user ? 'My Profile' : 'Login / Account'}
            </a>
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
