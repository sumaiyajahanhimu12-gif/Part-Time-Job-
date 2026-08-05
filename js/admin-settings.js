import { db } from "../js/firebase.js";

import {
  doc,
  getDoc,
  setDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

loadSettings();

document
.getElementById(
  "saveSettingsBtn"
)
.addEventListener(
  "click",
  saveSettings
);

async function loadSettings() {

  const settingsRef =
    doc(
      db,
      "settings",
      "system"
    );

  const settingsSnap =
    await getDoc(
      settingsRef
    );

  if (
    !settingsSnap.exists()
  ) {
    return;
  }

  const data =
    settingsSnap.data();

  document.getElementById(
    "withdrawEnabled"
  ).value =
    String(
      data.withdrawEnabled ?? true
    );

  document.getElementById(
    "minWithdraw"
  ).value =
    data.minWithdraw || 50000;

  document.getElementById(
    "referralPercent"
  ).value =
    data.referralPercent || 5;

  document.getElementById(
    "taskCooldown"
  ).value =
    data.taskCooldown || 24;

}

async function saveSettings() {

  const withdrawEnabled =
    document.getElementById(
      "withdrawEnabled"
    ).value === "true";

  const minWithdraw =
    Number(
      document.getElementById(
        "minWithdraw"
      ).value
    );

  const referralPercent =
    Number(
      document.getElementById(
        "referralPercent"
      ).value
    );

  const taskCooldown =
    Number(
      document.getElementById(
        "taskCooldown"
      ).value
    );

  await setDoc(
    doc(
      db,
      "settings",
      "system"
    ),
    {
      withdrawEnabled,
      minWithdraw,
      referralPercent,
      taskCooldown,
      updatedAt:
        new Date()
    },
    {
      merge: true
    }
  );

  alert(
    "Settings Saved Successfully"
  );

}
