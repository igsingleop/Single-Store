import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Upload, AlertCircle } from 'lucide-react';
import { addReview } from '../utils/db';

export default function ReviewModal({ isOpen, onClose, orderId, product, customerName, customerEmail, onReviewSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [image, setImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      setError("Image size should be less than 800KB.");
      return;
    }

    setError('');
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError("Please select a rating of at least 1 star.");
      return;
    }

    if (!comment.trim()) {
      setError("Please enter a review comment.");
      return;
    }

    setSubmitting(true);
    try {
      const reviewObj = {
        productId: String(product.posterId || product.id),
        orderId: String(orderId),
        customerName: customerName || 'Anonymous Customer',
        customerEmail: customerEmail,
        rating: Number(rating),
        comment: comment.trim(),
        image: image || null,
        date: new Date().toISOString()
      };

      await addReview(reviewObj);
      onReviewSubmitted();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 30 }}
          className="w-full max-w-lg glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-white/5 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-350 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <h3 className="font-outfit text-xl font-extrabold text-zinc-900 dark:text-white mb-2 pr-8">
            Write a Review
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
            Your feedback helps others make better choices and assists us in improving our premium wall art prints.
          </p>

          <div className="flex items-center gap-3.5 mb-6 p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-200/50 dark:border-zinc-850">
            <img
              src={product.image}
              alt={product.title}
              className="w-12 h-16 object-cover rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white"
            />
            <div className="min-w-0">
              <h4 className="font-outfit text-sm font-bold text-zinc-800 dark:text-white truncate">
                {product.title}
              </h4>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-550 font-semibold mt-0.5">
                Size: {product.size} • Frame: {product.frame}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Star Rating Selection */}
            <div className="text-center">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2.5">
                Rate this Product
              </span>
              <div className="flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-zinc-300 dark:text-zinc-600 transition-colors duration-200 focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 transition-all duration-200 ${
                        star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400 scale-110 drop-shadow-md'
                          : ''
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <span className="text-xs font-bold text-amber-500 mt-2 block">
                  {rating === 5 ? 'Excellent!' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Below Average' : 'Poor'}
                </span>
              )}
            </div>

            {/* Written Comment */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1.5">
                Review Details *
              </label>
              <textarea
                rows={3}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts on print quality, frame durability, packaging, etc..."
                className="w-full px-4 py-3 rounded-2xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-zinc-400"
              />
            </div>

            {/* Image Upload attachment */}
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1.5">
                Attach Feedback Image (Optional)
              </span>
              
              <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-200/50 dark:border-zinc-850 shadow-inner">
                {image ? (
                  <div className="relative shrink-0">
                    <img
                      src={image}
                      alt="Feedback Preview"
                      className="w-16 h-16 object-cover rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setImage('')}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-md"
                      title="Remove Image"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-850 flex flex-col items-center justify-center shrink-0 text-zinc-400">
                    <Upload className="w-5 h-5 text-zinc-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <label className="inline-block px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:shadow-neo-in border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs rounded-xl cursor-pointer shadow-sm transition-all whitespace-nowrap">
                    <span>{image ? 'Change Photo' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                      disabled={uploading}
                    />
                  </label>
                  <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-1 font-semibold">
                    PNG, JPG or JPEG. Max size: 800KB.
                  </p>
                </div>
              </div>
            </div>

            {/* Submission actions */}
            <div className="flex gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-800/80">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 font-bold text-xs transition-colors border border-zinc-200 dark:border-zinc-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploading}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center"
              >
                {submitting ? 'Submitting...' : 'Post Review'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
