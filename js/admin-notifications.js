import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

loadNotices();

document
.getElementById(
  "publishNoticeBtn"
)
.addEventListener(
  "click",
  publishNotice
);

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

  const snap =
    await getDocs(
      collection(
        db,
        "notifications"
      )
    );

  let html = "";

  snap.forEach(item => {

    const data =
      item.data();

    html += `

    <div class="section-card">

    <h3>
    ${data.title}
    </h3>

    <p>
    ${data.message}
    </p>

    </div>

    `;

  });

  document.getElementById(
    "noticeList"
  ).innerHTML =
    html;

}
