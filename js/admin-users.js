import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  increment,
  serverTimestamp,
  query,
  orderBy
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
let allUsers = [];

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

async function loadUsers() {
  await checkAdmin();

  const snap = await getDocs(collection(db, "users"));
  allUsers = [];
  snap.forEach(d => {
    allUsers.push({ id: d.id, ...d.data() });
  });

  // Sort by highest coin first (Leaderboard)
  allUsers.sort((a, b) => (b.coin || 0) - (a.coin || 0));

  renderUsers(allUsers);
}

function renderUsers(list) {
  let active = 0, pending = 0, inactive = 0, banned = 0;

  list.forEach(u => {
    if (u.isBanned) banned++;
    else if (u.status === "Active") active++;
    else if (u.status === "Pending") pending++;
    else inactive++;
  });

  let html = "";

  list.forEach(u => {
    const statusBadge = u.isBanned
      ? `<span class="badge badge-rejected">Banned</span>`
      : u.status === "Active"
        ? `<span class="badge badge-active">Active</span>`
        : u.status === "Pending"
          ? `<span class="badge badge-pending">Pending</span>`
          : `<span class="badge badge-inactive">${u.status || "Inactive"}</span>`;

    html += `
      <div class="item-card" id="user-${u.id}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
          <div>
            <h3 style="margin-bottom:4px;">👤 ${u.firstName || "User"} ${u.lastName || ""}</h3>
            <div style="font-size:12px;color:var(--muted);">@${u.username || "—"} • ID: ${u.telegramId}</div>
          </div>
          ${statusBadge}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;margin-bottom:12px;">
          <div>💰 Coin: <b>${Number(u.coin || 0).toLocaleString()}</b></div>
          <div>📈 Earned: <b>${Number(u.totalEarned || 0).toLocaleString()}</b></div>
          <div>👥 Active Refs: <b>${u.activeReferrals || 0}</b></div>
          <div>🔗 Total Refs: <b>${u.referrals || 0}</b></div>
        </div>

        ${u.facebookLink ? `
          <div style="font-size:12px;margin-bottom:8px;">
            <a href="${u.facebookLink}" target="_blank" style="color:var(--success);text-decoration:none;">
              📘 Facebook Profile
            </a>
          </div>
        ` : ""}

        ${u.paymentMethod ? `
          <div style="font-size:12px;color:var(--muted);margin-bottom:10px;">
            💳 ${u.paymentMethod}: ${u.paymentNumber || "—"}
          </div>
        ` : ""}

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <button class="btn-secondary" style="padding:10px;font-size:13px;" onclick="window.addCoin('${u.id}')">
            + Add Coin
          </button>
          <button class="btn-secondary" style="padding:10px;font-size:13px;" onclick="window.removeCoin('${u.id}')">
            − Remove Coin
          </button>
          <button class="btn-secondary" style="padding:10px;font-size:13px;" onclick="window.toggleBan('${u.id}', ${!!u.isBanned})">
            ${u.isBanned ? "Unban" : "Ban"}
          </button>
          <button class="btn-danger" style="padding:10px;font-size:13px;" onclick="window.deleteUser('${u.id}')">
            Delete
          </button>
        </div>
      </div>
    `;
  });

  document.getElementById("app").innerHTML = `
    <div class="admin-page">
      <div class="admin-header">
        <h1>👥 Users Management</h1>
        <p>Total ${list.length} users</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Active</div>
          <div class="stat-value green">${active}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pending</div>
          <div class="stat-value yellow">${pending}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Inactive</div>
          <div class="stat-value">${inactive}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Banned</div>
          <div class="stat-value red">${banned}</div>
        </div>
      </div>

      <div class="search-box">
        <input id="searchInput" placeholder="Search by Telegram ID or Username..." />
      </div>

      <div id="usersList">
        ${html || `<div class="section-card" style="text-align:center;color:var(--muted);">No users found</div>`}
      </div>

      <div style="margin-top:20px;">
        <a href="dashboard.html" class="btn-secondary" style="display:block;text-align:center;text-decoration:none;">
          ← Back to Dashboard
        </a>
      </div>
    </div>
  `;

  // Search
  document.getElementById("searchInput").oninput = (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) {
      renderUsers(allUsers);
      return;
    }
    const filtered = allUsers.filter(u =>
      String(u.telegramId).includes(q) ||
      (u.username || "").toLowerCase().includes(q) ||
      (u.firstName || "").toLowerCase().includes(q)
    );
    renderUsers(filtered);
  };
}

// Actions
window.addCoin = async function(uid) {
  const amount = prompt("Enter amount to ADD:");
  if (!amount || isNaN(amount) || Number(amount) <= 0) return;

  try {
    await updateDoc(doc(db, "users", uid), {
      coin: increment(Number(amount)),
      totalEarned: increment(Number(amount))
    });
    tg.showAlert(`+${amount} coins added`);
    loadUsers();
  } catch (e) {
    tg.showAlert("Error: " + e.message);
  }
};

window.removeCoin = async function(uid) {
  const amount = prompt("Enter amount to REMOVE:");
  if (!amount || isNaN(amount) || Number(amount) <= 0) return;

  try {
    await updateDoc(doc(db, "users", uid), {
      coin: increment(-Number(amount))
    });
    tg.showAlert(`−${amount} coins removed`);
    loadUsers();
  } catch (e) {
    tg.showAlert("Error: " + e.message);
  }
};

window.toggleBan = async function(uid, currentlyBanned) {
  const action = currentlyBanned ? "unban" : "ban";
  if (!confirm(`Are you sure you want to ${action} this user?`)) return;

  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    const data = snap.data();

    if (currentlyBanned) {
      await updateDoc(userRef, {
        isBanned: false,
        status: data.facebookLink ? "Active" : "Pending"
      });
      tg.showAlert("User unbanned");
    } else {
      await updateDoc(userRef, {
        isBanned: true,
        status: "Banned",
        banDeviceHash: data.deviceHash || ""
      });
      tg.showAlert("User banned");
    }
    loadUsers();
  } catch (e) {
    tg.showAlert("Error: " + e.message);
  }
};

window.deleteUser = async function(uid) {
  if (!confirm("Permanently DELETE this user? This cannot be undone.")) return;
  if (!confirm("Final confirmation: Delete user forever?")) return;

  try {
    await deleteDoc(doc(db, "users", uid));
    tg.showAlert("User deleted");
    loadUsers();
  } catch (e) {
    tg.showAlert("Error: " + e.message);
  }
};

loadUsers().catch(err => console.error(err));
