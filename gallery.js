/* ============================================================
   GALLERY.JS — Logic Galeri, Lightbox, Download, Favorit
   ============================================================ */

let allPhotos    = [];
let lightboxList = [];
let lightboxIdx  = 0;
let favorites    = JSON.parse(localStorage.getItem("stetsa_favs") || "[]");

window.addEventListener("DOMContentLoaded", () => {
  const session = getSession("stetsa_session");
  if (!session) { window.location.href = "index.html"; return; }

  // Set avatar
  if (session.photoUrl) {
    const a = document.getElementById("avatarBtn");
    if (a) a.innerHTML = `<img src="${session.photoUrl}" alt="avatar">`;
  }

  loadGallery(session);
  setupSwipeAndKeyboard();
});

/* ===== LOAD GALLERY ===== */
async function loadGallery(session) {
  const res = await apiCall("getGallery", {
    userId:  session.id,
    classId: session.classId || ""
  });

  const grid = document.getElementById("photoGrid");

  if (!res.success) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:rgba(255,255,255,.4);padding:40px">Gagal memuat galeri. Periksa koneksi internet.</p>';
    showToast("Gagal memuat galeri.", "error");
    return;
  }

  allPhotos = res.photos || [];
  buildAlbumTabs(res.albums || []);
  renderPhotos("all");

  const subtitle = document.getElementById("gallerySubtitle");
  if (subtitle) subtitle.textContent = `${allPhotos.length} foto tersedia`;
}

/* ===== ALBUM TABS ===== */
function buildAlbumTabs(albums) {
  const tabs = document.getElementById("albumTabs");
  if (!tabs) return;
  tabs.innerHTML = `<div class="album-tab active" onclick="filterAlbum('all', this)">
    <i class="fas fa-th"></i> Semua
  </div>`;
  albums.forEach(a => {
    const t = document.createElement("div");
    t.className = "album-tab";
    t.innerHTML = a.name;
    t.onclick = () => filterAlbum(a.id, t);
    tabs.appendChild(t);
  });
}

function filterAlbum(id, el) {
  document.querySelectorAll(".album-tab").forEach(t => t.classList.remove("active"));
  if (el) el.classList.add("active");
  renderPhotos(id);
}

/* ===== RENDER PHOTOS ===== */
function renderPhotos(albumId) {
  const grid = document.getElementById("photoGrid");
  const list = albumId === "all"
    ? allPhotos
    : allPhotos.filter(p => String(p.albumId) === String(albumId));

  if (!list.length) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:rgba(255,255,255,.35);padding:40px">Tidak ada foto di album ini.</p>';
    return;
  }

  // Simpan list untuk lightbox
  lightboxList = list;

  grid.innerHTML = list.map((p, i) => `
    <div class="photo-card" onclick="openLightbox(${i})">
      <img src="${p.thumbnailUrl || p.url}" alt="${p.name || 'foto'}" loading="lazy">
      <div class="photo-overlay">
        <button class="photo-btn fav ${favorites.includes(p.id) ? 'active' : ''}"
          onclick="toggleFav(event,'${p.id}')">
          <i class="fas fa-star"></i>
        </button>
        <button class="photo-btn" onclick="downloadPhoto(event,'${p.url}','${p.name || 'foto'}')">
          <i class="fas fa-download"></i>
        </button>
      </div>
    </div>
  `).join("");
}

/* ===== LIGHTBOX ===== */
function openLightbox(idx) {
  lightboxIdx = idx;
  const lb = document.getElementById("lightbox");
  const img = document.getElementById("lightboxImg");
  const info = document.getElementById("lightboxInfo");
  img.src = lightboxList[idx].url;
  if (info) info.textContent = `${idx + 1} / ${lightboxList.length}`;
  lb.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  document.getElementById("lightbox").classList.remove("open");
  document.body.style.overflow = "";
}

function lightboxNav(dir) {
  if (!lightboxList.length) return;
  lightboxIdx = (lightboxIdx + dir + lightboxList.length) % lightboxList.length;
  const img  = document.getElementById("lightboxImg");
  const info = document.getElementById("lightboxInfo");
  img.src = lightboxList[lightboxIdx].url;
  if (info) info.textContent = `${lightboxIdx + 1} / ${lightboxList.length}`;
}

function downloadCurrentPhoto() {
  const p = lightboxList[lightboxIdx];
  if (p) downloadPhoto(null, p.url, p.name || "foto");
}

/* ===== DOWNLOAD ===== */
function downloadPhoto(e, url, name) {
  if (e) e.stopPropagation();
  const a = document.createElement("a");
  a.href     = url;
  a.download = name.endsWith(".jpg") || name.endsWith(".png") ? name : name + ".jpg";
  a.target   = "_blank";
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast("Mendownload foto...", "info");
  const session = getSession("stetsa_session");
  if (session) apiPost("logDownload", { userId: session.id, photoName: name });
}

/* ===== FAVORIT ===== */
function toggleFav(e, photoId) {
  e.stopPropagation();
  const idx = favorites.indexOf(photoId);
  if (idx === -1) {
    favorites.push(photoId);
    showToast("Ditambahkan ke favorit ⭐", "success");
  } else {
    favorites.splice(idx, 1);
    showToast("Dihapus dari favorit", "info");
  }
  localStorage.setItem("stetsa_favs", JSON.stringify(favorites));
  e.currentTarget.classList.toggle("active");
}

/* ===== SWIPE & KEYBOARD ===== */
function setupSwipeAndKeyboard() {
  let startX = 0;
  const lb = document.getElementById("lightbox");

  lb.addEventListener("touchstart", e => { startX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) lightboxNav(diff > 0 ? 1 : -1);
  });

  document.addEventListener("keydown", e => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "ArrowRight") lightboxNav(1);
    if (e.key === "ArrowLeft")  lightboxNav(-1);
    if (e.key === "Escape")     closeLightbox();
  });
}
