import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  increment
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
      💰 ${data.coin || 0} Coins
      </h3>

      <p>
      🆔 Telegram ID:
      ${data.userId || data.telegramId || "-"}
      </p>

      <p>
      📱 Payment Number:
      ${data.paymentNumber || "-"}
      </p>

      <p>
      📌 Status:
      ${data.status || "pending"}
      </p>

      <p>

      <a
      href="${data.facebookLink || "#"}"
      target="_blank"
      >

      🔗 Facebook Profile

      </a>

      </p>

      ${
        data.status === "pending"
        ?
        `
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
        `
        :
        `
        <button disabled>
        ${data.status.toUpperCase()}
        </button>
        `
      }

    </div>

    `;

  });

  document.getElementById(
    "withdrawsContainer"
  ).innerHTML =
    html ||
    `
    <div class="section-card">
      No Withdraw Requests Found
    </div>
    `;

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

  const ok =
    confirm(
      "Approve Withdraw?"
    );

  if (!ok)
    return;

  const withdrawRef =
    doc(
      db,
      "withdraws",
      id
    );

  const withdrawSnap =
    await getDoc(
      withdrawRef
    );

  if (!withdrawSnap.exists())
    return;

  const withdrawData =
    withdrawSnap.data();

  await updateDoc(
    withdrawRef,
    {
      status: "approved"
    }
  );

  if (withdrawData.userId) {

    try {

      await updateDoc(
        doc(
          db,
          "users",
          withdrawData.userId
        ),
        {
          coin: 0,
          totalWithdraw:
            increment(
              withdrawData.coin || 0
            )
        }
      );

    }

    catch(error) {

      console.log(error);

    }

  }

  alert(
    "Withdraw Approved"
  );

  location.reload();

};

window.rejectWithdraw =
async function(id) {

  const ok =
    confirm(
      "Reject Withdraw?"
    );

  if (!ok)
    return;

  await updateDoc(
    doc(
      db,
      "withdraws",
      id
    ),
    {
      status: "rejected"
    }
  );

  alert(
    "Withdraw Rejected"
  );

  location.reload();

};
