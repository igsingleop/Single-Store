import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function Hero({ setView }) {
  return (
    <section className="relative w-full overflow-hidden py-20 px-6 flex flex-col items-center justify-center min-h-[75vh]">
      {/* Background Animated Gradient Blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Blob 1 */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-blue-400/20 dark:bg-blue-600/10 blur-3xl animate-blob-1" />
        {/* Blob 2 */}
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-3xl animate-blob-2" />
        {/* Blob 3 */}
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-sky-400/15 dark:bg-sky-600/5 blur-3xl animate-blob-3" />
      </div>

      {/* Hero Content (Glassmorphic Container) */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-4xl glass-panel p-8 md:p-16 rounded-3xl text-center shadow-2xl border border-white/20 dark:border-white/5"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold text-xs tracking-wide uppercase mb-6 border border-blue-200/50 dark:border-blue-500/20"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>India's Premium Poster Store</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="font-outfit text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.1] mb-6"
        >
          Transform Your{' '}
          <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 dark:from-blue-400 dark:via-sky-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Walls
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="font-inter text-zinc-600 dark:text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10"
        >
          Discover premium, high-resolution posters printed on heavy-grade 300 GSM art boards. Bring your personal space to life with iconic designs.
        </motion.p>

        {/* CTA Buttons (Neomorphic effects) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
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
        </motion.div>
      </motion.div>
    </section>
  );
}
