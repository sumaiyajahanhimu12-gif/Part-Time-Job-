import { db } from "./firebase.js";

import {
  doc,
  getDoc,
  setDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

loadSettings();

async function loadSettings() {

  const settingsRef =
    doc(db, "settings", "system");

  const snap =
    await getDoc(settingsRef);

  if (!snap.exists()) {
    return;
  }

  const data =
    snap.data();

  document.getElementById(
    "withdrawEnabled"
  ).value =
    String(data.withdrawEnabled);

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

document
.getElementById(
  "saveSettingsBtn"
)
.addEventListener(
  "click",
  saveSettings
);

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
      taskCooldown
    }
  );

  alert(
    "Settings Saved Successfully"
  );

}
