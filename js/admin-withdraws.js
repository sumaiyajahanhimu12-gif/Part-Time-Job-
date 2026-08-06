import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  increment,
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

async function loadWithdraws() {
  await checkAdmin();

  const snap = await getDocs(collection(db, "withdraws"));
  const list = [];
  let pending = 0, approved = 0, rejected = 0;

  snap.forEach(d => {
    const data = d.data();
    list.push({ id: d.id, ...data });
    if (data.status === "pending") pending++;
    else if (data.status === "approved") approved++;
    else if (data.status === "rejected") rejected++;
  });

  // Pending first, then newest
  list.sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    const ta = a.createdAt?.toDate?.()?.getTime() || 0;
    const tb = b.createdAt?.toDate?.()?.getTime() || 0;
    return tb - ta;
  });

  let html = "";

  list.forEach(w => {
    let badge = `<span class="badge badge-pending">Pending</span>`;
    if (w.status === "approved") badge = `<span class="badge badge-active">Approved</span>`;
    if (w.status === "rejected") badge = `<span class="badge badge-rejected">Rejected</span>`;

    const date = w.createdAt?.toDate
      ? w.createdAt.toDate().toLocaleString("en-GB", {
          day: "2-digit", month: "short", year: "numeric",
          hour: "2-digit", minute: "2-digit"
        })
      : "—";

    html += `
      <div class="item-card" id="wd-${w.id}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
          <div>
            <div style="font-size:22px;font-weight:800;color:var(--success);">
              💰 ${Number(w.coin || 0).toLocaleString()}
            </div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px;">${date}</div>
          </div>
          ${badge}
        </div>

        <div style="font-size:13px;line-height:1.7;margin-bottom:14px;">
          <div>👤 ${w.firstName || "User"} ${w.username ? "(@" + w.username + ")" : ""}</div>
          <div>🆔 ${w.userId}</div>
          <div>💳 \( {w.paymentMethod || "—"} • <b> \){w.paymentNumber || "—"}</b></div>
          ${w.facebookLink ? `
            <div>
              <a href="${w.facebookLink}" target="_blank" style="color:var(--success);text-decoration:none;">
                📘 Facebook Profile
              </a>
            </div>
          ` : ""}
        </div>

        ${w.status === "pending" ? `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <button class="btn-primary" style="padding:12px;font-size:14px;"
              onclick="window.approveWithdraw('${w.id}')">
              ✅ Approve
            </button>
            <button class="btn-danger" style="padding:12px;font-size:14px;"
              onclick="window.rejectWithdraw('${w.id}')">
              ❌ Reject
            </button>
          </div>
        ` : `
          <button class="btn-secondary" disabled style="padding:12px;">
            ${w.status.toUpperCase()}
          </button>
        `}
      </div>
    `;
  });

  document.getElementById("app").innerHTML = `
    <div class="admin-page">
      <div class="admin-header">
        <h1>💰 Withdraw Requests</h1>
        <p>Review & process payments</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Pending</div>
          <div class="stat-value yellow">${pending}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Approved</div>
          <div class="stat-value green">${approved}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Rejected</div>
          <div class="stat-value red">${rejected}</div>
        </div>
      </div>

      <div id="withdrawsList">
        ${html || `
          <div class="section-card" style="text-align:center;color:var(--muted);">
            No withdraw requests yet
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
}

window.approveWithdraw = async function(id) {
  if (!confirm("Approve this withdraw?\n\nCoins will be deducted from user balance.")) return;

  try {
    const wdRef = doc(db, "withdraws", id);
    const wdSnap = await getDoc(wdRef);
    if (!wdSnap.exists()) return tg.showAlert("Request not found");

    const w = wdSnap.data();
    if (w.status !== "pending") return tg.showAlert("Already processed");

    // Deduct coins + update totalWithdraw
    const userRef = doc(db, "users", w.userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const currentCoin = Number(userSnap.data().coin || 0);
      const deduct = Number(w.coin || 0);

      // Safety: only deduct if user still has enough
      if (currentCoin < deduct) {
        return tg.showAlert("User no longer has enough coins. Reject instead?");
      }

      await updateDoc(userRef, {
        coin: increment(-deduct),
        totalWithdraw: increment(deduct)
      });
    }

    await updateDoc(wdRef, {
      status: "approved",
      processedAt: serverTimestamp(),
      processedBy: String(adminUser.id)
    });

    tg.showAlert("✅ Withdraw Approved");
    loadWithdraws();
  } catch (e) {
    console.error(e);
    tg.showAlert("Error: " + e.message);
  }
};

window.rejectWithdraw = async function(id) {
  if (!confirm("Reject this withdraw?\n\nCoins will remain safe with the user.")) return;

  try {
    const wdRef = doc(db, "withdraws", id);
    const wdSnap = await getDoc(wdRef);
    if (!wdSnap.exists()) return tg.showAlert("Request not found");

    if (wdSnap.data().status !== "pending") {
      return tg.showAlert("Already processed");
    }

    await updateDoc(wdRef, {
      status: "rejected",
      processedAt: serverTimestamp(),
      processedBy: String(adminUser.id)
    });

    tg.showAlert("❌ Withdraw Rejected (coins safe)");
    loadWithdraws();
  } catch (e) {
    tg.showAlert("Error: " + e.message);
  }
};

loadWithdraws().catch(err => console.error(err));
