import { db } from "./firebase.js";

import {
  doc,
  getDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const tg = window.Telegram?.WebApp;

if (!tg || !tg.initDataUnsafe?.user) {

  location.href = "index.html";

}

const user = tg.initDataUnsafe.user;

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
    data.firstName || "User";

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
  ).innerHTML =
    data.facebookLink
    ?
    `<a href="${data.facebookLink}" target="_blank">
      Open Facebook Profile
    </a>`
    :
    "Not Added";

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

  if (data.createdAt) {

    const joinDate =
      data.createdAt.toDate();

    document.getElementById(
      "joinDate"
    ).innerText =
      "Joined: " +
      joinDate.toLocaleDateString();

  } else {

    document.getElementById(
      "joinDate"
    ).innerText =
      "Join Date Unavailable";

  }

}
