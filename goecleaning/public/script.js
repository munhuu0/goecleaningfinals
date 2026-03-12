const API_BASE_URL = window.location.origin; 


const prices = {
    apartment: { small: 300000, medium: 350000, largeRate: 5150 },
    construction: { small: 350000, medium: 600000, largeRate: 5150 },
    office: { small: 180000, medium: 350000, largeRate: 3350 },
    items: { carpet: 80000, sofa: 80000, planned: 0 }
};

let calculatedTotal = 0;
let selectedServiceText = "Айл гэр";

function selectService(type) {
    document.getElementById('serviceType').value = type;
    const options = document.querySelectorAll('.service-option');
    options.forEach(opt => opt.classList.remove('active'));
    
    const iconMap = { 'apartment': 0, 'construction': 1, 'office': 2, 'carpet': 3, 'sofa': 4, 'planned': 5 };
    if (options[iconMap[type]]) {
        options[iconMap[type]].classList.add('active');
        selectedServiceText = options[iconMap[type]].querySelector('span').innerText;
    }

    const sizeInput = document.getElementById('areaSize');
    const label = document.getElementById('areaLabel');
    if (type === 'carpet' || type === 'sofa') {
        label.innerText = 'Тоо ширхэг';
        sizeInput.placeholder = "Ширхэг";
    } else {
        label.innerText = 'Талбайн хэмжээ (м²)';
        sizeInput.placeholder = "м²";
    }
    calculatePrice();
}

function calculatePrice() {
    const type = document.getElementById('serviceType').value;
    const size = parseFloat(document.getElementById('areaSize').value) || 0;
    const priceDisplay = document.getElementById('totalPrice');

    if (type === 'planned') {
        priceDisplay.innerText = "Үнийн санал";
        calculatedTotal = 0;
        return;
    }

    let price = 0;
    if (type === 'apartment') {
        if (size > 0 && size < 50) price = prices.apartment.small;
        else if (size >= 50 && size <= 70) price = prices.apartment.medium;
        else if (size > 70) price = size * prices.apartment.largeRate;
    } 
    else if (type === 'construction') {
        if (size > 0 && size < 50) price = prices.construction.small;
        else if (size >= 50 && size <= 100) price = prices.construction.medium;
        else if (size > 100) price = size * prices.construction.largeRate;
    }
    else if (type === 'office') {
        if (size > 0 && size < 50) price = prices.office.small;
        else if (size >= 50 && size <= 100) price = prices.office.medium;
        else if (size > 100) price = size * prices.office.largeRate;
    }
    else if (type === 'carpet') price = size * prices.items.carpet;
    else if (type === 'sofa') price = size * prices.items.sofa;

    calculatedTotal = Math.ceil(price);
    priceDisplay.innerText = calculatedTotal.toLocaleString() + '₮';
}

function openOrderModal() {
    const type = document.getElementById('serviceType').value;
    const size = document.getElementById('areaSize').value;
    
    if (type !== 'planned' && (size <= 0 || size === '')) {
        alert("Талбайн хэмжээ эсвэл тоо ширхэгээ оруулна уу.");
        return;
    }

    document.getElementById('modalService').innerText = selectedServiceText;
    document.getElementById('modalSize').innerText = size || '-';
    document.getElementById('modalPrice').innerText = (calculatedTotal > 0 ? calculatedTotal.toLocaleString() + '₮' : 'Үнийн санал');

    document.getElementById('orderModal').classList.add('active');
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
}

window.onclick = function(event) {
    const modal = document.getElementById('orderModal');
    if (event.target == modal) modal.classList.remove('active');
}

async function submitOrder(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    data.service = selectedServiceText;
    data.phone = data.phone || '';
    data.message = data.message || `Үйлчилгээ: ${selectedServiceText}, Хэмжээ: ${document.getElementById('areaSize').value || '-'} Үнэ: ${calculatedTotal > 0 ? calculatedTotal.toLocaleString() + '₮' : 'Үнийн санал'}`;

    try {
        const response = await fetch(API_BASE_URL + '/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            alert('Захиалга амжилттай хүлээн авлаа! Бид тантай удахгүй холбогдоно.');
            closeOrderModal();
            e.target.reset();
            document.getElementById('areaSize').value = '';
            calculatePrice();
        } else {
            const errorData = await response.json();
            alert('Алдаа гарлаа: ' + (errorData.message || 'Дахин оролдоно уу.'));
        }
    } catch (err) {
        console.error("Submission Error:", err);
        alert('Сервертэй холбогдож чадсангүй.');
    }
}

async function loadPortfolio(isFullPage = false) {
    try {
        const res = await fetch(API_BASE_URL + '/api/portfolio/featured');
        const portfolioItems = await res.json();
        
        const containerId = isFullPage ? 'full-album-grid' : 'home-album-grid';
        const container = document.getElementById(containerId);
        
        if (!container) return; 
        
        container.innerHTML = '';

        // Handle case where portfolioItems is not an array
        if (!Array.isArray(portfolioItems) || portfolioItems.length === 0) {
            container.innerHTML = '<p style="text-align:center; width:100%; color:#888;">Одоогоор зураг байхгүй байна.</p>';
            return;
        }

        const itemsToShow = isFullPage ? portfolioItems : portfolioItems.slice(0, 4);

        itemsToShow.forEach(item => {
            const div = document.createElement('div');
            const imageUrl = item.images && item.images.length > 0 ? `/uploads/portfolio/${item.images[0].filename}` : '/images/placeholder.jpg';
            
            if (isFullPage) {
                div.className = "gallery-item reveal";
                div.innerHTML = `
                    <img src="${imageUrl}" alt="${item.title}">
                    <div class="overlay">
                        <h3>${item.title}</h3>
                        <p>${item.description || ''}</p>
                    </div>
                `;
            } else {
                div.className = "service-card reveal";
                div.style.padding = "0";
                div.style.overflow = "hidden";
                div.innerHTML = `
                    <div style="height: 200px; overflow: hidden;">
                        <img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div style="padding: 15px;">
                        <h4 style="margin: 0; font-size: 1rem;">${item.title}</h4>
                    </div>
                `;
            }
            container.appendChild(div);
        });
        
        setTimeout(reveal, 100); 

    } catch (err) {
        console.error("Failed to load portfolio", err);
        const container = document.getElementById(isFullPage ? 'full-album-grid' : 'home-album-grid');
        if (container) {
            container.innerHTML = '<p style="text-align:center; width:100%; color:#888;">Ачааллахад алдаа гарлаа.</p>';
        }
    }
}

if (document.getElementById('home-album-grid')) {
    loadPortfolio(false);
}

function reveal() {
    var reveals = document.querySelectorAll(".reveal");
    for (var i = 0; i < reveals.length; i++) {
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        var elementVisible = 100;
        if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add("active");
        }
    }
}
window.addEventListener("scroll", reveal);
reveal();


window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');

    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
});