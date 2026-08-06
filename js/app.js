import { db } from "./firebase.js";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const tg = window.Telegram?.WebApp;

if (!tg || !tg.initDataUnsafe?.user) {

  document.querySelector(".loading").innerHTML = `
    <h1>💼 Part Time Job</h1>
    <p>Open Inside Telegram</p>
  `;

  throw new Error("Telegram Required");

}

tg.expand();

const user = tg.initDataUnsafe.user;

await createOrUpdateUser();

await loadDashboard();

async function createOrUpdateUser() {

  const userRef =
    doc(db, "users", String(user.id));

  const userSnap =
    await getDoc(userRef);

  if (!userSnap.exists()) {

    await setDoc(userRef, {

      telegramId: user.id,

      username:
        user.username || "",

      firstName:
        user.first_name || "",

      lastName:
        user.last_name || "",

      coin: 0,

      referrals: 0,

      activeReferrals: 0,

      totalEarned: 0,

      totalWithdraw: 0,

      referralIncome: 0,

      facebookLink: "",

      role: "user",

      status: "active",

      createdAt:
        serverTimestamp()

    });

  }

}

async function loadDashboard() {

  const userRef =
    doc(db, "users", String(user.id));

  const userSnap =
    await getDoc(userRef);

  if (!userSnap.exists()) {

    document.querySelector(".loading").innerHTML =
      "<h2>User Not Found</h2>";

    return;

  }

  const data =
    userSnap.data();

  let adminButton = "";

  if (data.role === "admin") {

    adminButton = `

      <div class="card">

      <h3>🛠 Admin Panel</h3>

      <button
      onclick="location.href='admin/dashboard.html'"
      >
      Open Admin Dashboard
      </button>

      </div>

    `;

  }

  document.querySelector(".loading").innerHTML = `

  <div class="dashboard">

    <div class="top-card">

      <h1>💼 Part Time Job</h1>

      <h2>
      ${data.firstName || "User"}
      </h2>

      <div class="coin-box">
      💰 ${data.coin || 0}
      </div>

    </div>

    <div class="stats-grid">

      <div class="stat-card">
      <h3>Total Earned</h3>
      <p>${data.totalEarned || 0}</p>
      </div>

      <div class="stat-card">
      <h3>Referrals</h3>
      <p>${data.referrals || 0}</p>
      </div>

      <div class="stat-card">
      <h3>Withdraw</h3>
      <p>${data.totalWithdraw || 0}</p>
      </div>

      <div class="stat-card">
      <h3>Status</h3>
      <p>${data.status || "active"}</p>
      </div>

    </div>

    ${adminButton}

  </div>

  `;

}
