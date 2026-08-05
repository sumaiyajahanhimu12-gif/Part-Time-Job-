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

  await addDoc(
    collection(
      db,
      "notifications"
    ),
    {
      title,
      message,
      createdAt:
        serverTimestamp()
    }
  );

  alert(
    "Notice Published"
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

  snap.forEach(item => {

    const data =
      item.data();

    let dateText = "";

    if (data.createdAt) {

      dateText =
        data.createdAt
        .toDate()
        .toLocaleString();

    }

    html += `

      <div class="section-card">

        <h3>
          ${data.title}
        </h3>

        <p>
          ${data.message}
        </p>

        <small>
          ${dateText}
        </small>

        <br><br>

        <button
          onclick="deleteNotice('${item.id}')"
          style="background:#dc2626;"
        >
          Delete
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
      No Notices Found
    </div>
    `;

}

window.deleteNotice =
async function(id) {

  const ok =
    confirm(
      "Delete Notice?"
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
