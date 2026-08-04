import { db } from "./firebase.js";

const tg = window.Telegram?.WebApp;

if (tg) {
    tg.expand();

    console.log("Telegram User:", tg.initDataUnsafe?.user);

    document.querySelector(".loading").innerHTML = `
        <h1>💼 Part Time Job</h1>
        <p>Welcome ${tg.initDataUnsafe?.user?.first_name || "User"}</p>
    `;
} else {
    document.querySelector(".loading").innerHTML = `
        <h1>💼 Part Time Job</h1>
        <p>Open inside Telegram</p>
    `;
}
