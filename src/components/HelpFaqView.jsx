import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Clock,
  ArrowLeft,
  HelpCircle,
  Package,
  CreditCard,
  RotateCcw,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  MapPin
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All FAQs', icon: HelpCircle },
  { id: 'general', label: 'Products & Sizing', icon: HelpCircle },
  { id: 'shipping', label: 'Shipping & Delivery', icon: Package },
  { id: 'payments', label: 'Payments & Security', icon: CreditCard },
  { id: 'returns', label: 'Cancellations & Returns', icon: RotateCcw }
];

const FAQS = [
  {
    id: 'mat-print',
    category: 'general',
    question: 'What materials and printing techniques do you use?',
    answer: 'We use premium 220 GSM matte finish paper with state-of-the-art 12-color archival giclée printing. This ensures rich colors, sharp details, and long-lasting resistance to fading, keeping your art beautiful for decades.'
  },
  {
    id: 'framed-opt',
    category: 'general',
    question: 'Are the posters framed?',
    answer: 'We offer both "Print Only" (safely rolled in protective tubes) and "Framed" options. Our premium frames are lightweight, durable, and come in satin black or natural wood finishes with protective acrylic glass.'
  },
  {
    id: 'sizes-guide',
    category: 'general',
    question: 'What sizes do you offer?',
    answer: 'We offer two standard sizes: Medium (18x24 inches / 45x60 cm) and Large (24x36 inches / 60x90 cm). Check our size guide on each product page for a visual reference.'
  },
  {
    id: 'custom-art',
    category: 'general',
    question: 'Can I request a custom poster size or artwork?',
    answer: 'Yes! We love custom requests. Drop us an email at support.thesinglestore@gmail.com with your high-resolution image and sizing requirements, and we will get back to you with a digital proof.'
  },
  {
    id: 'ship-cost',
    category: 'shipping',
    question: 'How much does shipping cost?',
    answer: 'Shipping is completely FREE all across India! There are no hidden charges or minimum order values required for free standard shipping.'
  },
  {
    id: 'ship-time',
    category: 'shipping',
    question: 'How long will it take to receive my order?',
    answer: 'Orders are processed within 24-48 hours. Delivery takes 3-5 business days for major metro cities and 5-7 business days for other regions across India.'
  },
  {
    id: 'packaging-sec',
    category: 'shipping',
    question: 'How do you package the items to prevent damage?',
    answer: 'Unframed prints are rolled in acid-free tissue paper and shipped in heavy-duty cardboard poster tubes. Framed posters are wrapped in layers of bubble wrap and secured in custom-fitted, shock-resistant corrugated boxes.'
  },
  {
    id: 'pay-methods',
    category: 'payments',
    question: 'What payment methods do you accept?',
    answer: 'We support all major payment methods including UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards (Visa, Mastercard, RuPay), Net Banking, and popular digital wallets.'
  },
  {
    id: 'pay-sec',
    category: 'payments',
    question: 'Is my payment information secure?',
    answer: 'Absolutely. All transactions are securely processed through Razorpay, India\'s leading payment gateway, utilizing industry-standard AES-256 encryption and PCI-DSS compliance. We never store your card details or credentials.'
  },
  {
    id: 'cancel-ord',
    category: 'returns',
    question: 'Can I cancel or modify my order?',
    answer: 'You can cancel or modify your order within 2 hours of placement. Please contact us via email or phone immediately, as we begin custom printing operations shortly after.'
  },
  {
    id: 'return-policy',
    category: 'returns',
    question: 'What is your return policy?',
    answer: 'Since each poster is printed custom to order, we do not accept returns for change of mind. However, if your item arrives damaged or is incorrect, we will send a free replacement immediately.'
  },
  {
    id: 'damaged-rec',
    category: 'returns',
    question: 'What should I do if my order arrives damaged?',
    answer: 'If your package is damaged during transit, please email us a photo of the damaged item and packaging within 48 hours of delivery at support.thesinglestore@gmail.com. We will ship a brand-new replacement at no extra charge.'
  }
];

export default function HelpFaqView({ setView, initialCategory = 'all' }) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState(null);

  // Sync category state if initialCategory changes (e.g. from footer clicks)
  useEffect(() => {
    setActiveCategory(initialCategory);
    setExpandedFaqId(null);
  }, [initialCategory]);

  // Handle accordion toggle
  const toggleFaq = (id) => {
    setExpandedFaqId(prev => prev === id ? null : id);
  };

  // Filter FAQs based on search query and active tab
  const filteredFaqs = FAQS.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
      {/* Header section with back button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <button
            onClick={() => setView('home')}
            className="flex items-center space-x-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Store</span>
          </button>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-1">
            Customer Support Center
          </span>
          <h1 className="font-outfit text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Help & FAQs
          </h1>
        </div>

        {/* Live Search input */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search for answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Sidebar categories for larger viewports, or horizontal tab selector for mobile */}
        <div className="lg:col-span-1 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 scrollbar-none gap-2">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setExpandedFaqId(null);
                }}
                className={`flex items-center space-x-3 px-4 py-3 rounded-2xl font-semibold text-sm whitespace-nowrap transition-all duration-300 ${isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 dark:shadow-blue-500/15'
                  : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 shadow-neo-out hover:shadow-neo-in'
                  }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-zinc-400 dark:text-zinc-500'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* FAQ list Accordions */}
        <div className="lg:col-span-3 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory + searchQuery}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map(faq => {
                  const isOpen = expandedFaqId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className="glass-panel rounded-2xl border border-zinc-200/50 dark:border-zinc-800 overflow-hidden hover:border-blue-500/35 transition-colors"
                    >
                      <button
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 select-none focus:outline-none"
                      >
                        <span className="font-outfit font-bold text-zinc-800 dark:text-zinc-200 text-base md:text-md">
                          {faq.question}
                        </span>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400' : ''}`}>
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                          >
                            <div className="px-6 pb-6 pt-1 text-zinc-600 dark:text-zinc-350 text-sm md:text-sm leading-relaxed border-t border-zinc-100/50 dark:border-zinc-800/40">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              ) : (
                <div className="glass-panel p-10 rounded-2xl text-center border border-zinc-200/50 dark:border-zinc-800">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4 text-zinc-400 dark:text-zinc-500">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="font-outfit text-lg font-bold text-zinc-800 dark:text-white mb-1">
                    No results found
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                    We couldn't find any FAQs matching "{searchQuery}". Try using other keywords.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Contact Support Section */}
          <div className="mt-12 glass-panel p-6 sm:p-8 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md relative overflow-hidden bg-gradient-to-r from-blue-50/20 via-indigo-50/10 to-transparent dark:from-blue-950/10 dark:via-indigo-950/5 dark:to-transparent">
            <div className="space-y-2 text-center md:text-left max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-blue-400/10 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                <MessageSquare className="w-3 h-3" /> Dedicated Support
              </span>
              <h3 className="font-outfit text-xl font-extrabold text-zinc-900 dark:text-white">
                Still have questions?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                If you cannot find your answer in our FAQs, please feel free to reach out directly. Our friendly support team is here to assist you with order updates, sizing issues, or custom poster orders.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <a
                href="mailto:support.thesinglestore@gmail.com"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = "mailto:support.thesinglestore@gmail.com";
                }}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all whitespace-nowrap"
              >
                <Mail className="w-4 h-4" />
                <span>Email Support</span>
              </a>
              {/* <a
                href="tel:+919876543210"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:shadow-neo-in text-zinc-700 dark:text-zinc-200 font-semibold text-xs transition-all whitespace-nowrap"
              >
                <Phone className="w-4 h-4 text-zinc-400" />
                <span>Call Us</span>
              </a> */}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
