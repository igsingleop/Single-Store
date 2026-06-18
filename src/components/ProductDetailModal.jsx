import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, ShieldCheck, Truck, RefreshCw, Minus, Plus, Star, Calendar } from 'lucide-react';
import { getReviews } from '../utils/db';

export default function ProductDetailModal({ posterId, posters, onClose, onAddToCart }) {
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [zoomImage, setZoomImage] = useState(null);

  const poster = posters.find(p => String(p.id) === String(posterId));

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await getReviews();
        setReviews(data.filter(r => String(r.productId) === String(posterId)));
      } catch (err) {
        console.error(err);
      }
    };
    fetchReviews();

    const handleDbUpdate = async () => {
      const data = await getReviews();
      setReviews(data.filter(r => String(r.productId) === String(posterId)));
    };
    window.addEventListener('singlestore_db_update', handleDbUpdate);
    return () => {
      window.removeEventListener('singlestore_db_update', handleDbUpdate);
    };
  }, [posterId]);

  if (!poster) return null;

  const basePrice = poster.discountPrice ? parseFloat(poster.discountPrice) : parseFloat(poster.price);
  const currentPrice = basePrice;

  const handleAddToCart = () => {
    onAddToCart(poster.id, '18x24"', 'Print Only', quantity);
    onClose();
  };

  // Review summaries calculations
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : (poster.rating !== undefined ? Number(poster.rating).toFixed(1) : '5.0');

  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    if (starCounts[r.rating] !== undefined) {
      starCounts[r.rating]++;
    }
  });

  const getStarPercentage = (star) => {
    if (reviews.length === 0) return 0;
    return Math.round((starCounts[star] / reviews.length) * 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-start justify-center p-4 pt-10 md:items-center md:pt-4"
      onClick={onClose}
    >
      {/* Floating Close Button for Mobile viewports */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/50 dark:border-zinc-800 shadow-lg md:hidden text-zinc-800 dark:text-zinc-200"
        aria-label="Close details"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl glass-panel border border-white/20 dark:border-white/5 rounded-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative scrollbar-none"
      >
        {/* Close Button - Desktop Only */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2.5 rounded-xl bg-white/40 dark:bg-black/40 border border-white/20 dark:border-white/5 shadow-md hover:bg-white/60 dark:hover:bg-black/60 transition-all text-zinc-800 dark:text-zinc-200 hidden md:block"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Product info (2-Column Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Side: Product Image */}
          <div className="relative p-6 md:p-8 flex items-center justify-center bg-zinc-100/40 dark:bg-zinc-950/20 border-r border-zinc-200/30 dark:border-zinc-800/30">
            <div className="w-full max-w-[340px] md:max-w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-xl border border-zinc-200 dark:border-zinc-800 bg-white">
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

              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-baseline space-x-2">
                  <span className="font-inter text-2xl font-extrabold text-zinc-900 dark:text-white">
                    Rs. {currentPrice.toFixed(2)}
                  </span>
                  {poster.discountPrice && (
                    <span className="font-inter text-sm text-zinc-400 dark:text-zinc-500 line-through">
                      Rs. {parseFloat(poster.price).toFixed(2)}
                    </span>
                  )}
                </div>
                {avgRating && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{avgRating} ({reviews.length})</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-zinc-650 dark:text-zinc-350 font-inter leading-relaxed mt-4">
                {poster.description || "Bring home a piece of art. This custom poster is printed with sharp detail and vibrant colors."}
              </p>

              <hr className="my-6 border-zinc-200 dark:border-zinc-800/80" />

              {/* Quantity Selector */}
              <div className="mb-6">
                <span className="text-xs font-bold text-zinc-550 dark:text-zinc-455 uppercase tracking-wider block mb-2.5">
                  Quantity
                </span>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center rounded-xl bg-zinc-50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-800 shadow-neo-in p-1">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      type="button"
                      className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-750 transition-colors shadow-neo-out hover:shadow-neo-in flex items-center justify-center"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </motion.button>
                    
                    <span className="w-10 text-center text-xs font-extrabold text-zinc-900 dark:text-white font-inter">
                      {quantity}
                    </span>

                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(prev => prev + 1)}
                      type="button"
                      className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-750 transition-colors shadow-neo-out hover:shadow-neo-in flex items-center justify-center"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </motion.button>
                  </div>
                  {quantity > 1 && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold font-inter">
                      Total: Rs. {(currentPrice * quantity).toFixed(2)}
                    </span>
                  )}
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
              <div className="grid grid-cols-3 gap-2 mt-6 text-center text-[10px] font-semibold text-zinc-550 dark:text-zinc-400">
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
        </div>

        {/* Ratings & Reviews Section (Full Width) */}
        <div className="border-t border-zinc-200/50 dark:border-zinc-800 p-6 md:p-10 bg-zinc-50/10 dark:bg-zinc-950/10">
          <h3 className="font-outfit text-xl font-extrabold text-zinc-900 dark:text-white mb-6">
            Customer Ratings & Reviews
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Overall Summary Card */}
            <div className="md:col-span-1 p-6 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-850 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-2">Overall Rating</span>
              {avgRating ? (
                <>
                  <span className="text-4xl font-black text-zinc-900 dark:text-white font-mono leading-none mb-2.5">
                    {avgRating} <span className="text-sm text-zinc-450 dark:text-zinc-500 font-bold">/ 5.0</span>
                  </span>
                  <div className="flex gap-0.5 mb-2.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        className={`w-4 h-4 ${s <= Math.round(parseFloat(avgRating)) ? 'fill-amber-400 text-amber-400' : 'text-zinc-250 dark:text-zinc-700'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
                    Based on {reviews.length} customer {reviews.length === 1 ? 'review' : 'reviews'}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xl font-bold text-zinc-455 dark:text-zinc-500 italic py-4">No reviews yet</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-450 leading-relaxed max-w-[160px]">
                    Have you purchased this poster? Leave a review from your account page!
                  </span>
                </>
              )}
            </div>

            {/* Stars Progress bars breakdown */}
            <div className="md:col-span-2 space-y-2.5 pt-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const percentage = getStarPercentage(star);
                return (
                  <div key={star} className="flex items-center gap-3.5 text-xs text-zinc-650 dark:text-zinc-455 font-semibold">
                    <span className="w-8 flex items-center justify-end gap-1 font-bold">
                      <span>{star}</span>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                    </span>
                    <div className="flex-1 h-2.5 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden shadow-inner border border-zinc-200/20 dark:border-zinc-800/60 relative">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono text-[10px] font-bold text-zinc-400 dark:text-zinc-550">
                      {percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Individual Reviews list container */}
          <div className="mt-10 space-y-5">
            <h4 className="font-outfit text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block border-b border-zinc-200/40 dark:border-zinc-800/60 pb-3">
              Review Feed
            </h4>
            
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div 
                    key={rev.id} 
                    className="p-5 bg-zinc-50/40 dark:bg-zinc-900/10 border border-zinc-200/40 dark:border-zinc-800/80 rounded-2xl flex flex-col sm:flex-row gap-4 shadow-sm"
                  >
                    {/* Customer Identity Block */}
                    <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 sm:w-32 shrink-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-650 to-indigo-650 flex items-center justify-center text-white font-extrabold text-xs shadow-sm">
                        {(rev.customerName || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-outfit text-xs font-bold text-zinc-850 dark:text-zinc-200 truncate max-w-[120px]" title={rev.customerName}>
                          {rev.customerName}
                        </h5>
                        <span className="text-[9px] text-zinc-450 dark:text-zinc-550 block font-bold mt-0.5">
                          Verified Buyer
                        </span>
                      </div>
                    </div>

                    {/* Feedback Rating details */}
                    <div className="flex-1 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star 
                              key={s} 
                              className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300 dark:text-zinc-700'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-550 font-semibold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-550" />
                          <span>{new Date(rev.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </span>
                      </div>
                      
                      <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed font-sans font-medium whitespace-pre-line">
                        {rev.comment}
                      </p>

                      {/* Photo Attachments preview */}
                      {rev.image && (
                        <div className="pt-1.5">
                          <img 
                            src={rev.image} 
                            alt="Customer review photo" 
                            onClick={() => setZoomImage(rev.image)}
                            className="w-16 h-20 object-cover rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white hover:opacity-90 cursor-zoom-in transition-all shadow-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-xs font-semibold text-zinc-450 dark:text-zinc-550 italic">
                No reviews posted for this poster yet.
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Enlarged Image Zoom modal overlay */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomImage(null)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="max-w-3xl w-full max-h-[85vh] flex items-center justify-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setZoomImage(null)}
                className="absolute -top-12 right-0 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all shadow"
              >
                <X className="w-5 h-5" />
              </button>
              <img 
                src={zoomImage} 
                alt="Enlarged review photo preview" 
                className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
