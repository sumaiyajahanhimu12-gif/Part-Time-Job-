import { db } from "./firebase.js";

import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const tg = window.Telegram?.WebApp;

if (!tg) {

  document.body.innerHTML = `
    <h1>Open Inside Telegram</h1>
  `;

  throw new Error("Telegram Required");

}

tg.expand();

const user = tg.initDataUnsafe?.user;

await checkAdmin();
await loadDashboardStats();

async function checkAdmin() {

  const adminRef =
    doc(db, "admins", String(user.id));

  const adminSnap =
    await getDoc(adminRef);

  if (!adminSnap.exists()) {

    document.body.innerHTML = `
      <h1>⛔ Access Denied</h1>
    `;

    throw new Error("Not Admin");

  }

}

async function loadDashboardStats() {

  const usersSnap =
    await getDocs(collection(db, "users"));

  const tasksSnap =
    await getDocs(collection(db, "tasks"));

  const withdrawsSnap =
    await getDocs(collection(db, "withdraws"));

  const activeUsersSnap =
    await getDocs(
      query(
        collection(db, "users"),
        where("status", "==", "active")
      )
    );

  const totalUsersEl =
    document.getElementById("totalUsers");

  const activeUsersEl =
    document.getElementById("activeUsers");

  const totalTasksEl =
    document.getElementById("totalTasks");

  const pendingWithdrawsEl =
    document.getElementById("pendingWithdraws");

  if (totalUsersEl)
    totalUsersEl.textContent =
      usersSnap.size;

  if (activeUsersEl)
    activeUsersEl.textContent =
      activeUsersSnap.size;

  if (totalTasksEl)
    totalTasksEl.textContent =
      tasksSnap.size;

  if (pendingWithdrawsEl)
    pendingWithdrawsEl.textContent =
      withdrawsSnap.size;

}

const createBtn =
document.getElementById("createTaskBtn");

if (createBtn) {

  createBtn.addEventListener(
    "click",
    createTask
  );

}

async function createTask() {

  const name =
    document.getElementById("taskName").value.trim();

  const link =
    document.getElementById("taskLink").value.trim();

  const coin =
    Number(
      document.getElementById("taskCoin").value
    );

  const code =
    document.getElementById("taskCode").value.trim();

  const timer =
    Number(
      document.getElementById("taskTimer").value
    );

  const limit =
    Number(
      document.getElementById("taskLimit").value
    );

  const taskType =
    document.getElementById("taskType").value;

  const status =
    document.getElementById("taskStatus").value;

  if (!name || !link || !coin) {

    alert("Fill Required Fields");

    return;

  }

  await addDoc(
    collection(db, "tasks"),
    {
      name,
      link,
      coin,

      code: code || "",

      timer: timer || 0,

      limit: limit || 0,

      taskType,

      status,

      trending:
        status === "trending",

      completedCount: 0,

      createdAt:
        serverTimestamp()
    }
  );

  alert("✅ Task Created Successfully");

  location.reload();

}
