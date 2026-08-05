import { db } from "./firebase.js";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
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

loadReferralPage();

async function loadReferralPage() {

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
    "totalReferrals"
  ).innerText =
    userData.referrals || 0;

  document.getElementById(
    "activeReferrals"
  ).innerText =
    userData.activeReferrals || 0;

  document.getElementById(
    "referralIncome"
  ).innerText =
    userData.referralEarned || 0;

  const referralLink =

`https://t.me/PartTimeIncomeofficial_bot/parttimejob?startapp=${user.id}`;

  document.getElementById(
    "referralLink"
  ).value =
    referralLink;

  document
    .getElementById(
      "copyReferralBtn"
    )
    .addEventListener(
      "click",
      () => {

      navigator.clipboard.writeText(
        referralLink
      );

      alert(
        "Referral Link Copied"
      );

    });

  loadReferralList();

}

async function loadReferralList() {

  const q = query(
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

  const snap =
    await getDocs(q);

  let html = "";

  if (snap.empty) {

    html =
      "No Referrals Yet";

  } else {

    snap.forEach(ref => {

      const data =
        ref.data();

      html += `

      <div class="task-card">

      <h3>
      ${data.referredId}
      </h3>

      <p>
      Status:
      ${data.status}
      </p>

      </div>

      `;

    });

  }

  document.getElementById(
    "referralList"
  ).innerHTML =
    html;

}
