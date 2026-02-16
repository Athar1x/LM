import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc, updateDoc, query, orderBy, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAjE-2q6PONBkCin9ZN22gDp9Q8pAH9ZW8",
    authDomain: "story-97cf7.firebaseapp.com",
    databaseURL: "https://story-97cf7-default-rtdb.firebaseio.com",
    projectId: "story-97cf7",
    storageBucket: "story-97cf7.firebasestorage.app",
    messagingSenderId: "742801388214",
    appId: "1:742801388214:web:32a305a8057b0582c5ec17",
    measurementId: "G-9DPPWX7CF0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ADMIN_PIN = "2024"; 
const WA_PHONE = "201202687082";

let SHIPPING_COST = 50;
let socialLinks = {
    whatsapp: "",
    facebook: "",
    instagram: "",
    tiktok: ""
};

const governorates = [
    "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "الشرقية", "المنوفية", 
    "القليوبية", "البحيرة", "الغربية", "بور سعيد", "دمياط", "الإسماعيلية", 
    "السويس", "كفر الشيخ", "الفيوم", "بني سويف", "المنيا", "أسيوط", 
    "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد", 
    "مطروح", "شمال سيناء", "جنوب سيناء"
];

const systemColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', 
    '#FFFF00', '#800080', '#FFA500', '#A52A2A', '#808080', 
    '#D4AF37', '#FFC0CB', '#40E0D0', '#000080'
];

const colorNames = {
    '#000000': 'أسود', '#FFFFFF': 'أبيض', '#FF0000': 'أحمر', 
    '#00FF00': 'أخضر', '#0000FF': 'أزرق', '#FFFF00': 'أصفر', 
    '#800080': 'بنفسجي', '#FFA500': 'برتقالي', '#A52A2A': 'بني', 
    '#808080': 'رمادي', '#D4AF37': 'ذهبي', '#FFC0CB': 'بمبي', 
    '#40E0D0': 'فيروزي', '#000080': 'كحلي'
};

let cart = JSON.parse(localStorage.getItem('athar_cart')) || [];
let productsCache = [];
let slideIntervals = {}; 
let isAdmin = sessionStorage.getItem('isAdmin') === 'true';
let selectedColorsForNewProduct = [];

async function loadSettings() {
    try {
        const settingsDoc = await getDoc(doc(db, "settings", "general"));
        if (settingsDoc.exists()) {
            const data = settingsDoc.data();
            if (data.socialLinks) {
                socialLinks = data.socialLinks;
            }
            if (data.shippingCost) {
                SHIPPING_COST = data.shippingCost;
            }
        }
    } catch (e) {
        console.error(e);
    }
}

window.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    checkHash();
});

window.checkHash = async () => {
    const hash = window.location.hash;
    if(hash.startsWith('#product=')) {
        const id = hash.split('=')[1];
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if(docSnap.exists()) {
            productsCache = [{ id: docSnap.id, ...docSnap.data() }];
            router('product', id);
        } else {
            router('home');
        }
    } else {
        router('home');
    }
}

window.router = function(route, param = null) {
    const header = document.getElementById('main-header');
    const footer = document.getElementById('main-footer');
    const divider = document.getElementById('footer-divider');
    const ramadanHero = document.getElementById('ramadan-hero');
    
    Object.values(slideIntervals).forEach(clearInterval);
    slideIntervals = {};
    window.scrollTo(0,0);
    updateAdminUI();

    if(route === 'home') {
        history.pushState(null, null, ' ');
        header.style.display = 'flex';
        if(ramadanHero) ramadanHero.style.display = 'flex';
        renderHome(); 
    } else if (route === 'product') {
        header.style.display = 'none'; 
        footer.classList.add('hidden');
        divider.classList.add('hidden');
        if(ramadanHero) ramadanHero.style.display = 'none';
        renderProductPage(param);
    } else if (route === 'cart') {
        history.pushState(null, null, '#cart');
        header.style.display = 'flex';
        footer.classList.add('hidden');
        divider.classList.add('hidden');
        if(ramadanHero) ramadanHero.style.display = 'none';
        renderCartPage();
    } else if (route === 'admin-login') {
        header.style.display = 'none';
        footer.classList.add('hidden');
        divider.classList.add('hidden');
        if(ramadanHero) ramadanHero.style.display = 'none';
        renderAdminLogin();
    } else if (route === 'admin-add') {
        header.style.display = 'none';
        footer.classList.add('hidden');
        divider.classList.add('hidden');
        if(ramadanHero) ramadanHero.style.display = 'none';
        renderAddProductPage(param); 
    } else if (route === 'social-settings') {
        header.style.display = 'none';
        footer.classList.add('hidden');
        divider.classList.add('hidden');
        if(ramadanHero) ramadanHero.style.display = 'none';
        renderSocialSettings();
    }
}

function updateAdminUI() {
    const addBtn = document.getElementById('admin-add-btn');
    addBtn.classList.toggle('hidden', !isAdmin);
}

function updateFooter() {
    const footer = document.getElementById('main-footer');
    const divider = document.getElementById('footer-divider');
    if(footer) footer.classList.remove('hidden');
    if(divider) divider.classList.remove('hidden');
    
    const socialContainer = document.getElementById('social-icons-container');
    if(socialContainer) {
        let socialHTML = '';
        
        if(socialLinks.whatsapp) {
            const waLink = socialLinks.whatsapp.startsWith('http') ? socialLinks.whatsapp : `https://wa.me/${socialLinks.whatsapp}`;
            socialHTML += `
                <a href="${waLink}" target="_blank" class="social-btn-premium wa">
                    <i class="fab fa-whatsapp"></i>
                    <span>WhatsApp</span>
                </a>
            `;
        }
        
        if(socialLinks.facebook) {
            socialHTML += `
                <a href="${socialLinks.facebook}" target="_blank" class="social-btn-premium fb">
                    <i class="fab fa-facebook-f"></i>
                    <span>Facebook</span>
                </a>
            `;
        }
        
        if(socialLinks.instagram) {
            socialHTML += `
                <a href="${socialLinks.instagram}" target="_blank" class="social-btn-premium ig">
                    <i class="fab fa-instagram"></i>
                    <span>Instagram</span>
                </a>
            `;
        }
        
        if(socialLinks.tiktok) {
            socialHTML += `
                <a href="${socialLinks.tiktok}" target="_blank" class="social-btn-premium tk">
                    <i class="fab fa-tiktok"></i>
                    <span>TikTok</span>
                </a>
            `;
        }
        
        if(!socialHTML && isAdmin) {
            socialHTML = `
                <div style="grid-column: 1/-1; text-align:center; color:var(--text-secondary); padding:20px;">
                    <i class="fas fa-info-circle" style="font-size:2rem; color:var(--gold); margin-bottom:10px;"></i>
                    <p>لم يتم إضافة روابط تواصل اجتماعي بعد</p>
                    <button onclick="router('social-settings')" class="btn-sec" style="margin-top:10px;">
                        إضافة الروابط
                    </button>
                </div>
            `;
        }
        
        socialContainer.innerHTML = socialHTML;
    }
}

async function renderHome() {
    const appDiv = document.getElementById('app');
    document.body.style.background = 'var(--bg-grad)';
    
    appDiv.innerHTML = `<div class="product-grid">${Array(4).fill('<div class="img-box skeleton" style="height:250px;background:rgba(255,255,255,0.5);border-radius:24px;"></div>').join('')}</div>`;

    try {
        const q = query(collection(db, "products"), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        productsCache = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        let html = '<div class="product-grid">';
        productsCache.forEach(p => {
            const images = p.images || [p.imageCode];
            const imgId = `img-${p.id}`;
            let discountHtml = '';
            let priceHtml = `<div class="price-tag">${p.price} ج.م</div>`;
            if(p.oldPrice && parseFloat(p.oldPrice) > parseFloat(p.price)) {
                discountHtml = `<div class="discount-badge">خصم</div>`;
            }

            let adminControls = '';
            if(isAdmin) {
                adminControls = `
                    <div class="admin-overlay-controls" style="position:absolute; top:10px; left:10px; z-index:20; display:flex; gap:5px;">
                        <button class="admin-btn-card btn-del-float" onclick="event.stopPropagation(); deleteProduct('${p.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="admin-btn-card btn-edit-float" onclick="event.stopPropagation(); router('admin-add', '${p.id}')">
                            <i class="fas fa-pen"></i>
                        </button>
                    </div>
                `;
            }

            html += `
                <div class="product-card" onclick="router('product', '${p.id}')">
                    <div class="ramadan-lantern">🏮</div>
                    ${adminControls}
                    <div class="img-box">
                        <img src="${images[0]}" class="p-img" id="${imgId}" loading="lazy">
                        <div class="price-overlay">
                            ${discountHtml}
                            ${priceHtml}
                        </div>
                    </div>
                    <div class="product-info">
                        <div class="product-title">${p.title}</div>
                        ${p.oldPrice ? `<div class="old-price-text">${p.oldPrice} ج.م</div>` : ''}
                    </div>
                </div>
            `;
            
            if(images.length > 1) {
                let idx = 0;
                slideIntervals[p.id] = setInterval(() => {
                    const el = document.getElementById(imgId);
                    if(el) {
                        idx = (idx + 1) % images.length;
                        el.style.opacity = '0';
                        setTimeout(() => {
                            el.src = images[idx];
                            el.style.opacity = '1';
                        }, 200);
                    }
                }, 3000);
            }
        });
        html += '</div>';
        appDiv.innerHTML = html;
        updateFooter();
    } catch(e) { console.error(e); }
}

window.renderProductPage = (id) => {
    const p = productsCache.find(x => x.id === id);
    if(!p) return router('home');
    const images = p.images || [p.imageCode];
    const appDiv = document.getElementById('app');

    const colors = p.colors || [];
    let selectedColor = colors[0] || '#000000';
    let qty = 1;

    const shareUrl = `${window.location.origin}${window.location.pathname}#product=${id}`;
    const shareText = `تسوق ${p.title} على متجر أثر`;

    function render() {
        const colorBtns = colors.map(c => `<div class="color-circle ${c === selectedColor ? 'active' : ''}" style="background:${c};" onclick="selectColor('${c}')"></div>`).join('');
        const thumbs = images.map((img, i) => `<img src="${img}" class="thumb-img ${i === 0 ? 'active' : ''}" data-idx="${i}" onclick="changeMainImg(${i})">`).join('');

        appDiv.innerHTML = `
            <div class="full-page-view">
                <div class="product-detail-container">
                    <div style="flex:1;">
                        <div class="main-image-frame">
                            <img src="${images[0]}" class="main-img-full" id="main-img-view">
                            <button class="floating-share-btn" onclick="shareProduct()">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                        ${images.length > 1 ? `<div class="thumbnails-row">${thumbs}</div>` : ''}
                    </div>
                    <div class="info-section" style="flex:1;">
                        <button class="btn-back-circle" style="margin-bottom:20px;" onclick="router('home')">
                            <i class="fas fa-arrow-right"></i>
                        </button>
                        <h2 class="cool-title">${p.title}</h2>
                        <p style="font-size:1.6rem; font-weight:800; color:var(--primary); margin:15px 0;">${p.price} ج.م</p>
                        ${p.oldPrice ? `<p class="old-price-text" style="font-size:1.1rem; margin-bottom:15px;">${p.oldPrice} ج.م</p>` : ''}
                        ${p.description ? `<p style="color:var(--text-secondary); margin-bottom:20px; line-height:1.8;">${p.description}</p>` : ''}
                        ${colors.length > 0 ? `
                            <div style="margin:25px 0;">
                                <h4 style="margin-bottom:12px; color:var(--primary);">اختر اللون:</h4>
                                <div class="color-select-row">${colorBtns}</div>
                            </div>
                        ` : ''}
                        <div style="margin:25px 0;">
                            <h4 style="margin-bottom:12px; color:var(--primary);">الكمية:</h4>
                            <div class="qty-box">
                                <button class="qty-btn" onclick="changeQty(-1)">-</button>
                                <span id="qty-display" style="font-size:1.2rem; font-weight:700;">${qty}</span>
                                <button class="qty-btn" onclick="changeQty(1)">+</button>
                            </div>
                        </div>
                        <button class="btn-primary" onclick="addToCart()">
                            <i class="fas fa-shopping-bag"></i> أضف للسلة
                        </button>
                        <button class="btn-share-main" onclick="shareProduct()">
                            <i class="fas fa-share-alt"></i> <span>مشاركة المنتج</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    window.selectColor = (c) => { selectedColor = c; render(); }
    window.changeQty = (delta) => { qty = Math.max(1, qty + delta); document.getElementById('qty-display').innerText = qty; }
    window.changeMainImg = (idx) => {
        document.getElementById('main-img-view').src = images[idx];
        document.querySelectorAll('.thumb-img').forEach((t, i) => t.classList.toggle('active', i === idx));
    }
    window.addToCart = () => {
        cart.push({ id: p.id, title: p.title, price: p.price, img: images[0], color: selectedColor, qty });
        localStorage.setItem('athar_cart', JSON.stringify(cart));
        updateBadge();
        showToast('تمت الإضافة للسلة ✓');
    }
    window.shareProduct = () => {
        if (navigator.share) {
            navigator.share({ title: p.title, text: shareText, url: shareUrl }).catch(() => {});
        } else {
            window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
        }
    }

    render();
}

window.renderCartPage = () => {
    const appDiv = document.getElementById('app');
    document.body.style.background = 'var(--bg-grad)';

    if(cart.length === 0) {
        appDiv.innerHTML = `
        <div class="cart-page-container glass-card" style="text-align:center; padding:60px 20px;">
            <i class="fas fa-shopping-bag" style="font-size:4rem; color:var(--gold); margin-bottom:20px;"></i>
            <h3>السلة فارغة</h3>
            <button class="btn-sec" onclick="router('home')">تسوق الآن</button>
        </div>`;
        return;
    }

    let total = 0;
    const items = cart.map((item, i) => {
        total += item.price * item.qty;
        return `
            <div class="cart-item glass-card" style="display:flex; gap:10px; margin-bottom:10px; padding:10px;">
                <img src="${item.img}" style="width:70px; height:70px; border-radius:12px; object-fit:cover;">
                <div style="flex:1;">
                    <div style="font-weight:bold; font-size:1rem;">${item.title}</div>
                    <div style="font-size:0.85rem; color:#666; margin:4px 0;">
                        ${colorNames[item.color] || 'لون'} 
                        <span onclick="editColorCart(${i})" style="color:var(--primary); cursor:pointer; font-weight:bold;">(تعديل)</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:bold; color:var(--primary);">${item.price} ج.م</span>
                        <div class="qty-box" style="padding:2px 8px;">
                            <button class="qty-btn" style="width:25px; height:25px;" onclick="updateCartItemQty(${i}, -1)">-</button>
                            <span style="font-size:0.9rem; margin:0 5px;">${item.qty}</span>
                            <button class="qty-btn" style="width:25px; height:25px;" onclick="updateCartItemQty(${i}, 1)">+</button>
                        </div>
                    </div>
                </div>
                <button onclick="remCart(${i})" style="border:none; background:none; color:#ef4444; cursor:pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');

    const govOptions = governorates.map(g => `<option value="${g}">${g}</option>`).join('');

    appDiv.innerHTML = `
        <div class="cart-page-container glass-card">
            <h2 style="margin-bottom:20px; font-size:1.3rem;">مراجعة الطلب</h2>
            <div style="margin-bottom:25px;">${items}</div>
            <div style="background:rgba(255,255,255,0.5); padding:20px; border-radius:16px; margin-bottom:25px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;"><span>المجموع</span><span>${total} ج.م</span></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;"><span>الشحن</span><span>${SHIPPING_COST} ج.م</span></div>
                <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:1.2rem; border-top:1px solid #ddd; padding-top:10px;">
                    <span>الإجمالي</span><span>${total+SHIPPING_COST} ج.م</span>
                </div>
            </div>
            <h3 style="margin-bottom:15px;">بيانات الشحن</h3>
            <div class="form-group"><input id="c-name" class="form-input" placeholder="الاسم ثلاثي" required></div>
            <div class="form-group"><input id="c-phone" type="tel" class="form-input" placeholder="رقم واتساب" required></div>
            <div class="form-group">
                <select id="c-gov" class="form-select">
                    <option value="" disabled selected>اختر المحافظة</option>
                    ${govOptions}
                </select>
            </div>
            <div class="form-group" style="display:flex; gap:10px;">
                <input id="c-city" class="form-input" placeholder="المدينة/المركز" required>
                <input id="c-area" class="form-input" placeholder="الحي/المنطقة" required>
            </div>
            <button class="btn-primary" onclick="sendWA(${total+SHIPPING_COST})">
                <i class="fab fa-whatsapp"></i> إرسال الطلب
            </button>
        </div>
    `;
}

window.updateCartItemQty = (i, change) => { let newQty = cart[i].qty + change; if(newQty >= 1) { cart[i].qty = newQty; localStorage.setItem('athar_cart', JSON.stringify(cart)); renderCartPage(); updateBadge(); } }
window.sendWA = (total) => {
    const name = document.getElementById('c-name').value;
    const phone = document.getElementById('c-phone').value;
    const gov = document.getElementById('c-gov').value;
    const city = document.getElementById('c-city').value;
    const area = document.getElementById('c-area').value;
    if(!name || !phone || !gov || !city || !area) return showToast("أكمل البيانات");
    let msg = `*طلب جديد - Athar*\n👤 الاسم: ${name}\n📱 رقم: ${phone}\n📍 العنوان: ${gov} - ${city} - ${area}\n----------------\n`;
    cart.forEach(i => { msg += `- ${i.title} (${colorNames[i.color] || 'لون'}) عدد ${i.qty}\n`; });
    msg += `----------------\n*الإجمالي: ${total} ج.م*`;
    window.location.href = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`;
    localStorage.removeItem('athar_cart'); cart = []; updateBadge(); router('home');
}
window.checkAdminAccess = () => { 
    if(isAdmin) {
        const choice = confirm("اضغط OK لإضافة منتج\nاضغط Cancel لتعديل الإعدادات");
        if(choice) {
            router('admin-add');
        } else {
            router('social-settings');
        }
    } else {
        router('admin-login');
    }
}
window.renderAdminLogin = () => {
    document.body.style.background = 'var(--bg-grad)';
    document.getElementById('app').innerHTML = `<div class="login-wrapper"><div class="login-card glass-card"><i class="fas fa-user-shield fa-3x" style="color:var(--primary); margin-bottom:15px;"></i><h3 style="margin-bottom:20px;">لوحة المدير</h3><input type="password" id="admin-pin" class="form-input" style="text-align:center; margin-bottom:20px;" placeholder="الرمز السري"><button class="btn-primary" onclick="verifyPin()">دخول</button><button class="btn-back-circle" style="margin:20px auto 0;" onclick="router('home')"><i class="fas fa-arrow-right"></i></button></div></div>`;
}
window.verifyPin = () => { if(document.getElementById('admin-pin').value === ADMIN_PIN) { isAdmin = true; sessionStorage.setItem('isAdmin', 'true'); showToast("مرحباً بك!"); router('home'); } else { showToast("رمز خاطئ"); } }
window.renderAddProductPage = (editId = null) => {
    const appDiv = document.getElementById('app'); document.body.style.background = 'var(--bg-grad)';
    let data = { title: '', price: '', oldPrice: '', description: '', colors: [] }; let formTitle = "إضافة منتج"; selectedColorsForNewProduct = [];
    if(editId) { const p = productsCache.find(x => x.id === editId); if(p) { data = p; selectedColorsForNewProduct = p.colors || []; } formTitle = "تعديل منتج"; } else { selectedColorsForNewProduct = ['#000000', '#FFFFFF']; }
    appDiv.innerHTML = `<div style="padding:20px; max-width:600px; margin:0 auto;"><button class="btn-back-circle" onclick="router('home')"><i class="fas fa-arrow-right"></i></button><div class="glass-card"><h3 style="margin-bottom:20px;">${formTitle}</h3><form id="prod-form"><div class="form-group"><label>اسم المنتج</label><input id="p-title" class="form-input" value="${data.title}" required></div><div class="form-group" style="display:flex; gap:10px;"><div style="flex:1"><label>السعر الحالي</label><input id="p-price" type="number" class="form-input" value="${data.price}" required></div><div style="flex:1"><label>السعر قبل الخصم</label><input id="p-old-price" type="number" class="form-input" value="${data.oldPrice || ''}"></div></div><div class="form-group"><label>الوصف</label><textarea id="p-desc" class="form-input" style="height:80px;">${data.description || ''}</textarea></div><div class="form-group"><label>الألوان المتاحة:</label><div id="new-prod-colors" style="display:flex; gap:5px; flex-wrap:wrap; margin:5px 0;"></div><div style="margin-top:10px; border-top:1px solid #ccc; padding-top:10px;"><small>أضف لون:</small><div style="display:flex; gap:5px; flex-wrap:wrap;">${systemColors.map(c => `<div class="color-circle" style="background:${c}; width:25px; height:25px;" onclick="addColToNew('${c}')"></div>`).join('')}</div></div></div><div class="form-group"><label>الصور</label><input type="file" id="p-imgs" multiple accept="image/*" class="form-input">${editId ? '<small style="color:red">اترك الصور فارغة إذا لم ترد تغييرها</small>' : ''}</div><button type="submit" id="save-btn" class="btn-primary">حفظ</button></form></div></div>`;
    renderNewProdColors();
    document.getElementById('prod-form').onsubmit = async (e) => {
        e.preventDefault(); const btn = document.getElementById('save-btn'); btn.innerText = 'جاري...'; btn.disabled = true;
        const title = document.getElementById('p-title').value; const price = document.getElementById('p-price').value; const oldPrice = document.getElementById('p-old-price').value; const desc = document.getElementById('p-desc').value; const files = document.getElementById('p-imgs').files;
        let imgs = []; if(editId && files.length === 0) { imgs = productsCache.find(x => x.id === editId).images; } else if (files.length > 0) { for(let f of files) imgs.push(await compress(f)); }
        if(!imgs || !imgs.length) { showToast('الصور مطلوبة'); btn.disabled=false; btn.innerText='حفظ'; return; }
        const payload = { title, price, oldPrice, description: desc, images: imgs, imageCode: imgs[0], colors: selectedColorsForNewProduct, timestamp: Date.now() };
        if(editId) { await updateDoc(doc(db, "products", editId), payload); showToast("تم التعديل"); } else { await addDoc(collection(db, "products"), payload); showToast("تمت الإضافة"); } router('home');
    };
}
window.renderNewProdColors = () => { const div = document.getElementById('new-prod-colors'); if(!div) return; div.innerHTML = selectedColorsForNewProduct.map(c => `<div class="color-circle" style="background:${c}; position:relative;" onclick="remColFromNew('${c}')"><i class="fas fa-times" style="position:absolute; top:-5px; right:-5px; background:red; color:white; border-radius:50%; font-size:10px; width:12px; height:12px; display:flex; align-items:center; justify-content:center;"></i></div>`).join(''); }
window.addColToNew = (c) => { if(!selectedColorsForNewProduct.includes(c)) { selectedColorsForNewProduct.push(c); renderNewProdColors(); } }
window.remColFromNew = (c) => { selectedColorsForNewProduct = selectedColorsForNewProduct.filter(x => x !== c); renderNewProdColors(); }
window.deleteProduct = async (id) => { if(confirm('حذف المنتج نهائياً؟')) { await deleteDoc(doc(db, "products", id)); showToast("تم الحذف"); router('home'); } }
function compress(file) { return new Promise(r => { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = e => { const img = new Image(); img.src = e.target.result; img.onload = () => { const cvs = document.createElement('canvas'); const ctx = cvs.getContext('2d'); const s = 800/img.width; cvs.width = 800; cvs.height = img.height * s; ctx.drawImage(img,0,0,cvs.width,cvs.height); r(cvs.toDataURL('image/jpeg', 0.8)); } } }); }
function showToast(msg) { const t = document.getElementById('toast'); document.getElementById('toast-msg').innerText = msg; t.classList.remove('hidden'); setTimeout(() => t.classList.add('hidden'), 3000); }
window.remCart = (i) => { cart.splice(i, 1); localStorage.setItem('athar_cart', JSON.stringify(cart)); renderCartPage(); updateBadge(); }
window.editColorCart = (i) => { const item = cart[i]; const p = productsCache.find(x => x.id === item.id); if(!p || !p.colors) return; document.getElementById('modal-colors-area').innerHTML = p.colors.map(c => `<div class="color-circle" style="background:${c};" onclick="cart[${i}].color='${c}'; confirmColorUpdate()"></div>`).join(''); document.getElementById('color-modal').classList.remove('hidden'); }
window.confirmColorUpdate = () => { localStorage.setItem('athar_cart', JSON.stringify(cart)); closeColorModal(); renderCartPage(); }
window.closeColorModal = () => document.getElementById('color-modal').classList.add('hidden');
function updateBadge() { document.getElementById('cart-badge').innerText = cart.reduce((a,b)=>a+b.qty,0); }

window.renderSocialSettings = () => {
    const appDiv = document.getElementById('app');
    document.body.style.background = 'var(--bg-grad)';
    
    appDiv.innerHTML = `
        <div style="padding:20px; max-width:600px; margin:0 auto;">
            <button class="btn-back-circle" onclick="router('home')">
                <i class="fas fa-arrow-right"></i>
            </button>
            
            <div class="glass-card" style="margin-top:20px;">
                <h3 style="margin-bottom:25px; color:var(--primary); display:flex; align-items:center; gap:10px; font-size:1.6rem;">
                    <i class="fas fa-cog" style="color:var(--gold);"></i>
                    إعدادات المتجر
                </h3>
                
                <h4 style="margin-bottom:15px; color:var(--primary); font-size:1.2rem;">
                    <i class="fas fa-share-alt" style="color:var(--gold);"></i>
                    التواصل الاجتماعي
                </h4>
                
                <div class="form-group">
                    <label style="display:flex; align-items:center; gap:8px; margin-bottom:8px; font-weight:600; color:var(--primary);">
                        <i class="fab fa-whatsapp" style="color:#25D366; font-size:1.2rem;"></i>
                        رقم الواتساب
                    </label>
                    <input id="social-wa" type="text" class="form-input" 
                           placeholder="مثال: 201234567890" 
                           value="${socialLinks.whatsapp}">
                    <small style="color:var(--text-secondary); margin-top:5px; display:block;">
                        أدخل الرقم بدون + أو مسافات (مثال: 201234567890)
                    </small>
                </div>

                <div class="form-group">
                    <label style="display:flex; align-items:center; gap:8px; margin-bottom:8px; font-weight:600; color:var(--primary);">
                        <i class="fab fa-facebook-f" style="color:#1877F2; font-size:1.2rem;"></i>
                        رابط فيسبوك
                    </label>
                    <input id="social-fb" type="text" class="form-input" 
                           placeholder="https://facebook.com/yourpage" 
                           value="${socialLinks.facebook}">
                </div>

                <div class="form-group">
                    <label style="display:flex; align-items:center; gap:8px; margin-bottom:8px; font-weight:600; color:var(--primary);">
                        <i class="fab fa-instagram" style="color:#E4405F; font-size:1.2rem;"></i>
                        رابط إنستجرام
                    </label>
                    <input id="social-ig" type="text" class="form-input" 
                           placeholder="https://instagram.com/yourpage" 
                           value="${socialLinks.instagram}">
                </div>

                <div class="form-group">
                    <label style="display:flex; align-items:center; gap:8px; margin-bottom:8px; font-weight:600; color:var(--primary);">
                        <i class="fab fa-tiktok" style="color:#000000; font-size:1.2rem;"></i>
                        رابط تيك توك
                    </label>
                    <input id="social-tk" type="text" class="form-input" 
                           placeholder="https://tiktok.com/@yourpage" 
                           value="${socialLinks.tiktok}">
                </div>

                <hr style="margin: 30px 0; border: none; border-top: 2px solid rgba(212, 175, 55, 0.2);">

                <h4 style="margin-bottom:15px; color:var(--primary); font-size:1.2rem;">
                    <i class="fas fa-truck" style="color:var(--gold);"></i>
                    سعر الشحن
                </h4>

                <div class="form-group">
                    <label style="display:flex; align-items:center; gap:8px; margin-bottom:8px; font-weight:600; color:var(--primary);">
                        <i class="fas fa-money-bill-wave" style="color:var(--gold); font-size:1.2rem;"></i>
                        السعر بالجنيه المصري
                    </label>
                    <input id="shipping-cost" type="number" class="form-input" 
                           placeholder="مثال: 50" 
                           value="${SHIPPING_COST}">
                </div>

                <button class="btn-primary" onclick="saveSettings()" style="margin-top:10px;">
                    <i class="fas fa-save"></i> حفظ الإعدادات
                </button>
            </div>
        </div>
    `;
}

window.saveSettings = async () => {
    const newSocialLinks = {
        whatsapp: document.getElementById('social-wa').value.trim(),
        facebook: document.getElementById('social-fb').value.trim(),
        instagram: document.getElementById('social-ig').value.trim(),
        tiktok: document.getElementById('social-tk').value.trim()
    };
    
    const newShippingCost = parseInt(document.getElementById('shipping-cost').value) || 50;
    
    try {
        await setDoc(doc(db, "settings", "general"), {
            socialLinks: newSocialLinks,
            shippingCost: newShippingCost,
            updatedAt: Date.now()
        });
        
        socialLinks = newSocialLinks;
        SHIPPING_COST = newShippingCost;
        
        showToast('تم حفظ الإعدادات بنجاح! ✓');
        
        setTimeout(() => {
            router('home');
        }, 1500);
    } catch (e) {
        showToast('حدث خطأ أثناء الحفظ');
        console.error(e);
    }
}

updateBadge(); updateAdminUI();
