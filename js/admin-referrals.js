import { db } from "../js/firebase.js";

import {
  collection,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  increment
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
          👥 Referral
        </h3>

        <p>
          🔹 Referrer:
          ${data.referrerId}
        </p>

        <p>
          🔹 Referred:
          ${data.referredId}
        </p>

        <p>
          📌 Status:
          ${
            data.status === "active"
            ? "✅ Active"
            : "⏳ Pending"
          }
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
          `
          <button
            disabled
          >
            Approved
          </button>
          `
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

      <h3>
      Empty
      </h3>

      <p>
      No Referrals Found
      </p>

    </div>
    `;

}

window.approveReferral =
async function(id) {

  const ok =
    confirm(
      "Approve This Referral?"
    );

  if (!ok)
    return;

  const referralRef =
    doc(
      db,
      "pendingReferrals",
      id
    );

  const referralSnap =
    await getDoc(
      referralRef
    );

  if (!referralSnap.exists())
    return;

  const referralData =
    referralSnap.data();

  await updateDoc(
    referralRef,
    {
      status: "active"
    }
  );

  const referrerRef =
    doc(
      db,
      "users",
      referralData.referrerId
    );

  try {

    await updateDoc(
      referrerRef,
      {
        referrals:
          increment(1),

        activeReferrals:
          increment(1)
      }
    );

  }

  catch(error) {

    console.log(error);

  }

  alert(
    "Referral Approved Successfully"
  );

  location.reload();

};
