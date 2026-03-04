/* ============================================================
   ADMIN.JS — Logic Panel Admin
   ============================================================ */

let allClasses = [], allStudents = [], allAlbums = [];
let uploadFiles = [], uploadMode = "local";

window.addEventListener("DOMContentLoaded", () => {
  const session = getSession("stetsa_admin_session");
  if (!session) { window.location.href = "admin-login.html"; return; }

  const nameEl = document.getElementById("adminNameTopbar");
  if (nameEl) nameEl.textContent = session.name || "Admin";

  // Restore halaman terakhir
  const lastPage = sessionStorage.getItem("adminLastPage") || "dashboard";
  showPage(lastPage);
});

/* ============================================================
   NAVIGASI
   ============================================================ */
function showPage(name) {
  document.querySelectorAll(".admin-page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));

  const page = document.getElementById("page-" + name);
  if (page) page.classList.add("active");

  const titles = {
    dashboard:"Dashboard", classes:"Manajemen Kelas", students:"Manajemen Siswa",
    albums:"Manajemen Album", photos:"Manajemen Foto", impressions:"Pesan & Kesan",
    yearbook:"Yearbook Digital", event:"Event & Countdown",
    appearance:"Tampilan & Tema", admins:"Manajemen Admin", logs:"Statistik & Log"
  };
  const topbar = document.getElementById("topbarTitle");
  if (topbar) topbar.textContent = titles[name] || name;

  // Tandai nav link aktif
  document.querySelectorAll(".nav-link").forEach(l => {
    if (l.getAttribute("onclick") && l.getAttribute("onclick").includes(`'${name}'`)) {
      l.classList.add("active");
    }
  });

  sessionStorage.setItem("adminLastPage", name);
  document.getElementById("sidebar")?.classList.remove("open");

  // Load data sesuai halaman
  const loaders = {
    dashboard: loadDashboard,
    classes:   loadClasses,
    students:  loadStudentPage,
    albums:    loadAlbums,
    photos:    loadAdminPhotos,
    impressions: loadImpressionAdmin,
    admins:    loadAdmins,
    logs:      loadLogs,
    event:     loadEventSettings
  };
  if (loaders[name]) loaders[name]();
}

/* ============================================================
   DASHBOARD
   ============================================================ */
async function loadDashboard() {
  const res = await apiCall("adminGetStats");
  if (!res.success) return;
  const d = res.data;
  animateCounter(document.getElementById("st-students"),  d.students  || 0);
  animateCounter(document.getElementById("st-photos"),    d.photos    || 0);
  animateCounter(document.getElementById("st-downloads"), d.downloads || 0);
  animateCounter(document.getElementById("st-views"),     d.views     || 0);
  const logsEl = document.getElementById("recentLogs");
  if (logsEl) {
    const logs = d.recentLogs || [];
    logsEl.innerHTML = logs.length
      ? logs.map(l => `
          <div class="log-item">
            <i class="fas fa-sign-in-alt log-icon"></i>
            <span><b>${l.name}</b> login</span>
            <span class="log-time">${l.time}</span>
          </div>`).join("")
      : '<div class="log-item" style="color:rgba(255,255,255,.35)">Belum ada aktivitas.</div>';
  }
}

/* ============================================================
   KELAS
   ============================================================ */
async function loadClasses() {
  const res = await apiCall("adminGetClasses");
  if (!res.success) return;
  allClasses = res.data || [];
  document.getElementById("classTableBody").innerHTML = allClasses.length
    ? allClasses.map((c, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${c.name}</td>
          <td>${c.studentCount || 0} siswa</td>
          <td>
            <button class="btn btn-primary btn-sm btn-icon" title="Lihat Siswa"
              onclick="viewClassStudents('${c.id}')"><i class="fas fa-eye"></i></button>
            <button class="btn btn-danger btn-sm btn-icon" style="margin-left:6px" title="Hapus"
              onclick="deleteClass('${c.id}')"><i class="fas fa-trash"></i></button>
          </td>
        </tr>`).join("")
    : '<tr><td colspan="4" class="empty-row">Belum ada kelas.</td></tr>';
}

async function addClass() {
  const name = document.getElementById("newClassName").value.trim();
  if (!name) { showToast("Nama kelas wajib diisi!", "error"); return; }
  const res = await apiPost("adminAddClass", { name });
  if (res.success) {
    showToast("Kelas ditambahkan!", "success");
    closeModal("addClassModal");
    document.getElementById("newClassName").value = "";
    loadClasses();
  } else showToast(res.message, "error");
}

async function deleteClass(id) {
  if (!confirm("Hapus kelas? Semua siswa di kelas ini juga akan terhapus.")) return;
  const res = await apiPost("adminDeleteClass", { classId: id });
  if (res.success) { showToast("Kelas dihapus.", "success"); loadClasses(); }
  else showToast(res.message, "error");
}

function viewClassStudents(classId) {
  const sel = document.getElementById("classFilter");
  if (sel) sel.value = classId;
  showPage("students");
}

/* ============================================================
   SISWA
   ============================================================ */
async function loadStudentPage() {
  // Load kelas untuk filter & form
  if (!allClasses.length) {
    const res = await apiCall("adminGetClasses");
    if (res.success) allClasses = res.data || [];
  }
  const sel = document.getElementById("classFilter");
  if (sel) {
    const prev = sel.value;
    sel.innerHTML = '<option value="">Semua Kelas</option>' +
      allClasses.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
    sel.value = prev;
  }
  const selForm = document.getElementById("newStudentClass");
  if (selForm) {
    selForm.innerHTML = allClasses.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
  }
  loadStudents();
}

async function loadStudents() {
  const classId = document.getElementById("classFilter")?.value || "";
  const res = await apiCall("adminGetStudents", classId ? { classId } : {});
  if (!res.success) return;
  allStudents = res.data || [];
  renderStudents(allStudents);
}

function renderStudents(list) {
  const payLabel = {
    paid:   '<span class="badge badge-success">Lunas</span>',
    unpaid: '<span class="badge badge-warning">Belum Bayar</span>',
    none:   '<span class="badge badge-danger">Tidak Ikut</span>'
  };
  document.getElementById("studentTableBody").innerHTML = list.length
    ? list.map((s, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${s.name}</td>
          <td>${s.nis}</td>
          <td>${s.className || "-"}</td>
          <td>${payLabel[s.paymentStatus] || "-"}</td>
          <td>
            <button class="btn btn-danger btn-sm btn-icon" onclick="deleteStudent('${s.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>`).join("")
    : '<tr><td colspan="6" class="empty-row">Tidak ada siswa.</td></tr>';
}

function filterStudents(q) {
  const f = allStudents.filter(s =>
    s.name.toLowerCase().includes(q.toLowerCase()) || String(s.nis).includes(q)
  );
  renderStudents(f);
}

async function addStudent() {
  const d = {
    name:          document.getElementById("newStudentName").value.trim(),
    nis:           document.getElementById("newStudentNIS").value.trim(),
    classId:       document.getElementById("newStudentClass").value,
    paymentStatus: document.getElementById("newStudentPayment").value
  };
  if (!d.name || !d.nis) { showToast("Nama dan NIS wajib diisi!", "error"); return; }
  const res = await apiPost("adminAddStudent", d);
  if (res.success) {
    showToast("Siswa ditambahkan!", "success");
    closeModal("addStudentModal");
    document.getElementById("newStudentName").value = "";
    document.getElementById("newStudentNIS").value  = "";
    loadStudents();
  } else showToast(res.message, "error");
}

async function deleteStudent(id) {
  if (!confirm("Hapus siswa ini?")) return;
  const res = await apiPost("adminDeleteStudent", { studentId: id });
  if (res.success) { showToast("Siswa dihapus.", "success"); loadStudents(); }
  else showToast(res.message, "error");
}

async function importFromSpreadsheet() {
  const url = document.getElementById("spreadsheetUrl").value.trim();
  if (!url) { showToast("Masukkan URL spreadsheet!", "error"); return; }
  showToast("Mengimport data...", "info");
  const res = await apiPost("adminImportStudents", { sheetUrl: url });
  if (res.success) {
    showToast(`${res.count} siswa berhasil diimport!`, "success");
    closeModal("importStudentModal");
    loadStudents();
  } else showToast(res.message, "error");
}

/* ============================================================
   ALBUM
   ============================================================ */
async function loadAlbums() {
  const res = await apiCall("adminGetAlbums");
  if (!res.success) return;
  allAlbums = res.data || [];
  const grid = document.getElementById("albumGrid");

  grid.innerHTML = allAlbums.length
    ? allAlbums.map(a => `
        <div class="album-card">
          <div class="album-thumb" style="${a.thumbnailUrl ? `background-image:url('${a.thumbnailUrl}')` : ''}"></div>
          <div class="album-info">
            <h4>${a.name}</h4>
            <p>${a.photoCount || 0} foto &bull; ${a.classes === "all" ? "Semua Kelas" : a.classNames || a.classes}</p>
            <div class="album-actions">
              <button class="btn btn-primary btn-sm" onclick="goToAlbumPhotos('${a.id}')">
                <i class="fas fa-images"></i> Kelola Foto
              </button>
              <button class="btn btn-danger btn-sm" onclick="deleteAlbum('${a.id}')">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>`).join("")
    : '<p style="color:rgba(255,255,255,.35)">Belum ada album. Klik "Buat Album Baru".</p>';

  // Populate class checklist di modal
  const checklist = document.getElementById("albumClassChecklist");
  if (checklist && allClasses.length) {
    checklist.innerHTML = allClasses.map(c => `
      <label class="checkbox-item">
        <input type="checkbox" name="albumClass" value="${c.id}"> ${c.name}
      </label>`).join("");
  }

  // Populate select di modal upload
  const selUpload = document.getElementById("uploadAlbumId");
  if (selUpload) selUpload.innerHTML = allAlbums.map(a => `<option value="${a.id}">${a.name}</option>`).join("");

  const selFilter = document.getElementById("photoAlbumFilter");
  if (selFilter) {
    selFilter.innerHTML = '<option value="">-- Pilih Album --</option>' +
      allAlbums.map(a => `<option value="${a.id}">${a.name}</option>`).join("");
  }
}

function toggleAllClass(cb) {
  document.querySelectorAll('[name="albumClass"]').forEach(c => {
    c.disabled = cb.checked;
    c.checked  = false;
  });
}

async function addAlbum() {
  const name = document.getElementById("newAlbumName").value.trim();
  if (!name) { showToast("Nama album wajib diisi!", "error"); return; }
  const allCls = document.getElementById("albumAllClass").checked;
  const classes = allCls
    ? ["all"]
    : Array.from(document.querySelectorAll('[name="albumClass"]:checked')).map(c => c.value);
  const res = await apiPost("adminAddAlbum", { name, classes });
  if (res.success) {
    showToast("Album dibuat!", "success");
    closeModal("addAlbumModal");
    document.getElementById("newAlbumName").value = "";
    loadAlbums();
  } else showToast(res.message, "error");
}

async function deleteAlbum(id) {
  if (!confirm("Hapus album? Semua foto di dalamnya juga akan terhapus.")) return;
  const res = await apiPost("adminDeleteAlbum", { albumId: id });
  if (res.success) { showToast("Album dihapus.", "success"); loadAlbums(); }
  else showToast(res.message, "error");
}

function goToAlbumPhotos(albumId) {
  showPage("photos");
  setTimeout(() => {
    const sel = document.getElementById("photoAlbumFilter");
    if (sel) { sel.value = albumId; loadAdminPhotos(); }
  }, 300);
}

/* ============================================================
   FOTO
   ============================================================ */
async function loadAdminPhotos() {
  const albumId = document.getElementById("photoAlbumFilter")?.value;
  if (!albumId) return;
  const res = await apiCall("adminGetPhotos", { albumId });
  if (!res.success) return;
  const photos = res.data || [];
  const grid = document.getElementById("adminPhotoGrid");
  grid.innerHTML = photos.length
    ? photos.map(p => `
        <div class="photo-card">
          <img src="${p.thumbnailUrl || p.url}" alt="${p.name}" loading="lazy">
          <div class="photo-overlay">
            <button class="photo-btn" onclick="adminDeletePhoto('${p.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>`).join("")
    : '<p style="grid-column:1/-1;color:rgba(255,255,255,.35);padding:20px">Belum ada foto di album ini.</p>';
}

function openUploadModal() {
  if (!allAlbums.length) { showToast("Buat album terlebih dahulu!", "error"); return; }
  openModal("uploadPhotoModal");
}

function setUploadMode(mode) {
  uploadMode = mode;
  document.getElementById("uploadLocalSection").style.display = mode === "local" ? "block" : "none";
  document.getElementById("uploadDriveSection").style.display = mode === "drive" ? "block" : "none";
  document.getElementById("tabLocalBtn").style.borderColor = mode === "local" ? "var(--primary)" : "";
  document.getElementById("tabLocalBtn").style.color       = mode === "local" ? "var(--primary)" : "";
  document.getElementById("tabDriveBtn").style.borderColor = mode === "drive" ? "var(--primary)" : "";
  document.getElementById("tabDriveBtn").style.color       = mode === "drive" ? "var(--primary)" : "";
}

function handlePhotoFiles(e) { processFiles(Array.from(e.target.files)); }
function handleDrop(e) {
  e.preventDefault();
  document.getElementById("uploadZone").classList.remove("drag-over");
  processFiles(Array.from(e.dataTransfer.files));
}

function processFiles(files) {
  uploadFiles = files;
  const preview = document.getElementById("uploadPreviewList");
  const count   = document.getElementById("uploadCount");
  preview.innerHTML = uploadFiles.slice(0, 8).map(f => {
    const url = URL.createObjectURL(f);
    return `<img src="${url}" style="width:58px;height:58px;border-radius:8px;object-fit:cover">`;
  }).join("");
  if (uploadFiles.length > 8) {
    preview.innerHTML += `<div style="width:58px;height:58px;border-radius:8px;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-size:12px">+${uploadFiles.length - 8}</div>`;
  }
  if (count) count.textContent = `${uploadFiles.length} foto siap diupload`;
}

async function startBulkUpload() {
  const albumId = document.getElementById("uploadAlbumId").value;
  if (!albumId)          { showToast("Pilih album tujuan!", "error"); return; }
  if (!uploadFiles.length) { showToast("Pilih foto terlebih dahulu!", "error"); return; }

  const btn = document.getElementById("uploadBtn");
  btn.disabled = true;
  let success = 0;

  for (let i = 0; i < uploadFiles.length; i++) {
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${i + 1}/${uploadFiles.length}`;
    await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const res = await apiPost("adminUploadPhoto", {
          albumId, base64: ev.target.result, name: uploadFiles[i].name
        });
        if (res.success) success++;
        resolve();
      };
      reader.readAsDataURL(uploadFiles[i]);
    });
  }

  btn.innerHTML = '<i class="fas fa-upload"></i> Upload Semua';
  btn.disabled = false;
  showToast(`${success}/${uploadFiles.length} foto berhasil diupload!`, success > 0 ? "success" : "error");
  if (success > 0) {
    closeModal("uploadPhotoModal");
    uploadFiles = [];
    loadAdminPhotos();
    loadAlbums();
  }
}

async function importFromDrive() {
  const link    = document.getElementById("driveFolderLink").value.trim();
  const albumId = document.getElementById("uploadAlbumId").value;
  if (!link)    { showToast("Masukkan link folder Google Drive!", "error"); return; }
  if (!albumId) { showToast("Pilih album tujuan!", "error"); return; }
  showToast("Mengimport dari Google Drive...", "info");
  const res = await apiPost("adminImportFromDrive", { folderLink: link, albumId });
  if (res.success) {
    showToast(`${res.count} foto berhasil diimport!`, "success");
    closeModal("uploadPhotoModal");
    loadAdminPhotos(); loadAlbums();
  } else showToast(res.message, "error");
}

async function adminDeletePhoto(id) {
  if (!confirm("Hapus foto ini?")) return;
  const res = await apiPost("adminDeletePhoto", { photoId: id });
  if (res.success) { showToast("Foto dihapus.", "success"); loadAdminPhotos(); }
  else showToast(res.message, "error");
}

/* ============================================================
   PESAN & KESAN
   ============================================================ */
async function loadImpressionAdmin() {
  const res = await apiCall("adminGetImpressions");
  if (!res.success) return;
  const list = res.data || [];
  document.getElementById("impressionTableBody").innerHTML = list.length
    ? list.map(imp => `
        <tr>
          <td><b>${imp.name}</b></td>
          <td style="max-width:280px;white-space:normal">${imp.text}</td>
          <td style="white-space:nowrap">${imp.date || "-"}</td>
          <td>
            ${imp.hidden  ? '<span class="badge badge-danger">Disembunyikan</span>'  : '<span class="badge badge-success">Tampil</span>'}
            ${imp.pinned  ? '<span class="badge badge-warning" style="margin-left:4px">Pin</span>' : ""}
          </td>
          <td style="white-space:nowrap">
            <button class="btn btn-outline btn-sm" onclick="toggleImpression('${imp.id}','pin')">
              ${imp.pinned ? "Unpin" : "Pin"}
            </button>
            <button class="btn btn-outline btn-sm" onclick="toggleImpression('${imp.id}','hide')">
              ${imp.hidden ? "Tampilkan" : "Sembunyikan"}
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteImpression('${imp.id}')">Hapus</button>
          </td>
        </tr>`).join("")
    : '<tr><td colspan="5" class="empty-row">Belum ada pesan.</td></tr>';
}

async function toggleImpression(id, action) {
  await apiPost("adminToggleImpression", { id, action });
  loadImpressionAdmin();
}
async function deleteImpression(id) {
  if (!confirm("Hapus pesan ini?")) return;
  await apiPost("adminDeleteImpression", { id });
  showToast("Pesan dihapus.", "success");
  loadImpressionAdmin();
}

/* ============================================================
   YEARBOOK
   ============================================================ */
async function uploadYearbook(e) {
  const file = e.target.files[0];
  if (!file) return;
  showToast("Mengupload yearbook PDF...", "info");
  const reader = new FileReader();
  reader.onload = async (ev) => {
    const res = await apiPost("adminUploadYearbook", { base64: ev.target.result, name: file.name });
    const status = document.getElementById("yearbookStatus");
    if (res.success) {
      showToast("Yearbook berhasil diupload!", "success");
      if (status) status.innerHTML = `<p style="color:#10B981"><i class="fas fa-check-circle"></i> 
        <b>${file.name}</b> berhasil diupload. 
        <a href="${res.url}" target="_blank" style="color:var(--primary)">Lihat PDF</a></p>`;
    } else {
      showToast(res.message, "error");
      if (status) status.innerHTML = `<p style="color:#ef4444"><i class="fas fa-times-circle"></i> Gagal: ${res.message}</p>`;
    }
  };
  reader.readAsDataURL(file);
}

/* ============================================================
   EVENT & COUNTDOWN
   ============================================================ */
async function loadEventSettings() {
  const res = await apiCall("adminGetEvent");
  if (!res.success || !res.data) return;
  const d = res.data;
  document.getElementById("eventTitle").value           = d.title || "";
  document.getElementById("eventDate").value            = d.date  || "";
  document.getElementById("eventDesc").value            = d.desc  || "";
  document.getElementById("countdownActive").checked    = d.countdownActive || false;
}
async function saveEvent() {
  const d = {
    title:           document.getElementById("eventTitle").value.trim(),
    date:            document.getElementById("eventDate").value,
    desc:            document.getElementById("eventDesc").value.trim(),
    countdownActive: document.getElementById("countdownActive").checked
  };
  const res = await apiPost("adminSaveEvent", d);
  showToast(res.success ? "Event disimpan!" : res.message, res.success ? "success" : "error");
}

/* ============================================================
   TAMPILAN & TEMA
   ============================================================ */
function previewBg(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const prev = document.getElementById("bgPreview");
    prev.src = ev.target.result;
    prev.style.display = "block";
  };
  reader.readAsDataURL(file);
}
async function saveAppearance() {
  const bgFile = document.getElementById("bgInput").files[0];
  const primary = document.getElementById("primaryHex").value;
  const accent  = document.getElementById("accentHex").value;
  let bgBase64 = null;
  if (bgFile) {
    const reader = new FileReader();
    bgBase64 = await new Promise(resolve => { reader.onload = e => resolve(e.target.result); reader.readAsDataURL(bgFile); });
  }
  const res = await apiPost("adminSaveAppearance", { primaryColor: primary, accentColor: accent, bgBase64 });
  showToast(res.success ? "Tema disimpan!" : res.message, res.success ? "success" : "error");
}

/* ============================================================
   MANAJEMEN ADMIN
   ============================================================ */
async function loadAdmins() {
  const res = await apiCall("adminGetAdmins");
  if (!res.success) return;
  document.getElementById("adminTableBody").innerHTML = (res.data || []).length
    ? res.data.map(a => `
        <tr>
          <td>${a.name}</td>
          <td>${a.username}</td>
          <td><span class="badge badge-success">${a.role || "Admin"}</span></td>
          <td>
            <button class="btn btn-danger btn-sm btn-icon" onclick="deleteAdmin('${a.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>`).join("")
    : '<tr><td colspan="4" class="empty-row">Belum ada admin.</td></tr>';
}
async function addAdmin() {
  const d = {
    name:     document.getElementById("newAdminName").value.trim(),
    username: document.getElementById("newAdminUser").value.trim(),
    password: document.getElementById("newAdminPass").value
  };
  if (!d.name || !d.username || !d.password) { showToast("Semua field wajib diisi!", "error"); return; }
  const res = await apiPost("adminAddAdmin", d);
  if (res.success) {
    showToast("Admin ditambahkan!", "success");
    closeModal("addAdminModal");
    document.getElementById("newAdminName").value = "";
    document.getElementById("newAdminUser").value = "";
    document.getElementById("newAdminPass").value = "";
    loadAdmins();
  } else showToast(res.message, "error");
}
async function deleteAdmin(id) {
  if (!confirm("Hapus admin ini?")) return;
  const res = await apiPost("adminDeleteAdmin", { adminId: id });
  if (res.success) { showToast("Admin dihapus.", "success"); loadAdmins(); }
  else showToast(res.message, "error");
}

/* ============================================================
   STATISTIK & LOG
   ============================================================ */
async function loadLogs() {
  const res = await apiCall("adminGetLogs");
  if (!res.success) return;
  const d = res.data;
  animateCounter(document.getElementById("log-logins"),    d.totalLogins    || 0);
  animateCounter(document.getElementById("log-downloads"), d.totalDownloads || 0);
  const ratingEl = document.getElementById("log-rating");
  if (ratingEl) ratingEl.textContent = (d.avgRating || 0).toFixed(1) + " ★";
  const logsEl = document.getElementById("activityLogs");
  if (logsEl) {
    logsEl.innerHTML = (d.logs || []).length
      ? d.logs.map(l => `
          <div class="log-item">
            <i class="fas fa-circle log-icon" style="font-size:7px"></i>
            <span><b>${l.user}</b> — ${l.action}</span>
            <span class="log-time">${l.time}</span>
          </div>`).join("")
      : '<div class="log-item" style="color:rgba(255,255,255,.35)">Belum ada log.</div>';
  }
}

/* ============================================================
   ADMIN LOGOUT
   ============================================================ */
function adminLogout() {
  clearSession("stetsa_admin_session");
  showToast("Logout berhasil.", "info");
  setTimeout(() => window.location.href = "admin-login.html", 700);
}
