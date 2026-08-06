import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc,
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

const user = tg.initDataUnsafe.user;

async function checkAdmin() {
  const userRef = doc(db, "users", String(user.id));
  const snap = await getDoc(userRef);

  if (!snap.exists() || snap.data().role !== "admin") {
    document.getElementById("app").innerHTML = `
      <div class="loader-content">
        <h1>⛔ Access Denied</h1>
        <p>You are not an admin</p>
      </div>
    `;
    throw new Error("Not Admin");
  }
  return snap.data();
}

async function loadDashboard() {
  await checkAdmin();

  const [usersSnap, tasksSnap, pendingWithdrawsSnap, settingsSnap] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "tasks")),
    getDocs(query(collection(db, "withdraws"), where("status", "==", "pending"))),
    getDoc(doc(db, "settings", "main"))
  ]);

  let totalUsers = 0;
  let activeUsers = 0;
  let inactiveUsers = 0;
  let pendingUsers = 0;
  let totalCoins = 0;

  usersSnap.forEach(d => {
    const u = d.data();
    totalUsers++;
    totalCoins += Number(u.totalEarned || 0);
    if (u.status === "Active") activeUsers++;
    else if (u.status === "Inactive") inactiveUsers++;
    else if (u.status === "Pending") pendingUsers++;
  });

  const totalTasks = tasksSnap.size;
  const pendingWithdraws = pendingWithdrawsSnap.size;

  const settings = settingsSnap.exists() ? settingsSnap.data() : {};
  const withdrawStatus = settings.withdrawEnabled ? "ON" : "OFF";

  document.getElementById("app").innerHTML = `
    <div class="admin-page">
      <div class="admin-header">
        <h1>🛠 Admin Dashboard</h1>
        <p>Part Time Job • Control Panel</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Users</div>
          <div class="stat-value">${totalUsers}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Active Users</div>
          <div class="stat-value green">${activeUsers}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pending Users</div>
          <div class="stat-value yellow">${pendingUsers}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Inactive Users</div>
          <div class="stat-value red">${inactiveUsers}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Tasks</div>
          <div class="stat-value">${totalTasks}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pending Withdraws</div>
          <div class="stat-value yellow">${pendingWithdraws}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Coins Distributed</div>
          <div class="stat-value">${totalCoins.toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Withdraw System</div>
          <div class="stat-value \( {settings.withdrawEnabled ? 'green' : 'red'}"> \){withdrawStatus}</div>
        </div>
      </div>

      <!-- Quick Create Task -->
      <div class="section-card">
        <h2>🚀 Quick Create Task</h2>

        <div class="form-grid">
          <input id="taskName" placeholder="Task Name *" />
          <input id="taskLink" placeholder="Task Link *" />
          <input id="taskCoin" type="number" placeholder="Coin Reward *" />
          <input id="taskCode" placeholder="Verification Code (optional)" />
          <input id="taskTimer" type="number" placeholder="Timer (seconds)" value="15" />
          <input id="taskLimit" type="number" placeholder="Limit (0 = ∞)" value="0" />
          <input id="taskCooldown" type="number" placeholder="Cooldown Hours (0 = none)" value="0" />
          <input id="taskDuration" type="number" placeholder="Duration Days (for Days type)" value="0" />

          <select id="taskType">
            <option value="daily">Daily Task</option>
            <option value="weekly">Weekly Task</option>
            <option value="permanent">Permanent Task</option>
            <option value="days">Days-Based Task</option>
          </select>

          <select id="taskTrending">
            <option value="false">Normal</option>
            <option value="true">🔥 Trending</option>
          </select>
        </div>

        <button class="btn-primary" id="createTaskBtn">Create Task</button>
      </div>

      <!-- Admin Menu -->
      <div class="admin-menu">
        <a href="users.html" class="menu-item">
          <span>👥</span>
          <span>Users</span>
        </a>
        <a href="tasks.html" class="menu-item">
          <span>📋</span>
          <span>Tasks</span>
        </a>
        <a href="withdraws.html" class="menu-item">
          <span>💰</span>
          <span>Withdraws</span>
        </a>
        <a href="referrals.html" class="menu-item">
          <span>🔗</span>
          <span>Referrals</span>
        </a>
        <a href="notifications.html" class="menu-item">
          <span>📢</span>
          <span>Notices</span>
        </a>
        <a href="security.html" class="menu-item">
          <span>🛡</span>
          <span>Security</span>
        </a>
        <a href="settings.html" class="menu-item">
          <span>⚙</span>
          <span>Settings</span>
        </a>
        <a href="../index.html" class="menu-item">
          <span>🏠</span>
          <span>User App</span>
        </a>
      </div>
    </div>
  `;

  // Create Task
  document.getElementById("createTaskBtn").onclick = async () => {
    const name = document.getElementById("taskName").value.trim();
    const link = document.getElementById("taskLink").value.trim();
    const coin = Number(document.getElementById("taskCoin").value);
    const code = document.getElementById("taskCode").value.trim();
    const timer = Number(document.getElementById("taskTimer").value) || 15;
    const limit = Number(document.getElementById("taskLimit").value) || 0;
    const cooldownHours = Number(document.getElementById("taskCooldown").value) || 0;
    const durationDays = Number(document.getElementById("taskDuration").value) || 0;
    const taskType = document.getElementById("taskType").value;
    const trending = document.getElementById("taskTrending").value === "true";

    if (!name || !link || !coin) {
      return tg.showAlert("Name, Link and Coin are required");
    }

    const btn = document.getElementById("createTaskBtn");
    btn.disabled = true;
    btn.innerText = "Creating...";

    try {
      await addDoc(collection(db, "tasks"), {
        name,
        link,
        coin,
        code: code || "",
        timer,
        limit,
        cooldownHours,
        durationDays,
        taskType,
        status: "published",
        trending,
        completedCount: 0,
        createdAt: serverTimestamp()
      });

      tg.showAlert("✅ Task created successfully!");
      location.reload();
    } catch (e) {
      tg.showAlert("Error: " + e.message);
      btn.disabled = false;
      btn.innerText = "Create Task";
    }
  };
}

loadDashboard().catch(err => {
  console.error(err);
});
