document.addEventListener('DOMContentLoaded', () => {
    // Determine which page we're on based on path or basic ID checks
    const currentPath = window.location.pathname;

    // Always load these if available
    loadDashboardStats();
    loadDashboardRecentOrders();

    if (document.getElementById('inventoryForm')) {
        setupInventoryEvents();
        loadInventoryTable();
    }

    if (document.getElementById('ordersTableBody')) {
        loadDetailedOrders();
    }
});

function toggleAdminSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    sidebar.classList.toggle('open');
}

function loadDashboardStats() {
    if (!document.getElementById('statRevenue')) return;

    const orders = window.db.getOrders();
    const posters = window.db.getPosters();

    let totalRevenue = 0;
    orders.forEach(order => {
        if (order.status !== 'cancelled') {
            totalRevenue += order.total;
        }
    });

    document.getElementById('statRevenue').innerText = `₹${totalRevenue.toFixed(2)}`;
    document.getElementById('statOrders').innerText = orders.length;
    document.getElementById('statPosters').innerText = posters.length;
}

function loadDashboardRecentOrders() {
    const tbody = document.getElementById('recentOrdersBody');
    if (!tbody) return;

    const orders = window.db.getOrders();
    const recent = orders.slice(-5).reverse(); // Last 5 orders

    if (recent.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No recent orders.</td></tr>`;
        return;
    }

    tbody.innerHTML = recent.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.customerName}</td>
            <td>${new Date(order.date).toLocaleDateString()}</td>
            <td>₹${order.total.toFixed(2)}</td>
            <td><span class="badge ${order.status.toLowerCase()}">${order.status}</span></td>
        </tr>
    `).join('');
}


// --- INVENTORY MANAGEMENT ---
let currentEditId = null;

function setupInventoryEvents() {
    const form = document.getElementById('inventoryForm');
    const formTitle = document.querySelector('.section-title');
    const submitBtn = form.querySelector('.btn-submit');
    const titleEl = document.getElementById('posterTitle');
    const catEl = document.getElementById('posterCategory');
    const priceEl = document.getElementById('posterPrice');
    const discountEl = document.getElementById('posterDiscountPrice');
    const descEl = document.getElementById('posterDesc');
    const fileInput = document.getElementById('posterImageFile');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = titleEl.value;
        const category = catEl.value;
        const price = parseFloat(priceEl.value);
        const discountPrice = discountEl.value ? parseFloat(discountEl.value) : null;
        const description = descEl.value;
        const file = fileInput.files[0];

        const savePoster = (imageBase64) => {
            if (currentEditId) {
                const poster = {
                    id: currentEditId,
                    title, category, price, discountPrice, description,
                    image: imageBase64
                };
                window.db.updatePoster(poster);
                alert("Poster updated successfully!");

                // reset edit state
                currentEditId = null;
                submitBtn.innerText = "Add Poster to Store";
                if (formTitle) formTitle.innerText = "Add New Poster";
            } else {
                const newId = Date.now().toString();
                const poster = {
                    id: newId,
                    title, category, price, discountPrice, description,
                    image: imageBase64
                };
                window.db.addPoster(poster);
                alert("Poster added successfully!");
            }

            form.reset();
            loadInventoryTable();
            loadDashboardStats(); // update sidebar/stats if any
        };

        if (file) {
            const reader = new FileReader();
            reader.onload = function (evt) {
                savePoster(evt.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            if (currentEditId) {
                const existing = window.db.getPosters().find(p => String(p.id) === String(currentEditId));
                savePoster(existing ? existing.image : 'https://via.placeholder.com/400x600?text=No+Image');
            } else {
                savePoster('https://via.placeholder.com/400x600?text=No+Image');
            }
        }
    });

    window.editPosterHandler = function (id) {
        const poster = window.db.getPosters().find(p => String(p.id) === String(id));
        if (!poster) return;

        currentEditId = id;
        titleEl.value = poster.title;
        catEl.value = poster.category;
        priceEl.value = poster.price || 0;
        discountEl.value = poster.discountPrice || '';
        descEl.value = poster.description || '';

        submitBtn.innerText = "Update Poster";
        if (formTitle) formTitle.innerText = "Edit Poster";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
}

function loadInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    const posters = window.db.getPosters();

    if (posters.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No posters found.</td></tr>`;
        return;
    }

    tbody.innerHTML = posters.map(p => `
        <tr>
            <td><img src="${p.image}" alt="${p.title}" style="width: 50px; border-radius: 4px;"></td>
            <td>${p.title}</td>
            <td>${p.category}</td>
            <td>₹${p.price.toFixed(2)}${p.discountPrice ? `<br><span style="color:var(--accent-red); font-size:0.8rem;">Sale: ₹${p.discountPrice.toFixed(2)}</span>` : ''}</td>
            <td>
                <button class="action-btn" onclick="editPosterHandler('${p.id}')">Edit</button>
                <button class="action-btn delete" onclick="deletePosterHandler('${p.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

window.deletePosterHandler = function (id) {
    if (confirm("Are you sure you want to delete this poster?")) {
        window.db.deletePoster(id);
        loadInventoryTable();
    }
}


// --- ORDER MANAGEMENT ---
function loadDetailedOrders() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    const orders = window.db.getOrders();

    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No orders yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = orders.reverse().map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.customerName}<br><small style="color:var(--text-muted)">${order.customerEmail}</small></td>
            <td>${new Date(order.date).toLocaleString()}</td>
            <td>₹${order.total.toFixed(2)} (x${order.items.length} items)</td>
            <td>
                <select onchange="updateOrderStatus('${order.id}', this.value)" style="background: var(--bg-card); color: var(--text-light); border: 1px solid var(--border-color); padding: 5px; border-radius: 4px;">
                    <option value="Pending" ${order.status.toLowerCase() === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="Completed" ${order.status.toLowerCase() === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="Cancelled" ${order.status.toLowerCase() === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td><button class="action-btn" onclick="alert('Viewing order details is mocked.')">View</button></td>
        </tr>
    `).join('');
}

window.updateOrderStatus = function (orderId, newStatus) {
    const orders = window.db.getOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
        orders[orderIndex].status = newStatus;
        window.db.saveOrders(orders);
        alert(`Order #${orderId} marked as ${newStatus}`);
    }
}
