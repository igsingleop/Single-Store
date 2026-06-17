import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Calendar, 
  Mail, 
  LogOut, 
  Edit3, 
  User, 
  Phone, 
  MapPin, 
  Check, 
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getOrders, getEstimatedDeliveryDate } from '../utils/db';
import { getUserProfileDetails, updateUserProfileDetails } from '../utils/auth';

export default function AccountView({ setView, user, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [details, setDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState({});

  const avatarInputRef = useRef(null);

  const triggerAvatarUpload = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      alert("Image size should be less than 500KB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result;
      try {
        setLoading(true);
        const response = await updateUserProfileDetails(user.uid, {
          displayName: user.displayName || '',
          photoURL: base64Image,
          phone: details?.phone || '',
          dob: details?.dob || '',
          address: details?.address || '',
          city: details?.city || '',
          pinCode: details?.pinCode || '',
          country: details?.country || 'India',
          contactEmail: details?.contactEmail || user.email || ''
        });
        setDetails(response.details);
      } catch (err) {
        alert(err.message || "Failed to update profile photo.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // Form states
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editPinCode, setEditPinCode] = useState('');
  const [editCountry, setEditCountry] = useState('India');
  const [editPhotoURL, setEditPhotoURL] = useState('');

  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch orders and custom profile details
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const profileDetails = await getUserProfileDetails(user.uid, user.email);
        setDetails(profileDetails);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchOrders = async () => {
      try {
        const data = await getOrders();
        const userOrders = data.filter(order => 
          order.customerEmail && order.customerEmail.toLowerCase() === user.email.toLowerCase()
        );
        setOrders([...userOrders].reverse());
      } catch (err) {
        console.error(err);
      }
    };

    fetchProfileData();
    fetchOrders();

    const handleDbUpdate = () => {
      fetchOrders();
    };

    window.addEventListener('singlestore_db_update', handleDbUpdate);
    return () => {
      window.removeEventListener('singlestore_db_update', handleDbUpdate);
    };
  }, [user.uid, user.email]);

  const enterEditMode = () => {
    setEditName(user.displayName || '');
    setEditPhone(details?.phone || '');
    setEditEmail(details?.contactEmail || user.email || '');
    setEditDob(details?.dob || '');
    setEditAddress(details?.address || '');
    setEditCity(details?.city || '');
    setEditPinCode(details?.pinCode || '');
    setEditCountry(details?.country || 'India');
    setEditPhotoURL(user.photoURL || '');
    setUpdateError('');
    setUpdateSuccess('');
    setIsEditing(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setUpdateError('');
    setUpdateSuccess('');
    setLoading(true);

    try {
      if (!editName.trim()) {
        throw new Error("Display Name cannot be empty.");
      }
      const response = await updateUserProfileDetails(user.uid, {
        displayName: editName.trim(),
        photoURL: editPhotoURL,
        phone: editPhone.trim(),
        dob: editDob,
        address: editAddress.trim(),
        city: editCity.trim(),
        pinCode: editPinCode.trim(),
        country: editCountry.trim(),
        contactEmail: editEmail.trim()
      });

      setDetails(response.details);
      setUpdateSuccess("Profile details saved successfully!");
      setTimeout(() => {
        setIsEditing(false);
        setUpdateSuccess('');
      }, 150);
    } catch (err) {
      setUpdateError(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  const formatPrice = (price) => {
    return 'Rs. ' + parseFloat(price).toFixed(2);
  };

  const getStatusStyle = (status) => {
    if (!status) return 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-250 dark:border-amber-800';
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-250 dark:border-emerald-800';
      case 'cancelled':
        return 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-250 dark:border-rose-800';
      case 'delayed':
        return 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-305 border-red-250 dark:border-red-800';
      case 'placed':
        return 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-250 dark:border-blue-800';
      case 'order received':
        return 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-250 dark:border-indigo-800';
      case 'order packed':
        return 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-250 dark:border-purple-800';
      case 'dispatch':
      case 'on the way':
        return 'bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-250 dark:border-sky-800';
      default:
        return 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-250 dark:border-amber-800';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-12">
      
      {/* Upper Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column Profile Sidebar Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 glass-panel p-8 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-xl flex flex-col items-center text-center"
        >
          {/* Avatar Area with Edit Trigger */}
          <div className="relative group mb-5">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Customer'}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-blue-500/20 shadow-lg bg-white dark:bg-zinc-900 group-hover:border-blue-500 transition-all duration-300"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-650 flex items-center justify-center text-white font-extrabold text-3xl shadow-lg shrink-0 group-hover:from-blue-500 transition-all duration-300">
                {getInitials(user.displayName || user.email)}
              </div>
            )}
            <button
              onClick={triggerAvatarUpload}
              className="absolute -bottom-1.5 -right-1.5 p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md border-2 border-white dark:border-zinc-900 transition-all duration-300"
              title="Edit Profile Picture"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={avatarInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <h2 className="font-outfit text-xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-2 mb-1 justify-center">
            <span>{user.displayName || 'VIP Customer'}</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
              VIP Member
            </span>
          </h2>

          <p className="text-xs text-zinc-400 dark:text-zinc-550 font-medium font-mono mb-6">
            ID: {user.uid.substring(0, 10)}...
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4 w-full mb-8">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 shadow-inner">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Orders Placed</span>
              <span className="text-lg font-black text-zinc-800 dark:text-white">{orders.length}</span>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 shadow-inner">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Wallet Credit</span>
              <span className="text-lg font-black text-emerald-500">Rs. 0.00</span>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={onLogout}
            className="w-full py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 border border-rose-100 dark:border-rose-900/30 font-bold text-xs flex items-center justify-center gap-2 transition-all duration-300 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out Account</span>
          </button>
        </motion.div>

        {/* Right Columns Main Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Dashboard Navigation Tabs */}
          <div className="glass-panel p-2.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 shadow-lg flex space-x-2">
            <button
              onClick={() => { setActiveTab('profile'); setIsEditing(false); }}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Personal Profile</span>
            </button>
            <button
              onClick={() => { setActiveTab('orders'); setIsEditing(false); }}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                activeTab === 'orders'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Order History</span>
            </button>
          </div>

          {/* Tabs Inner Panel */}
          <div className="glass-panel p-8 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-xl min-h-[400px] relative">
            
            {activeTab === 'profile' && (
              <AnimatePresence mode="wait">
                {!isEditing ? (
                  <motion.div
                    key="read-mode"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-800">
                      <div>
                        <h3 className="font-outfit text-xl font-extrabold text-zinc-900 dark:text-white">
                          Profile Details
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Verify and manage your personal details
                        </p>
                      </div>
                      <button
                        onClick={enterEditMode}
                        className="px-4 py-2 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-100 dark:border-blue-900/30 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Details</span>
                      </button>
                    </div>

                    {/* Information Details Card Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Name Card */}
                      <div className="p-5 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl flex items-start gap-4 shadow-sm">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                          <User className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Full Name</span>
                          <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100">{user.displayName || 'Not Set'}</span>
                        </div>
                      </div>
 
                      {/* Phone Number */}
                      <div className="p-5 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl flex items-start gap-4 shadow-sm">
                        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0">
                          <Phone className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Phone Number</span>
                          <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100">{details?.phone || 'Not Set'}</span>
                        </div>
                      </div>
 
                      {/* Preferred Contact Email */}
                      <div className="p-5 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl flex items-start gap-4 shadow-sm">
                        <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-500 shrink-0">
                          <Mail className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Contact Email</span>
                          <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100">{details?.contactEmail || user.email || 'Not Set'}</span>
                        </div>
                      </div>
 
                      {/* Date of Birth */}
                      <div className="p-5 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl flex items-start gap-4 shadow-sm">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                          <Calendar className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Date of Birth</span>
                          <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100">
                            {details?.dob ? new Date(details.dob).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Not Set'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Address Box */}
                    <div className="p-5 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl flex items-start gap-4 shadow-sm w-full">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                        <MapPin className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Primary Shipping Address</span>
                        {details?.address || details?.city || details?.pinCode ? (
                          <div className="space-y-0.5">
                            <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100 block">{details.address}</span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold">
                              {details.city}, {details.pinCode}
                            </span>
                            <span className="text-[11px] text-zinc-400 uppercase tracking-widest font-black block">
                              {details.country || 'India'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm font-extrabold text-zinc-400 italic">No shipping address provided yet.</span>
                        )}
                      </div>
                    </div>

                  </motion.div>
                ) : (
                  <motion.div
                    key="edit-mode"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Form Header */}
                    <div className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
                      <h3 className="font-outfit text-xl font-extrabold text-zinc-900 dark:text-white">
                        Edit Profile Details
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Update your profile values and save to finalize
                      </p>
                    </div>

                    {updateError && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl">
                        {updateError}
                      </div>
                    )}
                    {updateSuccess && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-1.5">
                        <Check className="w-4 h-4" />
                        <span>{updateSuccess}</span>
                      </div>
                    )}

                    <form onSubmit={handleSaveProfile} className="space-y-5">
                      
                      {/* Name / Phone Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block mb-1.5">
                            Full Name
                          </label>
                          <input
                            type="text"
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block mb-1.5">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            placeholder="+91 99999 99999"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                          />
                        </div>
                      </div>

                      {/* Email / DOB Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block mb-1.5">
                            Contact Email
                          </label>
                          <input
                            type="email"
                            required
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block mb-1.5">
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            value={editDob}
                            onChange={(e) => setEditDob(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                          />
                        </div>
                      </div>

                      {/* Address Fields */}
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block mb-1.5">
                          Street Address
                        </label>
                        <input
                          type="text"
                          placeholder="Apt, Suite, Building Name, Street..."
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block mb-1.5">
                            City
                          </label>
                          <input
                            type="text"
                            placeholder="City"
                            value={editCity}
                            onChange={(e) => setEditCity(e.target.value)}
                            className="w-full px-3 py-3 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block mb-1.5">
                            PIN Code
                          </label>
                          <input
                            type="text"
                            placeholder="Pin"
                            value={editPinCode}
                            onChange={(e) => setEditPinCode(e.target.value)}
                            className="w-full px-3 py-3 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block mb-1.5">
                            Country
                          </label>
                          <input
                            type="text"
                            disabled
                            value={editCountry}
                            className="w-full px-3 py-3 rounded-xl text-xs bg-zinc-200 dark:bg-zinc-800 text-zinc-550 border border-zinc-350 dark:border-zinc-700 cursor-not-allowed font-semibold"
                          />
                        </div>
                      </div>

                      {/* Profile Photo Upload */}
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block mb-2.5">
                          Profile Photo
                        </label>
                        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-inner">
                          {/* Preview avatar */}
                          <div className="relative shrink-0">
                            {editPhotoURL ? (
                              <img
                                src={editPhotoURL}
                                alt="Profile Preview"
                                className="w-16 h-16 rounded-2xl object-cover border border-zinc-200 dark:border-zinc-800 shadow-sm"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-650 flex items-center justify-center text-white font-extrabold text-2xl shadow-md">
                                {getInitials(editName || user.email)}
                              </div>
                            )}
                            {editPhotoURL && (
                              <button
                                type="button"
                                onClick={() => setEditPhotoURL('')}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm"
                                title="Remove photo"
                              >
                                ✕
                              </button>
                            )}
                          </div>

                          <div className="flex-1 space-y-2 text-center sm:text-left">
                            <label className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm transition-all duration-300">
                              <span>Choose Image File</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    if (file.size > 500 * 1024) {
                                      alert("Image size should be less than 500KB.");
                                      return;
                                    }
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setEditPhotoURL(reader.result);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            <p className="text-[9px] text-zinc-400 font-semibold leading-relaxed">
                              Supports JPG, PNG, GIF. Max size: 500KB.
                            </p>
                          </div>
                        </div>

                        {/* Optional Custom Photo URL Input */}
                        <div className="mt-3">
                          <input
                            type="url"
                            placeholder="Or paste custom image URL..."
                            value={editPhotoURL && editPhotoURL.startsWith('data:') ? '' : editPhotoURL}
                            onChange={(e) => setEditPhotoURL(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl text-[11px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                          />
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="flex-1 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 font-bold text-xs border border-zinc-200 dark:border-zinc-700 transition-all"
                        >
                          Cancel Edit
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center"
                        >
                          {loading ? 'Saving Changes...' : 'Save Details'}
                        </button>
                      </div>

                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {activeTab === 'orders' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 animate-fade-in"
              >
                {/* Orders Header */}
                <div className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <h3 className="font-outfit text-xl font-extrabold text-zinc-950 dark:text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>Purchase History ({orders.length})</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Track your orders, bills, and shipping status
                  </p>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-5xl mb-4">📦</div>
                    <h4 className="font-bold text-zinc-700 dark:text-white">No orders found</h4>
                    <p className="text-xs text-zinc-500 mt-1">You haven't ordered any premium posters yet.</p>
                    <button
                      onClick={() => setView('shop')}
                      className="mt-6 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-md shadow-blue-500/10"
                    >
                      Browse Poster Collection
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                    {orders.map((order, idx) => {
                      const isExpanded = !!expandedOrders[order.id];
                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          key={order.id}
                          className="p-5 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 shadow-sm flex flex-col justify-between transition-all duration-300"
                        >
                          {/* Order Collapsed Summary Bar */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Order ID & Status</span>
                              <div className="flex flex-wrap items-center gap-2.5">
                                <span className="text-sm font-black text-zinc-900 dark:text-white font-mono">
                                  #{order.id.substring(0, 14)}
                                </span>
                                <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase inline-block ${getStatusStyle(order.status)}`}>
                                  {order.status || 'Placed'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between sm:justify-end gap-6">
                              <div>
                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block sm:text-right">Grand Total</span>
                                <span className="font-inter text-sm font-black text-zinc-900 dark:text-white">
                                  {formatPrice(order.total)}
                                </span>
                              </div>
                              
                              <button
                                onClick={() => toggleOrderDetails(order.id)}
                                className="px-4 py-2 bg-blue-50 dark:bg-blue-955/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-100 dark:border-blue-900/40 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                              >
                                <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Order Details */}
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-4 mt-4 border-t border-zinc-200/50 dark:border-zinc-800/80 space-y-4">
                                  {/* Info Badges & Delivery Estimate */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-100/30 dark:bg-zinc-955/20 p-4 rounded-xl border border-zinc-200/30 dark:border-zinc-800/50">
                                    <div>
                                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Order Date</span>
                                      <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 font-sans">
                                        <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                        <span>{new Date(order.date).toLocaleDateString()} at {new Date(order.date).toLocaleTimeString()}</span>
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Est. Delivery Date</span>
                                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 font-sans">
                                        <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                        <span>{new Date(getEstimatedDeliveryDate(order.date)).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Order Items list */}
                                  <div className="space-y-3">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Items & Quantities</span>
                                    {order.items && order.items.map((item, itemIdx) => (
                                      <div key={item.cartId || itemIdx} className="flex items-center gap-4 p-2 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-xl border border-zinc-100 dark:border-zinc-800/60">
                                        <img
                                          src={item.image}
                                          alt={item.title}
                                          className="w-10 h-14 object-cover rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between gap-2">
                                            <div>
                                              <h4 className="font-outfit text-xs font-bold text-zinc-800 dark:text-white line-clamp-1">
                                                {item.title}
                                              </h4>
                                              {(item.size || item.frame) && (
                                                <span className="text-[9px] text-zinc-455 dark:text-zinc-500 font-semibold block mt-0.5">
                                                  {item.size} • {item.frame}
                                                </span>
                                              )}
                                            </div>
                                            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 whitespace-nowrap">
                                              Qty: {item.quantity || 1}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <span className="font-inter text-xs font-extrabold text-zinc-800 dark:text-zinc-200 block">
                                            {formatPrice(parseFloat(item.price) * (item.quantity || 1))}
                                          </span>
                                          {(item.quantity || 1) > 1 && (
                                            <span className="text-[8px] text-zinc-400 dark:text-zinc-500 block font-medium">
                                              {formatPrice(item.price)} each
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

          </div>
        </motion.div>

      </div>
    </div>
  );
}
