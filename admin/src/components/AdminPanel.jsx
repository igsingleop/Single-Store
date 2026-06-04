import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Package,
  ShoppingBag,
  Plus,
  Trash2,
  Edit3,
  DollarSign,
  Grid,
  CheckCircle,
  FileText,
  Upload,
  AlertTriangle,
  LogOut,
  ArrowLeft
} from 'lucide-react';
import {
  getPosters,
  addPoster,
  updatePoster,
  deletePoster,
  getOrders,
  updateOrderStatus
} from '../utils/db';

export default function AdminPanel({ session, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [posters, setPosters] = useState([]);
  const [orders, setOrders] = useState([]);

  // Form states for creating/editing poster
  const [editingId, setEditingId] = useState(null);
  const [posterTitle, setPosterTitle] = useState('');
  const [posterCategory, setPosterCategory] = useState('');
  const [posterPrice, setPosterPrice] = useState('');
  const [posterDiscountPrice, setPosterDiscountPrice] = useState('');
  const [posterDesc, setPosterDesc] = useState('');
  const [posterImage, setPosterImage] = useState('');

  useEffect(() => {
    // Initial fetch
    const fetchAllData = async () => {
      const dbPosters = await getPosters();
      const dbOrders = await getOrders();
      setPosters(dbPosters);
      setOrders(dbOrders);
    };
    fetchAllData();

    // Sync database events
    const handleDbUpdate = () => {
      fetchAllData();
    };
    window.addEventListener('singlestore_db_update', handleDbUpdate);
    return () => {
      window.removeEventListener('singlestore_db_update', handleDbUpdate);
    };
  }, []);

  const formatPrice = (price) => {
    return 'Rs. ' + parseFloat(price).toFixed(2);
  };

  // --- STATS CALCULATIONS ---
  const revenue = orders.reduce((sum, order) => {
    return order.status.toLowerCase() !== 'cancelled' ? sum + parseFloat(order.total) : sum;
  }, 0);

  const totalPosters = posters.length;
  const totalOrders = orders.length;

  // Category sales breakdown
  const categorySales = orders.reduce((acc, order) => {
    if (order.status.toLowerCase() === 'cancelled') return acc;
    order.items.forEach(item => {
      const itemPoster = posters.find(p => String(p.id) === String(item.posterId));
      const cat = itemPoster ? itemPoster.category : 'General';
      acc[cat] = (acc[cat] || 0) + item.price;
    });
    return acc;
  }, {});

  const totalCategoryRevenue = Object.values(categorySales).reduce((a, b) => a + b, 0) || 1;

  // --- HANDLERS ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      setPosterImage(evt.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!posterTitle || !posterCategory || !posterPrice) {
      alert("Please fill in all required fields.");
      return;
    }

    const imgUrl = posterImage || 'https://via.placeholder.com/400x600?text=No+Image';

    if (editingId) {
      // Edit
      const updated = {
        id: editingId,
        title: posterTitle,
        category: posterCategory,
        price: parseFloat(posterPrice),
        discountPrice: posterDiscountPrice ? parseFloat(posterDiscountPrice) : null,
        description: posterDesc,
        image: imgUrl
      };
      await updatePoster(updated);
      alert("Poster updated successfully!");
      setEditingId(null);
    } else {
      // Add
      const newPoster = {
        id: Date.now().toString(),
        title: posterTitle,
        category: posterCategory,
        price: parseFloat(posterPrice),
        discountPrice: posterDiscountPrice ? parseFloat(posterDiscountPrice) : null,
        description: posterDesc,
        image: imgUrl
      };
      await addPoster(newPoster);
      alert("Poster added successfully!");
    }

    // Reset Form
    setPosterTitle('');
    setPosterCategory('');
    setPosterPrice('');
    setPosterDiscountPrice('');
    setPosterDesc('');
    setPosterImage('');
  };

  const handleEditPosterClick = (p) => {
    setEditingId(p.id);
    setPosterTitle(p.title);
    setPosterCategory(p.category);
    setPosterPrice(p.price);
    setPosterDiscountPrice(p.discountPrice || '');
    setPosterDesc(p.description || '');
    setPosterImage(p.image || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePosterClick = async (id) => {
    if (window.confirm("Are you sure you want to delete this poster?")) {
      await deletePoster(id);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    await updateOrderStatus(orderId, newStatus);
    alert(`Order #${orderId} marked as ${newStatus}`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-8">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-2 p-3 glass-panel border border-zinc-200/50 dark:border-zinc-800 rounded-3xl h-fit lg:min-h-[500px]">
        
        {/* Profile overview */}
        <div className="hidden lg:block pb-4 mb-4 border-b border-zinc-200 dark:border-zinc-800 text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg mx-auto mb-2 shadow-md">
            {session.name ? session.name.substring(0, 2).toUpperCase() : 'AD'}
          </div>
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">{session.name || 'Admin'}</span>
          <span className="text-[9px] text-zinc-400 font-semibold">{session.email}</span>
        </div>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 lg:flex-none px-4 py-3 rounded-2xl font-bold text-xs md:text-sm flex items-center justify-center lg:justify-start space-x-2.5 transition-all duration-300 ${
            activeTab === 'dashboard'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/55'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 lg:flex-none px-4 py-3 rounded-2xl font-bold text-xs md:text-sm flex items-center justify-center lg:justify-start space-x-2.5 transition-all duration-300 ${
            activeTab === 'inventory'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/55'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Inventory Manager</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 lg:flex-none px-4 py-3 rounded-2xl font-bold text-xs md:text-sm flex items-center justify-center lg:justify-start space-x-2.5 transition-all duration-300 ${
            activeTab === 'orders'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/55'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Orders Manager</span>
        </button>

        {/* Return to shop */}
        <a
          href="http://localhost:5173/"
          className="hidden lg:flex px-4 py-3 rounded-2xl font-bold text-xs md:text-sm items-center space-x-2.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/55 mt-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Shop</span>
        </a>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="px-4 py-3 rounded-2xl font-bold text-xs md:text-sm flex items-center justify-center lg:justify-start space-x-2.5 text-red-500 hover:bg-red-500/10 transition-all mt-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Stats Cards (Neomorphic) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-md flex items-center space-x-4">
                  <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Total Revenue</span>
                    <span className="font-inter text-2xl font-extrabold text-zinc-900 dark:text-white">
                      {formatPrice(revenue)}
                    </span>
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-md flex items-center space-x-4">
                  <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Order Volume</span>
                    <span className="font-inter text-2xl font-extrabold text-zinc-900 dark:text-white">
                      {totalOrders}
                    </span>
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-md flex items-center space-x-4">
                  <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-500">
                    <Grid className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Unique Designs</span>
                    <span className="font-inter text-2xl font-extrabold text-zinc-900 dark:text-white">
                      {totalPosters}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lower Section: Charts + Recent Orders */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Category breakdown (Visual progress bars) */}
                <div className="glass-panel p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-md lg:col-span-1">
                  <h3 className="font-outfit text-base font-bold text-zinc-900 dark:text-white mb-6">
                    Sales by Category
                  </h3>
                  <div className="space-y-4">
                    {Object.keys(categorySales).length === 0 ? (
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 text-center py-8">
                        No sales recorded yet.
                      </p>
                    ) : (
                      Object.entries(categorySales).map(([cat, amount]) => {
                        const pct = Math.min((amount / totalCategoryRevenue) * 100, 100);
                        return (
                          <div key={cat} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                              <span>{cat}</span>
                              <span className="font-bold">{formatPrice(amount)}</span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                              <div
                                style={{ width: `${pct}%` }}
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Recent Orders table */}
                <div className="glass-panel p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-md lg:col-span-2 overflow-x-auto">
                  <h3 className="font-outfit text-base font-bold text-zinc-900 dark:text-white mb-6">
                    Recent Store Orders
                  </h3>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold">
                        <th className="pb-3">Order ID</th>
                        <th className="pb-3">Customer</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Total Sum</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/40 dark:divide-zinc-800/40 text-zinc-700 dark:text-zinc-300">
                      {orders.slice(-5).reverse().map((o) => (
                        <tr key={o.id}>
                          <td className="py-3 font-semibold text-blue-600 dark:text-blue-400">#{o.id.substring(0, 8)}</td>
                          <td className="py-3">{o.customerName}</td>
                          <td className="py-3">{new Date(o.date).toLocaleDateString()}</td>
                          <td className="py-3 font-extrabold">{formatPrice(o.total)}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              o.status === 'Completed' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600' :
                              o.status === 'Cancelled' ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600' :
                              'bg-amber-100 dark:bg-amber-950/40 text-amber-600'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-zinc-500 dark:text-zinc-500">
                            No orders found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'inventory' && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 xl:grid-cols-3 gap-8"
            >
              {/* Left Side: Create/Edit Form */}
              <div className="glass-panel p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-md xl:col-span-1 h-fit">
                <h3 className="font-outfit text-base font-bold text-zinc-900 dark:text-white mb-6">
                  {editingId ? 'Edit Product Poster' : 'Add New Poster'}
                </h3>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                      Poster Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Iron Man Mark L"
                      value={posterTitle}
                      onChange={(e) => setPosterTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                      Category *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Marvel, DC, Motivation"
                      value={posterCategory}
                      onChange={(e) => setPosterCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                        Regular Price (₹) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="25.99"
                        value={posterPrice}
                        onChange={(e) => setPosterPrice(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                        Discount Price (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="19.99"
                        value={posterDiscountPrice}
                        onChange={(e) => setPosterDiscountPrice(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                      Poster Image *
                    </label>
                    <div className="relative group border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {posterImage ? (
                        <div className="text-center">
                          <img
                            src={posterImage}
                            alt="Preview"
                            className="w-16 h-20 object-cover rounded-md mx-auto mb-2 border border-zinc-200 dark:border-zinc-800 bg-white"
                          />
                          <span className="text-[9px] text-emerald-500 font-bold block">Image Uploaded</span>
                        </div>
                      ) : (
                        <div className="text-center text-zinc-400">
                          <Upload className="w-5 h-5 mx-auto mb-1 text-zinc-400" />
                          <span className="text-[10px] font-semibold">Upload Poster Image</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Enter premium description details..."
                      value={posterDesc}
                      onChange={(e) => setPosterDesc(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-colors"
                    >
                      {editingId ? 'Update Product' : 'Add Poster to Store'}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setPosterTitle('');
                          setPosterCategory('');
                          setPosterPrice('');
                          setPosterDiscountPrice('');
                          setPosterDesc('');
                          setPosterImage('');
                        }}
                        className="px-4 py-3 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-300 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Right Side: Posters List Table */}
              <div className="glass-panel p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-md xl:col-span-2 overflow-x-auto">
                <h3 className="font-outfit text-base font-bold text-zinc-900 dark:text-white mb-6">
                  Catalog Inventory ({posters.length})
                </h3>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold">
                      <th className="pb-3 w-16">Preview</th>
                      <th className="pb-3">Title</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Regular Price</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/40 dark:divide-zinc-800/40 text-zinc-700 dark:text-zinc-300">
                    {posters.map((p) => (
                      <tr key={p.id} className="group">
                        <td className="py-3">
                          <img
                            src={p.image}
                            alt={p.title}
                            className="w-10 h-14 object-cover rounded-md border border-zinc-200 dark:border-zinc-800 bg-white"
                          />
                        </td>
                        <td className="py-3 font-semibold">{p.title}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-semibold">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3 font-bold">
                          <div>{formatPrice(p.price)}</div>
                          {p.discountPrice && (
                            <span className="text-[10px] text-red-500 font-bold block">Sale: {formatPrice(p.discountPrice)}</span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleEditPosterClick(p)}
                              className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500 text-blue-600 hover:text-white transition-colors"
                              aria-label="Edit product"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePosterClick(p.id)}
                              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white transition-colors"
                              aria-label="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {posters.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-zinc-500 dark:text-zinc-500">
                          Your catalog has no posters. Add some!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass-panel p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-md overflow-x-auto"
            >
              <h3 className="font-outfit text-base font-bold text-zinc-900 dark:text-white mb-6">
                Customer Transactions Log ({orders.length})
              </h3>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold">
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Client Email</th>
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3">Total Amount</th>
                    <th className="pb-3">Modify Status</th>
                    <th className="pb-3 text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/40 dark:divide-zinc-800/40 text-zinc-700 dark:text-zinc-300">
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="py-3 font-semibold text-blue-600 dark:text-blue-400">#{o.id.substring(0, 8)}</td>
                      <td className="py-3">
                        <div className="font-semibold">{o.customerName}</div>
                        <div className="text-[10px] text-zinc-400 dark:text-zinc-500">{o.customerEmail}</div>
                      </td>
                      <td className="py-3">{new Date(o.date).toLocaleString()}</td>
                      <td className="py-3 font-extrabold">{formatPrice(o.total)} <span className="text-[10px] font-semibold text-zinc-400">({o.items.length} items)</span></td>
                      <td className="py-3">
                        <select
                          value={o.status}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => alert(`Order details:\nItems:\n${o.items.map(i => `- ${i.title} (${i.size}, ${i.frame})`).join('\n')}`)}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-zinc-500 dark:text-zinc-500">
                        No orders recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

