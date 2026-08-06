import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  orderBy
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

loadNotifications();

async function loadNotifications() {

  try {

    const q =
      query(
        collection(db, "notifications"),
        orderBy("createdAt", "desc")
      );

    const snap =
      await getDocs(q);

    let html = "";

    snap.forEach(item => {

      const data =
        item.data();

      let date =
        "Unknown";

      if (data.createdAt) {
        date =
          data.createdAt
          .toDate()
          .toLocaleString();
      }

      html += `

      <div class="card">

        <h3>
        📢 ${data.title}
        </h3>

        <p>
        ${data.message}
        </p>

        <small>
        ${date}
        </small>

      </div>

      `;
    });

    document.getElementById(
      "notificationsContainer"
    ).innerHTML =
      html ||
      `
      <div class="card">
      No Notifications
      </div>
      `;

  }

  catch {

    document.getElementById(
      "notificationsContainer"
    ).innerHTML =
      `
      <div class="card">
      Failed To Load Notifications
      </div>
      `;
  }
}
