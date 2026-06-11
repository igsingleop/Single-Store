import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShoppingCart, ArrowRight, Minus, Plus } from 'lucide-react';

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onRemove,
  onCheckout,
  onUpdateQuantity,
  coupons = [],
  appliedCoupon = null,
  onApplyCoupon
}) {
  const [couponCode, setCouponCodeState] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + parseFloat(item.price) * (item.quantity || 1), 0);
  };

  const getDiscount = () => {
    if (!appliedCoupon) return 0;
    const subtotal = getSubtotal();
    if (appliedCoupon.type === 'percentage') {
      return (subtotal * appliedCoupon.value) / 100;
    } else {
      return appliedCoupon.value;
    }
  };

  const getFinalTotal = () => {
    const subtotal = getSubtotal();
    const discount = getDiscount();
    return Math.max(0, subtotal - discount);
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');

    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    const codeUpper = couponCode.trim().toUpperCase();
    const couponObj = coupons.find(c => c.code.toUpperCase() === codeUpper);

    if (!couponObj) {
      setCouponError('Coupon code not found.');
      return;
    }

    const subtotal = getSubtotal();
    if (subtotal < couponObj.minAmount) {
      setCouponError(`Minimum order value for ${couponObj.code} is Rs. ${couponObj.minAmount.toFixed(2)}`);
      return;
    }

    onApplyCoupon(couponObj);
    setCouponSuccess(`Coupon ${couponObj.code} applied successfully!`);
    setCouponCodeState('');
  };

  const formatPrice = (price) => {
    return 'Rs. ' + parseFloat(price).toFixed(2);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md glass-panel border-l border-white/20 dark:border-white/5 shadow-2xl flex flex-col justify-between"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-outfit text-lg font-bold text-zinc-900 dark:text-white">
                  Your Cart ({cart.reduce((sum, item) => sum + (item.quantity || 1), 0)})
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                aria-label="Close cart"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center justify-center h-full">
                  <div className="text-4xl mb-3 text-zinc-300 dark:text-zinc-700">🛒</div>
                  <h4 className="font-semibold text-zinc-700 dark:text-zinc-300">
                    Your cart is empty
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 max-w-[200px]">
                    Looks like you haven't added any premium posters yet.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-6 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <motion.div
                    key={item.cartId}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    className="flex gap-4 p-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/40 dark:border-zinc-800/40"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-16 h-20 object-cover rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-outfit text-sm font-bold text-zinc-900 dark:text-white line-clamp-1">
                            {item.title}
                          </h4>
                          <button
                            onClick={() => onRemove(item.cartId)}
                            className="text-zinc-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-500/10 transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold mt-0.5">
                          Size: {item.size} / {item.frame}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-2.5">
                        {/* Inline Compact Quantity Controls */}
                        <div className="flex items-center rounded-lg bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-250 dark:border-zinc-800 p-0.5">
                          <button
                            onClick={() => onUpdateQuantity(item.cartId, (item.quantity || 1) - 1)}
                            className="p-1 rounded-md text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <span className="w-6 text-center text-xs font-bold text-zinc-800 dark:text-zinc-200 font-inter">
                            {item.quantity || 1}
                          </span>

                          <button
                            onClick={() => onUpdateQuantity(item.cartId, (item.quantity || 1) + 1)}
                            className="p-1 rounded-md text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price Displays */}
                        <div className="text-right">
                          <span className="font-inter text-xs font-extrabold text-zinc-900 dark:text-white">
                            {formatPrice(parseFloat(item.price) * (item.quantity || 1))}
                          </span>
                          {(item.quantity || 1) > 1 && (
                            <span className="text-[9px] text-zinc-400 dark:text-zinc-550 font-medium block">
                              {formatPrice(item.price)} each
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/30 dark:bg-zinc-950/20 space-y-4">
                {/* Coupon Application Box */}
                {!appliedCoupon ? (
                  <form onSubmit={handleApplyCoupon} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Discount code (e.g. WELCOME50)"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCodeState(e.target.value);
                          setCouponError('');
                          setCouponSuccess('');
                        }}
                        className="flex-1 px-4 py-2.5 rounded-xl text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono uppercase"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold text-xs shadow-md transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[10px] text-red-500 font-bold mt-1 pl-1">
                        {couponError}
                      </p>
                    )}
                    {couponSuccess && (
                      <p className="text-[10px] text-emerald-500 font-bold mt-1 pl-1">
                        {couponSuccess}
                      </p>
                    )}
                  </form>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-250/40 dark:border-blue-800/40">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-md font-mono font-bold uppercase tracking-wider">
                        {appliedCoupon.code}
                      </span>
                      <span className="text-[10px] text-zinc-550 dark:text-zinc-400 font-semibold">
                        Applied ({appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : `Rs. ${appliedCoupon.value}`})
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        onApplyCoupon(null);
                        setCouponSuccess('');
                      }}
                      className="text-[10px] text-red-500 hover:text-red-400 hover:underline font-bold transition-all"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <div className="space-y-1.5 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50">
                  <div className="flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatPrice(getSubtotal())}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span className="font-mono">-{formatPrice(getDiscount())}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-1.5 border-t border-zinc-200/40 dark:border-zinc-800/40">
                    <span className="text-sm font-bold text-zinc-800 dark:text-white">
                      Grand Total
                    </span>
                    <span className="font-inter text-xl font-extrabold text-zinc-900 dark:text-white">
                      {formatPrice(getFinalTotal())}
                    </span>
                  </div>
                </div>

                {getFinalTotal() < 99 ? (
                  <div className="text-[11px] text-rose-500 font-bold text-center mb-4 bg-rose-500/10 py-2.5 rounded-xl border border-rose-500/20">
                    Minimum order value is Rs. 99.00
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-550 text-center mb-4">
                    Taxes and shipping calculated at checkout
                  </p>
                )}

                <motion.button
                  whileHover={getFinalTotal() >= 99 ? { scale: 1.02 } : {}}
                  whileTap={getFinalTotal() >= 99 ? { scale: 0.98 } : {}}
                  onClick={() => {
                    if (getFinalTotal() >= 99) {
                      onCheckout();
                      onClose();
                    }
                  }}
                  disabled={getFinalTotal() < 99}
                  className={`w-full py-4 rounded-2xl font-bold text-sm md:text-base flex items-center justify-center space-x-2 transition-all duration-300 ${getFinalTotal() >= 99
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 cursor-pointer"
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed border border-zinc-300 dark:border-zinc-800"
                    }`}
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
