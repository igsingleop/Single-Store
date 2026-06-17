import { firestoreDb, isFirebaseConfigured } from './firebase';
import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
  query
} from 'firebase/firestore';

const DB_POSTERS_KEY = 'SINGLESTORE_POSTERS';
const DB_ORDERS_KEY = 'SINGLESTORE_ORDERS';
const DB_CART_KEY = 'SINGLESTORE_CART';
const ADMIN_USERS_KEY = 'SINGLESTORE_ADMIN_USERS';
const DB_COUPONS_KEY = 'SINGLESTORE_COUPONS';

const defaultPosters = [
  {
    id: '1',
    title: 'Iron Man Mark L',
    category: 'Marvel',
    price: 25.99,
    image: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=800&auto=format&fit=crop',
    description: 'Premium print of Iron Man.'
  },
  {
    id: '2',
    title: 'Batman Gotham Knight',
    category: 'DC',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?q=80&w=800&auto=format&fit=crop',
    description: 'Dark Knight poster.'
  },
  {
    id: '3',
    title: 'Never Give Up',
    category: 'Motivation',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1552508744-1696d4464960?q=80&w=800&auto=format&fit=crop',
    description: 'Motivational typography poster.'
  },
  {
    id: '4',
    title: 'Vintage Sports Car',
    category: 'Cars',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800&auto=format&fit=crop',
    description: 'Classic car poster.'
  }
];

const defaultAdmins = [
  {
    name: 'Super Admin',
    email: 'admin@singlestore.in',
    password: 'Amma@9344'
  }
];

function safeParse(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    if (!data) return fallback;
    const parsed = JSON.parse(data);
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    return parsed;
  } catch (e) {
    console.warn(`Local storage parse error for key ${key}:`, e);
    return fallback;
  }
}

export async function initDB() {
  if (typeof window === 'undefined') return;

  if (isFirebaseConfigured && firestoreDb) {
    // 1. Seed Posters
    try {
      const q = query(collection(firestoreDb, 'posters'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        console.log("Seeding default posters into Firestore...");
        for (const poster of defaultPosters) {
          await setDoc(doc(firestoreDb, 'posters', String(poster.id)), poster);
        }
        window.dispatchEvent(new Event('singlestore_db_update'));
      }
    } catch (e) {
      console.error("Firestore seeding posters error:", e);
    }

    // 2. Seed default admin accounts if collection is empty
    try {
      const adminsQ = query(collection(firestoreDb, 'admins'));
      const adminsSnapshot = await getDocs(adminsQ);
      if (adminsSnapshot.empty) {
        console.log("Seeding default admin into Firestore...");
        for (const admin of defaultAdmins) {
          await setDoc(doc(firestoreDb, 'admins', admin.email.toLowerCase()), admin);
        }
      }
    } catch (e) {
      console.error("Firestore seeding admins error:", e);
    }

    // 3. Seed default coupons if collection is empty
    try {
      const couponsQ = query(collection(firestoreDb, 'coupons'));
      const couponsSnapshot = await getDocs(couponsQ);
      if (couponsSnapshot.empty) {
        console.log("Seeding default coupons into Firestore...");
        const defaultCoupons = [
          { code: 'SS10', type: 'percentage', value: 10, minAmount: 0 },
          { code: 'WELCOME50', type: 'flat', value: 50, minAmount: 499 }
        ];
        for (const coupon of defaultCoupons) {
          await setDoc(doc(firestoreDb, 'coupons', coupon.code.toUpperCase()), coupon);
        }
      }
    } catch (e) {
      console.error("Firestore seeding coupons error:", e);
    }
  } else {
    // LocalStorage fallback
    if (!localStorage.getItem(DB_POSTERS_KEY)) {
      localStorage.setItem(DB_POSTERS_KEY, JSON.stringify(defaultPosters));
    }
    if (!localStorage.getItem(DB_ORDERS_KEY)) {
      localStorage.setItem(DB_ORDERS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(ADMIN_USERS_KEY)) {
      localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(defaultAdmins));
    }
    if (!localStorage.getItem(DB_COUPONS_KEY)) {
      const defaultCoupons = [
        { code: 'SS10', type: 'percentage', value: 10, minAmount: 0 },
        { code: 'WELCOME50', type: 'flat', value: 50, minAmount: 499 }
      ];
      localStorage.setItem(DB_COUPONS_KEY, JSON.stringify(defaultCoupons));
    }
  }

  // Cart remains in LocalStorage always
  if (!localStorage.getItem(DB_CART_KEY)) {
    localStorage.setItem(DB_CART_KEY, JSON.stringify([]));
  }
}

// Initialize on import (safe for client environments)
initDB();

// --- Poster Operations ---
export async function getPosters() {
  let list = [];
  if (isFirebaseConfigured && firestoreDb) {
    try {
      const snapshot = await getDocs(collection(firestoreDb, 'posters'));
      snapshot.forEach(doc => {
        list.push({ ...doc.data(), id: doc.id });
      });
    } catch (e) {
      console.error("Firestore getPosters error:", e);
      list = safeParse(DB_POSTERS_KEY, defaultPosters);
    }
  } else {
    list = safeParse(DB_POSTERS_KEY, defaultPosters);
  }

  if (list.length === 0) {
    return defaultPosters;
  }
  return list;
}

export async function savePosters(posters) {
  if (isFirebaseConfigured && firestoreDb) {
    // Write all posters to Firestore (warning: bulk overwrite)
    try {
      for (const poster of posters) {
        await setDoc(doc(firestoreDb, 'posters', String(poster.id)), poster);
      }
      window.dispatchEvent(new Event('singlestore_db_update'));
    } catch (e) {
      console.error("Firestore savePosters error:", e);
    }
  } else {
    localStorage.setItem(DB_POSTERS_KEY, JSON.stringify(posters));
    window.dispatchEvent(new Event('singlestore_db_update'));
  }
}

export async function addPoster(poster) {
  if (isFirebaseConfigured && firestoreDb) {
    try {
      const posterId = poster.id || doc(collection(firestoreDb, 'posters')).id;
      await setDoc(doc(firestoreDb, 'posters', String(posterId)), { ...poster, id: posterId });
      window.dispatchEvent(new Event('singlestore_db_update'));
    } catch (e) {
      console.error("Firestore addPoster error:", e);
    }
  } else {
    const posters = safeParse(DB_POSTERS_KEY, defaultPosters);
    posters.push(poster);
    localStorage.setItem(DB_POSTERS_KEY, JSON.stringify(posters));
    window.dispatchEvent(new Event('singlestore_db_update'));
  }
}

export async function updatePoster(updatedPoster) {
  if (isFirebaseConfigured && firestoreDb) {
    try {
      await setDoc(doc(firestoreDb, 'posters', String(updatedPoster.id)), updatedPoster, { merge: true });
      window.dispatchEvent(new Event('singlestore_db_update'));
    } catch (e) {
      console.error("Firestore updatePoster error:", e);
    }
  } else {
    const posters = safeParse(DB_POSTERS_KEY, defaultPosters);
    const index = posters.findIndex(p => String(p.id) === String(updatedPoster.id));
    if (index > -1) {
      posters[index] = { ...posters[index], ...updatedPoster };
      localStorage.setItem(DB_POSTERS_KEY, JSON.stringify(posters));
      window.dispatchEvent(new Event('singlestore_db_update'));
    }
  }
}

export async function deletePoster(id) {
  if (isFirebaseConfigured && firestoreDb) {
    try {
      await deleteDoc(doc(firestoreDb, 'posters', String(id)));
      window.dispatchEvent(new Event('singlestore_db_update'));
    } catch (e) {
      console.error("Firestore deletePoster error:", e);
    }
  } else {
    let posters = safeParse(DB_POSTERS_KEY, defaultPosters);
    posters = posters.filter(p => String(p.id) !== String(id));
    localStorage.setItem(DB_POSTERS_KEY, JSON.stringify(posters));
    window.dispatchEvent(new Event('singlestore_db_update'));
  }
}

// --- Order Operations ---
export async function getOrders() {
  if (isFirebaseConfigured && firestoreDb) {
    try {
      const snapshot = await getDocs(collection(firestoreDb, 'orders'));
      const list = [];
      snapshot.forEach(doc => {
        list.push({ ...doc.data(), id: doc.id });
      });
      // Sort by date (asc)
      list.sort((a, b) => new Date(a.date) - new Date(b.date));
      return list;
    } catch (e) {
      console.error("Firestore getOrders error:", e);
      return safeParse(DB_ORDERS_KEY, []);
    }
  } else {
    return safeParse(DB_ORDERS_KEY, []);
  }
}

export async function saveOrders(orders) {
  if (isFirebaseConfigured && firestoreDb) {
    try {
      for (const order of orders) {
        await setDoc(doc(firestoreDb, 'orders', String(order.id)), order);
      }
      window.dispatchEvent(new Event('singlestore_db_update'));
    } catch (e) {
      console.error("Firestore saveOrders error:", e);
    }
  } else {
    localStorage.setItem(DB_ORDERS_KEY, JSON.stringify(orders));
    window.dispatchEvent(new Event('singlestore_db_update'));
  }
}

export async function addOrder(order) {
  if (isFirebaseConfigured && firestoreDb) {
    try {
      const orderId = order.id || doc(collection(firestoreDb, 'orders')).id;
      const orderWithId = { ...order, id: orderId };
      await setDoc(doc(firestoreDb, 'orders', String(orderId)), orderWithId);
      // Automatically register or update customer details
      await updateCustomerFromOrder(orderWithId);
      window.dispatchEvent(new Event('singlestore_db_update'));
    } catch (e) {
      console.error("Firestore addOrder error:", e);
    }
  } else {
    const orders = safeParse(DB_ORDERS_KEY, []);
    orders.push(order);
    localStorage.setItem(DB_ORDERS_KEY, JSON.stringify(orders));
    // Automatically register or update customer details
    await updateCustomerFromOrder(order);
    window.dispatchEvent(new Event('singlestore_db_update'));
  }
}

export async function updateOrderStatus(orderId, newStatus) {
  if (isFirebaseConfigured && firestoreDb) {
    try {
      await updateDoc(doc(firestoreDb, 'orders', String(orderId)), { status: newStatus });
      window.dispatchEvent(new Event('singlestore_db_update'));
    } catch (e) {
      console.error("Firestore updateOrderStatus error:", e);
    }
  } else {
    const orders = safeParse(DB_ORDERS_KEY, []);
    const index = orders.findIndex(o => String(o.id) === String(orderId));
    if (index > -1) {
      orders[index].status = newStatus;
      localStorage.setItem(DB_ORDERS_KEY, JSON.stringify(orders));
      window.dispatchEvent(new Event('singlestore_db_update'));
    }
  }
}

export async function deleteOrder(orderId) {
  if (isFirebaseConfigured && firestoreDb) {
    try {
      await deleteDoc(doc(firestoreDb, 'orders', String(orderId)));
      window.dispatchEvent(new Event('singlestore_db_update'));
    } catch (e) {
      console.error("Firestore deleteOrder error:", e);
    }
  } else {
    const orders = safeParse(DB_ORDERS_KEY, []);
    const filteredOrders = orders.filter(o => String(o.id) !== String(orderId));
    localStorage.setItem(DB_ORDERS_KEY, JSON.stringify(filteredOrders));
    window.dispatchEvent(new Event('singlestore_db_update'));
  }
}

// --- Cart Operations (Client-only LocalStorage) ---
export function getCart() {
  return safeParse(DB_CART_KEY, []);
}

export function saveCart(cart) {
  localStorage.setItem(DB_CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('singlestore_db_update'));
}

// --- Admin Credentials / Auth Operations ---
export async function getAdmins() {
  let list = [];
  if (isFirebaseConfigured && firestoreDb) {
    try {
      const snapshot = await getDocs(collection(firestoreDb, 'admins'));
      snapshot.forEach(doc => {
        list.push(doc.data());
      });
    } catch (e) {
      console.error("Firestore getAdmins error:", e);
      list = safeParse(ADMIN_USERS_KEY, defaultAdmins);
    }
  } else {
    list = safeParse(ADMIN_USERS_KEY, defaultAdmins);
  }

  // Ensure default admins are always present as a fallback
  const merged = [...list];
  for (const defAdmin of defaultAdmins) {
    if (!merged.some(a => a.email.toLowerCase() === defAdmin.email.toLowerCase())) {
      merged.push(defAdmin);
    }
  }
  return merged;
}

export async function registerAdmin(admin) {
  const emailLower = admin.email.toLowerCase();
  if (isFirebaseConfigured && firestoreDb) {
    try {
      await setDoc(doc(firestoreDb, 'admins', emailLower), {
        name: admin.name,
        email: emailLower,
        password: admin.password
      });
    } catch (e) {
      console.error("Firestore registerAdmin error:", e);
    }
  } else {
    const admins = safeParse(ADMIN_USERS_KEY, defaultAdmins);
    admins.push({
      name: admin.name,
      email: emailLower,
      password: admin.password
    });
    localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(admins));
  }
}

// --- Coupon Operations ---
export async function getCoupons() {
  let list = [];
  const defaultCoupons = [
    { code: 'SS10', type: 'percentage', value: 10, minAmount: 0 },
    { code: 'WELCOME50', type: 'flat', value: 50, minAmount: 499 }
  ];

  if (isFirebaseConfigured && firestoreDb) {
    try {
      const snapshot = await getDocs(collection(firestoreDb, 'coupons'));
      snapshot.forEach(doc => {
        list.push(doc.data());
      });
    } catch (e) {
      console.error("Firestore getCoupons error:", e);
      list = safeParse(DB_COUPONS_KEY, defaultCoupons);
    }
  } else {
    list = safeParse(DB_COUPONS_KEY, defaultCoupons);
  }

  if (list.length === 0) {
    return defaultCoupons;
  }
  return list;
}

export async function addCoupon(coupon) {
  const codeUpper = coupon.code.toUpperCase();
  const formattedCoupon = {
    code: codeUpper,
    type: coupon.type,
    value: parseFloat(coupon.value),
    minAmount: parseFloat(coupon.minAmount || 0)
  };

  if (isFirebaseConfigured && firestoreDb) {
    try {
      await setDoc(doc(firestoreDb, 'coupons', codeUpper), formattedCoupon);
      window.dispatchEvent(new Event('singlestore_db_update'));
    } catch (e) {
      console.error("Firestore addCoupon error:", e);
    }
  } else {
    const coupons = safeParse(DB_COUPONS_KEY, []);
    const filtered = coupons.filter(c => c.code !== codeUpper);
    filtered.push(formattedCoupon);
    localStorage.setItem(DB_COUPONS_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event('singlestore_db_update'));
  }
}

export async function deleteCoupon(code) {
  const codeUpper = code.toUpperCase();
  if (isFirebaseConfigured && firestoreDb) {
    try {
      await deleteDoc(doc(firestoreDb, 'coupons', codeUpper));
      window.dispatchEvent(new Event('singlestore_db_update'));
    } catch (e) {
      console.error("Firestore deleteCoupon error:", e);
    }
  } else {
    const coupons = safeParse(DB_COUPONS_KEY, []);
    const filtered = coupons.filter(c => c.code !== codeUpper);
    localStorage.setItem(DB_COUPONS_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event('singlestore_db_update'));
  }
}

// --- Customer Operations ---
export async function getCustomers() {
  let list = [];
  if (isFirebaseConfigured && firestoreDb) {
    try {
      const snapshot = await getDocs(collection(firestoreDb, 'customers'));
      snapshot.forEach(doc => {
        list.push({ ...doc.data(), email: doc.id });
      });
    } catch (e) {
      console.error("Firestore getCustomers error:", e);
      list = safeParse('SINGLESTORE_CUSTOMERS', []);
    }
  } else {
    list = safeParse('SINGLESTORE_CUSTOMERS', []);
  }
  return list;
}

export async function updateCustomerFromOrder(order) {
  if (!order.customerEmail) return;
  const email = order.customerEmail.toLowerCase().trim();
  const name = order.customerName || 'Anonymous Customer';
  const phone = order.customerPhone || '';
  const address = order.shippingAddress || '';
  const date = order.date || new Date().toISOString();
  const total = parseFloat(order.total) || 0;

  if (isFirebaseConfigured && firestoreDb) {
    try {
      const docRef = doc(firestoreDb, 'customers', email);
      const docSnap = await getDoc(docRef);
      let customerData = {
        name,
        email,
        phone,
        address,
        lastOrderDate: date,
        totalSpent: total,
        orderCount: 1,
        orderIds: [order.id]
      };
      if (docSnap.exists()) {
        const existing = docSnap.data();
        const orderIds = existing.orderIds || [];
        if (!orderIds.includes(order.id)) {
          orderIds.push(order.id);
          customerData = {
            ...existing,
            name: name !== 'Anonymous Customer' ? name : existing.name,
            phone: phone || existing.phone,
            address: address || existing.address,
            lastOrderDate: date,
            totalSpent: (existing.totalSpent || 0) + total,
            orderCount: (existing.orderCount || 0) + 1,
            orderIds
          };
        }
      }
      await setDoc(docRef, customerData);
    } catch (e) {
      console.error("Firestore updateCustomerFromOrder error:", e);
    }
  } else {
    const customers = safeParse('SINGLESTORE_CUSTOMERS', []);
    const idx = customers.findIndex(c => c.email.toLowerCase() === email);
    if (idx > -1) {
      const existing = customers[idx];
      const orderIds = existing.orderIds || [];
      if (!orderIds.includes(order.id)) {
        orderIds.push(order.id);
        customers[idx] = {
          ...existing,
          name: name !== 'Anonymous Customer' ? name : existing.name,
          phone: phone || existing.phone,
          address: address || existing.address,
          lastOrderDate: date,
          totalSpent: (existing.totalSpent || 0) + total,
          orderCount: (existing.orderCount || 0) + 1,
          orderIds
        };
      }
    } else {
      customers.push({
        name,
        email,
        phone,
        address,
        lastOrderDate: date,
        totalSpent: total,
        orderCount: 1,
        orderIds: [order.id]
      });
    }
    localStorage.setItem('SINGLESTORE_CUSTOMERS', JSON.stringify(customers));
  }
}

export async function syncCustomersFromOrders(orders) {
  if (!orders || orders.length === 0) return;
  const customerMap = {};
  for (const order of orders) {
    if (!order.customerEmail) continue;
    const email = order.customerEmail.toLowerCase().trim();
    if (!customerMap[email]) {
      customerMap[email] = {
        name: order.customerName || 'Anonymous Customer',
        email: email,
        phone: order.customerPhone || '',
        address: order.shippingAddress || '',
        lastOrderDate: order.date || new Date().toISOString(),
        totalSpent: 0,
        orderCount: 0,
        orderIds: []
      };
    }
    const c = customerMap[email];
    if (!c.orderIds.includes(order.id)) {
      c.orderIds.push(order.id);
      c.orderCount += 1;
      c.totalSpent += parseFloat(order.total) || 0;
      if (new Date(order.date) > new Date(c.lastOrderDate)) {
        c.lastOrderDate = order.date;
        c.address = order.shippingAddress || c.address;
        c.phone = order.customerPhone || c.phone;
        c.name = order.customerName || c.name;
      }
    }
  }

  if (isFirebaseConfigured && firestoreDb) {
    try {
      for (const email of Object.keys(customerMap)) {
        await setDoc(doc(firestoreDb, 'customers', email), customerMap[email]);
      }
    } catch (e) {
      console.error("Firestore syncCustomersFromOrders error:", e);
    }
  } else {
    localStorage.setItem('SINGLESTORE_CUSTOMERS', JSON.stringify(Object.values(customerMap)));
  }
}
