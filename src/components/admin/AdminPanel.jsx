import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Package,
  ShoppingBag,
  Trash2,
  Edit3,
  DollarSign,
  Grid,
  Upload,
  Download,
  Database,
  LogOut,
  ArrowLeft,
  Ticket,
  Users,
  Search,
  FileSpreadsheet,
  Eye,
  X,
  ChevronRight
} from 'lucide-react';
import {
  getPosters,
  addPoster,
  updatePoster,
  deletePoster,
  getOrders,
  updateOrderStatus,
  savePosters,
  deleteOrder,
  getCoupons,
  addCoupon,
  deleteCoupon,
  getCustomers,
  syncCustomersFromOrders,
  getEstimatedDeliveryDate
} from '../../utils/db';

export default function AdminPanel({ session, onLogout, onBackToStore = () => window.location.href = '/' }) {
  // Default to inventory management workspace
  const [activeTab, setActiveTab] = useState('inventory');
  const [posters, setPosters] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Form states for creating/editing poster
  const [editingId, setEditingId] = useState(null);
  const [posterTitle, setPosterTitle] = useState('');
  const [posterCategory, setPosterCategory] = useState('');
  const [posterPrice, setPosterPrice] = useState('');
  const [posterDiscountPrice, setPosterDiscountPrice] = useState('');
  const [posterDesc, setPosterDesc] = useState('');
  const [posterImage, setPosterImage] = useState('');
  
  // Custom image input mode: file upload or external URL
  const [imageInputMode, setImageInputMode] = useState('file'); // 'file' or 'url'
  const [imageUploading, setImageUploading] = useState(false);

  const [addMode, setAddMode] = useState('single'); // 'single' or 'multiple'
  const [multiplePosters, setMultiplePosters] = useState([
    { id: '1', title: '', category: '', price: '', discountPrice: '', description: '', image: '', imageInputMode: 'url', uploading: false }
  ]);

  // Coupon form states
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState('percentage');
  const [couponValue, setCouponValue] = useState('');
  const [couponMinAmount, setCouponMinAmount] = useState('');

  // Customer search, sort, and detail states
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSortBy, setCustomerSortBy] = useState('spent'); // 'spent', 'orders', 'name', 'recent'
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [syncingCustomers, setSyncingCustomers] = useState(false);

  useEffect(() => {
    // Initial fetch
    const fetchAllData = async () => {
      const dbPosters = await getPosters();
      const dbOrders = await getOrders();
      const dbCoupons = await getCoupons();
      let dbCustomers = await getCustomers();

      // Automatically sync customer profiles if none exist but orders do
      if (dbCustomers.length === 0 && dbOrders.length > 0) {
        setSyncingCustomers(true);
        try {
          await syncCustomersFromOrders(dbOrders);
          dbCustomers = await getCustomers();
        } catch (e) {
          console.error("Auto-sync customers error:", e);
        } finally {
          setSyncingCustomers(false);
        }
      }

      setPosters(dbPosters);
      setOrders(dbOrders);
      setCoupons(dbCoupons);
      setCustomers(dbCustomers);
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

  const getStatusBadgeClass = (status) => {
    if (!status) return 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400';
    switch (status) {
      case 'Delivered':
      case 'Completed':
        return 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400';
      case 'Cancelled':
        return 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400';
      case 'Delayed':
        return 'bg-red-100 dark:bg-red-950/40 text-red-650 dark:text-red-400';
      case 'Placed':
        return 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400';
      case 'Order Received':
        return 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400';
      case 'Order Packed':
        return 'bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400';
      case 'Dispatch':
      case 'On the way':
        return 'bg-sky-100 dark:bg-sky-950/40 text-sky-655 dark:text-sky-400';
      default:
        return 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400';
    }
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
  // Client-side image compression using canvas
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const originalBase64 = evt.target.result;
      
      setImageUploading(true);
      fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: originalBase64,
          filename: file.name
        })
      })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Upload failed with status ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.success && data.url) {
          setPosterImage(data.url);
        } else {
          throw new Error('Upload succeeded but no public URL returned');
        }
      })
      .catch((err) => {
        console.warn("Backblaze B2 upload failed, using local Base64 string fallback:", err);
        alert("B2 storage not available or configured. Image saved to local session. (" + err.message + ")");
        setPosterImage(originalBase64);
      })
      .finally(() => {
        setImageUploading(false);
      });
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

  const handleMultipleImageUpload = (index, file) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const originalBase64 = evt.target.result;

      setMultiplePosters(prev => prev.map((item, idx) => 
        idx === index ? { ...item, uploading: true } : item
      ));

      fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: originalBase64,
          filename: file.name
        })
      })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Upload failed with status ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.success && data.url) {
          setMultiplePosters(prev => prev.map((item, idx) => 
            idx === index ? { ...item, image: data.url, uploading: false } : item
          ));
        } else {
          throw new Error('No public URL returned');
        }
      })
      .catch((err) => {
        console.warn("Backblaze B2 upload failed, using local Base64 fallback:", err);
        setMultiplePosters(prev => prev.map((item, idx) => 
          idx === index ? { ...item, image: originalBase64, uploading: false } : item
        ));
      });
    };
    reader.readAsDataURL(file);
  };

  const handleBulkImagesSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach((file, fIdx) => {
      const tempId = Date.now().toString() + Math.random().toString(36).substring(2, 6) + '-' + fIdx;
      const newRow = {
        id: tempId,
        title: file.name.substring(0, file.name.lastIndexOf('.')) || file.name,
        category: '',
        price: '',
        discountPrice: '',
        description: '',
        image: '',
        imageInputMode: 'file',
        uploading: true
      };

      setMultiplePosters(prev => {
        if (prev.length === 1 && !prev[0].title && !prev[0].image && !prev[0].uploading) {
          return [newRow];
        }
        return [...prev, newRow];
      });

      const reader = new FileReader();
      reader.onload = (evt) => {
        const originalBase64 = evt.target.result;

        fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            image: originalBase64,
            filename: file.name
          })
        })
        .then(async (res) => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Upload failed with status ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data.success && data.url) {
            setMultiplePosters(prev => prev.map((item) => 
              item.id === tempId ? { ...item, image: data.url, uploading: false } : item
            ));
          } else {
            throw new Error('No public URL returned');
          }
        })
        .catch((err) => {
          console.warn("Backblaze B2 upload failed, using local Base64 fallback:", err);
          setMultiplePosters(prev => prev.map((item) => 
            item.id === tempId ? { ...item, image: originalBase64, uploading: false } : item
          ));
        });
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const addMultipleRow = () => {
    setMultiplePosters(prev => [
      ...prev,
      {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
        title: '',
        category: '',
        price: '',
        discountPrice: '',
        description: '',
        image: '',
        imageInputMode: 'url',
        uploading: false
      }
    ]);
  };

  const removeMultipleRow = (index) => {
    setMultiplePosters(prev => {
      const updated = prev.filter((_, idx) => idx !== index);
      if (updated.length === 0) {
        return [{
          id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
          title: '',
          category: '',
          price: '',
          discountPrice: '',
          description: '',
          image: '',
          imageInputMode: 'url',
          uploading: false
        }];
      }
      return updated;
    });
  };

  const updateMultipleField = (index, field, value) => {
    setMultiplePosters(prev => prev.map((item, idx) => 
      idx === index ? { ...item, [field]: value } : item
    ));
  };

  const handleMultipleSubmit = async (e) => {
    e.preventDefault();

    const invalidItem = multiplePosters.find(item => !item.title.trim() || !item.category.trim() || !item.price || isNaN(parseFloat(item.price)));
    if (invalidItem) {
      alert("Please fill in Poster Title, Category, and a valid Regular Price for all rows.");
      return;
    }

    const stillUploading = multiplePosters.some(item => item.uploading);
    if (stillUploading) {
      alert("Some images are still uploading. Please wait for them to finish.");
      return;
    }

    let count = 0;
    for (const item of multiplePosters) {
      const newPoster = {
        id: (Date.now() + count).toString(),
        title: item.title.trim(),
        category: item.category.trim(),
        price: parseFloat(item.price),
        discountPrice: item.discountPrice ? parseFloat(item.discountPrice) : null,
        description: item.description.trim(),
        image: item.image || 'https://via.placeholder.com/400x600?text=No+Image'
      };
      await addPoster(newPoster);
      count++;
    }

    alert(`Successfully added ${multiplePosters.length} posters to the catalog!`);
    
    setMultiplePosters([
      {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
        title: '',
        category: '',
        price: '',
        discountPrice: '',
        description: '',
        image: '',
        imageInputMode: 'url',
        uploading: false
      }
    ]);
  };

  const handleEditPosterClick = (p) => {
    setEditingId(p.id);
    setPosterTitle(p.title);
    setPosterCategory(p.category);
    setPosterPrice(p.price);
    setPosterDiscountPrice(p.discountPrice || '');
    setPosterDesc(p.description || '');
    setPosterImage(p.image || '');
    setImageInputMode(p.image && p.image.startsWith('data:') ? 'file' : 'url');
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

  const handleDeleteOrderClick = async (id) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      await deleteOrder(id);
      alert("Order deleted successfully!");
    }
  };

  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    if (!couponCode || !couponValue) return;

    await addCoupon({
      code: couponCode.trim().toUpperCase(),
      type: couponType,
      value: parseFloat(couponValue),
      minAmount: parseFloat(couponMinAmount || 0)
    });

    setCouponCode('');
    setCouponValue('');
    setCouponMinAmount('');
    alert("Coupon added successfully!");
  };

  const handleDeleteCoupon = async (code) => {
    if (window.confirm(`Are you sure you want to delete coupon ${code}?`)) {
      await deleteCoupon(code);
      alert("Coupon deleted successfully!");
    }
  };

  // --- BULK OPERATIONS ---
  const handleBulkExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(posters, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `singlestore_inventory_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleBulkImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const importedList = JSON.parse(evt.target.result);
        if (!Array.isArray(importedList)) {
          alert("Invalid import format. Expected an array of products.");
          return;
        }

        // Validate structure
        for (const item of importedList) {
          if (!item.title || !item.category || item.price == null) {
            alert("Each product must have a title, category, and price.");
            return;
          }
          if (!item.id) {
            item.id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
          }
        }

        if (window.confirm(`Are you sure you want to import ${importedList.length} products? This will merge with your current inventory.`)) {
          const currentPosters = [...posters];
          for (const item of importedList) {
            const index = currentPosters.findIndex(p => String(p.id) === String(item.id));
            if (index > -1) {
              currentPosters[index] = item;
            } else {
              currentPosters.push(item);
            }
          }
          await savePosters(currentPosters);
          alert("Inventory imported successfully!");
        }
      } catch (err) {
        alert("Failed to parse JSON file: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  const handleExportCustomersCSV = () => {
    if (customers.length === 0) {
      alert("No customer profiles to export.");
      return;
    }

    const headers = ["Customer Name", "Email", "Phone", "Total Orders", "Total Spent (Rs.)", "Shipping Address", "Last Order Date"];

    const rows = customers.map(c => [
      c.name || "Anonymous Customer",
      c.email || "",
      c.phone || "",
      c.orderCount || 0,
      (c.totalSpent || 0).toFixed(2),
      c.address || "",
      c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleString() : "N/A"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `singlestore_customers_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCustomers = customers.filter(c => {
    const query = customerSearchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (c.name && c.name.toLowerCase().includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query)) ||
      (c.phone && c.phone.includes(query)) ||
      (c.address && c.address.toLowerCase().includes(query))
    );
  }).sort((a, b) => {
    if (customerSortBy === 'spent') {
      return (b.totalSpent || 0) - (a.totalSpent || 0);
    } else if (customerSortBy === 'orders') {
      return (b.orderCount || 0) - (a.orderCount || 0);
    } else if (customerSortBy === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    } else if (customerSortBy === 'recent') {
      return new Date(b.lastOrderDate || 0) - new Date(a.lastOrderDate || 0);
    }
    return 0;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-12 flex flex-col lg:flex-row gap-6 md:gap-8">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-2 p-2 sm:p-3 glass-panel border border-zinc-200/50 dark:border-zinc-800 rounded-2xl lg:rounded-3xl h-fit lg:min-h-[500px] overflow-x-auto scrollbar-none flex-nowrap lg:flex-wrap lg:overflow-visible">
        
        {/* Profile overview */}
        <div className="hidden lg:block pb-4 mb-4 border-b border-zinc-200 dark:border-zinc-800 text-center w-full animate-none">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-650 flex items-center justify-center text-white font-extrabold text-lg mx-auto mb-2 shadow-md">
            {session.name ? session.name.substring(0, 2).toUpperCase() : 'AD'}
          </div>
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">{session.name || 'Admin'}</span>
          <span className="text-[9px] text-zinc-400 font-semibold">{session.email}</span>
        </div>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`shrink-0 lg:shrink flex-1 lg:flex-none px-4 py-3 rounded-xl sm:rounded-2xl font-bold text-xs md:text-sm flex items-center justify-center lg:justify-start space-x-2 transition-all duration-300 ${
            activeTab === 'inventory'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/55'
          }`}
        >
          <Package className="w-4 h-4 animate-none" />
          <span>Inventory</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`shrink-0 lg:shrink flex-1 lg:flex-none px-4 py-3 rounded-xl sm:rounded-2xl font-bold text-xs md:text-sm flex items-center justify-center lg:justify-start space-x-2 transition-all duration-300 ${
            activeTab === 'orders'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/55'
          }`}
        >
          <ShoppingBag className="w-4 h-4 animate-none" />
          <span>Orders</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`shrink-0 lg:shrink flex-1 lg:flex-none px-4 py-3 rounded-xl sm:rounded-2xl font-bold text-xs md:text-sm flex items-center justify-center lg:justify-start space-x-2 transition-all duration-300 ${
            activeTab === 'customers'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/55'
          }`}
        >
          <Users className="w-4 h-4 animate-none" />
          <span>Customers</span>
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={`shrink-0 lg:shrink flex-1 lg:flex-none px-4 py-3 rounded-xl sm:rounded-2xl font-bold text-xs md:text-sm flex items-center justify-center lg:justify-start space-x-2 transition-all duration-300 ${
            activeTab === 'coupons'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/55'
          }`}
        >
          <Ticket className="w-4 h-4 animate-none" />
          <span>Coupons</span>
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`shrink-0 lg:shrink flex-1 lg:flex-none px-4 py-3 rounded-xl sm:rounded-2xl font-bold text-xs md:text-sm flex items-center justify-center lg:justify-start space-x-2 transition-all duration-300 ${
            activeTab === 'dashboard'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/55'
          }`}
        >
          <TrendingUp className="w-4 h-4 animate-none" />
          <span>Dashboard</span>
        </button>

        {/* Return to shop */}
        <button
          onClick={onBackToStore}
          className="hidden lg:flex px-4 py-3 rounded-2xl font-bold text-xs md:text-sm items-center space-x-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/55 mt-auto text-left w-full transition-all"
        >
          <ArrowLeft className="w-4 h-4 animate-none" />
          <span>Return to Shop</span>
        </button>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="shrink-0 lg:shrink px-4 py-3 rounded-xl sm:rounded-2xl font-bold text-xs md:text-sm flex items-center justify-center lg:justify-start space-x-2 text-red-500 hover:bg-red-500/10 transition-all lg:mt-2"
        >
          <LogOut className="w-4 h-4 animate-none" />
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
                <div className="glass-panel p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-md lg:col-span-2 overflow-x-auto font-sans">
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
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${getStatusBadgeClass(o.status)}`}>
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
              className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start"
            >
              {/* Left Column (Create/Edit Form + Bulk Actions) */}
              <div className={`space-y-6 ${addMode === 'multiple' && !editingId ? 'xl:col-span-3' : 'xl:col-span-1'}`}>
                {/* Create/Edit Form */}
                {addMode === 'multiple' && !editingId ? (
                  <div className="glass-panel p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-md">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                      <div>
                        <h3 className="font-outfit text-lg font-bold text-zinc-900 dark:text-white">
                          Add Multiple Posters
                        </h3>
                        <p className="text-zinc-400 text-xs mt-1">
                          Add multiple items at once by filling out the table or uploading images in bulk.
                        </p>
                      </div>
                      <div className="flex bg-zinc-150 dark:bg-zinc-800/80 rounded-xl p-1 text-xs font-bold gap-1 self-stretch sm:self-auto border border-zinc-200/50 dark:border-zinc-800 shadow-neo-in">
                        <button
                          type="button"
                          onClick={() => setAddMode('single')}
                          className="px-4 py-2 rounded-lg text-zinc-550 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all font-semibold"
                        >
                          Single Poster
                        </button>
                        <button
                          type="button"
                          className="px-4 py-2 rounded-lg bg-blue-600 text-white shadow font-semibold"
                        >
                          Multiple Posters
                        </button>
                      </div>
                    </div>

                    {/* Bulk Upload Section */}
                    <div className="border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 rounded-2xl p-6 text-center transition-all bg-zinc-50/30 dark:bg-zinc-900/10 mb-6 relative group cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleBulkImagesSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className="w-8 h-8 mx-auto mb-2 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200 block mb-1">
                        Bulk Upload Poster Images
                      </span>
                      <span className="text-[10px] text-zinc-450 font-medium leading-relaxed block">
                        Drag & drop or click to select multiple files. This will automatically generate a row for each image!
                      </span>
                    </div>

                    {/* Table Container */}
                    <div className="overflow-x-auto border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl mb-6">
                      <table className="w-full text-left text-xs border-collapse min-w-[800px]">
                        <thead>
                          <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-850 text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                            <th className="p-3 w-12 text-center">#</th>
                            <th className="p-3 w-52">Image Source</th>
                            <th className="p-3 w-64">Poster Details</th>
                            <th className="p-3 w-44">Pricing</th>
                            <th className="p-3">Description</th>
                            <th className="p-3 w-12 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200/40 dark:divide-zinc-800/40 text-zinc-700 dark:text-zinc-300">
                          {multiplePosters.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-955/10">
                              <td className="p-3 text-center font-bold text-zinc-400">{idx + 1}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-14 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white flex items-center justify-center shrink-0 overflow-hidden relative">
                                    {item.uploading ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                                    ) : item.image ? (
                                      <img src={item.image} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-[9px] text-zinc-400">No Image</span>
                                    )}
                                  </div>
                                  <div className="flex-1 space-y-1 min-w-[120px]">
                                    <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded p-0.5 text-[8px] font-bold w-fit border border-zinc-200/50 dark:border-zinc-700">
                                      <button
                                        type="button"
                                        onClick={() => updateMultipleField(idx, 'imageInputMode', 'file')}
                                        className={`px-1.5 py-0.5 rounded transition-all ${
                                          item.imageInputMode === 'file' ? 'bg-white dark:bg-zinc-750 text-blue-600' : 'text-zinc-500'
                                        }`}
                                      >
                                        File
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => updateMultipleField(idx, 'imageInputMode', 'url')}
                                        className={`px-1.5 py-0.5 rounded transition-all ${
                                          item.imageInputMode === 'url' ? 'bg-white dark:bg-zinc-750 text-blue-600' : 'text-zinc-500'
                                        }`}
                                      >
                                        URL
                                      </button>
                                    </div>

                                    {item.imageInputMode === 'file' ? (
                                      <div className="relative">
                                        <button className="w-full py-1 px-1.5 bg-zinc-100 hover:bg-zinc-250 dark:bg-zinc-800 dark:hover:bg-zinc-750 border border-zinc-250 dark:border-zinc-700 rounded text-[9px] font-bold transition-all relative overflow-hidden text-zinc-700 dark:text-zinc-300">
                                          {item.image ? 'Change' : 'Upload'}
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                              const file = e.target.files[0];
                                              if (file) handleMultipleImageUpload(idx, file);
                                            }}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                          />
                                        </button>
                                      </div>
                                    ) : (
                                      <input
                                        type="text"
                                        placeholder="Image URL"
                                        value={item.image && !item.image.startsWith('data:') ? item.image : ''}
                                        onChange={(e) => updateMultipleField(idx, 'image', e.target.value)}
                                        className="w-full px-1.5 py-1 text-[9px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 text-zinc-800 dark:text-zinc-150 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                                      />
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="space-y-1.5">
                                  <input
                                    type="text"
                                    required
                                    placeholder="Poster Title *"
                                    value={item.title}
                                    onChange={(e) => updateMultipleField(idx, 'title', e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold animate-none"
                                  />
                                  <input
                                    type="text"
                                    required
                                    placeholder="Category *"
                                    value={item.category}
                                    onChange={(e) => updateMultipleField(idx, 'category', e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold animate-none"
                                  />
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[8px] font-bold text-zinc-400 w-12">Regular:</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      required
                                      placeholder="₹25.99"
                                      value={item.price}
                                      onChange={(e) => updateMultipleField(idx, 'price', e.target.value)}
                                      className="w-full px-1.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-850 dark:text-zinc-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                                    />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[8px] font-bold text-zinc-400 w-12">Discount:</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      placeholder="₹19.99"
                                      value={item.discountPrice}
                                      onChange={(e) => updateMultipleField(idx, 'discountPrice', e.target.value)}
                                      className="w-full px-1.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-855 dark:text-zinc-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <textarea
                                  rows={2}
                                  placeholder="Poster description details..."
                                  value={item.description}
                                  onChange={(e) => updateMultipleField(idx, 'description', e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeMultipleRow(idx)}
                                  className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white transition-colors"
                                  aria-label="Delete row"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-between">
                      <button
                        type="button"
                        onClick={addMultipleRow}
                        className="px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-750 text-zinc-850 dark:text-zinc-200 font-bold text-xs shadow-sm transition-colors border border-zinc-250 dark:border-zinc-700"
                      >
                        + Add Empty Row
                      </button>
                      <button
                        onClick={handleMultipleSubmit}
                        className="px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-505 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-colors"
                      >
                        Save All Posters
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="glass-panel p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-md h-fit">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                      <h3 className="font-outfit text-base font-bold text-zinc-900 dark:text-white">
                        {editingId ? 'Edit Product Poster' : 'Add New Poster'}
                      </h3>
                      {!editingId && (
                        <div className="flex bg-zinc-150 dark:bg-zinc-800/80 rounded-xl p-1 text-xs font-bold gap-1 border border-zinc-200/50 dark:border-zinc-800 shadow-neo-in">
                          <button
                            type="button"
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white shadow font-semibold"
                          >
                            Single Poster
                          </button>
                          <button
                            type="button"
                            onClick={() => setAddMode('multiple')}
                            className="px-4 py-2 rounded-lg text-zinc-550 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all font-semibold"
                          >
                            Multiple Posters
                          </button>
                        </div>
                      )}
                    </div>
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

                      {/* Dual Image Input Mode */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                            Poster Image *
                          </label>
                          <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 text-[9px] font-bold">
                            <button
                              type="button"
                              onClick={() => { setImageInputMode('file'); }}
                              className={`px-2.5 py-1 rounded-md transition-all ${
                                imageInputMode === 'file'
                                  ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-650 dark:text-blue-400'
                                  : 'text-zinc-500'
                              }`}
                            >
                              Upload File
                            </button>
                            <button
                              type="button"
                              onClick={() => { setImageInputMode('url'); }}
                              className={`px-2.5 py-1 rounded-md transition-all ${
                                imageInputMode === 'url'
                                  ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-650 dark:text-blue-400'
                                  : 'text-zinc-500'
                              }`}
                            >
                              Image URL
                            </button>
                          </div>
                        </div>

                        {imageInputMode === 'file' ? (
                          <div className="relative group border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={imageUploading}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            />
                            {imageUploading ? (
                              <div className="text-center text-blue-500">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto mb-1" />
                                <span className="text-[10px] font-bold block">Uploading to B2 Cloud...</span>
                              </div>
                            ) : posterImage ? (
                              <div className="text-center">
                                <img
                                  src={posterImage}
                                  alt="Preview"
                                  className="w-16 h-20 object-cover rounded-md mx-auto mb-2 border border-zinc-200 dark:border-zinc-800 bg-white"
                                  onError={(e) => { e.target.src = 'https://via.placeholder.com/400x600?text=Preview+Error'; }}
                                />
                                <span className="text-[9px] text-emerald-500 font-bold block">
                                  {posterImage.startsWith('data:') ? 'Image Loaded (Local Session)' : 'Image Stored in B2 Cloud'}
                                </span>
                              </div>
                            ) : (
                              <div className="text-center text-zinc-400">
                                <Upload className="w-5 h-5 mx-auto mb-1 text-zinc-400" />
                                <span className="text-[10px] font-semibold">Upload Poster Image</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="https://images.unsplash.com/photo-..."
                              value={posterImage && !posterImage.startsWith('data:image/') ? posterImage : ''}
                              onChange={(e) => setPosterImage(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                            {posterImage && !posterImage.startsWith('data:image/') && (
                              <div className="text-center">
                                <img
                                  src={posterImage}
                                  alt="Preview"
                                  className="w-16 h-20 object-cover rounded-md mx-auto mb-1 border border-zinc-200 dark:border-zinc-800 bg-white"
                                  onError={(e) => { e.target.src = 'https://via.placeholder.com/400x600?text=Invalid+Image+URL'; }}
                                />
                                <span className="text-[9px] text-zinc-400 font-semibold block">URL Preview</span>
                              </div>
                            )}
                          </div>
                        )}
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
                          disabled={imageUploading}
                          className={`flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-colors ${
                            imageUploading ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {imageUploading ? 'Uploading Image...' : editingId ? 'Update Product' : 'Add Poster to Store'}
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
                )}

                {/* Bulk Operations Tools */}
                <div className="glass-panel p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-md h-fit">
                  <h3 className="font-outfit text-base font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-500" />
                    <span>Bulk Operations</span>
                  </h3>
                  <p className="text-zinc-400 text-[10px] leading-relaxed mb-4">
                    Import or export your entire products inventory list instantly in JSON format.
                  </p>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleBulkExport}
                      className="w-full py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-bold text-xs shadow-sm hover:shadow-neo-in transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Catalog (JSON)</span>
                    </button>

                    <div className="relative border border-dashed border-zinc-300 dark:border-zinc-750 hover:border-blue-500 rounded-xl p-3 flex items-center justify-center cursor-pointer transition-all">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleBulkImport}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Upload className="w-4 h-4" />
                        <span className="text-xs font-semibold">Import Products JSON</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Posters List Table */}
              <div className="glass-panel p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-md xl:col-span-2 overflow-x-auto h-fit">
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
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x600?text=No+Image'; }}
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
                    <th className="pb-3 text-right">Actions</th>
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
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all ${getStatusBadgeClass(o.status)}`}
                        >
                          <option value="Pending" className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100">Pending</option>
                          <option value="Placed" className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100">Placed</option>
                          <option value="Order Received" className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100">Order Received</option>
                          <option value="Order Packed" className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100">Order Packed</option>
                          <option value="Dispatch" className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100">Dispatch</option>
                          <option value="On the way" className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100">On the way</option>
                          <option value="Delayed" className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100">Delayed</option>
                          <option value="Delivered" className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100">Delivered</option>
                          <option value="Completed" className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100">Completed</option>
                          <option value="Cancelled" className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => setSelectedOrderDetails(o)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold transition-colors"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleDeleteOrderClick(o.id)}
                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white transition-colors"
                            title="Delete Order"
                            aria-label="Delete order"
                          >
                            <Trash2 className="w-3.5 h-3.5 animate-none" />
                          </button>
                        </div>
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

          {activeTab === 'customers' && (
            <motion.div
              key="customers"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 font-sans"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-md">
                <div>
                  <h3 className="font-outfit text-base font-bold text-zinc-900 dark:text-white">
                    Customer Profiles Directory
                  </h3>
                  <p className="text-zinc-400 text-xs mt-1 animate-none">
                    Manage customer database, purchase history, and export records for Excel.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleExportCustomersCSV}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-505 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4 animate-none" />
                    <span>Download Excel (.csv)</span>
                  </button>
                </div>
              </div>

              {/* Filters & Search Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div className="relative sm:col-span-2">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                     type="text"
                     placeholder="Search by customer name, email, phone or address..."
                     value={customerSearchQuery}
                     onChange={(e) => setCustomerSearchQuery(e.target.value)}
                     className="w-full pl-10 pr-4 py-3 rounded-2xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-850 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium animate-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Sort By:</span>
                  <select
                    value={customerSortBy}
                    onChange={(e) => setCustomerSortBy(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-850 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-bold transition-all"
                  >
                    <option value="spent">Total Spent</option>
                    <option value="orders">Total Orders</option>
                    <option value="name">Name A-Z</option>
                    <option value="recent">Last Active</option>
                  </select>
                </div>
              </div>

              {syncingCustomers && (
                <div className="text-center py-8 text-xs font-bold text-blue-500 animate-pulse">
                  Syncing and compiling historic customer details from orders...
                </div>
              )}

              {/* Desktop and Tablet Table view */}
              <div className="hidden md:block glass-panel p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-md overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold">
                      <th className="pb-3">Customer Info</th>
                      <th className="pb-3">Contact</th>
                      <th className="pb-3">Default Location</th>
                      <th className="pb-3 text-center">Orders</th>
                      <th className="pb-3 text-right">Spent</th>
                      <th className="pb-3 text-right">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/40 dark:divide-zinc-800/40 text-zinc-700 dark:text-zinc-300">
                    {filteredCustomers.map((c) => (
                      <tr key={c.email} className="hover:bg-zinc-50/20 dark:hover:bg-zinc-850/10 transition-colors">
                        <td className="py-4 font-semibold">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-extrabold text-[11px] shadow-sm">
                              {(c.name || 'C').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-zinc-900 dark:text-white">{c.name || 'Anonymous Customer'}</div>
                              <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">{c.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 font-medium text-zinc-650 dark:text-zinc-350">{c.phone || 'N/A'}</td>
                        <td className="py-4 max-w-[200px] truncate font-medium text-zinc-600 dark:text-zinc-400" title={c.address}>
                          {c.address || 'No address logged'}
                        </td>
                        <td className="py-4 text-center font-bold text-blue-600 dark:text-blue-400">{c.orderCount || 0}</td>
                        <td className="py-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400">{formatPrice(c.totalSpent || 0)}</td>
                        <td className="py-4 text-right font-medium text-zinc-500 dark:text-zinc-500">
                          {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-zinc-500 dark:text-zinc-500">
                          No customer profiles found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards view */}
              <div className="block md:hidden space-y-4">
                {filteredCustomers.map((c) => (
                  <div key={c.email} className="glass-panel p-5 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-md space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-extrabold text-xs shadow-sm">
                        {(c.name || 'C').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-sm text-zinc-900 dark:text-white truncate">
                          {c.name || 'Anonymous Customer'}
                        </div>
                        <div className="text-[10px] text-zinc-450 truncate">{c.email}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center bg-zinc-50/50 dark:bg-zinc-900/50 p-2.5 rounded-2xl border border-zinc-150 dark:border-zinc-850">
                      <div>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase block">Total Orders</span>
                        <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">{c.orderCount || 0}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase block">Total Spent</span>
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">{formatPrice(c.totalSpent || 0)}</span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1.5 text-zinc-650 dark:text-zinc-350 font-medium">
                      <p><strong className="text-zinc-800 dark:text-zinc-200 font-bold">Phone:</strong> {c.phone || 'N/A'}</p>
                      <p className="line-clamp-2"><strong className="text-zinc-800 dark:text-zinc-200 font-bold">Address:</strong> {c.address || 'No address logged'}</p>
                      <p><strong className="text-zinc-800 dark:text-zinc-200 font-bold">Last Active:</strong> {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                ))}
                {filteredCustomers.length === 0 && (
                  <div className="glass-panel p-8 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 text-center text-zinc-500 dark:text-zinc-500">
                    No customer profiles found.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'coupons' && (
            <motion.div
              key="coupons"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start font-sans"
            >
              {/* Left Column: Create Coupon Form */}
              <div className="space-y-6 xl:col-span-1">
                <div className="glass-panel p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-md h-fit">
                  <h3 className="font-outfit text-base font-bold text-zinc-900 dark:text-white mb-6">
                    Add New Coupon
                  </h3>
                  <form onSubmit={handleCouponSubmit} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                        Coupon Code *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. WELCOME10"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="w-full px-4 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                        Discount Type *
                      </label>
                      <select
                        value={couponType}
                        onChange={(e) => setCouponType(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer font-sans"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="flat">Flat Amount (Rs.)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                          Discount Value *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder={couponType === 'percentage' ? "10" : "50"}
                          value={couponValue}
                          onChange={(e) => setCouponValue(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                          Min. Order (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          value={couponMinAmount}
                          onChange={(e) => setCouponMinAmount(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-colors mt-2"
                    >
                      Add Coupon Code
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Coupons List */}
              <div className="glass-panel p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-md xl:col-span-2 overflow-x-auto h-fit">
                <h3 className="font-outfit text-base font-bold text-zinc-900 dark:text-white mb-6">
                  Active Store Coupons ({coupons.length})
                </h3>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold">
                      <th className="pb-3">Code</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Value</th>
                      <th className="pb-3">Min. Purchase</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/40 dark:divide-zinc-800/40 text-zinc-700 dark:text-zinc-300">
                    {coupons.map((c) => (
                      <tr key={c.code} className="group">
                        <td className="py-3 font-mono font-bold text-blue-600 dark:text-blue-400">{c.code}</td>
                        <td className="py-3 capitalize">{c.type}</td>
                        <td className="py-3 font-semibold font-mono">
                          {c.type === 'percentage' ? `${c.value}%` : `Rs. ${parseFloat(c.value).toFixed(2)}`}
                        </td>
                        <td className="py-3 font-semibold font-mono">
                          {c.minAmount > 0 ? `Rs. ${parseFloat(c.minAmount).toFixed(2)}` : 'No Minimum'}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleDeleteCoupon(c.code)}
                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white transition-colors"
                            aria-label="Delete coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {coupons.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-zinc-500 dark:text-zinc-500">
                          No coupons found. Add some coupon codes above!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Order Details Modal Overlay */}
      <AnimatePresence>
        {selectedOrderDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedOrderDetails(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 relative font-sans text-zinc-850 dark:text-zinc-100"
            >
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 animate-none" />
              </button>

              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                  <ShoppingBag className="w-6 h-6 animate-none" />
                </div>
                <div>
                  <h3 className="font-outfit text-lg font-bold text-zinc-900 dark:text-white">
                    Order Details
                  </h3>
                  <p className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5 animate-none">
                    #{selectedOrderDetails.id}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-zinc-150 dark:border-zinc-800/80">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-widest block">
                    Customer Information
                  </h4>
                  <div className="text-xs space-y-1.5 text-zinc-700 dark:text-zinc-300 font-medium">
                    <p><strong className="text-zinc-950 dark:text-white font-bold">Name:</strong> {selectedOrderDetails.customerName}</p>
                    <p><strong className="text-zinc-950 dark:text-white font-bold">Email:</strong> {selectedOrderDetails.customerEmail}</p>
                    <p><strong className="text-zinc-950 dark:text-white font-bold">Phone:</strong> {selectedOrderDetails.customerPhone || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-widest block">
                    Shipping Details
                  </h4>
                  <div className="text-xs space-y-1.5 text-zinc-700 dark:text-zinc-300 font-medium">
                    <p className="leading-relaxed"><strong className="text-zinc-950 dark:text-white font-bold">Address:</strong> {selectedOrderDetails.shippingAddress}</p>
                    <p><strong className="text-zinc-950 dark:text-white font-bold">Date:</strong> {new Date(selectedOrderDetails.date).toLocaleString()}</p>
                    <p className="flex items-center gap-1.5">
                      <strong className="text-zinc-950 dark:text-white font-bold">Status:</strong>{' '}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadgeClass(selectedOrderDetails.status)}`}>
                        {selectedOrderDetails.status}
                      </span>
                    </p>
                    <p><strong className="text-zinc-950 dark:text-white font-bold">Est. Delivery:</strong> {new Date(getEstimatedDeliveryDate(selectedOrderDetails.date)).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>

              {/* Order Metadata */}
              <div className="grid grid-cols-3 gap-2 py-4 border-b border-zinc-150 dark:border-zinc-800/80 text-[10px] font-mono text-zinc-400">
                <div>
                  <span className="block font-bold">Tracking ID:</span>
                  <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{selectedOrderDetails.trackingId || 'N/A'}</span>
                </div>
                <div>
                  <span className="block font-bold">Shipping ID:</span>
                  <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{selectedOrderDetails.shippingId || 'N/A'}</span>
                </div>
                <div>
                  <span className="block font-bold">Invoice ID:</span>
                  <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{selectedOrderDetails.invoiceId || 'N/A'}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="py-6 space-y-4 max-h-[30vh] overflow-y-auto">
                <h4 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-widest mb-2 block">
                  Order Items
                </h4>
                {selectedOrderDetails.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 py-2 border-b border-zinc-100 dark:border-zinc-850/50 last:border-b-0">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-10 h-14 object-cover rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/400x600?text=No+Image'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-outfit text-xs font-bold text-zinc-900 dark:text-white truncate">
                        {item.title}
                      </h5>
                      <p className="text-[10px] text-zinc-450 mt-0.5">
                        {item.size || '18x24"'} / {item.frame || 'Print Only'}
                      </p>
                      <div className="flex justify-between items-baseline mt-1">
                        <span className="text-[11px] font-bold font-inter text-zinc-800 dark:text-zinc-300">
                          {formatPrice(item.price)} x {item.quantity || 1}
                        </span>
                        <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                          {formatPrice(parseFloat(item.price) * (item.quantity || 1))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Totals */}
              <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800/80 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase block">Payment Method</span>
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 font-sans">Razorpay Secure Online</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase block">Grand Total</span>
                  <span className="font-inter text-xl font-extrabold text-zinc-900 dark:text-white">
                    {formatPrice(selectedOrderDetails.total)}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
