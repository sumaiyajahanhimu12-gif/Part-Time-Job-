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
      collection(db,"tasks")
    );

  let html = "";

  snap.forEach(task => {

    const data =
      task.data();

    html += `

    <div class="task-card">

    <h3>
    ${data.name}
    </h3>

    <p>
    Reward:
    ${data.coin}
    </p>

    <p>
    Type:
    ${data.taskType}
    </p>

    <p>
    Completed:
    ${data.completedCount || 0}
    </p>

    </div>

    `;

  });

  document.getElementById(
    "tasksContainer"
  ).innerHTML = html;

}
