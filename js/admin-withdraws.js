import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  doc,
  updateDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

loadWithdraws();

async function loadWithdraws() {

  const snap =
    await getDocs(
      collection(db, "withdraws")
    );

  let html = "";

  let pending = 0;
  let approved = 0;
  let rejected = 0;

  snap.forEach(item => {

    const data =
      item.data();

    if (data.status === "pending")
      pending++;

    if (data.status === "approved")
      approved++;

    if (data.status === "rejected")
      rejected++;

    html += `

    <div class="section-card">

    <h3>
    💰 ${data.coin} Coins
    </h3>

    <p>
    Telegram ID:
    ${data.telegramId}
    </p>

    <p>
    Payment Number:
    ${data.paymentNumber}
    </p>

    <p>
    Status:
    ${data.status}
    </p>

    <p>

    <a
    href="${data.facebookLink || "#"}"
    target="_blank"
    >

    🔗 Facebook Profile

    </a>

    </p>

    <button
    onclick="approveWithdraw('${item.id}')"
    >
    ✅ Approve
    </button>

    <br><br>

    <button
    onclick="rejectWithdraw('${item.id}')"
    style="background:#ef4444;"
    >
    ❌ Reject
    </button>

    </div>

    `;

  });

  document.getElementById(
    "withdrawsContainer"
  ).innerHTML = html;

  document.getElementById(
    "pendingCount"
  ).innerText = pending;

  document.getElementById(
    "approvedCount"
  ).innerText = approved;

  document.getElementById(
    "rejectedCount"
  ).innerText = rejected;

}

window.approveWithdraw =
async function(id) {

  await updateDoc(
    doc(db, "withdraws", id),
    {
      status: "approved"
    }
  );

  alert("Withdraw Approved");

  location.reload();

};

window.rejectWithdraw =
async function(id) {

  await updateDoc(
    doc(db, "withdraws", id),
    {
      status: "rejected"
    }
  );

  alert("Withdraw Rejected");

  location.reload();

};
