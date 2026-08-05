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
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

await saveUser(user);

const startParam =
tg.initDataUnsafe?.start_param || null;

if (startParam) {

  await saveReferral(
    startParam,
    user.id
  );

}

await loadDashboard(user);

function generateFingerprint() {

  return btoa(
    navigator.userAgent +
    screen.width +
    screen.height +
    navigator.language
  );

}

async function saveUser(user) {

  const userRef =
    doc(
      db,
      "users",
      String(user.id)
    );

  const userSnap =
    await getDoc(userRef);

  if (userSnap.exists())
    return;

  await setDoc(userRef, {

    telegramId:
      user.id,

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

    fingerprint:
      generateFingerprint(),

    status:
      "inactive",

    createdAt:
      serverTimestamp()

  });

}

async function saveReferral(
  referrerId,
  referredId
) {

  if (
    String(referrerId)
    ===
    String(referredId)
  ) return;

  const q =
    query(
      collection(
        db,
        "pendingReferrals"
      ),
      where(
        "referredId",
        "==",
        String(referredId)
      )
    );

  const snap =
    await getDocs(q);

  if (!snap.empty)
    return;

  await addDoc(
    collection(
      db,
      "pendingReferrals"
    ),
    {
      referrerId:
        String(referrerId),

      referredId:
        String(referredId),

      status:
        "pending",

      createdAt:
        serverTimestamp()
    }
  );

}

async function loadDashboard(user) {

  const userRef =
    doc(
      db,
      "users",
      String(user.id)
    );

  const userSnap =
    await getDoc(userRef);

  const data =
    userSnap.data();

  if (
    data.status === "banned"
  ) {

    document.querySelector(
      ".loading"
    ).innerHTML = `
      <h1>🚫 Account Banned</h1>
    `;

    return;

  }

  if (
    data.status === "inactive"
  ) {

    document.querySelector(
      ".loading"
    ).innerHTML = `
      <div class="activate-box">

      <h1>
      💼 Part Time Job
      </h1>

      <p>
      Account Not Activated
      </p>

      <input
      id="facebookLink"
      placeholder="Facebook Profile Link"
      >

      <button
      id="activateBtn"
      >
      Activate Account
      </button>

      </div>
    `;

    document
    .getElementById(
      "activateBtn"
    )
    .onclick =
    async () => {

      const link =
        document
        .getElementById(
          "facebookLink"
        )
        .value
        .trim();

      if (!link) {

        alert(
          "Facebook Link Required"
        );

        return;

      }

      await updateDoc(
        userRef,
        {
          facebookLink:
            link,

          status:
            "active",

          activatedAt:
            serverTimestamp()
        }
      );

      location.reload();

    };

    return;

  }

  document.querySelector(
    ".loading"
  ).innerHTML = `

  <div class="dashboard">

  <div class="top-card">

  <h1>
  💼 Part Time Job
  </h1>

  <h2>
  ${data.firstName}
  </h2>

  <div class="coin-box">

  💰 ${data.coin}

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
  <h3>Withdrawn</h3>
  <p>${data.totalWithdraw || 0}</p>
  </div>

  <div class="stat-card">
  <h3>Status</h3>
  <p>${data.status}</p>
  </div>

  </div>

  <div class="card">

  <h3>
  🚀 Quick Access
  </h3>

  <p>
  Complete Tasks, Invite Friends and Earn Coins.
  </p>

  </div>

  <div class="card">

  <h3>
  🔔 Latest Update
  </h3>

  <p>
  Check Notifications Page For Latest Notices.
  </p>

  </div>

  </div>

  `;

      }
