import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';

export default function CartDrawer({ isOpen, onClose, cart, onRemove, onCheckout }) {
  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
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
                  Your Cart ({cart.length})
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
                        <h4 className="font-outfit text-sm font-bold text-zinc-900 dark:text-white line-clamp-1">
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold mt-0.5">
                          Size: {item.size} / {item.frame}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-inter text-sm font-extrabold text-zinc-900 dark:text-white">
                          {formatPrice(item.price)}
                        </span>
                        <button
                          onClick={() => onRemove(item.cartId)}
                          className="text-[10px] flex items-center space-x-1 text-red-500 hover:text-red-600 font-semibold bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/30 dark:bg-zinc-950/20">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
                    Subtotal
                  </span>
                  <span className="font-inter text-xl font-extrabold text-zinc-900 dark:text-white">
                    {formatPrice(getSubtotal())}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center mb-4">
                  Taxes and shipping calculated at checkout
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onCheckout();
                    onClose();
                  }}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm md:text-base flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25 transition-all"
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
