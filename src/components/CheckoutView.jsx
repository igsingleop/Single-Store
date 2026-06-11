import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, ShoppingBag, ArrowLeft } from 'lucide-react';
import { addOrder, saveCart } from '../utils/db';
import { getUserProfileDetails } from '../utils/auth';

// Helpers outside the component to keep the component pure for ESLint
const getTimestamp = () => Date.now();

export default function CheckoutView({
  cart,
  setView,
  onOrderConfirmed,
  user,
  coupons = [],
  appliedCoupon = null,
  setAppliedCoupon
}) {
  const [email, setEmail] = useState(user ? user.email || '' : '');
  const [fname, setFname] = useState(() => {
    if (user && user.displayName) {
      return user.displayName.split(' ')[0] || '';
    }
    return '';
  });
  const [lname, setLname] = useState(() => {
    if (user && user.displayName) {
      const parts = user.displayName.split(' ');
      return parts.slice(1).join(' ') || '';
    }
    return '';
  });
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');

  const [couponCode, setCouponCodeState] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Load custom profile details for auto-prefill
  useEffect(() => {
    const prefillProfileDetails = async () => {
      if (user) {
        try {
          const profile = await getUserProfileDetails(user.uid, user.email);
          if (profile) {
            if (profile.contactEmail) setEmail(profile.contactEmail);
            if (profile.address) setAddress(profile.address);
            if (profile.city) setCity(profile.city);
            if (profile.pinCode) setPinCode(profile.pinCode);
            if (profile.phone) setPhone(profile.phone);
          }
        } catch (e) {
          console.error("Error pre-filling checkout details", e);
        }
      }
    };
    prefillProfileDetails();
  }, [user]);

  // Load Razorpay Script dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.price) * (item.quantity || 1), 0);

  const getDiscount = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percentage') {
      return (subtotal * appliedCoupon.value) / 100;
    } else {
      return appliedCoupon.value;
    }
  };

  const discount = getDiscount();
  const grandTotal = Math.max(0, subtotal - discount);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');

    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    const codeUpper = couponCode.trim().toUpperCase();
    const couponObj = coupons.find(c => c.code.toUpperCase() === codeUpper);

    if (!couponObj) {
      setCouponError('Coupon code not found.');
      return;
    }

    if (subtotal < couponObj.minAmount) {
      setCouponError(`Minimum order value for ${couponObj.code} is Rs. ${couponObj.minAmount.toFixed(2)}`);
      return;
    }

    setAppliedCoupon(couponObj);
    setCouponSuccess(`Coupon ${couponObj.code} applied successfully!`);
    setCouponCodeState('');
  };

  const formatPrice = (price) => {
    return 'Rs. ' + parseFloat(price).toFixed(2);
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

    // Fallback to simulated checkout directly if VITE_RAZORPAY_KEY_ID is not configured
    if (!razorpayKey) {
      console.log("No VITE_RAZORPAY_KEY_ID configured. Bypassing Razorpay and starting simulated checkout.");
      if (window.confirm("Razorpay API credentials are not configured. Would you like to complete this order using simulated Demo Mode?")) {
        setTimeout(() => {
          confirmOrder("mock_pay_" + Math.floor(Math.random() * 1000000));
        }, 1000);
      } else {
        setLoading(false);
      }
      return;
    }

    try {
      const amountInPaise = Math.round(grandTotal * 100);

      // Step 1: Create Order on backend
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `receipt_${getTimestamp()}`,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed to create order (status: ${response.status})`);
      }

      const orderData = await response.json();

      const rzpOptions = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Single Store",
        description: "Wall Posters Purchase",
        order_id: orderData.order_id,
        handler: async function (paymentResponse) {
          // Step 3: Verify Payment Signature on backend
          try {
            setLoading(true);
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              confirmOrder(paymentResponse.razorpay_payment_id);
            } else {
              alert("Payment verification failed: " + (verifyData.error || "Invalid signature"));
              setLoading(false);
            }
          } catch (verifyErr) {
            console.error("Signature verification error:", verifyErr);
            alert("Payment verification failed due to network error.");
            setLoading(false);
          }
        },
        prefill: {
          name: `${fname} ${lname}`,
          email: email,
          contact: phone || "9876543210"
        },
        theme: {
          color: "#3B82F6"
        },
        modal: {
          ondismiss: function () {
            console.log("Checkout modal dismissed by user");
            setLoading(false);
          }
        }
      };

      if (window.Razorpay) {
        const rzp1 = new window.Razorpay(rzpOptions);
        rzp1.on('payment.failed', function (resp) {
          alert("Payment Failed. Reason: " + resp.error.description);
          setLoading(false);
        });
        rzp1.open();
      } else {
        throw new Error("Razorpay script not loaded");
      }

    } catch (err) {
      console.warn("Razorpay checkout failed, falling back to simulated checkout:", err);
      if (window.confirm(`Razorpay integration failed: "${err.message}". Would you like to complete this order using simulated Demo Mode?`)) {
        setTimeout(() => {
          confirmOrder("mock_pay_" + Math.floor(Math.random() * 1000000));
        }, 1000);
      } else {
        setLoading(false);
      }
    }
  };

  const confirmOrder = async (paymentId) => {
    const newOrder = {
      id: paymentId,
      customerName: `${fname} ${lname}`,
      customerEmail: email,
      customerPhone: phone,
      shippingAddress: `${address}, ${city}, ${pinCode}, India`,
      shippingId: "SS-SHIP-" + Math.floor(10000000 + Math.random() * 90000000),
      trackingId: "SS-TRK-" + Math.floor(10000000 + Math.random() * 90000000),
      date: new Date().toISOString(),
      items: cart,
      total: grandTotal,
      status: 'Placed'
    };

    // Save order in database and empty the cart
    await addOrder(newOrder);
    saveCart([]);
    setLoading(false);
    onOrderConfirmed(newOrder);
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 px-6 text-center">
        <div className="text-4xl mb-4">🛒</div>
        <h2 className="font-outfit text-xl font-bold text-zinc-900 dark:text-white">Checkout is empty</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm">
          Please add some items to your cart before proceeding.
        </p>
        <button
          onClick={() => setView('shop')}
          className="mt-6 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors"
        >
          Explore Shop
        </button>
      </div>
    );
  }

  if (subtotal < 99) {
    return (
      <div className="max-w-md mx-auto py-16 px-6 text-center animate-fade-in">
        <div className="text-4xl mb-4 text-rose-500">⚠️</div>
        <h2 className="font-outfit text-xl font-bold text-zinc-900 dark:text-white">Minimum Order Value Required</h2>
        <p className="text-zinc-550 dark:text-zinc-400 mt-2 text-sm leading-relaxed">
          Your current order subtotal is {formatPrice(subtotal)}. The minimum order value required to checkout is Rs. 99.00. Please add more items to your cart.
        </p>
        <button
          onClick={() => setView('shop')}
          className="mt-6 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-blue-500/25"
        >
          Explore Shop
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-12">
      {/* Back Button */}
      <button
        onClick={() => setView('shop')}
        className="inline-flex items-center space-x-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 font-semibold mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Continue Shopping</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Side Form (Neomorphism Panels) */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Contact Panel */}
          <div className="glass-panel p-8 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-md">
            <h3 className="font-outfit text-lg font-bold text-zinc-900 dark:text-white mb-6 flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-blue-500" />
              <span>Contact Information</span>
            </h3>
            <form onSubmit={handleCheckoutSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <h4 className="font-outfit text-base font-bold text-zinc-900 dark:text-white mt-8 mb-4">
                Shipping Address
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="John"
                    value={fname}
                    onChange={(e) => setFname(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Doe"
                    value={lname}
                    onChange={(e) => setLname(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">
                  Country/Region
                </label>
                <input
                  type="text"
                  disabled
                  value="India"
                  className="w-full px-4 py-3 rounded-xl text-sm bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">
                  Street Address
                </label>
                <input
                  type="text"
                  required
                  placeholder="Apartment, suite, unit, road name..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="400001"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <h4 className="font-outfit text-base font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-blue-500" />
                  <span>Payment Gateway</span>
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 mb-4">
                  Payments are secure and processed.
                </p>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || subtotal < 99}
                  className={`w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-base flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25 transition-all ${loading || subtotal < 99 ? 'opacity-85 cursor-not-allowed' : ''
                    }`}
                >
                  {loading ? 'Processing Transaction...' : `Pay ${formatPrice(grandTotal)}`}
                </motion.button>

                {!import.meta.env.VITE_RAZORPAY_KEY_ID && (
                  <p className="text-[10px] text-zinc-455 dark:text-zinc-500 font-semibold text-center mt-2.5">
                    {/* ℹ️ Razorpay API credentials are not set. Simulated demo checkout will be used. */}
                  </p>
                )}
              </div>
            </form>
          </div>
        </motion.div>

        {/* Right Side summary Panel */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-panel p-8 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-md h-fit"
        >
          <h3 className="font-outfit text-lg font-bold text-zinc-900 dark:text-white mb-6">
            Order Summary
          </h3>
          <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2">
            {cart.map((item) => (
              <div
                key={item.cartId}
                className="flex items-center gap-4 py-3 border-b border-zinc-200/55 dark:border-zinc-800/55 last:border-b-0"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-14 h-18 object-cover rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-outfit text-sm font-bold text-zinc-900 dark:text-white line-clamp-1">
                      {item.title}
                    </h4>
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 font-inter">
                      x{item.quantity || 1}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    {item.size} / {item.frame}
                  </p>
                  <div className="flex justify-between items-baseline mt-1">
                    <span className="font-inter text-xs font-extrabold text-zinc-700 dark:text-zinc-300">
                      {formatPrice(parseFloat(item.price) * (item.quantity || 1))}
                    </span>
                    {(item.quantity || 1) > 1 && (
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium">
                        {formatPrice(item.price)} each
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex justify-between text-sm text-zinc-550 dark:text-zinc-400 font-semibold">
              <span>Subtotal</span>
              <span className="font-mono">{formatPrice(subtotal)}</span>
            </div>

            {appliedCoupon ? (
              <div className="flex justify-between items-center text-sm text-emerald-600 dark:text-emerald-450 font-semibold bg-emerald-500/10 dark:bg-emerald-950/20 px-3 py-2 rounded-xl border border-emerald-500/20">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                    {appliedCoupon.code}
                  </span>
                  <span className="text-xs">Applied</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono">-{formatPrice(discount)}</span>
                  <button
                    type="button"
                    onClick={() => setAppliedCoupon(null)}
                    className="text-red-500 hover:text-red-400 text-xs font-bold hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon Code"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCodeState(e.target.value);
                      setCouponError('');
                      setCouponSuccess('');
                    }}
                    className="flex-1 px-3 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-neo-in focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-3.5 py-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {couponError && (
                  <p className="text-[10px] text-red-500 font-bold mt-1 pl-1">
                    {couponError}
                  </p>
                )}
                {couponSuccess && (
                  <p className="text-[10px] text-emerald-500 font-bold mt-1 pl-1">
                    {couponSuccess}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-between text-sm text-zinc-550 dark:text-zinc-400 font-semibold pt-1">
              <span>Shipping</span>
              <span className="text-emerald-500">Free Shipping</span>
            </div>
            <div className="flex justify-between text-sm text-zinc-550 dark:text-zinc-400 font-semibold">
              <span>GST / Taxes</span>
              <span>Included</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-zinc-900 dark:text-white pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
              <span>Grand Total</span>
              <span className="font-inter text-xl font-extrabold">{formatPrice(grandTotal)}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
