import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const tg = window.Telegram?.WebApp;

if (!tg || !tg.initDataUnsafe?.user) {
  document.getElementById("app").innerHTML = `
    <div class="loader-content">
      <div class="logo-glow">💼</div>
      <h1>Part Time Job</h1>
      <p class="error-text">Please open this app inside Telegram</p>
    </div>
  `;
  throw new Error("Telegram Required");
}

tg.ready();
tg.expand();
tg.setHeaderColor("#050B1F");
tg.setBackgroundColor("#050B1F");

const user = tg.initDataUnsafe.user;
const startParam = tg.initDataUnsafe.start_param || null;

function generateDeviceHash() {
  const raw = `\( {navigator.userAgent}| \){screen.width}x\( {screen.height}| \){navigator.language}|${navigator.platform}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return "dh_" + Math.abs(hash).toString(36);
}

async function ensureSettings() {
  const settingsRef = doc(db, "settings", "main");
  const snap = await getDoc(settingsRef);
  if (!snap.exists()) {
    await setDoc(settingsRef, {
      withdrawEnabled: false,
      minWithdraw: 500,
      requiredActiveReferrals: 15,
      taskCooldownHours: 24,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
}

async function createOrUpdateUser() {
  const userRef = doc(db, "users", String(user.id));
  const userSnap = await getDoc(userRef);
  const deviceHash = generateDeviceHash();

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      telegramId: user.id,
      username: user.username || "",
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      photoUrl: user.photo_url || "",
      language: user.language_code || "en",
      coin: 0,
      totalEarned: 0,
      totalWithdraw: 0,
      referralIncome: 0,
      referrals: 0,
      activeReferrals: 0,
      status: "Pending",
      facebookLink: "",
      paymentMethod: "",
      paymentNumber: "",
      deviceHash: deviceHash,
      role: "user",
      isBanned: false,
      lastActive: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    // Handle referral
    if (startParam && startParam !== String(user.id)) {
      const pendingRef = collection(db, "pendingReferrals");
      await addDoc(pendingRef, {
        referrerId: startParam,
        newUserId: String(user.id),
        status: "pending",
        createdAt: serverTimestamp()
      });
    }
  } else {
    // Update lastActive + basic info
    await updateDoc(userRef, {
      lastActive: serverTimestamp(),
      username: user.username || userSnap.data().username,
      firstName: user.first_name || userSnap.data().firstName,
      photoUrl: user.photo_url || userSnap.data().photoUrl || ""
    });
  }
}

async function loadDashboard() {
  const userRef = doc(db, "users", String(user.id));
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    document.getElementById("app").innerHTML = `
      <div class="loader-content">
        <h2>User not found</h2>
      </div>
    `;
    return;
  }

  const data = userSnap.data();

  let statusBadge = "";
  if (data.status === "Pending") {
    statusBadge = `<span class="badge badge-pending">Pending</span>`;
  } else if (data.status === "Active") {
    statusBadge = `<span class="badge badge-active">Active</span>`;
  } else if (data.status === "Inactive") {
    statusBadge = `<span class="badge badge-inactive">Inactive</span>`;
  }

  let adminCard = "";
  if (data.role === "admin") {
    adminCard = `
      <div class="card admin-card">
        <div class="card-header">
          <span>🛠 Admin Panel</span>
        </div>
        <button class="btn-primary" onclick="location.href='admin/dashboard.html'">
          Open Dashboard
        </button>
      </div>
    `;
  }

  let facebookNotice = "";
  if (data.status === "Pending") {
    facebookNotice = `
      <div class="card notice-card">
        <div class="card-header">
          <span>⚠️ Account Activation Required</span>
        </div>
        <p>Submit your Facebook profile link to activate your account and start earning.</p>
        <button class="btn-primary" onclick="location.href='profile.html'">
          Go to Profile
        </button>
      </div>
    `;
  }

  document.getElementById("app").innerHTML = `
    <div class="page">
      <div class="hero-card">
        <div class="hero-top">
          <div class="avatar-wrap">
            <img src="${data.photoUrl || 'images/default-avatar.png'}" alt="avatar" class="avatar" onerror="this.src='images/default-avatar.png'">
          </div>
          <div class="hero-info">
            <h2>${data.firstName || "User"}</h2>
            <p>@${data.username || "unknown"}</p>
            ${statusBadge}
          </div>
        </div>
        <div class="coin-display">
          <span class="coin-label">Available Balance</span>
          <div class="coin-amount">💰 ${Number(data.coin || 0).toLocaleString()}</div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-value">${Number(data.totalEarned || 0).toLocaleString()}</div>
          <div class="stat-label">Total Earned</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-value">${data.activeReferrals || 0}</div>
          <div class="stat-label">Active Refs</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔗</div>
          <div class="stat-value">${data.referrals || 0}</div>
          <div class="stat-label">Total Refs</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💸</div>
          <div class="stat-value">${Number(data.totalWithdraw || 0).toLocaleString()}</div>
          <div class="stat-label">Withdrawn</div>
        </div>
      </div>

      ${facebookNotice}
      ${adminCard}

      <div class="quick-actions">
        <a href="tasks.html" class="action-btn">
          <span>📋</span>
          <span>Tasks</span>
        </a>
        <a href="refer.html" class="action-btn">
          <span>👥</span>
          <span>Invite</span>
        </a>
        <a href="withdraw.html" class="action-btn">
          <span>💰</span>
          <span>Withdraw</span>
        </a>
        <a href="notifications.html" class="action-btn">
          <span>🔔</span>
          <span>Alerts</span>
        </a>
      </div>
    </div>
  `;
}

// Main
(async () => {
  try {
    await ensureSettings();
    await createOrUpdateUser();
    await loadDashboard();
  } catch (err) {
    console.error(err);
    document.getElementById("app").innerHTML = `
      <div class="loader-content">
        <h2>Something went wrong</h2>
        <p class="error-text">${err.message}</p>
      </div>
    `;
  }
})();
