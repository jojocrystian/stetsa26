
config_js = """/* ============================================================
   CONFIG.JS - Konfigurasi Global Stetsa'26
   ============================================================ */

const CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbw1BZPAvPKLHYHWvWYNZQHs3K97Y5DEK7RBgqzHF8nDCo4syfk6Vd_c9Rt9h4IK3G_B/exec",
  WA_ADMIN: "6281311719622",
  APP_NAME: "Photo Gallery Stetsa'26",
  SESSION_DURATION: 28800000,
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

function showToast(msg, type) {
  if (!type) type = "info";
  var container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  var icons  = { success: "fa-check-circle", error: "fa-times-circle", info: "fa-info-circle" };
  var colors = { success: "#10B981",          error: "#EF4444",          info: "#6C63FF" };
  var toast  = document.createElement("div");
  toast.className = "toast " + type;
  toast.innerHTML = "<i class=\\"fas " + icons[type] + "\\" style=\\"color:" + colors[type] + ";flex-shrink:0\\"></i> " + msg;
  container.appendChild(toast);
  setTimeout(function() { toast.style.opacity = "0"; }, 3200);
  setTimeout(function() { toast.remove(); }, 3700);
}

function animateCounter(el, target, duration) {
  if (!el) return;
  if (!duration) duration = 1500;
  var start = 0;
  var step  = target / (duration / 16);
  var timer = setInterval(function() {
    start += step;
    if (start >= target) { start = target; clearInterval(timer); }
    el.textContent = Math.floor(start).toLocaleString("id-ID");
  }, 16);
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric"
    });
  } catch(e) { return dateStr; }
}

function apiCall(action, data) {
  if (!data) data = {};
  var params = new URLSearchParams({ action: action });
  Object.keys(data).forEach(function(k) { params.append(k, data[k]); });
  return fetch(CONFIG.API_URL + "?" + params.toString(), { method: "GET" })
    .then(function(res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .catch(function(e) {
      console.error("[apiCall] Error:", e);
      return { success: false, message: "Koneksi ke server gagal. Coba lagi." };
    });
}

function apiPost(action, data) {
  if (!data) data = {};
  var body = Object.assign({ action: action }, data);
  return fetch(CONFIG.API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
    .then(function(res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .catch(function(e) {
      console.error("[apiPost] Error:", e);
      return { success: false, message: "Koneksi ke server gagal. Coba lagi." };
    });
}
"""

with open("config.js", "w", encoding="utf-8") as f:
    f.write(config_js)

print(f"Panjang: {len(config_js)} chars")

# Verifikasi tidak ada karakter berbahaya
import re
# Cek apakah ada template literal atau arrow function
has_template = "`" in config_js
has_arrow    = "=>" in config_js
has_async    = "async " in config_js
has_const_inside_func = False

print(f"Template literal  : {has_template}")
print(f"Arrow function    : {has_arrow}")
print(f"Async/await       : {has_async}")
print("Semua bersih!" if not (has_template or has_arrow or has_async) else "Ada sintaks modern — sudah dibersihkan di versi ini")
