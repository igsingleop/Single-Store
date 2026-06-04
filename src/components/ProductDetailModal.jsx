import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ShoppingBag, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

export default function ProductDetailModal({ posterId, posters, onClose, onAddToCart }) {
  const poster = posters.find(p => String(p.id) === String(posterId));
  
  if (!poster) return null;

  const [selectedSize, setSelectedSize] = useState('18x24"');
  const [selectedFrame, setSelectedFrame] = useState('Print Only');

  const basePrice = poster.discountPrice ? parseFloat(poster.discountPrice) : parseFloat(poster.price);
  
  // Calculate pricing based on options
  const getCalculatedPrice = () => {
    let price = basePrice;
    if (selectedSize.includes('24x36')) price += 10;
    if (selectedFrame.includes('Frame')) price += 15;
    return price;
  };

  const currentPrice = getCalculatedPrice();

  const handleAddToCart = () => {
    onAddToCart(poster.id, selectedSize, selectedFrame);
    onClose();
  };

  const sizes = ['18x24"', '24x36"'];
  const frames = ['Print Only', 'Black Frame', 'White Frame'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl glass-panel border border-white/20 dark:border-white/5 rounded-3xl overflow-hidden shadow-2xl relative grid grid-cols-1 md:grid-cols-2"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2.5 rounded-xl bg-white/40 dark:bg-black/40 border border-white/20 dark:border-white/5 shadow-md hover:bg-white/60 dark:hover:bg-black/60 transition-all text-zinc-800 dark:text-zinc-200"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Product Image */}
        <div className="relative p-6 md:p-8 flex items-center justify-center bg-zinc-100/40 dark:bg-zinc-950/20 border-r border-zinc-200/30 dark:border-zinc-800/30">
          <div className="w-full max-w-[340px] md:max-w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-xl border border-zinc-200 dark:border-zinc-800">
            <img
              src={poster.image}
              alt={poster.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right Side: Options and Details */}
        <div className="p-6 md:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">
                Single Store Exclusive
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                {poster.category}
              </span>
            </div>

            <h2 className="font-outfit text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white leading-tight">
              {poster.title}
            </h2>

            <div className="mt-3 flex items-baseline space-x-2">
              <span className="font-inter text-2xl font-extrabold text-zinc-900 dark:text-white">
                Rs. {currentPrice.toFixed(2)}
              </span>
              {poster.discountPrice && (
                <span className="font-inter text-sm text-zinc-400 dark:text-zinc-500 line-through">
                  Rs. {((poster.price) + (selectedSize.includes('24x36') ? 10 : 0) + (selectedFrame.includes('Frame') ? 15 : 0)).toFixed(2)}
                </span>
              )}
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-300 font-inter leading-relaxed mt-4">
              {poster.description || "Bring home a piece of art. This custom poster is printed with sharp detail and vibrant colors."}
            </p>

            <hr className="my-6 border-zinc-200 dark:border-zinc-800" />

            {/* Size Selector */}
            <div className="mb-5">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2.5">
                Select Size
              </span>
              <div className="flex gap-3">
                {sizes.map((size) => {
                  const active = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`flex-1 py-2.5 rounded-xl font-medium text-xs border transition-all duration-300 ${
                        active
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                          : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-neo-out hover:shadow-neo-in'
                      }`}
                    >
                      {size} {size.includes('24x36') && '(+Rs. 10.00)'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Frame Selector */}
            <div className="mb-6">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2.5">
                Framing Option
              </span>
              <div className="grid grid-cols-3 gap-3.5">
                {frames.map((frame) => {
                  const active = selectedFrame === frame;
                  return (
                    <button
                      key={frame}
                      onClick={() => setSelectedFrame(frame)}
                      className={`py-2 px-1 rounded-xl font-medium text-[10px] sm:text-xs border transition-all duration-300 ${
                        active
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                          : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-neo-out hover:shadow-neo-in'
                      }`}
                    >
                      {frame} {frame.includes('Frame') && '(+Rs. 15.00)'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            {/* Purchase Buttons */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddToCart}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm md:text-base flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25 transition-all"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Add to Cart</span>
            </motion.button>

            {/* Badges / Commitments */}
            <div className="grid grid-cols-3 gap-2 mt-6 text-center text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
              <div className="flex flex-col items-center">
                <ShieldCheck className="w-5 h-5 text-emerald-500 mb-1" />
                <span>300 GSM Paper</span>
              </div>
              <div className="flex flex-col items-center">
                <Truck className="w-5 h-5 text-indigo-500 mb-1" />
                <span>Free Shipping</span>
              </div>
              <div className="flex flex-col items-center">
                <RefreshCw className="w-5 h-5 text-purple-500 mb-1" />
                <span>Easy Return</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
