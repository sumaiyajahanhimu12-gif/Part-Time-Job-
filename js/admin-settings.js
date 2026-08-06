import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  setDoc,
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

async function loadSettings() {
  await checkAdmin();

  const settingsRef = doc(db, "settings", "main");
  const snap = await getDoc(settingsRef);

  let data = {
    withdrawEnabled: false,
    minWithdraw: 500,
    requiredActiveReferrals: 15,
    taskCooldownHours: 24
  };

  if (snap.exists()) {
    data = { ...data, ...snap.data() };
  } else {
    // Auto create
    await setDoc(settingsRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  document.getElementById("app").innerHTML = `
    <div class="admin-page">
      <div class="admin-header">
        <h1>⚙ Settings</h1>
        <p>System configuration</p>
      </div>

      <div class="section-card">
        <h2>💰 Withdraw Settings</h2>

        <label style="font-size:13px;color:var(--muted);display:block;margin-bottom:6px;">Withdraw System</label>
        <select id="withdrawEnabled">
          <option value="true" ${data.withdrawEnabled ? "selected" : ""}>✅ Enabled (ON)</option>
          <option value="false" ${!data.withdrawEnabled ? "selected" : ""}>❌ Disabled (OFF)</option>
        </select>

        <label style="font-size:13px;color:var(--muted);display:block;margin:14px 0 6px;">Minimum Withdraw Amount (Coins)</label>
        <input id="minWithdraw" type="number" value="${data.minWithdraw || 500}" placeholder="500" />

        <label style="font-size:13px;color:var(--muted);display:block;margin:14px 0 6px;">Required Active Referrals</label>
        <input id="requiredRefs" type="number" value="${data.requiredActiveReferrals || 15}" placeholder="15" />
      </div>

      <div class="section-card">
        <h2>📋 Task Settings</h2>

        <label style="font-size:13px;color:var(--muted);display:block;margin-bottom:6px;">Default Task Cooldown (Hours)</label>
        <input id="taskCooldown" type="number" value="${data.taskCooldownHours || 24}" placeholder="24" />
        <p style="font-size:12px;color:var(--muted);margin-top:8px;">
          Individual tasks can override this value when created.
        </p>
      </div>

      <button class="btn-primary" id="saveBtn" style="margin-bottom:16px;">
        💾 Save Settings
      </button>

      <a href="dashboard.html" class="btn-secondary" style="display:block;text-align:center;text-decoration:none;">
        ← Back to Dashboard
      </a>
    </div>
  `;

  document.getElementById("saveBtn").onclick = saveSettings;
}

async function saveSettings() {
  const withdrawEnabled = document.getElementById("withdrawEnabled").value === "true";
  const minWithdraw = Number(document.getElementById("minWithdraw").value);
  const requiredActiveReferrals = Number(document.getElementById("requiredRefs").value);
  const taskCooldownHours = Number(document.getElementById("taskCooldown").value);

  if (minWithdraw < 0 || requiredActiveReferrals < 0 || taskCooldownHours < 0) {
    return tg.showAlert("Values cannot be negative");
  }

  const btn = document.getElementById("saveBtn");
  btn.disabled = true;
  btn.innerText = "Saving...";

  try {
    await setDoc(doc(db, "settings", "main"), {
      withdrawEnabled,
      minWithdraw,
      requiredActiveReferrals,
      taskCooldownHours,
      updatedAt: serverTimestamp()
    }, { merge: true });

    tg.showAlert("✅ Settings saved successfully");
    btn.disabled = false;
    btn.innerText = "💾 Save Settings";
  } catch (e) {
    tg.showAlert("Error: " + e.message);
    btn.disabled = false;
    btn.innerText = "💾 Save Settings";
  }
}

loadSettings().catch(err => console.error(err));
