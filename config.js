
### 7. config.js ###
config_js = """/* ============================================================
   CONFIG.JS — Konfigurasi Global
   ============================================================
   WAJIB DIUBAH sebelum deploy:
   1. Ganti API_URL dengan URL Google Apps Script kamu
   2. Ganti WA_ADMIN dengan nomor WhatsApp admin
   ============================================================ */

const CONFIG = {
  // Ganti dengan URL Web App Google Apps Script setelah deploy
  API_URL: "https://script.google.com/macros/s/AKfycbw1BZPAvPKLHYHWvWYNZQHs3K97Y5DEK7RBgqzHF8nDCo4syfk6Vd_c9Rt9h4IK3G_B/exec",

  // Nomor WhatsApp admin (format internasional tanpa +)
  WA_ADMIN: "6281311719622",

  // Nama aplikasi
  APP_NAME: "Photo Gallery Stetsa'26",

  // Durasi session login (8 jam dalam milidetik)
  SESSION_DURATION: 8 * 60 * 60 * 1000,

  // Default slideshow photos (digunakan jika API belum diisi)
  DEFAULT_SLIDES: [
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920",
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1920",
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920",
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1920"
  ]
};

/* ============================================================
   UTILITY FUNCTIONS
   ============================================================ */

// Toast Notification
function showToast(msg, type = "info") {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const iconMap  = { success: "fa-check-circle", error: "fa-times-circle", info: "fa-info-circle" };
  const colorMap = { success: "#10B981", error: "#EF4444", info: "#6C63FF" };
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas ${iconMap[type]}" style="color:${colorMap[type]};flex-shrink:0"></i> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = "0"; }, 3200);
  setTimeout(() => toast.remove(), 3700);
}

// Animated number counter
function animateCounter(el, target, duration = 1500) {
  if (!el) return;
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { start = target; clearInterval(timer); }
    el.textContent = Math.floor(start).toLocaleString("id-ID");
  }, 16);
}

// Format tanggal Indonesia
function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric"
    });
  } catch { return dateStr; }
}

// API Call (GET)
async function apiCall(action, data = {}) {
  try {
    const params = new URLSearchParams({ action, ...data });
    const res = await fetch(`${CONFIG.API_URL}?${params}`, { method: "GET" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } catch (e) {
    console.error("[apiCall] Error:", e);
    return { success: false, message: "Koneksi ke server gagal. Coba lagi." };
  }
}

// API Call (POST)
async function apiPost(action, data = {}) {
  try {
    const res = await fetch(CONFIG.API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...data })
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } catch (e) {
    console.error("[apiPost] Error:", e);
    return { success: false, message: "Koneksi ke server gagal. Coba lagi." };
  }
}
"""

with open("config.js","w",encoding="utf-8") as f: f.write(config_js)
print(f"✅ config.js ({len(config_js)} chars)")
