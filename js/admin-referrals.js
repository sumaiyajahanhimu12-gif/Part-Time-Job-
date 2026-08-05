import { db } from "./firebase.js";

import {
  collection,
  getDocs
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

loadReferrals();

async function loadReferrals() {

  const snap =
    await getDocs(
      collection(
        db,
        "pendingReferrals"
      )
    );

  let html = "";

  let pending = 0;
  let active = 0;
  let total = 0;

  snap.forEach(item => {

    const data =
      item.data();

    total++;

    if (
      data.status === "pending"
    ) {
      pending++;
    }

    if (
      data.status === "active"
    ) {
      active++;
    }

    html += `

    <div class="section-card">

    <h3>
    Referral Record
    </h3>

    <p>
    Referrer:
    ${data.referrerId}
    </p>

    <p>
    Referred User:
    ${data.referredId}
    </p>

    <p>
    Status:
    ${data.status}
    </p>

    </div>

    `;

  });

  document.getElementById(
    "pendingReferrals"
  ).innerText =
    pending;

  document.getElementById(
    "activeReferrals"
  ).innerText =
    active;

  document.getElementById(
    "totalReferrals"
  ).innerText =
    total;

  document.getElementById(
    "referralsContainer"
  ).innerHTML =
    html;

    }
