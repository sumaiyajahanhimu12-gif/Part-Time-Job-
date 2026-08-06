import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const tg = window.Telegram?.WebApp;

if (!tg || !tg.initDataUnsafe?.user) {
  document.getElementById("app").innerHTML = `
    <div class="loader-content">
      <h1>⛔ Access Denied</h1>
      <p>Open inside Telegram</p>
    </div>
  `;
  throw new Error("Telegram Required");
}

tg.ready();
tg.expand();
tg.setHeaderColor("#050B1F");
tg.setBackgroundColor("#050B1F");

const adminUser = tg.initDataUnsafe.user;

async function checkAdmin() {
  const snap = await getDoc(doc(db, "users", String(adminUser.id)));
  if (!snap.exists() || snap.data().role !== "admin") {
    document.getElementById("app").innerHTML = `
      <div class="loader-content">
        <h1>⛔ Access Denied</h1>
        <p>You are not an admin</p>
      </div>
    `;
    throw new Error("Not Admin");
  }
}

async function loadPage() {
  await checkAdmin();
  await render();
}

async function render() {
  const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  let listHtml = "";

  snap.forEach(item => {
    const n = item.data();
    const date = n.createdAt?.toDate
      ? n.createdAt.toDate().toLocaleString("en-GB", {
          day: "2-digit", month: "short", year: "numeric",
          hour: "2-digit", minute: "2-digit"
        })
      : "—";

    listHtml += `
      <div class="item-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
          <h3 style="margin:0;font-size:15px;">📢 ${n.title || "Notice"}</h3>
        </div>
        <p style="font-size:14px;line-height:1.5;margin-bottom:10px;color:var(--text);">
          ${n.message || ""}
        </p>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:12px;color:var(--muted);">${date}</span>
          <button class="btn-danger" style="width:auto;padding:8px 14px;font-size:12px;"
            onclick="window.deleteNotice('${item.id}')">
            🗑 Delete
          </button>
        </div>
      </div>
    `;
  });

  document.getElementById("app").innerHTML = `
    <div class="admin-page">
      <div class="admin-header">
        <h1>📢 Notifications</h1>
        <p>Publish announcements to all users</p>
      </div>

      <div class="section-card">
        <h2>➕ Publish New Notice</h2>
        <input id="noticeTitle" placeholder="Title" style="margin-bottom:10px;" />
        <textarea id="noticeMessage" placeholder="Message..." rows="4" style="resize:vertical;"></textarea>
        <button class="btn-primary" id="publishBtn" style="margin-top:12px;">
          🚀 Publish Notice
        </button>
      </div>

      <div class="section-title" style="margin:20px 0 12px;font-size:16px;font-weight:700;">
        📜 All Notices
      </div>

      <div id="noticeList">
        ${listHtml || `
          <div class="section-card" style="text-align:center;color:var(--muted);">
            No notices yet
          </div>
        `}
      </div>

      <div style="margin-top:20px;">
        <a href="dashboard.html" class="btn-secondary" style="display:block;text-align:center;text-decoration:none;">
          ← Back to Dashboard
        </a>
      </div>
    </div>
  `;

  document.getElementById("publishBtn").onclick = publishNotice;
}

async function publishNotice() {
  const title = document.getElementById("noticeTitle").value.trim();
  const message = document.getElementById("noticeMessage").value.trim();

  if (!title || !message) {
    return tg.showAlert("Title and Message are required");
  }

  const btn = document.getElementById("publishBtn");
  btn.disabled = true;
  btn.innerText = "Publishing...";

  try {
    await addDoc(collection(db, "notifications"), {
      title,
      message,
      createdAt: serverTimestamp()
    });

    tg.showAlert("✅ Notice published!");
    await render();
  } catch (e) {
    tg.showAlert("Error: " + e.message);
    btn.disabled = false;
    btn.innerText = "🚀 Publish Notice";
  }
}

window.deleteNotice = async function(id) {
  if (!confirm("Delete this notice permanently?")) return;

  try {
    await deleteDoc(doc(db, "notifications", id));
    tg.showAlert("Notice deleted");
    await render();
  } catch (e) {
    tg.showAlert("Error: " + e.message);
  }
};

loadPage().catch(err => console.error(err));
