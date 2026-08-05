import { db } from "./firebase.js";

import {
  collection,
  getDocs
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

loadSecurity();

async function loadSecurity() {

  const snap =
    await getDocs(
      collection(db,"users")
    );

  let users = [];

  snap.forEach(doc => {

    users.push({
      id: doc.id,
      ...doc.data()
    });

  });

  document.getElementById(
    "totalUsers"
  ).innerText =
    users.length;

  let html = "";

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

  users.forEach(user => {

    let suspicious = false;

    const fbDuplicate =
      facebookMap[user.facebookLink] > 1;

    const fpDuplicate =
      fingerprintMap[user.fingerprint] > 1;

    if (fbDuplicate) {

      duplicateFacebook++;
      suspicious = true;

    }

    if (fpDuplicate) {

      duplicateFingerprint++;
      suspicious = true;

    }

    if (suspicious) {

      suspiciousUsers++;

      html += `

      <div class="section-card">

      <h3>
      🚨 Suspicious User
      </h3>

      <p>
      Telegram ID:
      ${user.telegramId}
      </p>

      <p>
      Username:
      ${user.username || "No Username"}
      </p>

      <p>
      Facebook:
      ${user.facebookLink || "-"}
      </p>

      <p>
      Status:
      ${user.status}
      </p>

      </div>

      `;

    }

  });

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
    html || `
      <div class="section-card">
      <h3>✅ No Suspicious Accounts Found</h3>
      </div>
    `;

}
