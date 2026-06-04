// Shared LocalStorage Database Wrapper
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

function initDB() {
    if (!localStorage.getItem(DB_POSTERS_KEY)) {
        localStorage.setItem(DB_POSTERS_KEY, JSON.stringify(defaultPosters));
    }
    if (!localStorage.getItem(DB_ORDERS_KEY)) {
        localStorage.setItem(DB_ORDERS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(DB_CART_KEY)) {
        localStorage.setItem(DB_CART_KEY, JSON.stringify([]));
    }
}

// Poster Operations
function getPosters() {
    return safeParse(DB_POSTERS_KEY, []);
}

function savePosters(posters) {
    localStorage.setItem(DB_POSTERS_KEY, JSON.stringify(posters));
}

function addPoster(poster) {
    const posters = getPosters();
    posters.push(poster);
    savePosters(posters);
}

function updatePoster(updatedPoster) {
    let posters = getPosters();
    const index = posters.findIndex(p => String(p.id) === String(updatedPoster.id));
    if (index > -1) {
        posters[index] = updatedPoster;
        savePosters(posters);
    }
}

function deletePoster(id) {
    let posters = getPosters();
    posters = posters.filter(p => String(p.id) !== String(id));
    savePosters(posters);
}

// Order Operations
function getOrders() {
    return safeParse(DB_ORDERS_KEY, []);
}

function saveOrders(orders) {
    localStorage.setItem(DB_ORDERS_KEY, JSON.stringify(orders));
}

function addOrder(order) {
    const orders = getOrders();
    orders.push(order);
    saveOrders(orders);
}

// Cart Operations
function getCart() {
    return safeParse(DB_CART_KEY, []);
}

function saveCart(cart) {
    localStorage.setItem(DB_CART_KEY, JSON.stringify(cart));
}

// Initialize on load
initDB();

// Export to window
window.db = {
    getPosters,
    savePosters,
    addPoster,
    updatePoster,
    deletePoster,
    getOrders,
    saveOrders,
    addOrder,
    getCart,
    saveCart
};
