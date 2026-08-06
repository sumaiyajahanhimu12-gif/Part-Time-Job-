import { db } from "../js/firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

loadNotices();

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

        <button
        onclick="deleteNotice('${item.id}')"
        style="background:#ef4444;"
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
      No Notice Found
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
