import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
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
const BOT_USERNAME = "PartTimeIncomeofficial_bot"; // তোমার বট ইউজারনেম

async function loadReferral() {
  const userRef = doc(db, "users", String(user.id));
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    location.href = "index.html";
    return;
  }

  const data = userSnap.data();
  await updateDoc(userRef, { lastActive: serverTimestamp() });

  // Correct Mini App referral link
  const referralLink = `https://t.me/\( {BOT_USERNAME}?startapp= \){user.id}`;

  // Fetch all referrals by this user
  const q = query(
    collection(db, "pendingReferrals"),
    where("referrerId", "==", String(user.id))
  );
  const snap = await getDocs(q);

  let total = 0;
  let active = 0;
  let pending = 0;
  let listHtml = "";

  for (const item of snap.docs) {
    const r = item.data();
    total++;
    if (r.status === "active") active++;
    else pending++;

    // Try to get referred user name
    let name = r.newUserId;
    try {
      const uSnap = await getDoc(doc(db, "users", r.newUserId));
      if (uSnap.exists()) {
        const u = uSnap.data();
        name = u.firstName || u.username || r.newUserId;
      }
    } catch (e) {}

    const statusBadge = r.status === "active"
      ? `<span class="badge badge-active">Active</span>`
      : `<span class="badge badge-pending">Pending</span>`;

    listHtml += `
      <div class="task-card" style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-weight:600;margin-bottom:4px;">👤 ${name}</div>
          <div style="font-size:12px;color:var(--muted);">ID: ${r.newUserId}</div>
        </div>
        ${statusBadge}
      </div>
    `;
  }

  document.getElementById("app").innerHTML = `
    <div class="page">
      <div class="hero-card" style="padding:18px;">
        <h1 style="font-size:22px;margin-bottom:4px;">👥 Referral Program</h1>
        <p style="color:var(--muted);font-size:13px;">Invite friends & grow your network</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🔗</div>
          <div class="stat-value">${total}</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-value">${active}</div>
          <div class="stat-label">Active</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏳</div>
          <div class="stat-value">${pending}</div>
          <div class="stat-label">Pending</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-value">${Number(data.referralIncome || 0).toLocaleString()}</div>
          <div class="stat-label">Income</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">🔗 Your Referral Link</div>
        <input id="referralLink" readonly value="${referralLink}" style="font-size:13px;" />
        <button class="btn-primary" id="copyBtn" style="margin-top:12px;">📋 Copy Link</button>
        <button class="btn-secondary" id="shareBtn" style="margin-top:8px;">📤 Share via Telegram</button>
      </div>

      <div class="section-title">📜 Your Referrals</div>
      <div id="referralList">
        ${listHtml || `
          <div class="card" style="text-align:center;color:var(--muted);">
            No referrals yet.<br>Share your link to start earning!
          </div>
        `}
      </div>
    </div>
  `;

  // Copy
  document.getElementById("copyBtn").onclick = () => {
    const link = document.getElementById("referralLink").value;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        tg.showAlert("Referral link copied!");
      });
    } else {
      // fallback
      const input = document.getElementById("referralLink");
      input.select();
      document.execCommand("copy");
      tg.showAlert("Referral link copied!");
    }
  };

  // Share
  document.getElementById("shareBtn").onclick = () => {
    const link = document.getElementById("referralLink").value;
    const text = `Join Part Time Job and earn coins by completing tasks!\n\n${link}`;
    if (tg.openTelegramLink) {
      tg.openTelegramLink(`https://t.me/share/url?url=\( {encodeURIComponent(link)}&text= \){encodeURIComponent(text)}`);
    } else {
      window.open(`https://t.me/share/url?url=\( {encodeURIComponent(link)}&text= \){encodeURIComponent(text)}`, "_blank");
    }
  };
}

loadReferral().catch(err => {
  console.error(err);
  document.getElementById("app").innerHTML = `
    <div class="loader-content">
      <h2>Error</h2>
      <p class="error-text">${err.message}</p>
    </div>
  `;
});
