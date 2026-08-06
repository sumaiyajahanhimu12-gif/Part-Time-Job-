import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  updateDoc
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

async function loadSecurity() {
  await checkAdmin();

  const snap = await getDocs(collection(db, "users"));
  const users = [];
  snap.forEach(d => users.push({ id: d.id, ...d.data() }));

  // Maps for duplicates
  const fbMap = {};
  const deviceMap = {};
  const paymentMap = {};

  users.forEach(u => {
    if (u.facebookLink) {
      fbMap[u.facebookLink] = (fbMap[u.facebookLink] || 0) + 1;
    }
    if (u.deviceHash) {
      deviceMap[u.deviceHash] = (deviceMap[u.deviceHash] || 0) + 1;
    }
    if (u.paymentNumber) {
      paymentMap[u.paymentNumber] = (paymentMap[u.paymentNumber] || 0) + 1;
    }
  });

  let duplicateFB = 0;
  let duplicateDevice = 0;
  let duplicatePayment = 0;
  let suspiciousList = [];

  const seenFB = new Set();
  const seenDevice = new Set();
  const seenPayment = new Set();

  users.forEach(u => {
    const issues = [];

    if (u.facebookLink && fbMap[u.facebookLink] > 1) {
      issues.push("Duplicate Facebook");
      if (!seenFB.has(u.facebookLink)) {
        duplicateFB++;
        seenFB.add(u.facebookLink);
      }
    }

    if (u.deviceHash && deviceMap[u.deviceHash] > 1) {
      issues.push("Duplicate Device");
      if (!seenDevice.has(u.deviceHash)) {
        duplicateDevice++;
        seenDevice.add(u.deviceHash);
      }
    }

    if (u.paymentNumber && paymentMap[u.paymentNumber] > 1) {
      issues.push("Duplicate Payment Number");
      if (!seenPayment.has(u.paymentNumber)) {
        duplicatePayment++;
        seenPayment.add(u.paymentNumber);
      }
    }

    if (u.isBanned) {
      issues.push("Already Banned");
    }

    if (issues.length > 0) {
      suspiciousList.push({ ...u, issues });
    }
  });

  let html = "";

  suspiciousList.forEach(u => {
    html += `
      <div class="item-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
          <div>
            <h3 style="margin:0 0 4px;">👤 ${u.firstName || "User"} ${u.lastName || ""}</h3>
            <div style="font-size:12px;color:var(--muted);">@${u.username || "—"} • ${u.telegramId}</div>
          </div>
          ${u.isBanned
            ? `<span class="badge badge-rejected">Banned</span>`
            : `<span class="badge badge-pending">Suspicious</span>`
          }
        </div>

        <div style="font-size:12px;margin-bottom:10px;">
          \( {u.issues.map(i => `<span class="badge badge-rejected" style="margin:2px 4px 2px 0;"> \){i}</span>`).join("")}
        </div>

        <div style="font-size:13px;line-height:1.6;color:var(--muted);margin-bottom:12px;">
          \( {u.facebookLink ? `<div>📘 <a href=" \){u.facebookLink}" target="_blank" style="color:var(--success);">${u.facebookLink}</a></div>` : ""}
          ${u.deviceHash ? `<div>📱 Device: ${u.deviceHash}</div>` : ""}
          ${u.paymentNumber ? `<div>💳 ${u.paymentMethod || ""}: ${u.paymentNumber}</div>` : ""}
          <div>💰 Coin: ${Number(u.coin || 0).toLocaleString()}</div>
        </div>

        ${!u.isBanned ? `
          <button class="btn-danger" style="padding:11px;font-size:13px;"
            onclick="window.banUser('${u.id}')">
            🚫 Ban User
          </button>
        ` : `
          <button class="btn-secondary" style="padding:11px;font-size:13px;"
            onclick="window.unbanUser('${u.id}')">
            Unban User
          </button>
        `}
      </div>
    `;
  });

  document.getElementById("app").innerHTML = `
    <div class="admin-page">
      <div class="admin-header">
        <h1>🛡 Security Center</h1>
        <p>Fraud & multi-account detection</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Users</div>
          <div class="stat-value">${users.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Duplicate FB</div>
          <div class="stat-value yellow">${duplicateFB}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Duplicate Device</div>
          <div class="stat-value yellow">${duplicateDevice}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Duplicate Payment</div>
          <div class="stat-value yellow">${duplicatePayment}</div>
        </div>
      </div>

      <div class="section-title" style="margin:8px 0 14px;font-size:15px;font-weight:700;">
        🚨 Suspicious Accounts (${suspiciousList.length})
      </div>

      <div id="securityList">
        ${html || `
          <div class="section-card" style="text-align:center;color:var(--muted);">
            ✅ No suspicious accounts detected
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

window.banUser = async function(uid) {
  if (!confirm("Ban this user?\n\nTheir device hash will be flagged.")) return;

  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    const data = snap.data() || {};

    await updateDoc(userRef, {
      isBanned: true,
      status: "Banned",
      banDeviceHash: data.deviceHash || ""
    });

    tg.showAlert("User banned");
    loadSecurity();
  } catch (e) {
    tg.showAlert("Error: " + e.message);
  }
};

window.unbanUser = async function(uid) {
  if (!confirm("Unban this user?")) return;

  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    const data = snap.data() || {};

    await updateDoc(userRef, {
      isBanned: false,
      status: data.facebookLink ? "Active" : "Pending",
      banDeviceHash: ""
    });

    tg.showAlert("User unbanned");
    loadSecurity();
  } catch (e) {
    tg.showAlert("Error: " + e.message);
  }
};

loadSecurity().catch(err => console.error(err));
