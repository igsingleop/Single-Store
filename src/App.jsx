import { useState, useEffect, lazy, Suspense } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import {
  getPosters,
  getCart,
  saveCart,
  initDB,
  getCoupons,
  getEstimatedDeliveryDate,
  getBanners
} from './utils/db';
import { subscribeAuth, logout } from './utils/auth';



import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ShopView from './components/ShopView';
import WishlistView from './components/WishlistView';
import ProductDetailModal from './components/ProductDetailModal';
import CartDrawer from './components/CartDrawer';
import PosterCard from './components/PosterCard';
import { ArrowRight, ShieldCheck, Mail, ShieldAlert, ArrowLeft, Sun, Moon, Calendar } from 'lucide-react';

// Lazy-loaded components for optimal bundle size and CPU execution time
const CheckoutView = lazy(() => import('./components/CheckoutView'));
const LoginView = lazy(() => import('./components/LoginView'));
const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));
const AccountView = lazy(() => import('./components/AccountView'));
const HelpFaqView = lazy(() => import('./components/HelpFaqView'));

export default function App() {
  const [currentView, setView] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    const validViews = ['home', 'shop', 'wishlist', 'checkout', 'login', 'account', 'faq', 'admin'];
    return validViews.includes(hash) ? hash : 'home';
  });
  const [faqCategory, setFaqCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosterId, setSelectedPosterId] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Auth User State
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('SINGLESTORE_CUSTOMER_SESSION');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Admin session state
  const [adminSession, setAdminSession] = useState(() => {
    try {
      const saved = localStorage.getItem('SINGLESTORE_ADMIN_SESSION');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Core reactive data states
  const [posters, setPosters] = useState([]);
  const [banners, setBanners] = useState([]);
  const [cart, setCart] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Wishlist state
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('SINGLESTORE_WISHLIST');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Theme state
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('singlestore_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Toast confirmation state
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  // Completed order dialog state
  const [completedOrder, setCompletedOrder] = useState(null);

  // Initialize DB and load data
  useEffect(() => {
    const loadInitialData = async () => {
      await initDB();
      const dbPosters = await getPosters();
      setPosters(dbPosters);
      setCart(getCart());
      const dbCoupons = await getCoupons();
      setCoupons(dbCoupons);
      const dbBanners = await getBanners();
      setBanners(dbBanners);
    };
    loadInitialData();

    const handleDbUpdate = async () => {
      const dbPosters = await getPosters();
      setPosters(dbPosters);
      setCart(getCart());
      const dbCoupons = await getCoupons();
      setCoupons(dbCoupons);
      const dbBanners = await getBanners();
      setBanners(dbBanners);
    };
    const handleStorageChange = (e) => {
      if (
        e.key === 'SINGLESTORE_POSTERS' ||
        e.key === 'SINGLESTORE_ORDERS' ||
        e.key === 'SINGLESTORE_COUPONS' ||
        e.key === 'SINGLESTORE_BANNERS'
      ) {
        handleDbUpdate();
      }
    };
    window.addEventListener('singlestore_db_update', handleDbUpdate);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('singlestore_db_update', handleDbUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Listen to customer auth changes reactively
  useEffect(() => {
    const unsubscribe = subscribeAuth((updatedUser) => {
      setUser(updatedUser);
    });
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Monitor applied coupon validity relative to cart subtotal updates
  useEffect(() => {
    if (appliedCoupon) {
      const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.price) * (item.quantity || 1), 0);
      if (subtotal < appliedCoupon.minAmount) {
        setTimeout(() => {
          setAppliedCoupon(null);
          setToastMessage(`Coupon ${appliedCoupon.code} removed: subtotal fell below Rs. ${appliedCoupon.minAmount}`);
          setToastVisible(true);
        }, 0);
        const timer = setTimeout(() => {
          setToastVisible(false);
        }, 3500);
        return () => clearTimeout(timer);
      }
    }
  }, [cart, appliedCoupon]);

  // Synchronize state when URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validViews = ['home', 'shop', 'wishlist', 'checkout', 'login', 'account', 'faq', 'admin'];
      if (validViews.includes(hash)) {
        setView(hash);
      } else if (!hash) {
        setView('home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Synchronize URL hash when currentView state changes
  useEffect(() => {
    if (currentView) {
      window.location.hash = currentView;
    }
  }, [currentView]);

  // Theme synchronization effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('singlestore_theme', theme);
  }, [theme]);

  // Initial view is always 'home' on page load.

  // Auth routing redirect guards
  useEffect(() => {
    if (currentView === 'account' && !user) {
      setView('login');
    }
    if (currentView === 'admin' && !adminSession) {
      setView('login');
    }
    if (currentView === 'login' && user) {
      setView('account');
    }
  }, [currentView, user, adminSession]);

  // Wishlist synchronization effect
  useEffect(() => {
    localStorage.setItem('SINGLESTORE_WISHLIST', JSON.stringify(wishlist));
  }, [wishlist]);

  const handleToggleWishlist = (posterId) => {
    setWishlist(prev => {
      if (prev.includes(posterId)) {
        return prev.filter(id => id !== posterId);
      } else {
        return [...prev, posterId];
      }
    });
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('SINGLESTORE_ADMIN_SESSION');
    setAdminSession(null);
    setView('home');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleAddToCart = (posterId, size = '18x24"', frame = 'Print Only', quantity = 1) => {
    const poster = posters.find(p => String(p.id) === String(posterId));
    if (!poster) return;

    let basePrice = parseFloat(poster.price);
    if (poster.discountPrice != null && String(poster.discountPrice) !== '' && !isNaN(parseFloat(poster.discountPrice))) {
      basePrice = parseFloat(poster.discountPrice);
    }

    if (size.includes('24x36')) basePrice += 10;
    if (frame.includes('Frame')) basePrice += 15;

    const currentCart = getCart();
    const existingIndex = currentCart.findIndex(
      item => String(item.posterId) === String(posterId) && item.size === size && item.frame === frame
    );

    let updatedCart;
    if (existingIndex > -1) {
      updatedCart = [...currentCart];
      updatedCart[existingIndex].quantity = (updatedCart[existingIndex].quantity || 1) + quantity;
    } else {
      const newCartItem = {
        cartId: Date.now().toString() + Math.random().toString(36).substring(2, 6),
        posterId: poster.id,
        title: poster.title,
        image: poster.image,
        price: basePrice,
        size,
        frame,
        quantity
      };
      updatedCart = [...currentCart, newCartItem];
    }
    saveCart(updatedCart);
    setCart(updatedCart);

    // Show toast message
    setToastMessage(`${poster.title} added to cart!`);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 3000);

    // Open Cart drawer for visual confirmation
    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (cartId) => {
    const currentCart = getCart();
    const updatedCart = currentCart.filter(item => item.cartId !== cartId);
    saveCart(updatedCart);
    setCart(updatedCart);
  };

  const handleUpdateCartQuantity = (cartId, newQty) => {
    if (newQty <= 0) {
      handleRemoveFromCart(cartId);
    } else {
      const currentCart = getCart();
      const updatedCart = currentCart.map(item =>
        item.cartId === cartId ? { ...item, quantity: newQty } : item
      );
      saveCart(updatedCart);
      setCart(updatedCart);
    }
  };

  const handleCheckoutTrigger = () => {
    setView('checkout');
  };


  const handleOrderConfirmed = (order) => {
    setCompletedOrder(order);
    setView('home');
  };

  const formatPrice = (price) => {
    return 'Rs. ' + parseFloat(price).toFixed(2);
  };

  if (currentView === 'admin' && adminSession) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
        {/* Admin Header */}
        <header className="sticky top-0 z-40 w-full glass-panel border-b px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between shadow-sm gap-2">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-outfit text-sm sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent truncate">
              Single Store Admin.
            </span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
            {/* Theme switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-neo-out hover:shadow-neo-in transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />}
            </button>

            {/* Back to Store button */}
            <button
              onClick={() => {
                setView('home');
              }}
              className="text-[10px] sm:text-xs font-bold bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl hover:shadow-neo-in shadow-neo-out flex items-center space-x-1 sm:space-x-1.5 transition-all"
            >
              <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Back to Store</span>
            </button>
          </div>
        </header>

        {/* Main Content routing */}
        <main className="flex-1">
          <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-xs font-semibold text-zinc-500">Loading Admin Center...</div>}>
            <AdminPanel session={adminSession} onLogout={handleAdminLogout} onBackToStore={() => setView('home')} />
          </Suspense>
        </main>

        {/* Footer */}
        <footer className="py-6 border-t border-zinc-200/50 dark:border-zinc-800/50 text-center text-[10px] text-zinc-400 dark:text-zinc-500">
          &copy; {new Date().getFullYear()} SingleStore Control Centre. Authorized Access Only.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">

      {/* Announcement Marquee Bar */}
      <div className="w-full bg-blue-600 dark:bg-blue-900 text-white py-2 text-xs font-semibold overflow-hidden relative select-none">
        <div className="animate-marquee flex items-center space-x-12">
          <span>🎉 Buy 2 Get 1 Free. Use Code SS01. Free Shipping In India.</span>
          <span>🔥 Buy 2 Get 1 Free. Use Code SS01. Free Shipping In India.</span>
          <span>⚡ Buy 2 Get 1 Free. Use Code SS01. Free Shipping In India.</span>
          <span>🎉 Buy 2 Get 1 Free. Use Code SS01. Free Shipping In India.</span>
          <span>🔥 Buy 2 Get 1 Free. Use Code SS01. Free Shipping In India.</span>
          <span>⚡ Buy 2 Get 1 Free. Use Code SS01. Free Shipping In India.</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <Navbar
        currentView={currentView}
        setView={setView}
        theme={theme}
        toggleTheme={toggleTheme}
        cartCount={cart.reduce((sum, item) => sum + (item.quantity || 1), 0)}
        toggleCart={() => setIsCartOpen(!isCartOpen)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        wishlistCount={wishlist.length}
        user={user}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        <m.div
          key={currentView}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {currentView === 'home' && (
            <>
              <Hero setView={setView} banners={banners} />

              {/* Featured Collection Section */}
              <section className="max-w-7xl mx-auto px-6 py-16">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-3">
                  <div>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-1">
                      Curated Artwork
                    </span>
                    <h2 className="font-outfit text-3xl font-extrabold text-zinc-900 dark:text-white">
                      Trending Hot Releases
                    </h2>
                  </div>
                  <m.button
                    whileHover={{ x: 5 }}
                    onClick={() => setView('shop')}
                    className="flex items-center space-x-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span>Explore Catalog</span>
                    <ArrowRight className="w-4 h-4" />
                  </m.button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                  {posters.slice(0, 4).map(poster => (
                    <PosterCard
                      key={poster.id}
                      poster={poster}
                      onSelect={setSelectedPosterId}
                      onAddToCart={handleAddToCart}
                      isWishlisted={wishlist.includes(poster.id)}
                      onToggleWishlist={handleToggleWishlist}
                    />
                  ))}
                </div>

                <div className="text-center mt-12">
                  <m.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setView('shop')}
                    className="px-8 py-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 shadow-neo-out hover:shadow-neo-in font-bold text-sm transition-all"
                  >
                    Browse All Products
                  </m.button>
                </div>
              </section>
            </>
          )}

          {currentView === 'shop' && (
            <ShopView
              posters={posters}
              searchQuery={searchQuery}
              onSelectPoster={setSelectedPosterId}
              onAddToCart={handleAddToCart}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
            />
          )}

          {currentView === 'wishlist' && (
            <WishlistView
              posters={posters}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
              onSelectPoster={setSelectedPosterId}
              onAddToCart={handleAddToCart}
              setView={setView}
            />
          )}

          {currentView === 'checkout' && (
            <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-xs font-semibold text-zinc-500">Loading Checkout...</div>}>
              <CheckoutView
                key={user ? user.uid : 'guest'}
                cart={cart}
                setView={setView}
                onOrderConfirmed={handleOrderConfirmed}
                user={user}
                coupons={coupons}
                appliedCoupon={appliedCoupon}
                setAppliedCoupon={setAppliedCoupon}
              />
            </Suspense>
          )}

          {currentView === 'login' && (
            <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-xs font-semibold text-zinc-500">Loading Login...</div>}>
              <LoginView
                setView={setView}
                onLoginSuccess={setUser}
                onAdminLogin={(session) => {
                  setAdminSession(session);
                  setView('admin');
                }}
              />
            </Suspense>
          )}

          {currentView === 'account' && (
            <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-xs font-semibold text-zinc-500">Loading Account...</div>}>
              <AccountView
                setView={setView}
                user={user}
                posters={posters}
                onLogout={async () => {
                  await logout();
                  setUser(null);
                  setView('home');
                }}
              />
            </Suspense>
          )}

          {currentView === 'faq' && (
            <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-xs font-semibold text-zinc-500">Loading Help Center...</div>}>
              <HelpFaqView setView={setView} initialCategory={faqCategory} />
            </Suspense>
          )}
        </m.div>
      </main>

      {/* Cart Notification Toast */}
      <m.div
        animate={{
          y: toastVisible ? 0 : 150,
          opacity: toastVisible ? 1 : 0
        }}
        transition={{ type: 'spring', damping: 20 }}
        className="fixed bottom-6 left-6 z-50 glass-panel border border-blue-500/20 px-6 py-3.5 rounded-2xl flex items-center gap-3 shadow-xl max-w-sm text-sm"
      >
        <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{toastMessage}</span>
      </m.div>

      {/* Checkout Success Confirmation Modal */}
      <AnimatePresence>
        {completedOrder && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <m.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="w-full max-w-md glass-panel p-8 rounded-3xl text-center shadow-2xl border border-white/20 dark:border-white/5"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="font-outfit text-2xl font-extrabold text-zinc-900 dark:text-white mb-2">
                Order Confirmed!
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
                Thank you for shopping. Your transaction was processed successfully.
                Transaction Reference: <strong className="text-blue-600 dark:text-blue-400 font-mono text-xs">{completedOrder.id.substring(0, 14)}</strong>
              </p>

              <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-800 p-4 rounded-2xl mb-8 text-left text-xs space-y-2">
                <div className="flex justify-between text-zinc-500">
                  <span>Customer Name:</span>
                  <span className="font-bold text-zinc-800 dark:text-white">{completedOrder.customerName}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Shipping Address:</span>
                  <span className="font-bold text-zinc-800 dark:text-white truncate max-w-[200px]" title={completedOrder.shippingAddress}>{completedOrder.shippingAddress || completedOrder.customerEmail}</span>
                </div>
                <div className="flex justify-between text-zinc-500 pb-2 border-b border-zinc-200/50 dark:border-zinc-800/80">
                  <span>Grand Total:</span>
                  <span className="font-extrabold text-zinc-800 dark:text-white">{formatPrice(completedOrder.total)}</span>
                </div>
                <div className="flex justify-between text-zinc-500 pt-1 font-sans">
                  <span className="font-semibold flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-blue-500" /> Est. Delivery:</span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400">
                    {new Date(getEstimatedDeliveryDate(completedOrder.date)).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setCompletedOrder(null);
                    setView('home');
                  }}
                  className="w-full py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-250 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-sm border border-zinc-200 dark:border-zinc-700 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemove={handleRemoveFromCart}
        onCheckout={handleCheckoutTrigger}
        onUpdateQuantity={handleUpdateCartQuantity}
        coupons={coupons}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={setAppliedCoupon}
        onStartShopping={() => setView('shop')}
      />

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedPosterId && (
          <ProductDetailModal
            posterId={selectedPosterId}
            posters={posters}
            onClose={() => setSelectedPosterId(null)}
            onAddToCart={handleAddToCart}
          />
        )}
      </AnimatePresence>

      {/* Premium Footer */}
      <footer className="w-full bg-zinc-100/50 dark:bg-zinc-900/50 border-t border-zinc-200/40 dark:border-zinc-800/40 py-12 px-6 mt-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <span className="font-outfit text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Single Store.
            </span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              India's premium outlet for custom wall art posters. Bring your screens, passions, and spaces to life with digital prints.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-outfit text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="text-xs space-y-2 text-zinc-550 dark:text-zinc-400">
              <li>
                <button onClick={() => { setView('shop'); }} className="hover:text-blue-600 transition-colors">
                  Shop All Posters
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-outfit text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider">
              Store Support
            </h4>
            <ul className="text-xs space-y-2 text-zinc-500 dark:text-zinc-400">
              <li 
                onClick={() => {
                  setFaqCategory('all');
                  setView('faq');
                  window.scrollTo(0, 0);
                }} 
                className="hover:text-blue-600 cursor-pointer"
              >
                Help & FAQs
              </li>
              <li 
                onClick={() => {
                  setFaqCategory('shipping');
                  setView('faq');
                  window.scrollTo(0, 0);
                }} 
                className="hover:text-blue-600 cursor-pointer"
              >
                Shipping & Packaging
              </li>
              <li 
                onClick={() => {
                  setFaqCategory('payments');
                  setView('faq');
                  window.scrollTo(0, 0);
                }} 
                className="hover:text-blue-600 cursor-pointer"
              >
                Razorpay Security Policy
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-outfit text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider">
              Newsletter
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Get notified of exclusive discounts and hot category drops!
            </p>
            <div className="flex items-center relative">
              <input
                type="email"
                placeholder="email@example.com"
                className="w-full pl-3 pr-10 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none"
              />
              <button className="absolute right-1 p-1.5 rounded-lg bg-blue-600 text-white">
                <Mail className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-zinc-200/50 dark:border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 gap-4">
          <span>&copy; {new Date().getFullYear()} SingleStore Premium Wall Art. All rights reserved.</span>
          <div className="flex space-x-4">
            <span className="hover:underline cursor-pointer">Privacy Policy</span>
            <span className="hover:underline cursor-pointer">Refund Policy</span>
            <span className="hover:underline cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
