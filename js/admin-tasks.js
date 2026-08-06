import { db } from "./firebase.js";

import {
  collection,
  getDocs
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

loadTasks();

async function loadTasks() {

  const snap =
    await getDocs(
      collection(db, "tasks")
    );

  let html = "";

  let totalTasks = 0;
  let totalCompleted = 0;

  snap.forEach(task => {

    const data =
      task.data();

    totalTasks++;

    totalCompleted +=
      (data.completedCount || 0);

    html += `

    <div class="section-card">

      <h3>
      📋 ${data.name || "Task"}
      </h3>

      <p>
      💰 Reward:
      ${data.coin || 0}
      Coins
      </p>

      <p>
      📂 Type:
      ${data.taskType || "-"}
      </p>

      <p>
      📊 Completed:
      ${data.completedCount || 0}
      </p>

      <p>
      📌 Status:
      ${data.status || "-"}
      </p>

    </div>

    `;

  });

  document.getElementById(
    "tasksContainer"
  ).innerHTML =
    html ||
    `
    <div class="section-card">
      No Tasks Found
    </div>
    `;

  document.getElementById(
    "totalTasks"
  ).innerText =
    totalTasks;

  document.getElementById(
    "totalCompleted"
  ).innerText =
    totalCompleted;

}
