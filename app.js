import { db } from "./firebase.js";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const tg = window.Telegram?.WebApp;

if (tg) {

  tg.expand();

  const user = tg.initDataUnsafe?.user;

  if (user) {
    console.log("Start Param:", tg.initDataUnsafe?.start_param);
alert("Start Param: " + (tg.initDataUnsafe?.start_param || "NONE"));
    
    await saveUser(user);
    await loadUser(user);
  }

} else {

  document.querySelector(".loading").innerHTML = `
    <h1>💼 Part Time Job</h1>
    <p>Open inside Telegram</p>
  `;

}

async function saveUser(user) {

  const userRef = doc(db, "users", String(user.id));
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {

    await setDoc(userRef, {
      telegramId: user.id,
      username: user.username || "",
      firstName: user.first_name || "",
      lastName: user.last_name || "",

      coin: 0,
      referrals: 0,
      activeReferrals: 0,

      status: "inactive",

      facebookLink: "",
      deviceId: "",
      activatedAt: null,

      createdAt: serverTimestamp()
    });

  }

}

async function loadUser(user) {

  const userRef = doc(db, "users", String(user.id));
  const userSnap = await getDoc(userRef);

  const data = userSnap.data();

  if (data.status === "inactive") {

    document.querySelector(".loading").innerHTML = `
      <h1>💼 Part Time Job</h1>

      <p>Welcome ${user.first_name}</p>

      <p>Status: ❌ Inactive</p>

      <input
        id="facebookLink"
        placeholder="Facebook Profile Link"
        style="padding:10px;width:90%;margin:10px;"
      >

      <button id="activateBtn">
        🚀 Activate Account
      </button>
    `;

    document
      .getElementById("activateBtn")
      .addEventListener("click", async () => {

        const facebookLink =
          document.getElementById("facebookLink").value;

        if (!facebookLink) {
          alert("Facebook Link Required");
          return;
        }

        await updateDoc(userRef, {
          facebookLink,
          status: "active",
          activatedAt: serverTimestamp()
        });

        alert("Account Activated");

        location.reload();

      });

  } else {

    document.querySelector(".loading").innerHTML = `
      <h1>💼 Part Time Job</h1>

      <p>✅ Welcome ${user.first_name}</p>

      <p>Account Active</p>

      <p>Coins: ${data.coin}</p>
    `;

  }

}
