/* ----------------------------------------------------
   admin.js - GOE Admin Logic
   ---------------------------------------------------- */
const API_BASE_URL = window.location.origin;
const API_URL = API_BASE_URL + '/api/admin/orders';

// Store authentication token
let authToken = localStorage.getItem('goeAdminToken');

// --- TAB SWITCHING LOGIC ---
function switchTab(viewName, clickedElement) {
    // 1. Remove 'active' class from all Sidebar Items
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    // 2. Add 'active' class to clicked Item
    if (clickedElement) {
        clickedElement.classList.add('active');
    }

    // 3. Hide all View Sections
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));

    // 4. Show the specific View
    const targetView = document.getElementById('view-' + viewName);
    if (targetView) {
        targetView.classList.add('active');
    }
}

// --- REST OF YOUR EXISTING LOGIC ---

document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('goeAdminLoggedIn');
    if (isLoggedIn === 'true' && authToken) {
        document.getElementById('login-screen').style.display = 'none';
        refreshAll();
    }
});

function refreshAll() {
    fetchOrders();
    fetchAlbums();
}

async function login() {
    const password = document.getElementById('passwordInput').value;
    try {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('goeAdminLoggedIn', 'true');
            localStorage.setItem('goeAdminToken', data.token);
            authToken = data.token;
            document.getElementById('login-screen').style.display = 'none';
            refreshAll();
        } else {
            alert('Wrong Password!');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

function logout() {
    localStorage.removeItem('goeAdminLoggedIn');
    localStorage.removeItem('goeAdminToken');
    authToken = null;
    location.reload();
}

// Helper function to add authentication headers
function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
}

async function fetchOrders() {
    try {
        const res = await fetch(API_URL, { headers: getAuthHeaders() });
        if (!res.ok) {
            if (res.status === 401) {
                // Token expired, logout user
                logout();
                return;
            }
            throw new Error('Failed to fetch orders');
        }
        const data = await res.json();
        
        document.getElementById('stat-count').innerText = data.totalOrders;
        document.getElementById('stat-revenue').innerText = data.totalRevenue.toLocaleString() + '₮';
        const pending = data.orders.filter(o => o.status === 'pending').length;
        document.getElementById('stat-pending').innerText = pending;

        const tbody = document.getElementById('orders-body');
        tbody.innerHTML = '';

        data.orders.forEach(order => {
            const date = new Date(order.createdAt).toLocaleDateString('mn-MN') + ' ' + 
                         new Date(order.createdAt).toLocaleTimeString('mn-MN', {hour:'2-digit', minute:'2-digit'});

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${date}</td>
                <td>
                    <strong>${order.customerName}</strong><br>
                    <a href="tel:${order.phone}" style="color:#666;text-decoration:none;">${order.phone}</a>
                </td>
                <td>
                    ${order.service || 'Үйлчилгээ'}<br>
                    <small style="color:#888;">${data.source || 'temporary'}</small>
                </td>
                <td>${order.location || 'N/A'}</td>
                <td><strong>${(order.totalPrice || 0).toLocaleString()}₮</strong></td>
                <td>
                    <select onchange="updateStatus('${order.id}', this.value)" 
                            class="status-select status-${(order.status || 'pending').replace(' ', '')}">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Хүлээгдэж буй</option>
                        <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Баталгаажсан</option>
                        <option value="in-progress" ${order.status === 'in-progress' ? 'selected' : ''}>Ажиллаж байна</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Дууссан</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Цуцлагдсан</option>
                    </select>
                </td>
                <td>
                    <button class="btn btn-danger" onclick="deleteOrder('${order.id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) { 
        console.error('Fetch orders error:', err);
        const tbody = document.getElementById('orders-body');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#666;">Захиалгуудыг ачааллахад алдаа гарлаа</td></tr>';
        }
    }
}

async function updateStatus(id, newStatus) {
    if(!confirm('Статус өөрчлөх үү?')) return;
    try {
        const res = await fetch(`/api/admin/orders/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) {
            fetchOrders();
        } else {
            alert('Статус өөрчлөх боломжгүй байна');
        }
    } catch (error) {
        console.error('Update status error:', error);
        alert('Алдаа гарлаа. Дахин оролдоно уу.');
    }
}

async function deleteOrder(id) {
    if(!confirm('Энэ захиалгыг устгахдаа итгэлтэй байна уу?')) return;
    try {
        const res = await fetch(`/api/admin/orders/${id}`, { 
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (res.ok) {
            fetchOrders();
        } else {
            alert('Захиалгыг устгах боломжгүй байна');
        }
    } catch (error) {
        console.error('Delete order error:', error);
        alert('Алдаа гарлаа. Дахин оролдоно уу.');
    }
}

// Album Logic
async function fetchAlbums() {
    try {
        const res = await fetch(API_BASE_URL + '/api/albums');
        const albums = await res.json();
        const container = document.getElementById('admin-album-list');
        container.innerHTML = '';

        // Handle empty or invalid data
        if (!Array.isArray(albums) || albums.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#666; grid-column:1/-1;">Одоогоор зураг байхгүй байна</p>';
            return;
        }

        albums.forEach(item => {
            const div = document.createElement('div');
            div.style.cssText = "border:1px solid #ddd; border-radius:8px; padding:10px; background: #fafafa; text-align:center;";
            
            // Get image URL from portfolio structure
            const imageUrl = item.images && item.images.length > 0 
                ? `/uploads/portfolio/${item.images[0].filename}` 
                : '/images/placeholder.jpg';
            
            div.innerHTML = `
                <img src="${imageUrl}" style="width:100%; height:150px; object-fit:cover; border-radius:5px; margin-bottom:10px;">
                <div style="font-weight:bold; font-size:0.9rem;">${item.title}</div>
                <div style="font-size:0.8rem; color:#666; margin-bottom:10px;">${item.description || ''}</div>
                <button class="btn btn-danger" onclick="deleteAlbum('${item._id}')" style="width:100%;">Delete</button>
            `;
            container.appendChild(div);
        });
    } catch (err) {
        console.error('Failed to fetch albums:', err);
        const container = document.getElementById('admin-album-list');
        if (container) {
            container.innerHTML = '<p style="text-align:center; color:#666; grid-column:1/-1;">Ачааллахад алдаа гарлаа</p>';
        }
    }
}

async function uploadPhoto(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
        const res = await fetch(API_BASE_URL + '/api/albums', { method: 'POST', body: formData });
        if (res.ok) { 
            alert('Photo uploaded!'); 
            e.target.reset(); 
            fetchAlbums(); 
        } else { 
            alert('Upload failed'); 
        }
    } catch (err) { 
        console.error(err); 
    }
}

async function deleteAlbum(id) {
    if(!confirm('Delete this photo?')) return;
    try {
        const res = await fetch(`/api/albums/${id}`, { method: 'DELETE' });
        if (res.ok) {
            fetchAlbums();
        } else {
            alert('Delete failed');
        }
    } catch (err) {
        console.error('Delete album error:', err);
        alert('Алдаа гарлаа. Дахин оролдоно уу.');
    }
}

function translate(type) {
    const dict = { 'apartment': 'Айл гэр', 'construction': 'Барилгын дараах', 'office': 'Оффис', 'carpet': 'Хивс', 'sofa': 'Буйдан', 'planned': 'Төлөвлөгөөт' };
    return dict[type] || type;
}