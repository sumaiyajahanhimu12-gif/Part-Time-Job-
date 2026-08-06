import { db } from "./firebase.js";

import {
  collection,
  getDocs
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

loadUsers();

async function loadUsers() {

  const snap =
    await getDocs(
      collection(db, "users")
    );

  let html = "";

  let totalUsers = 0;

  snap.forEach(user => {

    const data =
      user.data();

    totalUsers++;

    html += `

    <div class="section-card">

      <h3>
      👤 ${data.firstName || "User"}
      </h3>

      <p>
      Telegram ID:
      ${data.telegramId || "-"}
      </p>

      <p>
      Coins:
      ${data.coin || 0}
      </p>

      <p>
      Status:
      ${data.status || "inactive"}
      </p>

      <p>
      Username:
      ${data.username ? "@" + data.username : "-"}
      </p>

      ${
        data.facebookLink
        ?
        `
        <a
          href="${data.facebookLink}"
          target="_blank"
        >
          🔗 Facebook Profile
        </a>
        `
        :
        "<p>Facebook Not Added</p>"
      }

    </div>

    `;

  });

  document.getElementById(
    "usersContainer"
  ).innerHTML =
    html ||
    `
    <div class="section-card">
      No Users Found
    </div>
    `;

  const totalUsersElement =
    document.getElementById(
      "totalUsers"
    );

  if (totalUsersElement) {

    totalUsersElement.innerText =
      totalUsers;

  }

               }
