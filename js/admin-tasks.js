import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
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

async function loadTasks() {
  await checkAdmin();

  const snap = await getDocs(collection(db, "tasks"));
  const tasks = [];
  let totalCompleted = 0;

  snap.forEach(d => {
    const data = d.data();
    tasks.push({ id: d.id, ...data });
    totalCompleted += Number(data.completedCount || 0);
  });

  // Newest first
  tasks.sort((a, b) => {
    const ta = a.createdAt?.toDate?.()?.getTime() || 0;
    const tb = b.createdAt?.toDate?.()?.getTime() || 0;
    return tb - ta;
  });

  let html = "";

  tasks.forEach(t => {
    const statusBadge = t.status === "published"
      ? `<span class="badge badge-active">Published</span>`
      : `<span class="badge badge-pending">${t.status || "Paused"}</span>`;

    const trendingBadge = t.trending
      ? `<span class="badge badge-active" style="margin-left:6px;">🔥 Trending</span>`
      : "";

    const typeLabel = {
      daily: "Daily",
      weekly: "Weekly",
      permanent: "Permanent",
      days: `Days (${t.durationDays || "?"}d)`
    }[t.taskType] || t.taskType;

    html += `
      <div class="item-card" id="task-${t.id}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
          <h3 style="margin:0;font-size:16px;">${t.name}</h3>
          <div>\( {statusBadge} \){trendingBadge}</div>
        </div>

        <div style="font-size:13px;color:var(--muted);margin-bottom:12px;line-height:1.6;">
          <div>💰 <b style="color:var(--success)">${t.coin}</b> Coins</div>
          <div>📂 Type: ${typeLabel}</div>
          <div>⏱ Timer: ${t.timer || 15}s ${t.code ? "• Code Required" : ""}</div>
          <div>🔄 Cooldown: ${t.cooldownHours || 0}h</div>
          <div>📊 Completed: \( {t.completedCount || 0} \){t.limit ? " / " + t.limit : " / ∞"}</div>
          <div style="word-break:break-all;margin-top:4px;">
            🔗 <a href="\( {t.link}" target="_blank" style="color:var(--primary);"> \){t.link}</a>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <button class="btn-secondary" style="padding:10px;font-size:13px;"
            onclick="window.toggleStatus('\( {t.id}', ' \){t.status}')">
            ${t.status === "published" ? "⏸ Pause" : "▶ Publish"}
          </button>
          <button class="btn-secondary" style="padding:10px;font-size:13px;"
            onclick="window.toggleTrending('${t.id}', ${!!t.trending})">
            ${t.trending ? "Remove Trending" : "🔥 Make Trending"}
          </button>
          <button class="btn-secondary" style="padding:10px;font-size:13px;"
            onclick="window.editTask('${t.id}')">
            ✏️ Edit
          </button>
          <button class="btn-danger" style="padding:10px;font-size:13px;"
            onclick="window.deleteTask('${t.id}')">
            🗑 Delete
          </button>
        </div>
      </div>
    `;
  });

  document.getElementById("app").innerHTML = `
    <div class="admin-page">
      <div class="admin-header">
        <h1>📋 Tasks Management</h1>
        <p>Control all tasks</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Tasks</div>
          <div class="stat-value">${tasks.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Completions</div>
          <div class="stat-value green">${totalCompleted}</div>
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <a href="dashboard.html" class="btn-primary" style="display:block;text-align:center;text-decoration:none;">
          + Create New Task (from Dashboard)
        </a>
      </div>

      <div id="tasksList">
        ${html || `
          <div class="section-card" style="text-align:center;color:var(--muted);">
            No tasks found. Create one from Dashboard.
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

window.toggleStatus = async function(taskId, currentStatus) {
  const newStatus = currentStatus === "published" ? "paused" : "published";
  try {
    await updateDoc(doc(db, "tasks", taskId), {
      status: newStatus
    });
    tg.showAlert(`Task ${newStatus}`);
    loadTasks();
  } catch (e) {
    tg.showAlert("Error: " + e.message);
  }
};

window.toggleTrending = async function(taskId, currentlyTrending) {
  try {
    await updateDoc(doc(db, "tasks", taskId), {
      trending: !currentlyTrending
    });
    tg.showAlert(currentlyTrending ? "Removed from trending" : "Added to trending");
    loadTasks();
  } catch (e) {
    tg.showAlert("Error: " + e.message);
  }
};

window.editTask = async function(taskId) {
  const snap = await getDoc(doc(db, "tasks", taskId));
  if (!snap.exists()) return tg.showAlert("Task not found");

  const t = snap.data();

  const name = prompt("Task Name:", t.name);
  if (name === null) return;
  const coin = prompt("Coin Reward:", t.coin);
  if (coin === null) return;
  const link = prompt("Task Link:", t.link);
  if (link === null) return;
  const code = prompt("Verification Code (leave empty for timer):", t.code || "");
  const timer = prompt("Timer (seconds):", t.timer || 15);
  const limit = prompt("Limit (0 = unlimited):", t.limit || 0);
  const cooldown = prompt("Cooldown Hours:", t.cooldownHours || 0);

  try {
    await updateDoc(doc(db, "tasks", taskId), {
      name: name.trim() || t.name,
      coin: Number(coin) || t.coin,
      link: link.trim() || t.link,
      code: (code || "").trim(),
      timer: Number(timer) || 15,
      limit: Number(limit) || 0,
      cooldownHours: Number(cooldown) || 0
    });
    tg.showAlert("Task updated");
    loadTasks();
  } catch (e) {
    tg.showAlert("Error: " + e.message);
  }
};

window.deleteTask = async function(taskId) {
  if (!confirm("Delete this task permanently?")) return;
  try {
    await deleteDoc(doc(db, "tasks", taskId));
    tg.showAlert("Task deleted");
    loadTasks();
  } catch (e) {
    tg.showAlert("Error: " + e.message);
  }
};

loadTasks().catch(err => console.error(err));
