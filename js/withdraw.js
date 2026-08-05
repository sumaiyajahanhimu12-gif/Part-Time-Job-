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

  throw new Error("Telegram Required");

}

const user = tg.initDataUnsafe.user;

loadWithdrawPage();

const withdrawBtn =
document.getElementById(
  "withdrawBtn"
);

if (withdrawBtn) {

  withdrawBtn.addEventListener(
    "click",
    submitWithdraw
  );

}

async function loadWithdrawPage() {

  const userRef =
    doc(
      db,
      "users",
      String(user.id)
    );

  const userSnap =
    await getDoc(userRef);

  if (!userSnap.exists())
    return;

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
    await getDoc(
      settingsRef
    );

  let minWithdraw = 50000;

  let withdrawEnabled = true;

  if (
    settingsSnap.exists()
  ) {

    const settings =
      settingsSnap.data();

    minWithdraw =
      settings.minWithdraw || 50000;

    withdrawEnabled =
      settings.withdrawEnabled ?? true;

  }

  document.getElementById(
    "minWithdraw"
  ).innerText =
    minWithdraw;

  document.getElementById(
    "withdrawStatus"
  ).innerHTML =
    withdrawEnabled
    ? "✅ Withdraw Open"
    : "❌ Withdraw Closed";

  await loadHistory();

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

  if (!userSnap.exists())
    return;

  const userData =
    userSnap.data();

  const settingsRef =
    doc(
      db,
      "settings",
      "system"
    );

  const settingsSnap =
    await getDoc(
      settingsRef
    );

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

  const pendingQuery =
    query(
      collection(
        db,
        "withdraws"
      ),
      where(
        "userId",
        "==",
        String(user.id)
      ),
      where(
        "status",
        "==",
        "pending"
      )
    );

  const pendingSnap =
    await getDocs(
      pendingQuery
    );

  if (!pendingSnap.empty) {

    alert(
      "You Already Have A Pending Withdraw"
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

      firstName:
        user.first_name || "",

      coin:
        userData.coin || 0,

      paymentNumber,

      facebookLink:
        userData.facebookLink || "",

      status:
        "pending",

      createdAt:
        serverTimestamp()

    }
  );

  alert(
    "Withdraw Request Submitted Successfully"
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

    let badge = "⏳ Pending";

    if (
      data.status === "approved"
    ) {
      badge = "✅ Approved";
    }

    if (
      data.status === "rejected"
    ) {
      badge = "❌ Rejected";
    }

    html += `

      <div class="task-card">

        <h3>
        💰 ${data.coin}
        Coins
        </h3>

        <p>
        📱 ${data.paymentNumber}
        </p>

        <p>
        ${badge}
        </p>

      </div>

    `;

  });

  document.getElementById(
    "withdrawHistory"
  ).innerHTML =
    html ||
    `
    <div class="card">
    No Withdraw History
    </div>
    `;

}
