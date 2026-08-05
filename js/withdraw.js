import { db } from "./firebase.js";

import {
  doc,
  getDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const tg = window.Telegram?.WebApp;

if (!tg) {

  document.body.innerHTML =
    "Open Inside Telegram";

  throw new Error();

}

const user =
  tg.initDataUnsafe?.user;

loadWithdrawPage();

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
      "withdraw"
    );

  const settingsSnap =
    await getDoc(settingsRef);

  let minAmount = 50000;
  let enabled = false;

  if (settingsSnap.exists()) {

    const settings =
      settingsSnap.data();

    minAmount =
      settings.minAmount || 50000;

    enabled =
      settings.enabled || false;

  }

  document.getElementById(
    "minWithdraw"
  ).innerText =
    minAmount;

  document.getElementById(
    "withdrawStatus"
  ).innerText =
    enabled
      ? "✅ Withdraw Open"
      : "❌ Withdraw Closed";

  document
    .getElementById(
      "withdrawBtn"
    )
    .addEventListener(
      "click",
      async () => {

      if (!enabled) {

        alert(
          "Withdraw Closed"
        );

        return;

      }

      if (
        userData.coin <
        minAmount
      ) {

        alert(
          "Minimum Withdraw Not Reached"
        );

        return;

      }

      const number =
        document.getElementById(
          "paymentNumber"
        ).value.trim();

      if (!number) {

        alert(
          "Payment Number Required"
        );

        return;

      }

      await addDoc(
        collection(
          db,
          "withdraws"
        ),
        {
          telegramId:
            String(user.id),

          coin:
            userData.coin,

          paymentNumber:
            number,

          facebookLink:
            userData.facebookLink || "",

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

    });

  loadWithdrawHistory();

}

async function loadWithdrawHistory() {

  const q =
    query(
      collection(
        db,
        "withdraws"
      ),
      where(
        "telegramId",
        "==",
        String(user.id)
      )
    );

  const snap =
    await getDocs(q);

  let html = "";

  if (snap.empty) {

    html =
      "No Withdraw History";

  } else {

    snap.forEach(item => {

      const data =
        item.data();

      html += `

      <div class="task-card">

      <h3>
      ${data.coin} Coins
      </h3>

      <p>
      ${data.status}
      </p>

      </div>

      `;

    });

  }

  document.getElementById(
    "withdrawHistory"
  ).innerHTML =
    html;

}
