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
document.getElementById("publishNoticeBtn");

if (publishBtn) {

  publishBtn.addEventListener(
    "click",
    publishNotice
  );

}

async function publishNotice() {

  const title =
    document.getElementById("noticeTitle")
    ?.value.trim();

  const message =
    document.getElementById("noticeMessage")
    ?.value.trim();

  if (!title || !message) {

    alert("Title & Message Required");
    return;

  }

  publishBtn.disabled = true;

  try {

    await addDoc(
      collection(db, "notifications"),
      {
        title,
        message,
        status: "published",
        createdAt: serverTimestamp()
      }
    );

    alert("Notice Published Successfully");

    document.getElementById(
      "noticeTitle"
    ).value = "";

    document.getElementById(
      "noticeMessage"
    ).value = "";

    await loadNotices();

  }

  catch(error) {

    console.error(error);

    alert(
      "Failed To Publish Notice"
    );

  }

  finally {

    publishBtn.disabled = false;

  }

}

async function loadNotices() {

  try {

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
        📢 ${data.title || "Notice"}
        </h3>

        <p>
        ${data.message || ""}
        </p>

        <small>
        🕒 ${dateText}
        </small>

        <br><br>

        <button
        onclick="deleteNotice('${item.id}')"
        style="background:#ef4444;"
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
        No Notice Found
      </div>
      `;

  }

  catch(error) {

    console.error(error);

    document.getElementById(
      "noticeList"
    ).innerHTML =
      `
      <div class="section-card">
        Failed To Load Notices
      </div>
      `;

  }

}

window.deleteNotice =
async function(id) {

  const ok =
    confirm(
      "Delete Notice?"
    );

  if (!ok)
    return;

  try {

    await deleteDoc(
      doc(
        db,
        "notifications",
        id
      )
    );

    await loadNotices();

  }

  catch(error) {

    console.error(error);

    alert(
      "Failed To Delete Notice"
    );

  }

};
