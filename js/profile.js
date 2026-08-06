import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const tg = window.Telegram?.WebApp;

if (!tg || !tg.initDataUnsafe?.user) {
  location.href = "index.html";
  throw new Error("Telegram Required");
}

tg.ready();
tg.expand();
tg.setHeaderColor("#050B1F");
tg.setBackgroundColor("#050B1F");

const user = tg.initDataUnsafe.user;

async function loadProfile() {
  const userRef = doc(db, "users", String(user.id));
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    document.getElementById("app").innerHTML = `
      <div class="loader-content">
        <h2>User not found</h2>
      </div>
    `;
    return;
  }

  const data = userSnap.data();

  // Update lastActive
  await updateDoc(userRef, { lastActive: serverTimestamp() });

  let statusBadge = "";
  if (data.status === "Pending") {
    statusBadge = `<span class="badge badge-pending">Pending</span>`;
  } else if (data.status === "Active") {
    statusBadge = `<span class="badge badge-active">Active</span>`;
  } else {
    statusBadge = `<span class="badge badge-inactive">${data.status || "Inactive"}</span>`;
  }

  const joinDate = data.createdAt?.toDate
    ? data.createdAt.toDate().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
    : "—";

  // Facebook section
  let facebookSection = "";
  if (!data.facebookLink) {
    facebookSection = `
      <div class="card notice-card">
        <div class="card-header">⚠️ Activate Your Account</div>
        <p>Submit your Facebook profile link to change status from <b>Pending</b> to <b>Active</b> and unlock all features.</p>
        <input type="url" id="fbInput" placeholder="https://facebook.com/your.profile" />
        <button class="btn-primary" id="saveFbBtn">Submit Facebook Link</button>
      </div>
    `;
  } else {
    facebookSection = `
      <div class="card">
        <div class="card-header">📘 
  const paymentSection = `
    <div class="card">
      <div class="card-header">💳 Payment Details</div>
      <label style="font-size:13px;color:var(--muted);">Payment Method</label>
      <select id="payMethod">
        <option value="">Select Method</option>
        <option value="Bkash" ${data.paymentMethod === "Bkash" ? "selected" : ""}>Bkash</option>
        <option value="Nagad" ${data.paymentMethod === "Nagad" ? "selected" : ""}>Nagad</option>
      </select>
      <label style="font-size:13px;color:var(--muted);margin-top:12px;display:block;">Payment Number</label>
      <input type="text" id="payNumber" placeholder="01XXXXXXXXX" value="${data.paymentNumber || ""}" />
      <button class="btn-primary" id="savePayBtn" style="margin-top:14px;">Save Payment Info</button>
    </div>
  `;

  document.getElementById("app").innerHTML = `
    <div class="page">
      <div class="hero-card">
        <div class="hero-top">
          <div class="avatar-wrap">
            <img src="${data.photoUrl || 'images/default-avatar.png'}" class="avatar" alt="avatar"
              onerror="this.src='images/default-avatar.png'">
          </div>
          <div class="hero-info">
            <h2>${data.firstName || "User"} ${data.lastName || ""}</h2>
            <p>@${data.username || "unknown"}</p>
            ${statusBadge}
          </div>
        </div>
        <div class="coin-display">
          <span class="coin-label">Current Balance</span>
          <div class="coin-amount">💰 ${Number(data.coin || 0).toLocaleString()}</div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-value">${Number(data.totalEarned || 0).toLocaleString()}</div>
          <div class="stat-label">Total Earned</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-value">${data.activeReferrals || 0}</div>
          <div class="stat-label">Active Refs</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔗</div>
          <div class="stat-value">${data.referrals || 0}</div>
          <div class="stat-label">Total Refs</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💸</div>
          <div class="stat-value">${Number(data.totalWithdraw || 0).toLocaleString()}</div>
          <div class="stat-label">Withdrawn</div>
        </div>
      </div>

      ${facebookSection}

      ${paymentSection}

      <div class="card">
        <div class="card-header">📋 Account Info</div>
        <div style="display:flex;flex-direction:column;gap:10px;font-size:14px;">
          <div style="display:flex;justify-content:space-between;">
            <span style="color:var(--muted);">Telegram ID</span>
            <span>${data.telegramId}</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:var(--muted);">Username</span>
            <span>@${data.username || "—"}</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:var(--muted);">Status</span>
            <span>${data.status || "—"}</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:var(--muted);">Joined</span>
            <span>${joinDate}</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Event listeners
  const saveFbBtn = document.getElementById("saveFbBtn");
  if (saveFbBtn) {
    saveFbBtn.onclick = async () => {
      const link = document.getElementById("fbInput").value.trim();
      if (!link || !link.includes("facebook.com") && !link.includes("fb.com")) {
        tg.showAlert("Please enter a valid Facebook profile link");
        return;
      }
      saveFbBtn.disabled = true;
      saveFbBtn.innerText = "Saving...";
      try {
        await updateDoc(userRef, {
          facebookLink: link,
          status: "Active",
          lastActive: serverTimestamp()
        });
        tg.showAlert("Account activated successfully!");
        loadProfile();
      } catch (e) {
        tg.showAlert("Error: " + e.message);
        saveFbBtn.disabled = false;
        saveFbBtn.innerText = "Submit Facebook Link";
      }
    };
  }

  const changeFbBtn = document.getElementById("changeFbBtn");
  if (changeFbBtn) {
    changeFbBtn.onclick = () => {
      const card = changeFbBtn.closest(".card");
      card.innerHTML = `
        <div class="card-header">📘 Update Facebook Link</div>
        <input type="url" id="fbInput" placeholder="https://facebook.com/your.profile" value="${data.facebookLink}" />
        <button class="btn-primary" id="saveFbBtn">Update Link</button>
      `;
      document.getElementById("saveFbBtn").onclick = async () => {
        const link = document.getElementById("fbInput").value.trim();
        if (!link) return tg.showAlert("Link required");
        await updateDoc(userRef, { facebookLink: link, lastActive: serverTimestamp() });
        tg.showAlert("Updated!");
        loadProfile();
      };
    };
  }

  document.getElementById("savePayBtn").onclick = async () => {
    const method = document.getElementById("payMethod").value;
    const number = document.getElementById("payNumber").value.trim();
    if (!method || !number) {
      return tg.showAlert("Please select method and enter number");
    }
    if (!/^01[0-9]{9}$/.test(number)) {
      return tg.showAlert("Enter valid 11-digit BD number (01XXXXXXXXX)");
    }
    const btn = document.getElementById("savePayBtn");
    btn.disabled = true;
    btn.innerText = "Saving...";
    try {
      await updateDoc(userRef, {
        paymentMethod: method,
        paymentNumber: number,
        lastActive: serverTimestamp()
      });
      tg.showAlert("Payment info saved!");
      loadProfile();
    } catch (e) {
      tg.showAlert("Error: " + e.message);
      btn.disabled = false;
      btn.innerText = "Save Payment Info";
    }
  };
}

loadProfile().catch(err => {
  console.error(err);
  document.getElementById("app").innerHTML = `
    <div class="loader-content">
      <h2>Error loading profile</h2>
      <p class="error-text">${err.message}</p>
    </div>
  `;
});
