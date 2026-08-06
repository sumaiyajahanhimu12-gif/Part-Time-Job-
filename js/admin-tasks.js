import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

loadTasks();

async function loadTasks() {

  const snap =
    await getDocs(
      collection(
        db,
        "tasks"
      )
    );

  let html = "";

  let totalTasks = 0;
  let totalCompleted = 0;

  snap.forEach(task => {

    totalTasks++;

    const data =
      task.data();

    totalCompleted +=
      data.completedCount || 0;

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
      ⏱ Timer:
      ${data.timer || 0}
      Seconds
      </p>

      <p>
      🎯 Limit:
      ${data.limit || 0}
      </p>

      <p>
      📊 Completed:
      ${data.completedCount || 0}
      </p>

      <p>
      📌 Status:
      ${data.status || "published"}
      </p>

      <button
      onclick="toggleTrending('${task.id}', ${data.trending ? false : true})"
      >

      ${data.trending ? "🔥 Remove Trending" : "🔥 Make Trending"}

      </button>

      <br><br>

      <button
      onclick="deleteTask('${task.id}')"
      style="background:#dc2626;"
      >
      🗑 Delete Task
      </button>

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

}

window.deleteTask =
async function(taskId) {

  const ok =
    confirm(
      "Delete This Task?"
    );

  if (!ok)
    return;

  await deleteDoc(
    doc(
      db,
      "tasks",
      taskId
    )
  );

  alert(
    "Task Deleted"
  );

  location.reload();

};

window.toggleTrending =
async function(taskId, value) {

  await updateDoc(
    doc(
      db,
      "tasks",
      taskId
    ),
    {
      trending: value
    }
  );

  location.reload();

};
