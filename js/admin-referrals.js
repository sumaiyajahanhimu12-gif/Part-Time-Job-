import { db } from "../js/firebase.js";

import {
  collection,
  getDocs,
  updateDoc,
  doc
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

  let pending = 0;
  let active = 0;
  let total = 0;

  let html = "";

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
          Referral
        </h3>

        <p>
          👤 Referrer:
          ${data.referrerId}
        </p>

        <p>
          👥 Referred:
          ${data.referredId}
        </p>

        <p>
          📌 Status:
          ${data.status}
        </p>

        ${
          data.status === "pending"
          ?
          `
          <button
            onclick="approveReferral('${item.id}')"
          >
            ✅ Approve
          </button>
          `
          :
          ""
        }

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
    html ||
    `
    <div class="section-card">
      No Referrals Found
    </div>
    `;

}

window.approveReferral =
async function(id) {

  const ok =
    confirm(
      "Approve Referral?"
    );

  if (!ok)
    return;

  await updateDoc(
    doc(
      db,
      "pendingReferrals",
      id
    ),
    {
      status: "active"
    }
  );

  location.reload();

};
