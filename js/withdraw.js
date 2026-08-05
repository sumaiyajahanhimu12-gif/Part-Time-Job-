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
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const tg = window.Telegram?.WebApp;

if (!tg || !tg.initDataUnsafe?.user) {

  location.href = "index.html";

}

const user = tg.initDataUnsafe.user;

loadWithdrawPage();

document
.getElementById(
  "withdrawBtn"
)
.addEventListener(
  "click",
  submitWithdraw
);

async function loadWithdrawPage() {

  const userRef =
    doc(
      db,
      "users",
      String(user.id)
    );

  const userSnap =
    await getDoc(userRef);

  const userData =
    userSnap.data();

  document.getElementById(
    "userCoins"
  ).innerText =
    userData.coin || 0;

  const settingsRef =
    doc(
      db,
      "settings",
      "system"
    );

  const settingsSnap =
    await getDoc(settingsRef);

  let minWithdraw = 50000;
  let withdrawEnabled = true;

  if (settingsSnap.exists()) {

    const settings =
      settingsSnap.data();

    minWithdraw =
      settings.minWithdraw || 50000;

    withdrawEnabled =
      settings.withdrawEnabled;

  }

  document.getElementById(
    "minWithdraw"
  ).innerText =
    minWithdraw;

  document.getElementById(
    "withdrawStatus"
  ).innerText =
    withdrawEnabled
    ? "✅ Withdraw Open"
    : "❌ Withdraw Closed";

  loadHistory();

}

async function submitWithdraw() {

  const paymentNumber =
    document.getElementById(
      "paymentNumber"
    ).value.trim();

  if (!paymentNumber) {

    alert(
      "Payment Number Required"
    );

    return;

  }

  const userRef =
    doc(
      db,
      "users",
      String(user.id)
    );

  const userSnap =
    await getDoc(userRef);

  const userData =
    userSnap.data();

  const settingsRef =
    doc(
      db,
      "settings",
      "system"
    );

  const settingsSnap =
    await getDoc(settingsRef);

  const settings =
    settingsSnap.exists()
    ? settingsSnap.data()
    : {};

  const minWithdraw =
    settings.minWithdraw || 50000;

  const withdrawEnabled =
    settings.withdrawEnabled ?? true;

  if (!withdrawEnabled) {

    alert(
      "Withdraw Currently Closed"
    );

    return;

  }

  if (
    (userData.coin || 0)
    < minWithdraw
  ) {

    alert(
      `Minimum ${minWithdraw} Coins Required`
    );

    return;

  }

  await addDoc(
    collection(
      db,
      "withdraws"
    ),
    {
      userId:
        String(user.id),

      username:
        user.username || "",

      facebookLink:
        userData.facebookLink || "",

      coin:
        userData.coin,

      paymentNumber,

      status:
        "pending",

      createdAt:
        serverTimestamp()
    }
  );

  alert(
    "Withdraw Request Submitted"
  );

  location.reload();

}

async function loadHistory() {

  const q =
    query(
      collection(
        db,
        "withdraws"
      ),
      where(
        "userId",
        "==",
        String(user.id)
      )
    );

  const snap =
    await getDocs(q);

  let html = "";

  snap.forEach(item => {

    const data =
      item.data();

    html += `

    <div class="task-card">

      <p>
      💰 ${data.coin}
      Coins
      </p>

      <p>
      📱 ${data.paymentNumber}
      </p>

      <p>
      📌 ${data.status}
      </p>

    </div>

    `;

  });

  document.getElementById(
    "withdrawHistory"
  ).innerHTML =
    html ||
    "<p>No Withdraw History</p>";

        }
