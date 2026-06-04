document.addEventListener('DOMContentLoaded', () => {
    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        // Just a subtle shadow on scroll since background is already white
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
        } else {
            navbar.style.boxShadow = 'none';
        }
    });

    updateCartCount();
    loadFeaturedPosters();

    // Page specific loading
    if (document.getElementById('shopGrid')) {
        loadShopPosters();
    }
    if (document.getElementById('productDetail')) {
        loadProductDetails();
    }
    if (document.getElementById('accountPage')) {
        loadAccountDetails();
    }
});

function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    if (!sidebar) return;

    if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
    } else {
        sidebar.classList.add('open');
        renderCartItems();
    }
}

function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;
    navLinks.classList.toggle('active');
}

function updateCartCount() {
    const cart = window.db.getCart();
    const countEl = document.getElementById('cartCount');
    if (countEl) countEl.innerText = cart.length;
}

function addToCart(posterId, size = '18x24"', frame = 'Print Only') {
    try {
        const posters = window.db.getPosters();
        const poster = posters.find(p => String(p.id) === String(posterId));
        if (!poster) {
            console.warn("Add to cart failed: Poster not found for id:", posterId);
            return;
        }

        let cart = window.db.getCart();

        let basePrice = parseFloat(poster.price);
        if (isNaN(basePrice)) basePrice = 0;

        if (poster.discountPrice != null && String(poster.discountPrice) !== '' && !isNaN(parseFloat(poster.discountPrice))) {
            basePrice = parseFloat(poster.discountPrice);
        }

        // Basic price bumps
        if (size && typeof size === 'string' && size.includes('24x36')) basePrice += 10;
        if (frame && typeof frame === 'string' && frame.includes('Frame')) basePrice += 15;

        cart.push({
            cartId: Date.now().toString() + Math.random().toString(36).substring(2, 6),
            posterId: poster.id,
            title: poster.title,
            image: poster.image,
            price: basePrice,
            size,
            frame
        });

        window.db.saveCart(cart);
        updateCartCount();
        renderCartItems(); // ensure the cart items remain in sync even if already open

        // Automatically open the cart sidebar for visual feedback
        const sidebar = document.getElementById('cartSidebar');
        if (sidebar && !sidebar.classList.contains('open')) {
            sidebar.classList.add('open');
        }

        // Show success notification
        showCartToast(poster.title);
    } catch (err) {
        console.error("Error adding to cart:", err);
    }
}

function showCartToast(title) {
    let toast = document.getElementById('cartToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'cartToast';
        toast.style.position = 'fixed';
        toast.style.bottom = '30px';
        toast.style.left = '30px';
        toast.style.backgroundColor = 'var(--text-dark)';
        toast.style.color = '#fff';
        toast.style.padding = '1rem 1.5rem';
        toast.style.borderRadius = 'var(--radius-sm)';
        toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
        toast.style.zIndex = '9999';
        toast.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        toast.style.transform = 'translateY(150px)';
        toast.style.opacity = '0';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '10px';
        document.body.appendChild(toast);
    }

    toast.innerHTML = `<i class="fas fa-check-circle" style="color: #4CAF50; font-size: 1.2rem;"></i> ${title} added to cart!`;

    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    }, 10);

    // Pulse animation on the cart counter explicitly
    const cartCountEl = document.getElementById('cartCount');
    if (cartCountEl) {
        cartCountEl.style.animation = 'none';
        // Trigger reflow
        void cartCountEl.offsetWidth;
        cartCountEl.style.animation = 'cartPulse 0.6s ease-out';
    }

    // Hide toast after 3s
    clearTimeout(toast.hideTimeout);
    toast.hideTimeout = setTimeout(() => {
        toast.style.transform = 'translateY(150px)';
        toast.style.opacity = '0';
    }, 3000);
}

function removeFromCart(cartId) {
    let cart = window.db.getCart();
    cart = cart.filter(item => item.cartId !== cartId);
    window.db.saveCart(cart);
    updateCartCount();
    renderCartItems();
}

function formatPrice(price) {
    return 'Rs. ' + price.toFixed(2);
}

function renderCartItems() {
    const container = document.getElementById('cartItemsContainer');
    const totalEl = document.getElementById('cartTotalSum');
    if (!container) return;

    const cart = window.db.getCart();

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 2rem 0; color: var(--text-muted);">Your cart is empty</p>';
        if (totalEl) totalEl.innerText = formatPrice(0);
        return;
    }

    let total = 0;
    container.innerHTML = cart.map(item => {
        total += item.price;
        return `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.title}">
            <div style="flex:1;">
                <div class="cart-item-title">${item.title || 'Poster'}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.25rem;">${item.size || 'Standard'} / ${item.frame || 'None'}</div>
                <div class="cart-item-price">${formatPrice(item.price || 0)}</div>
                <span class="remove-item" onclick="removeFromCart('${item.cartId}')">Remove</span>
            </div>
        </div>
        `;
    }).join('');

    if (totalEl) totalEl.innerText = formatPrice(total);
}

function loadFeaturedPosters() {
    const container = document.getElementById('featuredPosters');
    if (!container) return;
    const posters = window.db.getPosters().slice(0, 4);
    container.innerHTML = posters.map(p => createPosterCard(p)).join('');
}

function loadShopPosters() {
    const container = document.getElementById('shopGrid');
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const catFilt = urlParams.get('cat');

    const filterSelect = document.getElementById('categorySelect');
    if (filterSelect && catFilt) {
        filterSelect.value = catFilt;
    }

    let posters = window.db.getPosters();
    if (catFilt && catFilt !== 'All') {
        posters = posters.filter(p => p.category === catFilt);
    }

    container.innerHTML = posters.map(p => createPosterCard(p)).join('');
}

window.createPosterCard = function (poster) {
    const hasDiscount = poster.discountPrice != null;
    const activePrice = hasDiscount ? parseFloat(poster.discountPrice) : parseFloat(poster.price);
    const comparePrice = hasDiscount ? parseFloat(poster.price) : null;

    return `
    <div class="poster-card" onclick="window.location.href='product.html?id=${poster.id}'">
        <div class="poster-image-container">
            <img src="${poster.image}" alt="${poster.title}">
            ${hasDiscount ? '<span class="sale-badge">Sale</span>' : ''}
        </div>
        <div class="poster-info">
            <div class="vendor-text">Single Store</div>
            <h3>${poster.title}</h3>
            <div class="poster-price-wrap">
                <span class="price-regular">${formatPrice(activePrice)}</span>
                ${comparePrice ? `<span class="price-compare">${formatPrice(comparePrice)}</span>` : ''}
            </div>
            <button class="quick-add" onclick="event.stopPropagation(); addToCart('${poster.id}')">Add to Cart</button>
        </div>
    </div>
    `;
}

function loadProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const posters = window.db.getPosters();

    const poster = posters.find(p => String(p.id) === String(id));
    if (!poster) {
        document.getElementById('productDetail').innerHTML = '<div class="section"><h2 style="text-align:center;">Product not found.</h2><div style="text-align:center;margin-top:20px;"><a href="shop.html" class="btn">View All Products</a></div></div>';
        return;
    }

    document.getElementById('prodImg').src = poster.image;
    document.getElementById('prodTitle').innerText = poster.title;
    document.getElementById('prodVendor').innerText = "Single Store";

    const hasDiscount = poster.discountPrice != null;
    const activePrice = hasDiscount ? parseFloat(poster.discountPrice) : parseFloat(poster.price);
    const comparePrice = hasDiscount ? parseFloat(poster.price) : null;

    document.getElementById('prodPrice').innerHTML = `
        <span class="price-regular" style="font-size: 1.5rem;">${formatPrice(activePrice)}</span>
        ${comparePrice ? `<span class="price-compare" style="font-size: 1rem; margin-left: 10px;">${formatPrice(comparePrice)}</span>` : ''}
    `;

    document.getElementById('prodDesc').innerHTML = `
        ${poster.description || "High-quality custom wall poster."} <br><br>
        <strong>Product details:</strong><br>
        - Premium 300 GSM Art Board<br>
        - High-resolution digital print<br>
        - Available in multiple sizes and framing options
    `;

    document.getElementById('btnAddToCartForm').onclick = (e) => {
        e.preventDefault();
        const sizeInput = document.getElementById('prodSize');
        const frameInput = document.getElementById('prodFrame');
        const size = sizeInput ? sizeInput.value : '18x24"';
        const frame = frameInput ? frameInput.value : 'Print Only';
        addToCart(poster.id, size, frame);
    };
}

function loadAccountDetails() {
    const ordersList = document.getElementById('accountOrdersList');
    if (!ordersList) return;

    // Simulate logged in user finding their orders
    // In our mock, we just show all orders to demonstrate the connection
    const orders = window.db.getOrders();
    const guestOrders = orders.filter(o => o.customerEmail === 'guest@singlestore.in' || true); // showing all for demo

    if (guestOrders.length === 0) {
        ordersList.innerHTML = '<p style="color: var(--text-muted);">You have no previous orders.</p>';
        return;
    }

    ordersList.innerHTML = guestOrders.reverse().map(order => `
        <div class="order-item">
            <div>
                <strong style="display:block; margin-bottom: 0.25rem;">Order #${order.id}</strong>
                <span style="font-size: 0.8rem; color: var(--text-muted);">${new Date(order.date).toLocaleDateString()}</span>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: 600; margin-bottom: 0.25rem;">${formatPrice(order.total)}</div>
                <span class="order-badge ${order.status.toLowerCase()}">${order.status}</span>
            </div>
        </div>
    `).join('');
}
