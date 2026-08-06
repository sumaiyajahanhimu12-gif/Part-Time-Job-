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

async function loadReferrals() {
  await checkAdmin();

  const snap = await getDocs(collection(db, "pendingReferrals"));
  const list = [];
  let pending = 0, active = 0;

  snap.forEach(d => {
    const data = d.data();
    list.push({ id: d.id, ...data });
    if (data.status === "active") active++;
    else pending++;
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

  for (const r of list) {
    // Try resolve names
    let referrerName = r.referrerId;
    let newUserName = r.newUserId;

    try {
      const refSnap = await getDoc(doc(db, "users", r.referrerId));
      if (refSnap.exists()) {
        const u = refSnap.data();
        referrerName = `\( {u.firstName || ""} (@ \){u.username || r.referrerId})`.trim();
      }
    } catch (e) {}

    try {
      const newSnap = await getDoc(doc(db, "users", r.newUserId));
      if (newSnap.exists()) {
        const u = newSnap.data();
        newUserName = `\( {u.firstName || ""} (@ \){u.username || r.newUserId})`.trim();
      }
    } catch (e) {}

    const badge = r.status === "active"
      ? `<span class="badge badge-active">Active</span>`
      : `<span class="badge badge-pending">Pending</span>`;

    const date = r.createdAt?.toDate
      ? r.createdAt.toDate().toLocaleDateString("en-GB")
      : "—";

    html += `
      <div class="item-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="font-size:13px;color:var(--muted);">${date}</div>
          ${badge}
        </div>

        <div style="font-size:13px;line-height:1.7;margin-bottom:12px;">
          <div>👤 <b>Referrer:</b> ${referrerName}</div>
          <div style="font-size:11px;color:var(--muted);margin-bottom:6px;">ID: ${r.referrerId}</div>
          <div>🆕 <b>New User:</b> ${newUserName}</div>
          <div style="font-size:11px;color:var(--muted);">ID: ${r.newUserId}</div>
        </div>

        ${r.status === "pending" ? `
          <button class="btn-primary" style="padding:11px;font-size:13px;"
            onclick="window.approveReferral('\( {r.id}', ' \){r.referrerId}')">
            ✅ Manually Approve
          </button>
        ` : `
          <button class="btn-secondary" disabled style="padding:11px;">Already Active</button>
        `}
      </div>
    `;
  }

  document.getElementById("app").innerHTML = `
    <div class="admin-page">
      <div class="admin-header">
        <h1>🔗 Referral Management</h1>
        <p>Track & manually approve referrals</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Pending</div>
          <div class="stat-value yellow">${pending}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Active</div>
          <div class="stat-value green">${active}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total</div>
          <div class="stat-value">${list.length}</div>
        </div>
      </div>

      <div style="font-size:12px;color:var(--muted);margin-bottom:16px;line-height:1.5;">
        Note: Referrals become <b>Active</b> automatically when the new user completes 1 task.
        You can also manually approve pending ones here.
      </div>

      <div id="referralsList">
        ${html || `
          <div class="section-card" style="text-align:center;color:var(--muted);">
            No referrals found
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

window.approveReferral = async function(id, referrerId) {
  if (!confirm("Manually approve this referral?\n\nThis will increase the referrer's Active Referrals count.")) return;

  try {
    const refDoc = doc(db, "pendingReferrals", id);
    const snap = await getDoc(refDoc);
    if (!snap.exists()) return tg.showAlert("Not found");
    if (snap.data().status === "active") return tg.showAlert("Already active");

    await updateDoc(refDoc, {
      status: "active",
      activatedAt: serverTimestamp(),
      activatedBy: "admin"
    });

    // Increment referrer stats
    const referrerRef = doc(db, "users", referrerId);
    const referrerSnap = await getDoc(referrerRef);
    if (referrerSnap.exists()) {
      await updateDoc(referrerRef, {
        activeReferrals: increment(1),
        referrals: increment(1)
      });
    }

    tg.showAlert("✅ Referral approved");
    loadReferrals();
  } catch (e) {
    tg.showAlert("Error: " + e.message);
  }
};

loadReferrals().catch(err => console.error(err));
