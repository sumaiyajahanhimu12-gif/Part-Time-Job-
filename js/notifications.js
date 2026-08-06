import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const tg = window.Telegram?.WebApp;

if (!tg || !tg.initDataUnsafe?.user) {
  location.href = "index.html";
  throw new Error("Telegram Required");
}

tg.ready();
tg.expand();
tg.setHeaderColor("#050B1F");
tg.setBackgroundColor("#050B1F");

const user = tg.initDataUnsafe.user;

async function loadNotifications() {
  // Update lastActive
  try {
    const userRef = doc(db, "users", String(user.id));
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      await updateDoc(userRef, { lastActive: serverTimestamp() });
    }
  } catch (e) {}

  try {
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);

    let listHtml = "";

    snap.forEach(item => {
      const n = item.data();
      const date = n.createdAt?.toDate
        ? n.createdAt.toDate().toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })
        : "—";

      listHtml += `
        <div class="card" style="border-left:3px solid var(--border);">
          <div class="card-header" style="margin-bottom:8px;">
            📢 ${n.title || "Announcement"}
          </div>
          <p style="font-size:14px;line-height:1.55;color:var(--text);margin-bottom:10px;">
            ${n.message || ""}
          </p>
          <div style="font-size:12px;color:var(--muted);">
            ${date}
          </div>
        </div>
      `;
    });

    document.getElementById("app").innerHTML = `
      <div class="page">
        <div class="hero-card" style="padding:18px;">
          <h1 style="font-size:22px;margin-bottom:4px;">🔔 Notifications</h1>
          <p style="color:var(--muted);font-size:13px;">Latest announcements & updates</p>
        </div>

        <div id="notificationsContainer">
          ${listHtml || `
            <div class="card" style="text-align:center;color:var(--muted);padding:40px 20px;">
              <div style="font-size:40px;margin-bottom:12px;">🔕</div>
              No notifications yet
            </div>
          `}
        </div>
      </div>
    `;
  } catch (err) {
    console.error(err);
    document.getElementById("app").innerHTML = `
      <div class="page">
        <div class="hero-card" style="padding:18px;">
          <h1 style="font-size:22px;">🔔 Notifications</h1>
        </div>
        <div class="card" style="text-align:center;color:var(--danger);">
          Failed to load notifications
        </div>
      </div>
    `;
  }
}

loadNotifications();
