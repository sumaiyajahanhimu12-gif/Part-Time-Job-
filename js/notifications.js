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

    let totalNotice = 0;

    snap.forEach(item => {

      totalNotice++;

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

      <div class="notice-card">

        <h3>
          📢 ${data.title || "Notice"}
        </h3>

        <p>
          ${data.message || ""}
        </p>

        <small>
          🕒 ${dateText}
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

      <h3>
      📭 Empty
      </h3>

      <p>
      No Notifications Available
      </p>

      </div>
      `;

    document.title =
      `(${totalNotice}) Notifications`;

  }

  catch (error) {

    console.error(error);

    document.getElementById(
      "notificationsContainer"
    ).innerHTML =
      `
      <div class="card">

      <h3>
      ❌ Error
      </h3>

      <p>
      Failed To Load Notifications
      </p>

      </div>
      `;

  }

}
