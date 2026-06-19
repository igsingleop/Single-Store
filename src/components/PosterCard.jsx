import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getReviews } from '../utils/db';

export default function PosterCard({ poster, onSelect, onAddToCart, isWishlisted = false, onToggleWishlist }) {
  const [ratingInfo, setRatingInfo] = useState({ avg: 0, count: 0 });

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const allReviews = await getReviews();
        const posterReviews = allReviews.filter(r => String(r.productId) === String(poster.id));
        if (posterReviews.length > 0) {
          const avg = posterReviews.reduce((sum, r) => sum + r.rating, 0) / posterReviews.length;
          setRatingInfo({ avg, count: posterReviews.length });
        } else {
          setRatingInfo({ avg: poster.rating !== undefined ? Number(poster.rating) : 5, count: 0 });
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchRating();

    window.addEventListener('singlestore_db_update', fetchRating);
    return () => {
      window.removeEventListener('singlestore_db_update', fetchRating);
    };
  }, [poster.id, poster.rating]);
  const hasDiscount = poster.discountPrice != null && String(poster.discountPrice) !== '' && !isNaN(parseFloat(poster.discountPrice));
  const activePrice = hasDiscount ? parseFloat(poster.discountPrice) : parseFloat(poster.price);
  const comparePrice = hasDiscount ? parseFloat(poster.price) : null;

  const formatPrice = (price) => {
    return 'Rs. ' + parseFloat(price).toFixed(2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      onClick={() => onSelect(poster.id)}
      className="group cursor-pointer rounded-2xl p-4 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 shadow-neo-out hover:shadow-neo-in transition-all duration-300 flex flex-col justify-between"
    >
      <div>
        {/* Image Container with Zoom */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-800 mb-4 border border-zinc-200 dark:border-zinc-800">
          <motion.img
            src={poster.image || 'https://via.placeholder.com/400x600?text=No+Image'}
            alt={poster.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {hasDiscount && (
            <span className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-extrabold text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full shadow-lg">
              Sale
            </span>
          )}
          
          {/* Wishlist toggle button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleWishlist) onToggleWishlist(poster.id);
            }}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-white/20 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 transition-colors shadow-md hover:scale-105"
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-zinc-700 dark:text-zinc-350 hover:text-rose-500'}`} />
          </button>

          <span className="absolute bottom-3 right-3 bg-white/70 dark:bg-black/50 backdrop-blur-md text-[9px] font-semibold text-zinc-800 dark:text-zinc-200 px-2 py-0.5 rounded border border-white/20 dark:border-white/10">
            {poster.category}
          </span>
        </div>

        {/* Vendor and Title */}
        <div className="px-1">
          <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest">
            Single Store
          </span>
          <h3 className="font-outfit text-base font-bold text-zinc-900 dark:text-white mt-0.5 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {poster.title}
          </h3>
          
          {/* Ratings Stars */}
          <div className="flex items-center gap-1 mt-1.5">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3 h-3 ${
                    ratingInfo.avg >= s
                      ? 'fill-amber-400 text-amber-400'
                      : ratingInfo.avg > s - 1
                      ? 'fill-amber-400 text-amber-400 opacity-50'
                      : 'text-zinc-300 dark:text-zinc-600'
                  }`}
                />
              ))}
            </div>
            {ratingInfo.count > 0 && (
              <span className="text-[10px] text-zinc-500 dark:text-zinc-450 font-bold font-sans">
                ({ratingInfo.count})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Price and Add button */}
      <div className="px-1 mt-4 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-inter text-sm font-extrabold text-zinc-900 dark:text-white">
            {formatPrice(activePrice)}
          </span>
          {comparePrice && (
            <span className="font-inter text-[11px] text-zinc-400 dark:text-zinc-500 line-through">
              {formatPrice(comparePrice)}
            </span>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(poster.id);
          }}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all"
          aria-label="Add to Cart"
        >
          <ShoppingCart className="w-4.5 h-4.5" />
        </motion.button>
      </div>
    </motion.div>
  );
}
