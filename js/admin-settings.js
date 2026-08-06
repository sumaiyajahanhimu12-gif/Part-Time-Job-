import { db } from "../js/firebase.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

loadSettings();

const saveBtn =
document.getElementById(
  "saveSettingsBtn"
);

if (saveBtn) {

  saveBtn.addEventListener(
    "click",
    saveSettings
  );

}

async function loadSettings() {

  try {

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

      document.getElementById(
        "withdrawEnabled"
      ).value = "true";

      document.getElementById(
        "minWithdraw"
      ).value = 50000;

      document.getElementById(
        "referralPercent"
      ).value = 5;

      document.getElementById(
        "taskCooldown"
      ).value = 24;

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

  catch(error) {

    console.error(error);

    alert(
      "Failed To Load Settings"
    );

  }

}

async function saveSettings() {

  try {

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

    if (
      minWithdraw < 0 ||
      referralPercent < 0 ||
      taskCooldown < 0
    ) {

      alert(
        "Invalid Settings Value"
      );

      return;

    }

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
          serverTimestamp()
      },
      {
        merge: true
      }
    );

    alert(
      "Settings Saved Successfully"
    );

  }

  catch(error) {

    console.error(error);

    alert(
      "Failed To Save Settings"
    );

  }

}
