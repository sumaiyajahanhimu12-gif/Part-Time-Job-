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
      collection(db,"users")
    );

  let html = "";

  snap.forEach(user => {

    const data =
      user.data();

    html += `

    <div class="task-card">

    <h3>
    ${data.firstName || ""}
    </h3>

    <p>
    Telegram ID:
    ${data.telegramId}
    </p>

    <p>
    Coins:
    ${data.coin || 0}
    </p>

    <p>
    Status:
    ${data.status}
    </p>

    <a
    href="${data.facebookLink || "#"}"
    target="_blank"
    >
    Facebook Profile
    </a>

    </div>

    `;

  });

  document.getElementById(
    "usersContainer"
  ).innerHTML = html;

}
