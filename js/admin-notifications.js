import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const publishBtn =
document.getElementById(
  "publishNoticeBtn"
);

if (publishBtn) {

  publishBtn.addEventListener(
    "click",
    publishNotice
  );

}

loadNotices();

async function publishNotice() {

  const title =
    document.getElementById(
      "noticeTitle"
    ).value.trim();

  const message =
    document.getElementById(
      "noticeMessage"
    ).value.trim();

  if (!title || !message) {

    alert(
      "Title & Message Required"
    );

    return;

  }

  publishBtn.disabled = true;

  await addDoc(
    collection(
      db,
      "notifications"
    ),
    {
      title,
      message,
      status: "published",
      createdAt:
        serverTimestamp()
    }
  );

  alert(
    "Notice Published Successfully"
  );

  location.reload();

}

async function loadNotices() {

  const q =
    query(
      collection(
        db,
        "notifications"
      ),
      orderBy(
        "createdAt",
        "desc"
      )
    );

  const snap =
    await getDocs(q);

  let html = "";

  let totalNotices = 0;

  snap.forEach(item => {

    totalNotices++;

    const data =
      item.data();

    let dateText =
      "Unknown Date";

    if (data.createdAt) {

      dateText =
        data.createdAt
        .toDate()
        .toLocaleString();

    }

    html += `

      <div class="section-card">

        <h3>
          📢 ${data.title}
        </h3>

        <p>
          ${data.message}
        </p>

        <small>
          🕒 ${dateText}
        </small>

        <br><br>

        <button
          onclick="deleteNotice('${item.id}')"
          style="
            background:#dc2626;
            color:white;
          "
        >
          🗑 Delete
        </button>

      </div>

    `;

  });

  document.getElementById(
    "noticeList"
  ).innerHTML =
    html ||
    `
    <div class="section-card">

      <h3>
      📭 Empty
      </h3>

      <p>
      No Notices Found
      </p>

    </div>
    `;

  document.title =
    `Notifications (${totalNotices})`;

}

window.deleteNotice =
async function(id) {

  const ok =
    confirm(
      "Delete This Notice?"
    );

  if (!ok)
    return;

  await deleteDoc(
    doc(
      db,
      "notifications",
      id
    )
  );

  location.reload();

};
