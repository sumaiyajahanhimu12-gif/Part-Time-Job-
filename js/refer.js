import { db } from "./firebase.js";

import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const tg = window.Telegram?.WebApp;

if (!tg || !tg.initDataUnsafe?.user) {

  location.href = "index.html";
  throw new Error("Telegram Required");

}

const user = tg.initDataUnsafe.user;

loadReferralData();

async function loadReferralData() {

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

  const botUsername =
    "PartTimeIncomeofficial_bot";

  const referralLink =
    `https://t.me/${botUsername}?start=${user.id}`;

  document.getElementById(
    "referralLink"
  ).value =
    referralLink;

  const referralQuery =
    query(
      collection(
        db,
        "pendingReferrals"
      ),
      where(
        "referrerId",
        "==",
        String(user.id)
      )
    );

  const referralSnap =
    await getDocs(
      referralQuery
    );

  let total = 0;
  let active = 0;

  let html = "";

  referralSnap.forEach(item => {

    const data =
      item.data();

    total++;

    if (
      data.status === "active"
    ) {
      active++;
    }

    html += `

      <div class="task-card">

        <h3>
          👤 User
        </h3>

        <p>
          Telegram ID:
          ${data.referredId}
        </p>

        <p>
          Status:
          ${
            data.status === "active"
            ? "✅ Active"
            : "⏳ Pending"
          }
        </p>

      </div>

    `;

  });

  document.getElementById(
    "totalReferrals"
  ).innerText =
    total;

  document.getElementById(
    "activeReferrals"
  ).innerText =
    active;

  document.getElementById(
    "referralIncome"
  ).innerText =
    userData.referralIncome || 0;

  document.getElementById(
    "referralList"
  ).innerHTML =
    html ||
    `
    <div class="card">
      No Referrals Yet
    </div>
    `;

}

const copyBtn =
document.getElementById(
  "copyReferralBtn"
);

if (copyBtn) {

  copyBtn.addEventListener(
    "click",
    async () => {

      const link =
        document.getElementById(
          "referralLink"
        ).value;

      await navigator.clipboard.writeText(
        link
      );

      alert(
        "Referral Link Copied Successfully"
      );

    }
  );

}
