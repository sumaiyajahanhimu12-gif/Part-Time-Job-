import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  increment,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy
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
let currentUserData = null;

async function getUserData() {
  const snap = await getDoc(doc(db, "users", String(user.id)));
  if (!snap.exists()) {
    location.href = "index.html";
    return null;
  }
  currentUserData = snap.data();
  // update lastActive
  await updateDoc(doc(db, "users", String(user.id)), {
    lastActive: serverTimestamp()
  });
  return currentUserData;
}

async function getUserClaims() {
  const q = query(
    collection(db, "taskClaims"),
    where("userId", "==", String(user.id))
  );
  const snap = await getDocs(q);
  const claims = {};
  snap.forEach(d => {
    const data = d.data();
    claims[data.taskId] = data;
  });
  return claims;
}

function isInCooldown(claim, cooldownHours) {
  if (!claim || !claim.createdAt || !cooldownHours) return false;
  const claimTime = claim.createdAt.toDate().getTime();
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  return Date.now() - claimTime < cooldownMs;
}

function getRemainingCooldown(claim, cooldownHours) {
  const claimTime = claim.createdAt.toDate().getTime();
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  const remaining = cooldownMs - (Date.now() - claimTime);
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m`;
}

async function loadTasks() {
  await getUserData();
  if (!currentUserData) return;

  const [tasksSnap, claims] = await Promise.all([
    getDocs(collection(db, "tasks")),
    getUserClaims()
  ]);

  let daily = 0, weekly = 0, permanent = 0, daysBased = 0;
  let trendingHtml = "";
  let allHtml = "";

  const now = Date.now();

  for (const taskDoc of tasksSnap.docs) {
    const t = taskDoc.data();
    const taskId = taskDoc.id;

    // Only published & live tasks
    if (t.status !== "published") continue;
    if (t.limit > 0 && (t.completedCount || 0) >= t.limit) continue;

    // Schedule check
    if (t.scheduleDate && t.scheduleDate.toDate) {
      if (t.scheduleDate.toDate().getTime() > now) continue;
    }

    // Duration / Days-Based expiry
    if (t.taskType === "days" && t.durationDays && t.createdAt?.toDate) {
      const expireTime = t.createdAt.toDate().getTime() + (t.durationDays * 24 * 60 * 60 * 1000);
      if (now > expireTime) continue;
    }

    // Weekly auto expire (7 days from publish)
    if (t.taskType === "weekly" && t.createdAt?.toDate) {
      const expireTime = t.createdAt.toDate().getTime() + (7 * 24 * 60 * 60 * 1000);
      if (now > expireTime) continue;
    }

    // Count by type
    if (t.taskType === "daily") daily++;
    else if (t.taskType === "weekly") weekly++;
    else if (t.taskType === "permanent") permanent++;
    else if (t.taskType === "days") daysBased++;

    const claim = claims[taskId];
    const cooldownHours = t.cooldownHours || 0;
    const inCooldown = isInCooldown(claim, cooldownHours);
    const alreadyDone = !!claim && (t.taskType === "permanent" || t.taskType === "daily" || !cooldownHours);

    // For permanent & daily → once only (or until next day for daily - simplified)
    // For others with cooldown → hide while in cooldown

    let actionHtml = "";

    if (currentUserData.status !== "Active") {
      actionHtml = `<button class="btn-secondary" disabled>Activate Account First</button>`;
    } else if (alreadyDone && t.taskType === "permanent") {
      actionHtml = `<button class="btn-secondary" disabled>✅ Completed</button>`;
    } else if (inCooldown) {
      actionHtml = `<button class="btn-secondary" disabled>⏳ ${getRemainingCooldown(claim, cooldownHours)}</button>`;
    } else {
      // Can do the task
      if (t.code && t.code.trim()) {
        // Manual code verification
        actionHtml = `
          <button class="btn-primary" onclick="window.openTask('${t.link}')">Open Task</button>
          <div style="margin-top:10px;">
            <input type="text" id="code-${taskId}" placeholder="Enter Task Code" style="margin-bottom:8px;" />
            <button class="btn-primary" onclick="window.submitCode('${taskId}', \( {t.coin}, ' \){t.code}')">
              Submit Code & Claim
            </button>
          </div>
        `;
      } else {
        // Timer based
        const timer = t.timer || 15;
        actionHtml = `
          <button class="btn-primary" onclick="window.openTask('${t.link}')">Open Task</button>
          <button class="btn-primary" id="claim-${taskId}" style="margin-top:8px;"
            onclick="window.startClaim('${taskId}', ${t.coin}, ${timer})">
            Start Timer & Claim (${timer}s)
          </button>
        `;
      }
    }

    const typeLabel = {
      daily: "Daily",
      weekly: "Weekly",
      permanent: "Permanent",
      days: `${t.durationDays || "?"} Days`
    }[t.taskType] || t.taskType;

    const card = `
      <div class="task-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
          <h3 style="font-size:16px;margin:0;">${t.name}</h3>
          <span class="badge badge-active" style="font-size:10px;">${typeLabel}</span>
        </div>
        <p style="color:var(--muted);font-size:13px;margin-bottom:6px;">💰 <b style="color:var(--success)">${t.coin}</b> Coins</p>
        <p style="color:var(--muted);font-size:12px;margin-bottom:12px;">
          \( {t.completedCount || 0} \){t.limit ? " / " + t.limit : ""} completed
          ${t.cooldownHours ? ` • Cooldown ${t.cooldownHours}h` : ""}
        </p>
        ${actionHtml}
      </div>
    `;

    allHtml += card;
    if (t.trending) trendingHtml += card;
  }

  // Render
  document.getElementById("app").innerHTML = `
    <div class="page">
      <div class="hero-card" style="padding:18px;">
        <h1 style="font-size:22px;margin-bottom:4px;">📋 Tasks</h1>
        <p style="color:var(--muted);font-size:13px;">Complete tasks & earn coins</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-value" id="dailyCount">${daily}</div>
          <div class="stat-label">Daily</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📆</div>
          <div class="stat-value" id="weeklyCount">${weekly}</div>
          <div class="stat-label">Weekly</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-value" id="permanentCount">${permanent}</div>
          <div class="stat-label">Permanent</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏳</div>
          <div class="stat-value">${daysBased}</div>
          <div class="stat-label">Days-Based</div>
        </div>
      </div>

      ${currentUserData.status !== "Active" ? `
        <div class="card notice-card">
          <div class="card-header">⚠️ Account Not Active</div>
          <p>Submit your Facebook link in Profile to activate and start doing tasks.</p>
          <button class="btn-primary" onclick="location.href='profile.html'">Go to Profile</button>
        </div>
      ` : ""}

      <div class="section-title">🔥 Trending Tasks</div>
      <div id="trendingTasks">
        ${trendingHtml || `<div class="card"><p style="color:var(--muted);text-align:center;">No trending tasks right now</p></div>`}
      </div>

      <div class="section-title">📋 All Available Tasks</div>
      <div id="tasksContainer">
        ${allHtml || `<div class="card"><p style="color:var(--muted);text-align:center;">No tasks available</p></div>`}
      </div>
    </div>
  `;
}

// Global helpers
window.openTask = function(link) {
  if (link) window.open(link, "_blank");
};

window.startClaim = async function(taskId, coin, timer) {
  if (currentUserData?.status !== "Active") {
    return tg.showAlert("Activate your account first");
  }

  const btn = document.getElementById(`claim-${taskId}`);
  if (!btn || btn.disabled) return;

  btn.disabled = true;
  let seconds = timer;
  btn.innerText = `Wait ${seconds}s...`;

  const interval = setInterval(() => {
    seconds--;
    btn.innerText = `Wait ${seconds}s...`;
    if (seconds <= 0) clearInterval(interval);
  }, 1000);

  setTimeout(async () => {
    try {
      await addDoc(collection(db, "taskClaims"), {
        userId: String(user.id),
        taskId,
        coin,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, "users", String(user.id)), {
        coin: increment(coin),
        totalEarned: increment(coin),
        lastActive: serverTimestamp()
      });

      await updateDoc(doc(db, "tasks", taskId), {
        completedCount: increment(1)
      });

      // Check pending referral → make active
      await activateReferralIfNeeded();

      tg.showAlert(`+${coin} coins added!`);
      loadTasks();
    } catch (e) {
      console.error(e);
      tg.showAlert("Error: " + e.message);
      btn.disabled = false;
      btn.innerText = "Try Again";
    }
  }, timer * 1000);
};

window.submitCode = async function(taskId, coin, correctCode) {
  if (currentUserData?.status !== "Active") {
    return tg.showAlert("Activate your account first");
  }

  const input = document.getElementById(`code-${taskId}`);
  const code = (input?.value || "").trim();

  if (!code) return tg.showAlert("Enter the code");
  if (code !== correctCode) return tg.showAlert("Wrong code!");

  try {
    await addDoc(collection(db, "taskClaims"), {
      userId: String(user.id),
      taskId,
      coin,
      createdAt: serverTimestamp()
    });

    await updateDoc(doc(db, "users", String(user.id)), {
      coin: increment(coin),
      totalEarned: increment(coin),
      lastActive: serverTimestamp()
    });

    await updateDoc(doc(db, "tasks", taskId), {
      completedCount: increment(1)
    });

    await activateReferralIfNeeded();

    tg.showAlert(`+${coin} coins added!`);
    loadTasks();
  } catch (e) {
    tg.showAlert("Error: " + e.message);
  }
};

async function activateReferralIfNeeded() {
  // Find if this user is in pendingReferrals
  const q = query(
    collection(db, "pendingReferrals"),
    where("newUserId", "==", String(user.id)),
    where("status", "==", "pending")
  );
  const snap = await getDocs(q);
  if (snap.empty) return;

  for (const d of snap.docs) {
    const refData = d.data();
    // mark as active
    await updateDoc(doc(db, "pendingReferrals", d.id), {
      status: "active",
      activatedAt: serverTimestamp()
    });
    // increment referrer's activeReferrals + referrals
    const referrerRef = doc(db, "users", refData.referrerId);
    const referrerSnap = await getDoc(referrerRef);
    if (referrerSnap.exists()) {
      await updateDoc(referrerRef, {
        activeReferrals: increment(1),
        referrals: increment(1)
      });
    }
  }
}

loadTasks().catch(err => {
  console.error(err);
  document.getElementById("app").innerHTML = `
    <div class="loader-content">
      <h2>Error loading tasks</h2>
      <p class="error-text">${err.message}</p>
    </div>
  `;
});
