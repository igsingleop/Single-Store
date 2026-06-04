import { firestoreDb, isFirebaseConfigured } from './firebase';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';

const DB_POSTERS_KEY = 'SINGLESTORE_POSTERS';
const DB_ORDERS_KEY = 'SINGLESTORE_ORDERS';
const DB_CART_KEY = 'SINGLESTORE_CART';

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
      console.error("Firestore DB initialization / seeding error:", e);
    }
  } else {
    // LocalStorage fallback
    if (!localStorage.getItem(DB_POSTERS_KEY)) {
      localStorage.setItem(DB_POSTERS_KEY, JSON.stringify(defaultPosters));
    }
    if (!localStorage.getItem(DB_ORDERS_KEY)) {
      localStorage.setItem(DB_ORDERS_KEY, JSON.stringify([]));
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
  if (isFirebaseConfigured && firestoreDb) {
    try {
      const snapshot = await getDocs(collection(firestoreDb, 'posters'));
      const list = [];
      snapshot.forEach(doc => {
        list.push({ ...doc.data(), id: doc.id });
      });
      return list;
    } catch (e) {
      console.error("Firestore getPosters error:", e);
      return safeParse(DB_POSTERS_KEY, defaultPosters);
    }
  } else {
    return safeParse(DB_POSTERS_KEY, defaultPosters);
  }
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
      await setDoc(doc(firestoreDb, 'orders', String(orderId)), { ...order, id: orderId });
      window.dispatchEvent(new Event('singlestore_db_update'));
    } catch (e) {
      console.error("Firestore addOrder error:", e);
    }
  } else {
    const orders = safeParse(DB_ORDERS_KEY, []);
    orders.push(order);
    localStorage.setItem(DB_ORDERS_KEY, JSON.stringify(orders));
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

// --- Cart Operations (Client-only LocalStorage) ---
export function getCart() {
  return safeParse(DB_CART_KEY, []);
}

export function saveCart(cart) {
  localStorage.setItem(DB_CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('singlestore_db_update'));
}
