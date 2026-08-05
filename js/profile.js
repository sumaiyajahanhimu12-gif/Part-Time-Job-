import { db } from "./firebase.js";

import {
  doc,
  getDoc
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

loadProfile();

async function loadProfile() {

  const userRef =
    doc(
      db,
      "users",
      String(user.id)
    );

  const userSnap =
    await getDoc(userRef);

  if (!userSnap.exists()) {

    alert("User Not Found");

    return;

  }

  const data =
    userSnap.data();

  document.getElementById(
    "profileName"
  ).innerText =
    `${data.firstName || ""} ${data.lastName || ""}`;

  document.getElementById(
    "telegramId"
  ).innerText =
    data.telegramId || "-";

  document.getElementById(
    "username"
  ).innerText =
    data.username
      ? "@" + data.username
      : "No Username";

  document.getElementById(
    "facebookLink"
  ).innerText =
    data.facebookLink || "-";

  document.getElementById(
    "coinBalance"
  ).innerText =
    data.coin || 0;

  document.getElementById(
    "totalReferrals"
  ).innerText =
    data.referrals || 0;

  document.getElementById(
    "activeReferrals"
  ).innerText =
    data.activeReferrals || 0;

  document.getElementById(
    "accountStatus"
  ).innerText =
    data.status || "inactive";

  document.getElementById(
    "joinDate"
  ).innerText =
    "Account Created Successfully";

}
