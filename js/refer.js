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

  const referralLink =
    `https://t.me/PartTimeIncomeofficial_bot?start=${user.id}`;

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
    await getDocs(referralQuery);

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

      <p>
      👤 User:
      ${data.referredId}
      </p>

      <p>
      📌 Status:
      ${data.status}
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
    html || `
    <p>No Referrals Yet</p>
    `;

}

document
.getElementById(
  "copyReferralBtn"
)
.addEventListener(
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
      "Referral Link Copied"
    );

  }
);
