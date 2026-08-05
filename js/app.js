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

if (tg) {

  tg.expand();

  const user = tg.initDataUnsafe?.user;

  if (user) {

    await saveUser(user);

    const startParam =
      tg.initDataUnsafe?.start_param || null;

    if (startParam) {
      await saveReferral(startParam, user.id);
    }

    await loadUser(user);
  }

} else {

  document.querySelector(".loading").innerHTML = `
    <h1>💼 Part Time Job</h1>
    <p>Open inside Telegram</p>
  `;

}

function generateFingerprint() {

  return btoa(
    navigator.userAgent +
    screen.width +
    screen.height +
    navigator.language +
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );

}

async function saveUser(user) {

  const userRef = doc(db, "users", String(user.id));
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {

    const fingerprint = generateFingerprint();

    const fpQuery = query(
      collection(db, "users"),
      where("fingerprint", "==", fingerprint)
    );

    const fpSnap = await getDocs(fpQuery);

    if (!fpSnap.empty) {

      document.querySelector(".loading").innerHTML = `
        <h1>🚫 Device Blocked</h1>
        <p>Only one account allowed per device.</p>
      `;

      throw new Error("Device already used");
    }

    await setDoc(userRef, {
      telegramId: user.id,
      username: user.username || "",
      firstName: user.first_name || "",
      lastName: user.last_name || "",

      coin: 0,

      referrals: 0,
      activeReferrals: 0,

      totalEarned: 0,
      totalWithdraw: 0,
      referralEarned: 0,

      status: "inactive",

      facebookLink: "",

      deviceId: "",
      fingerprint,

      activatedAt: null,

      createdAt: serverTimestamp()
    });

  }

}

async function saveReferral(referrerId, referredId) {

  if (String(referrerId) === String(referredId)) {
    return;
  }

  const q = query(
    collection(db, "pendingReferrals"),
    where("referredId", "==", String(referredId))
  );

  const snap = await getDocs(q);

  if (!snap.empty) {
    return;
  }

  await addDoc(collection(db, "pendingReferrals"), {
    referrerId: String(referrerId),
    referredId: String(referredId),
    status: "pending",
    createdAt: serverTimestamp()
  });

}

async function loadUser(user) {

  const userRef = doc(db, "users", String(user.id));
  const userSnap = await getDoc(userRef);

  const data = userSnap.data();

  if (data.status === "inactive") {

    document.querySelector(".loading").innerHTML = `
      <div class="activate-box">

        <h1>💼 Part Time Job</h1>

        <p>Welcome ${user.first_name}</p>

        <p>❌ Account Not Activated</p>

        <input
          id="facebookLink"
          placeholder="Facebook Profile Link"
        >

        <button id="activateBtn">
          🚀 Activate Account
        </button>

      </div>
    `;

    document
      .getElementById("activateBtn")
      .addEventListener("click", async () => {

        const facebookLink =
          document.getElementById("facebookLink").value.trim();

        if (!facebookLink) {
          alert("Facebook Link Required");
          return;
        }

        const fbQuery = query(
          collection(db, "users"),
          where("facebookLink", "==", facebookLink)
        );

        const fbSnap = await getDocs(fbQuery);

        let alreadyUsed = false;

        fbSnap.forEach(docSnap => {

          if (docSnap.id !== String(user.id)) {
            alreadyUsed = true;
          }

        });

        if (alreadyUsed) {

          alert("Facebook Profile Already Used");

          return;
        }

        await updateDoc(userRef, {
          facebookLink,
          status: "active",
          activatedAt: serverTimestamp()
        });

        alert("Account Activated");

        location.reload();

      });

    return;
  }

  document.querySelector(".loading").innerHTML = `
    <div class="dashboard">

      <div class="top-card">

        <h1>💼 Part Time Job</h1>

        <h2>Welcome ${user.first_name}</h2>

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
          <h3>Total Withdraw</h3>
          <p>${data.totalWithdraw || 0}</p>
        </div>

        <div class="stat-card">
          <h3>Referral Earned</h3>
          <p>${data.referralEarned || 0}</p>
        </div>

      </div>

      <div id="tasksContainer">
        Loading Tasks...
      </div>

    </div>
  `;

  await loadTasks();

}

async function loadTasks() {

  const q = query(
    collection(db, "tasks"),
    where("status", "==", "published")
  );

  const snap = await getDocs(q);

  let html = `
    <div class="section-title">
      📢 Available Tasks
    </div>
  `;

  snap.forEach(task => {

    const data = task.data();

    html += `
      <div class="task-card">

        <h3>${data.name || "Task"}</h3>

        <p>💰 Reward: ${data.coin}</p>

        <p>📂 ${data.type}</p>

        <p>🏷️ ${data.category}</p>

        <button
          onclick="window.open('${data.link}','_blank')"
        >
          Open Task
        </button>

      </div>
    `;

  });

  document.getElementById("tasksContainer").innerHTML = html;

            }
