import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PosterCard from './PosterCard';

export default function ShopView({
  posters,
  searchQuery,
  onSelectPoster,
  onAddToCart,
  wishlist = [],
  onToggleWishlist,
  selectedCategory,
  setSelectedCategory
}) {
  const [internalCategory, setInternalCategory] = useState('All');
  const activeCategory = setSelectedCategory ? selectedCategory : internalCategory;
  const setActiveCategory = setSelectedCategory ? setSelectedCategory : setInternalCategory;

  // Extract all categories dynamically from posters
  const categories = useMemo(() => {
    const cats = posters.map(p => p.category);
    const uniqueCats = ['All', ...new Set(cats.filter(Boolean))];
    return uniqueCats;
  }, [posters]);

  // Filter posters by search and category
  const filteredPosters = useMemo(() => {
    return posters.filter(p => {
      const matchCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [posters, activeCategory, searchQuery]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const categoryContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04
      }
    }
  };

  const categoryItemVariants = {
    hidden: { opacity: 0, scale: 0.9, y: -8 },
    show: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 400, damping: 25 }
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12">
      {/* Page Header */}
      <div className="text-center mb-10">
        <h2 className="font-outfit text-3xl md:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          Shop Our Collections
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm md:text-base max-w-lg mx-auto">
          Explore premium posters. Select a category below to discover artwork curated for your space.
        </p>
      </div>

      {/* Category Navigation (Neomorphic Pills with Sliding Indicator) */}
      <motion.div
        variants={categoryContainerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-wrap items-center justify-center gap-3 mb-12"
      >
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <motion.button
              key={cat}
              variants={categoryItemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat)}
              className={`relative px-6 py-2.5 rounded-full font-semibold text-sm border transition-colors duration-300 focus:outline-none ${
                isActive
                  ? 'border-transparent text-white'
                  : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-300 shadow-neo-out hover:shadow-neo-in hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="activeCategoryHighlight"
                  className="absolute inset-0 bg-blue-600 rounded-full shadow-lg shadow-blue-500/25"
                  transition={{ type: "spring", stiffness: 355, damping: 26 }}
                />
              )}
              <span className="relative z-10">{cat}</span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Product Display count */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          Showing {filteredPosters.length} {filteredPosters.length === 1 ? 'Poster' : 'Posters'}
        </span>
        {searchQuery && (
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            Filtered by search: "{searchQuery}"
          </span>
        )}
      </div>

      {/* Product Grid */}
      <AnimatePresence mode="wait">
        {filteredPosters.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            key={activeCategory + searchQuery}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
          >
            {filteredPosters.map((poster) => (
              <PosterCard
                key={poster.id}
                poster={poster}
                onSelect={onSelectPoster}
                onAddToCart={onAddToCart}
                isWishlisted={wishlist.includes(poster.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-16 glass-panel rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800"
          >
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="font-outfit text-xl font-bold text-zinc-800 dark:text-white">
              No matching posters found
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm">
              Try adjusting your filter category or search keywords.
            </p>
            <button
              onClick={() => {
                setActiveCategory('All');
              }}
              className="mt-6 px-6 py-2 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 transition-colors"
            >
              Reset Filters
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
