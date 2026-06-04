import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Calendar, Award, Receipt, Mail, ShoppingBag } from 'lucide-react';
import { getOrders } from '../utils/db';

export default function AccountView({ setView }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Load orders
    const fetchOrders = async () => {
      const data = await getOrders();
      setOrders([...data].reverse());
    };
    fetchOrders();

    // Sync database events
    const handleDbUpdate = () => {
      fetchOrders();
    };
    window.addEventListener('singlestore_db_update', handleDbUpdate);
    return () => {
      window.removeEventListener('singlestore_db_update', handleDbUpdate);
    };
  }, []);

  const formatPrice = (price) => {
    return 'Rs. ' + parseFloat(price).toFixed(2);
  };

  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'cancelled':
        return 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-12">
      {/* Account Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-md mb-12 flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="flex items-center space-x-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg">
            JD
          </div>
          <div>
            <h2 className="font-outfit text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <span>John Doe</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                VIP Customer
              </span>
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center space-x-1 mt-0.5">
              <Mail className="w-4 h-4 text-zinc-400" />
              <span>guest@singlestore.in</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-center">
          <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-inner">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Total Orders</span>
            <span className="text-xl font-extrabold text-zinc-800 dark:text-white">{orders.length}</span>
          </div>
          <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200/40 dark:border-zinc-800/40 shadow-inner">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Refund Balance</span>
            <span className="text-xl font-extrabold text-emerald-500">Rs. 0.00</span>
          </div>
        </div>
      </motion.div>

      {/* Orders log */}
      <div>
        <h3 className="font-outfit text-2xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center space-x-2">
          <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <span>Purchase History</span>
        </h3>

        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 glass-panel rounded-3xl border border-zinc-200 dark:border-zinc-800"
          >
            <div className="text-4xl mb-4">📦</div>
            <h4 className="font-bold text-zinc-700 dark:text-white">No orders found</h4>
            <p className="text-sm text-zinc-500 mt-1.5">You haven't ordered any premium posters yet.</p>
            <button
              onClick={() => setView('shop')}
              className="mt-6 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors shadow-md"
            >
              Shop Collection
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={order.id}
                className="glass-panel p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-md flex flex-col justify-between"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-extrabold text-zinc-900 dark:text-white">
                        Order #{order.id}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded border text-[10px] font-bold ${getStatusStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(order.date).toLocaleDateString()} at {new Date(order.date).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold block">Total Bill</span>
                    <span className="font-inter text-base font-extrabold text-zinc-900 dark:text-white">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>

                {/* Order Items list */}
                <div className="py-4 space-y-3">
                  {order.items && order.items.map((item, itemIdx) => (
                    <div key={item.cartId || itemIdx} className="flex items-center gap-4">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-12 h-16 object-cover rounded-md border border-zinc-200 dark:border-zinc-800 bg-white"
                      />
                      <div className="flex-1">
                        <h4 className="font-outfit text-xs font-bold text-zinc-800 dark:text-white line-clamp-1">
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">
                          Size: {item.size} / Frame: {item.frame}
                        </p>
                      </div>
                      <span className="font-inter text-xs font-bold text-zinc-900 dark:text-white">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Order Footer / Tracking info mock */}
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center space-x-1.5">
                    <Receipt className="w-4 h-4 text-blue-500" />
                    <span>Razorpay Invoice Generated</span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                    Track Shipment &rarr;
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
