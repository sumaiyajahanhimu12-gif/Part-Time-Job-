import { db } from "./firebase.js";

import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const tg = window.Telegram?.WebApp;

if (!tg) {

  document.body.innerHTML = `
    <h1>Open Inside Telegram</h1>
  `;

  throw new Error("Telegram Required");

}

const user = tg.initDataUnsafe?.user;

await checkAdmin();

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

      code,

      timer,

      limit,

      taskType,

      status,

      trending: false,

      completedCount: 0,

      createdAt:
        serverTimestamp()
    }
  );

  alert("Task Created Successfully");

  location.reload();

}
