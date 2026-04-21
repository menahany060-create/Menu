// ===== CART =====
let cart = JSON.parse(localStorage.getItem("menuCart")) || [];

// ===== PROMO CODES =====
const promoCodes = {
  "DRDS10":  10,
  "HESHEM5": 5,
  "DEVS7":   7
};
let appliedPromo = null;

// ===== NAVIGATION =====
function showSection(id, btn) {
  // Hide all sections
  document.querySelectorAll(".menu-section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

  // Show selected
  const section = document.getElementById("section-" + id);
  if (section) {
    section.classList.add("active");
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (btn) btn.classList.add("active");

  // Scroll nav btn into view
  if (btn) {
    btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }
}

// ===== CART FUNCTIONS =====
function addItem(name, price) {
  let existing = cart.find(i => i.name === name);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ name, price, qty: 1 });
  }
  saveCart();
  renderCart();
  showToast("✅ تمت الإضافة");
}

function changeQty(index, delta) {
  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  saveCart();
  renderCart();
  // recalc promo if applied
  if (appliedPromo) recalcPromo();
}

function saveCart() {
  localStorage.setItem("menuCart", JSON.stringify(cart));
}

function renderCart() {
  const container = document.getElementById("cartItems");
  const totalEl   = document.getElementById("cartTotal");
  const badge     = document.getElementById("cartBadge");
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = '<div class="empty-cart">🛒 السلة فارغة</div>';
    totalEl.innerText = "0 جنيه";
    badge.innerText = "0";
    return;
  }

  let sum = 0;
  let html = "";
  cart.forEach((item, i) => {
    const lineTotal = item.price * item.qty;
    sum += lineTotal;
    html += `
      <div class="cart-item">
        <span class="cart-item-name">${item.name}</span>
        <span class="cart-item-price">${lineTotal} جنيه</span>
        <div class="qty-controls">
          <button class="qty-btn" onclick="changeQty(${i}, 1)">+</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${i}, -1)">−</button>
        </div>
      </div>`;
  });

  container.innerHTML = html;

  // Apply promo discount to displayed total
  if (appliedPromo) {
    const discount = Math.round(sum * appliedPromo.discount / 100);
    totalEl.innerText = (sum - discount) + " جنيه";
  } else {
    totalEl.innerText = sum + " جنيه";
  }

  badge.innerText = cart.reduce((s, i) => s + i.qty, 0);
}

// ===== PROMO =====
function applyPromo() {
  const code   = document.getElementById("promoInput").value.trim().toUpperCase();
  const msgEl  = document.getElementById("promoMsg");
  const lineEl = document.getElementById("discountLine");
  const totalEl = document.getElementById("cartTotal");

  if (!code) {
    msgEl.style.color = "#c0392b";
    msgEl.innerText   = "⚠️ ادخل الكود الأول";
    return;
  }

  if (promoCodes[code]) {
    appliedPromo = { code, discount: promoCodes[code] };
    const raw = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const disc = Math.round(raw * appliedPromo.discount / 100);
    const final = raw - disc;

    msgEl.style.color    = "#27ae60";
    msgEl.innerText      = "✅ خصم " + appliedPromo.discount + "% اتطبق!";
    lineEl.style.display = "block";
    lineEl.innerText     = "🎟️ وفرت: " + disc + " جنيه | الإجمالي: " + final + " جنيه";
    totalEl.innerText    = final + " جنيه";
  } else {
    appliedPromo         = null;
    msgEl.style.color    = "#c0392b";
    msgEl.innerText      = "❌ كود غلط";
    lineEl.style.display = "none";
    const raw = cart.reduce((s, i) => s + i.price * i.qty, 0);
    totalEl.innerText    = raw + " جنيه";
  }
}

function recalcPromo() {
  if (!appliedPromo) return;
  const raw   = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const disc  = Math.round(raw * appliedPromo.discount / 100);
  const final = raw - disc;
  const lineEl  = document.getElementById("discountLine");
  const totalEl = document.getElementById("cartTotal");
  if (lineEl) { lineEl.innerText = "🎟️ وفرت: " + disc + " جنيه | الإجمالي: " + final + " جنيه"; }
  if (totalEl) totalEl.innerText = final + " جنيه";
}

// ===== CHECKOUT =====
function openCheckout() {
  if (cart.length === 0) { showToast("🛒 السلة فارغة!"); return; }
  document.getElementById("checkoutPopup").classList.add("active");
}

function closePopup() {
  document.querySelectorAll(".popup-overlay").forEach(p => p.classList.remove("active"));
}

function sendOrder() {
  if (cart.length === 0) { showToast("🛒 السلة فارغة!"); return; }
  const name    = document.getElementById("custName").value.trim();
  const phone   = document.getElementById("custPhone").value.trim();
  const address = document.getElementById("custAddress").value.trim();
  if (!name || !address) { showToast("⚠️ من فضلك املأ بياناتك"); return; }

  let total = 0;
  let msg = "🍽️ *طلب جديد من المطعم*\n\n";
  msg += "👤 الاسم: " + name + "\n";
  if (phone) msg += "📞 الهاتف: " + phone + "\n";
  msg += "📍 العنوان: " + address + "\n\n";
  msg += "─────────────────\n";

  cart.forEach(item => {
    const t = item.price * item.qty;
    total += t;
    if (item.price > 0) {
      msg += `• ${item.name} × ${item.qty} = ${t} جنيه\n`;
    } else {
      msg += `• ${item.name} × ${item.qty} (حسب الطلب)\n`;
    }
  });

  msg += "─────────────────\n";

  if (appliedPromo) {
    const disc = Math.round(total * appliedPromo.discount / 100);
    msg += `🎟️ كود خصم (${appliedPromo.code}): -${disc} جنيه\n`;
    total -= disc;
  }

  msg += "💰 *الإجمالي: " + total + " جنيه*";

  window.open("https://wa.me/201223136302?text=" + encodeURIComponent(msg));

  // Reset
  cart = [];
  appliedPromo = null;
  localStorage.removeItem("menuCart");
  document.getElementById("promoInput").value   = "";
  document.getElementById("promoMsg").innerText = "";
  document.getElementById("discountLine").style.display = "none";
  renderCart();
  closePopup();
  showToast("✅ تم إرسال طلبك!");
}

// ===== SCROLL TO CART =====
function scrollToCart() {
  const cartEl = document.querySelector(".cart-section");
  if (cartEl) cartEl.scrollIntoView({ behavior: "smooth", block: "center" });
}

// ===== TOAST =====
function showToast(msg) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const t = document.createElement("div");
  t.className = "toast";
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(() => t.style.opacity = "1", 50);
  setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.remove(), 300); }, 1800);
}

// ===== INIT =====
window.onload = function() {
  renderCart();
};
