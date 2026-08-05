import { db } from "./firebase.js";

import {
  collection,
  query,
  orderBy,
  getDocs
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

loadNotifications();

async function loadNotifications() {

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

  if (snap.empty) {

    html = `

    <div class="card">

    <h3>
    No Notifications
    </h3>

    </div>

    `;

  } else {

    snap.forEach(item => {

      const data =
        item.data();

      html += `

      <div class="notice-card">

      <h3>
      ${data.title || "Notice"}
      </h3>

      <p>
      ${data.message || ""}
      </p>

      </div>

      `;

    });

  }

  document.getElementById(
    "notificationsContainer"
  ).innerHTML = html;

}
