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

  let allHtml = "";

  let trendingHtml = "";

  let daily = 0;
  let weekly = 0;
  let permanent = 0;

  snap.forEach(task => {

    const data = task.data();

    if (data.taskType === "daily")
      daily++;

    if (data.taskType === "weekly")
      weekly++;

    if (data.taskType === "permanent")
      permanent++;

    const card = `

      <div class="task-card">

      <h3>${data.name}</h3>

      <p>💰 ${data.coin} Coins</p>

      <p>📂 ${data.taskType}</p>

      <button
      onclick="window.open('${data.link}','_blank')"
      >
      Open Task
      </button>

      </div>

    `;

    allHtml += card;

    if (data.trending) {
      trendingHtml += card;
    }

  });

  document.getElementById(
    "tasksContainer"
  ).innerHTML = allHtml;

  document.getElementById(
    "trendingTasks"
  ).innerHTML =
    trendingHtml || "No Trending Tasks";

  document.getElementById(
    "dailyCount"
  ).innerText = daily;

  document.getElementById(
    "weeklyCount"
  ).innerText = weekly;

  document.getElementById(
    "permanentCount"
  ).innerText = permanent;

}
