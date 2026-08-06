import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  increment,
  addDoc,
  serverTimestamp,
  query,
  where
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const tg = window.Telegram?.WebApp;

if (!tg || !tg.initDataUnsafe?.user) {

  location.href = "index.html";

}

const user = tg.initDataUnsafe.user;

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

  for (const taskDoc of snap.docs) {

    const data =
      taskDoc.data();

    if (data.status !== "published")
      continue;

    if (
      data.limit > 0 &&
      (data.completedCount || 0) >= data.limit
    ) {
      continue;
    }

    if (data.taskType === "daily")
      daily++;

    if (data.taskType === "weekly")
      weekly++;

    if (data.taskType === "permanent")
      permanent++;

    const completed =
      await isTaskCompleted(taskDoc.id);

    const card = `

      <div class="task-card">

        <h3>${data.name}</h3>

        <p>💰 ${data.coin} Coins</p>

        <p>📂 ${data.taskType}</p>

        <p>⏱ ${data.timer || 20} Seconds</p>

        <p>📊 ${data.completedCount || 0}/${data.limit || "∞"}</p>

        <button
          onclick="window.open('${data.link}','_blank')"
        >
          Open Task
        </button>

        ${
          completed
          ?
          `<button disabled>
            ✅ Completed
          </button>`
          :
          `<button
             id="claim-${taskDoc.id}"
             onclick="completeTask(
               '${taskDoc.id}',
               ${data.coin},
               ${data.timer || 20}
             )"
           >
             Claim Reward
           </button>`
        }

      </div>

    `;

    allHtml += card;

    if (data.trending) {

      trendingHtml += card;

    }

  }

  document.getElementById(
    "tasksContainer"
  ).innerHTML = allHtml;

  document.getElementById(
    "trendingTasks"
  ).innerHTML =
    trendingHtml ||
    "No Trending Tasks";

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

async function isTaskCompleted(taskId) {

  const q = query(
    collection(db, "taskClaims"),
    where("userId", "==", String(user.id)),
    where("taskId", "==", taskId)
  );

  const snap =
    await getDocs(q);

  return !snap.empty;

}

window.completeTask =
async function(taskId, coin, timer) {

  const already =
    await isTaskCompleted(taskId);

  if (already) {

    alert(
      "Task Already Completed"
    );

    return;

  }

  const btn =
    document.getElementById(
      `claim-${taskId}`
    );

  btn.disabled = true;

  let seconds = timer;

  btn.innerText =
    `Wait ${seconds}s`;

  const interval =
    setInterval(() => {

      seconds--;

      btn.innerText =
        `Wait ${seconds}s`;

      if (seconds <= 0) {

        clearInterval(interval);

      }

    }, 1000);

  setTimeout(async () => {

    await addDoc(
      collection(
        db,
        "taskClaims"
      ),
      {
        userId:
          String(user.id),

        taskId,

        coin,

        createdAt:
          serverTimestamp()
      }
    );

    await updateDoc(
      doc(
        db,
        "users",
        String(user.id)
      ),
      {
        coin:
          increment(coin),

        totalEarned:
          increment(coin)
      }
    );

    await updateDoc(
      doc(
        db,
        "tasks",
        taskId
      ),
      {
        completedCount:
          increment(1)
      }
    );

    alert(
      `Reward Added: ${coin} Coins`
    );

    location.reload();

  }, timer * 1000);

};
