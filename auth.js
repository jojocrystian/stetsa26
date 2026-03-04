
auth_js = """/* ============================================================
   AUTH.JS - Session & Login Logic Stetsa'26
   ============================================================ */

window.addEventListener("DOMContentLoaded", function() {
  setTimeout(function() {
    var ls = document.getElementById("loadingScreen");
    if (ls) ls.classList.add("hidden");
  }, 900);

  var path    = window.location.pathname;
  var session = getSession("stetsa_session");

  if (path.indexOf("admin") === -1) {
    if (session && (path.indexOf("index.html") !== -1 || path === "/" || path.endsWith("/"))) {
      window.location.href = "home.html";
      return;
    }
    if (!session && (path.indexOf("home.html") !== -1 || path.indexOf("gallery.html") !== -1)) {
      window.location.href = "index.html";
      return;
    }
  }
});

/* ===== SESSION ===== */
function getSession(key) {
  if (!key) key = "stetsa_session";
  try {
    var s = localStorage.getItem(key);
    if (!s) return null;
    var parsed = JSON.parse(s);
    if (Date.now() > parsed.expires) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch(e) {
    return null;
  }
}

function setSession(data, key) {
  if (!key) key = "stetsa_session";
  var session = {};
  var keys = Object.keys(data);
  for (var i = 0; i < keys.length; i++) {
    session[keys[i]] = data[keys[i]];
  }
  session.expires = Date.now() + CONFIG.SESSION_DURATION;
  localStorage.setItem(key, JSON.stringify(session));
}

function clearSession(key) {
  if (!key) key = "stetsa_session";
  localStorage.removeItem(key);
}

/* ===== LOGIN ===== */
function handleLogin(e) {
  e.preventDefault();

  var username = document.getElementById("username").value.trim();
  var password = document.getElementById("password").value.trim();
  var errEl    = document.getElementById("errorMsg");
  var btn      = document.getElementById("loginBtn");
  var txt      = document.getElementById("loginBtnText");
  var ldr      = document.getElementById("btnLoader");

  txt.style.display = "none";
  ldr.style.display = "block";
  btn.disabled      = true;
  errEl.textContent = "";

  apiCall("login", { username: username, password: password })
    .then(function(result) {
      txt.style.display = "block";
      ldr.style.display = "none";
      btn.disabled      = false;

      if (result.success) {
        setSession(result.data, "stetsa_session");
        showToast("Login berhasil! Mengalihkan...", "success");
        setTimeout(function() {
          window.location.href = "home.html";
        }, 900);
      } else {
        errEl.textContent = result.message || "Username atau password salah / belum terdaftar.";
        var card = document.querySelector(".login-card");
        if (card) {
          card.style.animation = "shake .4s";
          setTimeout(function() { card.style.animation = ""; }, 500);
        }
      }
    })
    .catch(function(err) {
      txt.style.display = "block";
      ldr.style.display = "none";
      btn.disabled      = false;
      errEl.textContent = "Terjadi kesalahan. Coba lagi.";
      console.error(err);
    });
}

/* ===== TOGGLE PASSWORD ===== */
function togglePassword() {
  var inp = document.getElementById("password");
  var ic  = document.getElementById("eyeIcon");
  if (!inp) return;
  if (inp.type === "password") {
    inp.type    = "text";
    ic.className = "fas fa-eye-slash";
  } else {
    inp.type    = "password";
    ic.className = "fas fa-eye";
  }
}

/* ===== LOGOUT ===== */
function logout() {
  clearSession("stetsa_session");
  showToast("Berhasil logout.", "info");
  setTimeout(function() {
    window.location.href = "index.html";
  }, 700);
}

function adminLogout() {
  clearSession("stetsa_admin_session");
  showToast("Berhasil logout.", "info");
  setTimeout(function() {
    window.location.href = "admin-login.html";
  }, 700);
}

/* ===== DROPDOWN ===== */
function toggleDropdown() {
  var m = document.getElementById("dropdownMenu");
  if (m) m.classList.toggle("show");
}

document.addEventListener("click", function(e) {
  var m   = document.getElementById("dropdownMenu");
  var btn = document.getElementById("avatarBtn");
  if (m && btn && !btn.contains(e.target) && !m.contains(e.target)) {
    m.classList.remove("show");
  }
});

/* ===== MODAL ===== */
function openModal(id) {
  var m = document.getElementById(id);
  if (m) m.classList.add("open");
}

function closeModal(id) {
  var m = document.getElementById(id);
  if (m) m.classList.remove("open");
}

document.addEventListener("click", function(e) {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.classList.remove("open");
  }
});
"""

with open("auth.js", "w", encoding="utf-8") as f:
    f.write(auth_js)

# Verifikasi tidak ada sintaks berbahaya
checks = {
  "Template literal (`)": "`" in auth_js,
  "Arrow function (=>)":  "=>" in auth_js,
  "async/await":          "async " in auth_js,
  "Default param (= {})": "= {}" in auth_js,
  "Spread (...)":         "...d" in auth_js,
}

print("=== HASIL VERIFIKASI auth.js ===")
all_ok = True
for k, v in checks.items():
    status = "DITEMUKAN" if v else "OK"
    if v: all_ok = False
    print(f"  {k:30s} : {status}")

print()
print("KESIMPULAN:", "BERSIH - Siap dipakai!" if all_ok else "Masih ada sintaks bermasalah!")
print(f"Ukuran file: {len(auth_js)} karakter")
