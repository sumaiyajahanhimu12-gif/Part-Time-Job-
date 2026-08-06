import { db } from "../js/firebase.js";

import {
  collection,
  getDocs,
  updateDoc,
  doc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

loadSecurity();

async function loadSecurity() {

  const snap =
    await getDocs(
      collection(
        db,
        "users"
      )
    );

  const users = [];

  snap.forEach(item => {

    users.push({
      id: item.id,
      ...item.data()
    });

  });

  document.getElementById(
    "totalUsers"
  ).innerText =
    users.length;

  let duplicateFacebook = 0;
  let duplicateFingerprint = 0;
  let suspiciousUsers = 0;

  const facebookMap = {};
  const fingerprintMap = {};

  users.forEach(user => {

    if (user.facebookLink) {

      facebookMap[user.facebookLink] =
      (facebookMap[user.facebookLink] || 0) + 1;

    }

    if (user.fingerprint) {

      fingerprintMap[user.fingerprint] =
      (fingerprintMap[user.fingerprint] || 0) + 1;

    }

  });

  const countedFacebook =
    new Set();

  const countedFingerprint =
    new Set();

  let html = "";

  users.forEach(user => {

    let suspicious = false;

    const fbDuplicate =
      user.facebookLink &&
      facebookMap[user.facebookLink] > 1;

    const fpDuplicate =
      user.fingerprint &&
      fingerprintMap[user.fingerprint] > 1;

    if (fbDuplicate) {

      suspicious = true;

      countedFacebook.add(
        user.facebookLink
      );

    }

    if (fpDuplicate) {

      suspicious = true;

      countedFingerprint.add(
        user.fingerprint
      );

    }

    if (suspicious) {

      suspiciousUsers++;

      html += `

      <div class="section-card">

        <h3>
          🚨 Suspicious Account
        </h3>

        <p>
          🆔 Telegram:
          ${user.telegramId || "-"}
        </p>

        <p>
          👤 Username:
          ${user.username || "-"}
        </p>

        <p>
          📘 Facebook:
          ${
            user.facebookLink
            ?
            `<a href="${user.facebookLink}" target="_blank">${user.facebookLink}</a>`
            :
            "-"
          }
        </p>

        <p>
          📱 Fingerprint:
          ${user.fingerprint || "-"}
        </p>

        <p>
          📌 Status:
          ${user.status || "-"}
        </p>

        <button
          onclick="banUser('${user.id}')"
          style="background:#dc2626;"
        >
          🚫 Ban User
        </button>

      </div>

      `;

    }

  });

  duplicateFacebook =
    countedFacebook.size;

  duplicateFingerprint =
    countedFingerprint.size;

  document.getElementById(
    "duplicateFacebook"
  ).innerText =
    duplicateFacebook;

  document.getElementById(
    "duplicateFingerprint"
  ).innerText =
    duplicateFingerprint;

  document.getElementById(
    "suspiciousUsers"
  ).innerText =
    suspiciousUsers;

  document.getElementById(
    "securityContainer"
  ).innerHTML =
    html ||
    `
    <div class="section-card">

      <h3>
      ✅ No Suspicious Accounts Found
      </h3>

    </div>
    `;

}

window.banUser =
async function(userId) {

  const ok =
    confirm(
      "Ban This User?"
    );

  if (!ok)
    return;

  await updateDoc(
    doc(
      db,
      "users",
      userId
    ),
    {
      status: "banned"
    }
  );

  alert(
    "User Banned Successfully"
  );

  location.reload();

};

window.unbanUser =
async function(userId) {

  const ok =
    confirm(
      "Unban This User?"
    );

  if (!ok)
    return;

  await updateDoc(
    doc(
      db,
      "users",
      userId
    ),
    {
      status: "active"
    }
  );

  alert(
    "User Unbanned Successfully"
  );

  location.reload();

};
