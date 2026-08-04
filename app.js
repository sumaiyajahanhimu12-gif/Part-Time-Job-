import { db } from "./firebase.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const tg = window.Telegram?.WebApp;

if (tg) {
  tg.expand();

  const user = tg.initDataUnsafe?.user;

  document.querySelector(".loading").innerHTML = `
    <h1>💼 Part Time Job</h1>
    <p>Welcome ${user?.first_name || "User"}</p>
  `;

  if (user) {
    saveUser(user);
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
      createdAt: serverTimestamp()
    });

    console.log("New User Created");

  } else {

    console.log("User Already Exists");

  }

        }
