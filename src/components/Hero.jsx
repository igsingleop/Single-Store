import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Hero({ setView, banners = [], setShopCategory }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95
    })
  };

  const paginate = useCallback((newDirection) => {
    if (!banners || banners.length === 0) return;
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection;
      if (nextIndex < 0) nextIndex = banners.length - 1;
      if (nextIndex >= banners.length) nextIndex = 0;
      return nextIndex;
    });
  }, [banners]);

  const handleDragEnd = (event, info) => {
    const swipeThreshold = 50; // pixels drag threshold
    if (info.offset.x < -swipeThreshold) {
      paginate(1);
    } else if (info.offset.x > swipeThreshold) {
      paginate(-1);
    }
  };

  // Autoplay effect
  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const timer = setInterval(() => {
      paginate(1);
    }, 6000); // Change slide every 6 seconds
    return () => clearInterval(timer);
  }, [currentIndex, banners, paginate]);

  // Fallback to static hero if no banners exist
  if (!banners || banners.length === 0) {
    return (
      <section className="relative w-full overflow-hidden py-20 px-6 flex flex-col items-center justify-center min-h-[75vh]">
        {/* Background Animated Gradient Blobs */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-blue-400/20 dark:bg-blue-600/10 blur-3xl animate-blob-1" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-3xl animate-blob-2" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-sky-400/15 dark:bg-sky-600/5 blur-3xl animate-blob-3" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full max-w-4xl glass-panel p-8 md:p-16 rounded-3xl text-center shadow-2xl border border-white/20 dark:border-white/5"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold text-xs tracking-wide uppercase mb-6 border border-blue-200/50 dark:border-blue-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>India's Premium Poster Store</span>
          </div>

          <h1 className="font-outfit text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.1] mb-6">
            Transform Your{' '}
            <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 dark:from-blue-400 dark:via-sky-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Walls
            </span>
          </h1>

          <p className="font-inter text-zinc-600 dark:text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            Discover premium, high-resolution posters printed on heavy-grade 300 GSM art boards. Bring your personal space to life with iconic designs.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView('shop')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25 transition-all"
            >
              <span>Shop Store</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView('shop')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-neo-out hover:shadow-neo-in font-bold text-base transition-all"
            >
              Browse Categories
            </motion.button>
          </div>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="relative w-full overflow-hidden py-10 md:py-16 px-6 flex flex-col items-center justify-center min-h-[70vh] sm:min-h-[75vh]">
      {/* Background Animated Gradient Blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-blue-400/20 dark:bg-blue-600/10 blur-3xl animate-blob-1" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-3xl animate-blob-2" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-sky-400/15 dark:bg-sky-600/5 blur-3xl animate-blob-3" />
      </div>

      {/* Slider Container */}
      <div className="relative z-10 w-full max-w-6xl h-[450px] sm:h-[500px] md:h-[550px] rounded-[32px] overflow-hidden shadow-2xl border border-zinc-200/50 dark:border-zinc-800 flex items-center justify-center bg-zinc-950">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 32 },
              opacity: { duration: 0.25 },
              scale: { duration: 0.25 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-6 sm:p-12 md:p-20 text-center select-none cursor-grab active:cursor-grabbing overflow-hidden"
          >
            {/* Slide Background Image */}
            <div className="absolute inset-0 w-full h-full z-0 select-none pointer-events-none">
              <img
                src={banners[currentIndex]?.image}
                alt={banners[currentIndex]?.title}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/1200x500?text=No+Image'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/45 to-black/70" />
            </div>

            {/* Sparkles Premium Tag */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="relative z-10 inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 text-blue-200 font-semibold text-[10px] sm:text-xs tracking-wider uppercase mb-5 border border-blue-500/30 backdrop-blur-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>India's Premium Poster Outlet</span>
            </motion.div>

            {/* Slide Title */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="relative z-10 font-outfit text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.15] mb-5 max-w-4xl"
            >
              {banners[currentIndex]?.title}
            </motion.h1>

            {/* Slide Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="relative z-10 font-inter text-zinc-200 text-sm sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-8 md:mb-10 font-medium"
            >
              {banners[currentIndex]?.subtitle}
            </motion.p>

            {/* CTA Action button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="relative z-10"
            >
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  const link = banners[currentIndex]?.link;
                  if (link && link.startsWith('category:')) {
                    const category = link.substring('category:'.length);
                    if (setShopCategory) setShopCategory(category);
                    setView('shop');
                  } else {
                    setView(link || 'shop');
                  }
                }}
                className="px-6 py-3.5 sm:px-8 sm:py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-550 text-white font-bold text-sm sm:text-base flex items-center justify-center space-x-2.5 shadow-lg shadow-blue-500/25 transition-all"
              >
                <span>Explore Store</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </motion.button>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Next/Prev Navigation Arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={() => paginate(-1)}
              className="absolute left-4 sm:left-6 z-20 p-2.5 sm:p-3 rounded-2xl bg-black/20 hover:bg-black/40 text-white backdrop-blur-md border border-white/10 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => paginate(1)}
              className="absolute right-4 sm:right-6 z-20 p-2.5 sm:p-3 rounded-2xl bg-black/20 hover:bg-black/40 text-white backdrop-blur-md border border-white/10 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </>
        )}

        {/* Visual Dots Indicators */}
        {banners.length > 1 && (
          <div className="absolute bottom-6 flex space-x-2 z-20">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'bg-blue-500 w-6'
                    : 'bg-white/40 hover:bg-white/70 w-2'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
