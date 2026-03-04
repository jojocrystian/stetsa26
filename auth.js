/* ============================================================
   AUTH.JS — Session & Login Logic
   ============================================================ */

window.addEventListener("DOMContentLoaded", () => {
  // Sembunyikan loading screen
  setTimeout(() => {
    const ls = document.getElementById("loadingScreen");
    if (ls) ls.classList.add("hidden");
  }, 900);

  // Guard: redirect jika belum/sudah login
  const path = window.location.pathname;
  const session = getSession("stetsa_session");

  if (!path.includes("admin")) {
    if (session && (path.includes("index.html") || path.endsWith("/"))) {
      window.location.href = "home.html"; return;
    }
    if (!session && (path.includes("home.html") || path.includes("gallery.html"))) {
      window.location.href = "index.html"; return;
    }
  }
});

/* ===== SESSION MANAGEMENT ===== */
function getSession(key = "stetsa_session") {
  try {
    const s = localStorage.getItem(key);
    if (!s) return null;
    const parsed = JSON.parse(s);
    if (Date.now() > parsed.expires) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch { return null; }
}

function setSession(data, key = "stetsa_session") {
  const session = { ...data, expires: Date.now() + CONFIG.SESSION_DURATION };
  localStorage.setItem(key, JSON.stringify(session));
}

function clearSession(key = "stetsa_session") {
  localStorage.removeItem(key);
}

/* ===== LOGIN HANDLER (Client) ===== */
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const errEl    = document.getElementById("errorMsg");
  const btn      = document.getElementById("loginBtn");
  const txt      = document.getElementById("loginBtnText");
  const ldr      = document.getElementById("btnLoader");

  // Loading state
  txt.style.display = "none";
  ldr.style.display = "block";
  btn.disabled = true;
  errEl.textContent = "";

  const result = await apiCall("login", { username, password });

  txt.style.display = "block";
  ldr.style.display = "none";
  btn.disabled = false;

  if (result.success) {
    setSession(result.data, "stetsa_session");
    showToast("Login berhasil! Mengalihkan...", "success");
    setTimeout(() => window.location.href = "home.html", 900);
  } else {
    errEl.textContent = "Username atau password salah / belum terdaftar.";
    const card = document.querySelector(".login-card");
    if (card) {
      card.style.animation = "shake .4s";
      setTimeout(() => card.style.animation = "", 500);
    }
  }
}

/* ===== TOGGLE PASSWORD ===== */
function togglePassword() {
  const inp = document.getElementById("password");
  const ic  = document.getElementById("eyeIcon");
  if (inp.type === "password") {
    inp.type = "text";
    ic.className = "fas fa-eye-slash";
  } else {
    inp.type = "password";
    ic.className = "fas fa-eye";
  }
}

/* ===== LOGOUT ===== */
function logout() {
  clearSession("stetsa_session");
  showToast("Berhasil logout.", "info");
  setTimeout(() => window.location.href = "index.html", 700);
}

/* ===== DROPDOWN TOGGLE ===== */
function toggleDropdown() {
  const m = document.getElementById("dropdownMenu");
  if (m) m.classList.toggle("show");
}

// Tutup dropdown jika klik di luar
document.addEventListener("click", (e) => {
  const m   = document.getElementById("dropdownMenu");
  const btn = document.getElementById("avatarBtn");
  if (m && btn && !btn.contains(e.target) && !m.contains(e.target)) {
    m.classList.remove("show");
  }
});

/* ===== MODAL HELPERS ===== */
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add("open");
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove("open");
}

// Tutup modal jika klik di luar box
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.classList.remove("open");
  }
});
