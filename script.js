// ===== STATE =====
let cart = JSON.parse(localStorage.getItem("menuCart")) || [];
const promoCodes = { "DRDS10": 10, "HESHEM5": 5, "DEVS7": 7 };
let appliedPromo = null;
let modalCard = null;
let selectedSize = null;

// ===== NAVIGATION =====
function showSection(id, btn) {
  clearSearch();
  document.querySelectorAll(".menu-section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  const sec = document.getElementById("section-" + id);
  if (sec) { sec.classList.add("active"); sec.scrollIntoView({ behavior: "smooth", block: "start" }); }
  if (btn) { btn.classList.add("active"); btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" }); }
}

function showAll(btn) {
  clearSearch();
  document.querySelectorAll(".menu-section").forEach(s => s.classList.add("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  document.querySelector(".main-content").scrollIntoView({ behavior: "smooth" });
}

// ===== SEARCH =====
function searchItems(q) {
  const searchRes = document.getElementById("searchResults");
  const searchGrid = document.getElementById("searchGrid");
  const mainContent = document.getElementById("mainContent");
  const hero = document.getElementById("heroSection");
  const clearBtn = document.getElementById("searchClear");
  if (!q.trim()) { clearSearch(); return; }
  clearBtn.style.display = "block";
  mainContent.style.display = "none";
  hero.style.display = "none";
  searchRes.style.display = "block";
  const all = document.querySelectorAll(".item-card[data-name]");
  const filtered = [];
  all.forEach(card => {
    const name = (card.dataset.name || "").toLowerCase();
    const desc = (card.querySelector(".item-desc") ? card.querySelector(".item-desc").innerText : "").toLowerCase();
    if (name.includes(q.toLowerCase()) || desc.includes(q.toLowerCase())) filtered.push(card);
  });
  if (filtered.length === 0) {
    searchGrid.innerHTML = '<div style="text-align:center;padding:30px;color:#8a8070;">لا توجد نتائج</div>';
  } else {
    searchGrid.innerHTML = "";
    filtered.forEach(card => {
      const clone = card.cloneNode(true);
      searchGrid.appendChild(clone);
    });
    updateCardStates();
  }
}

function clearSearch() {
  document.getElementById("searchInput").value = "";
  document.getElementById("searchClear").style.display = "none";
  document.getElementById("searchResults").style.display = "none";
  document.getElementById("mainContent").style.display = "block";
  document.getElementById("heroSection").style.display = "flex";
}

// ===== MODAL =====
function openModal(btn) {
  modalCard = btn.closest(".item-card");
  const name = modalCard.dataset.name;
  const sizesRaw = modalCard.dataset.sizes;
  document.getElementById("modalItemName").innerText = name;
  document.getElementById("itemNote").value = "";
  selectedSize = null;

  const sizeSection = document.getElementById("sizeSection");
  const sizeBtns = document.getElementById("sizeBtns");

  if (sizesRaw) {
    const sizes = JSON.parse(sizesRaw);
    sizeSection.style.display = "block";
    sizeBtns.innerHTML = "";
    sizes.forEach((s, i) => {
      const b = document.createElement("button");
      b.className = "size-option-btn";
      b.innerHTML = `<span class="size-label">${s.label}</span><span class="size-price">${s.price} ج</span>`;
      b.onclick = function() {
        document.querySelectorAll(".size-option-btn").forEach(x => x.classList.remove("selected"));
        b.classList.add("selected");
        selectedSize = s;
      };
      if (i === 0) { b.classList.add("selected"); selectedSize = s; }
      sizeBtns.appendChild(b);
    });
  } else {
    sizeSection.style.display = "none";
  }

  document.getElementById("addModal").classList.add("active");
}

function closeAddModal() {
  document.getElementById("addModal").classList.remove("active");
  modalCard = null;
  selectedSize = null;
}

function confirmAdd() {
  if (!modalCard) return;
  const name = modalCard.dataset.name;
  const note = document.getElementById("itemNote").value.trim();
  let price, label;

  if (modalCard.dataset.sizes) {
    if (!selectedSize) { showToast("⚠️ اختر الحجم"); return; }
    price = selectedSize.price;
    label = `${name} (${selectedSize.label})`;
  } else {
    price = parseInt(modalCard.dataset.price);
    label = name;
  }

  if (note) label += ` [${note}]`;
  addToCart(label, price, modalCard);
  closeAddModal();
}

// ===== CART CORE =====
function addToCart(name, price, card) {
  const existing = cart.find(i => i.name === name);
  if (existing) { existing.qty++; } else { cart.push({ name, price, qty: 1 }); }
  saveCart();
  renderCart();
  updateCardStates();
  showToast("✅ تمت الإضافة");
}

function cqChange(btn, delta) {
  const card = btn.closest(".item-card");
  const name = card.dataset.name;
  const cqn = btn.parentElement.querySelector(".cqn");
  let count = parseInt(cqn.innerText) + delta;
  if (count < 0) count = 0;
  cqn.innerText = count;

  const existing = cart.find(i => i.name === name);
  if (count === 0) {
    if (existing) cart.splice(cart.indexOf(existing), 1);
    card.classList.remove("in-cart");
    btn.parentElement.style.display = "none";
    card.querySelector(".add-btn").style.display = "flex";
  } else if (existing) {
    existing.qty = count;
  } else {
    cart.push({ name, price: parseInt(card.dataset.price), qty: count });
  }
  saveCart();
  renderCart();
}

function saveCart() { localStorage.setItem("menuCart", JSON.stringify(cart)); }

function updateCardStates() {
  document.querySelectorAll(".item-card[data-price]:not([data-sizes])").forEach(card => {
    const name = card.dataset.name;
    const item = cart.find(i => i.name === name);
    const cqc = card.querySelector(".cqc");
    const addBtn = card.querySelector(".add-btn");
    if (item && cqc) {
      card.classList.add("in-cart");
      cqc.style.display = "flex";
      cqc.querySelector(".cqn").innerText = item.qty;
      if (addBtn) addBtn.style.display = "none";
    } else if (cqc) {
      card.classList.remove("in-cart");
      cqc.style.display = "none";
      cqc.querySelector(".cqn").innerText = "0";
      if (addBtn) addBtn.style.display = "flex";
    }
  });
}

function changeQty(i, v) {
  cart[i].qty += v;
  if (cart[i].qty <= 0) cart.splice(i, 1);
  saveCart();
  renderCart();
  updateCardStates();
  if (appliedPromo) recalcPromo();
}

function renderCart() {
  const box = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  const badge = document.getElementById("cartBadge");
  if (!box) return;

  if (cart.length === 0) {
    box.innerHTML = '<div class="empty-cart">🛒 السلة فارغة</div>';
    totalEl.innerText = "0 جنيه";
    badge.innerText = "0";
    return;
  }

  let sum = 0, html = "";
  cart.forEach((item, i) => {
    const t = item.price * item.qty;
    sum += t;
    html += `<div class="cart-item">
      <span class="cart-item-name">${item.name}</span>
      <span class="cart-item-price">${t} ج</span>
      <div class="qty-controls">
        <button class="qty-btn" onclick="changeQty(${i},1)">+</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${i},-1)">−</button>
      </div>
    </div>`;
  });

  box.innerHTML = html;
  badge.innerText = cart.reduce((s, i) => s + i.qty, 0);

  if (appliedPromo) {
    const disc = Math.round(sum * appliedPromo.discount / 100);
    totalEl.innerText = (sum - disc) + " جنيه";
  } else {
    totalEl.innerText = sum + " جنيه";
  }
}

// ===== PROMO =====
function applyPromo() {
  const code = document.getElementById("promoInput").value.trim().toUpperCase();
  const msgEl = document.getElementById("promoMsg");
  const lineEl = document.getElementById("discountLine");
  const totalEl = document.getElementById("cartTotal");
  if (!code) { msgEl.style.color = "#c0392b"; msgEl.innerText = "⚠️ ادخل الكود الأول"; return; }
  if (promoCodes[code]) {
    appliedPromo = { code, discount: promoCodes[code] };
    const raw = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const disc = Math.round(raw * appliedPromo.discount / 100);
    msgEl.style.color = "#27ae60"; msgEl.innerText = "✅ خصم " + appliedPromo.discount + "% اتطبق!";
    lineEl.style.display = "block"; lineEl.innerText = "🎟️ وفرت: " + disc + " ج | الإجمالي: " + (raw - disc) + " جنيه";
    totalEl.innerText = (raw - disc) + " جنيه";
  } else {
    appliedPromo = null;
    msgEl.style.color = "#c0392b"; msgEl.innerText = "❌ كود غلط";
    lineEl.style.display = "none";
    totalEl.innerText = cart.reduce((s, i) => s + i.price * i.qty, 0) + " جنيه";
  }
}

function recalcPromo() {
  if (!appliedPromo) return;
  const raw = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const disc = Math.round(raw * appliedPromo.discount / 100);
  document.getElementById("discountLine").innerText = "🎟️ وفرت: " + disc + " ج | الإجمالي: " + (raw - disc) + " جنيه";
  document.getElementById("cartTotal").innerText = (raw - disc) + " جنيه";
}

// ===== CHECKOUT =====
function openCheckout() {
  if (cart.length === 0) { showToast("🛒 السلة فارغة!"); return; }
  document.getElementById("checkoutPopup").classList.add("active");
}

function closePopup() { document.querySelectorAll(".popup-overlay").forEach(p => p.classList.remove("active")); }

function sendOrder() {
  if (cart.length === 0) { showToast("🛒 السلة فارغة!"); return; }
  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const address = document.getElementById("custAddress").value.trim();
  if (!name || !address) { showToast("⚠️ من فضلك املأ بياناتك"); return; }

  let total = 0;
  let msg = "🍽️ *طلب جديد*\n\n";
  msg += "👤 " + name + "\n";
  if (phone) msg += "📞 " + phone + "\n";
  msg += "📍 " + address + "\n\n─────────────\n";

  // Group by section
  const sections = {};
  cart.forEach(item => { total += item.price * item.qty; });
  cart.forEach(item => {
    const t = item.price * item.qty;
    msg += `• ${item.name} × ${item.qty}`;
    if (item.price > 0) msg += ` = ${t} ج`;
    msg += "\n";
  });

  msg += "─────────────\n";
  if (appliedPromo) {
    const disc = Math.round(total * appliedPromo.discount / 100);
    msg += `🎟️ خصم (${appliedPromo.code}): -${disc} ج\n`;
    total -= disc;
  }
  msg += "💰 *الإجمالي: " + total + " جنيه*";

  window.open("https://wa.me/201223136302?text=" + encodeURIComponent(msg));
  cart = []; appliedPromo = null;
  localStorage.removeItem("menuCart");
  document.getElementById("promoInput").value = "";
  document.getElementById("promoMsg").innerText = "";
  document.getElementById("discountLine").style.display = "none";
  renderCart(); updateCardStates(); closePopup();
  showToast("✅ تم إرسال طلبك!");
}

function scrollToCart() { document.querySelector(".cart-section").scrollIntoView({ behavior: "smooth", block: "center" }); }

// ===== TOAST =====
function showToast(msg) {
  const ex = document.querySelector(".toast"); if (ex) ex.remove();
  const t = document.createElement("div"); t.className = "toast"; t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(() => t.style.opacity = "1", 50);
  setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.remove(), 300); }, 1800);
}

window.onload = function() { renderCart(); updateCardStates(); };
