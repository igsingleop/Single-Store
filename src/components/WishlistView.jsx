import { motion as m, AnimatePresence } from 'framer-motion';
import { Heart, ArrowLeft } from 'lucide-react';
import PosterCard from './PosterCard';

export default function WishlistView({
  posters,
  wishlist,
  onToggleWishlist,
  onSelectPoster,
  onAddToCart,
  setView
}) {
  // Filter posters in wishlist
  const wishlistedPosters = posters.filter(p => wishlist.includes(p.id));

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12">
      {/* Back Button */}
      <button
        onClick={() => setView('shop')}
        className="inline-flex items-center space-x-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 font-semibold mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Shop</span>
      </button>

      {/* Page Header */}
      <div className="text-center mb-10">
        <h2 className="font-outfit text-3xl md:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          Your Saved Artwork
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm md:text-base max-w-lg mx-auto">
          Review and order your favorite custom posters in one place.
        </p>
      </div>

      {/* Product Display count */}
      {wishlistedPosters.length > 0 && (
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            {wishlistedPosters.length} {wishlistedPosters.length === 1 ? 'Poster Saved' : 'Posters Saved'}
          </span>
        </div>
      )}

      {/* Product Grid */}
      <AnimatePresence mode="wait">
        {wishlistedPosters.length > 0 ? (
          <m.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            key="wishlist-grid"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
          >
            {wishlistedPosters.map((poster) => (
              <PosterCard
                key={poster.id}
                poster={poster}
                onSelect={onSelectPoster}
                onAddToCart={onAddToCart}
                isWishlisted={true}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </m.div>
        ) : (
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-16 glass-panel rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 max-w-lg mx-auto"
          >
            <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 fill-rose-500/20 text-rose-500 animate-pulse" />
            </div>
            <h3 className="font-outfit text-xl font-bold text-zinc-850 dark:text-white">
              Your wishlist is empty
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm">
              Save your favorite premium prints here to easily access or order them later.
            </p>
            <button
              onClick={() => setView('shop')}
              className="mt-6 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
            >
              Browse Shop
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
