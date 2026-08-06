import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
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

async function loadWithdraw() {
  const userRef = doc(db, "users", String(user.id));
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    location.href = "index.html";
    return;
  }

  const data = userSnap.data();
  await updateDoc(userRef, { lastActive: serverTimestamp() });

  // Settings (auto-created in app.js as settings/main)
  const settingsSnap = await getDoc(doc(db, "settings", "main"));
  const settings = settingsSnap.exists() ? settingsSnap.data() : {
    withdrawEnabled: false,
    minWithdraw: 500,
    requiredActiveReferrals: 15
  };

  const minWithdraw = settings.minWithdraw || 500;
  const requiredRefs = settings.requiredActiveReferrals || 15;
  const withdrawEnabled = settings.withdrawEnabled === true;

  // Check pending withdraw
  const pendingQ = query(
    collection(db, "withdraws"),
    where("userId", "==", String(user.id)),
    where("status", "==", "pending")
  );
  const pendingSnap = await getDocs(pendingQ);
  const hasPending = !pendingSnap.empty;

  // History
  const histQ = query(
    collection(db, "withdraws"),
    where("userId", "==", String(user.id))
  );
  const histSnap = await getDocs(histQ);
  let historyHtml = "";
  histSnap.forEach(item => {
    const w = item.data();
    let badge = `<span class="badge badge-pending">Pending</span>`;
    if (w.status === "approved") badge = `<span class="badge badge-active">Approved</span>`;
    if (w.status === "rejected") badge = `<span class="badge badge-inactive">Rejected</span>`;

    const date = w.createdAt?.toDate
      ? w.createdAt.toDate().toLocaleDateString("en-GB")
      : "—";

    historyHtml += `
      <div class="task-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div style="font-weight:700;font-size:18px;">💰 ${Number(w.coin).toLocaleString()}</div>
          ${badge}
        </div>
        <div style="font-size:13px;color:var(--muted);">
          ${w.paymentMethod || "—"} • ${w.paymentNumber || "—"}<br>
          ${date}
        </div>
      </div>
    `;
  });

  // Requirements status
  const canWithdraw =
    withdrawEnabled &&
    data.status === "Active" &&
    (data.coin || 0) >= minWithdraw &&
    (data.activeReferrals || 0) >= requiredRefs &&
    !hasPending &&
    data.paymentMethod &&
    data.paymentNumber;

  let reqHtml = `
    <div style="display:flex;flex-direction:column;gap:8px;font-size:13px;">
      <div style="display:flex;justify-content:space-between;">
        <span>Withdraw System</span>
        <span style="color:${withdrawEnabled ? 'var(--success)' : 'var(--danger)'}">
          ${withdrawEnabled ? '✅ ON' : '❌ OFF'}
        </span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span>Account Status</span>
        <span style="color:${data.status === 'Active' ? 'var(--success)' : 'var(--warning)'}">
          ${data.status === 'Active' ? '✅ Active' : '⚠️ ' + (data.status || 'Pending')}
        </span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span>Minimum Coins (${minWithdraw})</span>
        <span style="color:${(data.coin || 0) >= minWithdraw ? 'var(--success)' : 'var(--danger)'}">
          ${(data.coin || 0) >= minWithdraw ? '✅' : '❌'} ${Number(data.coin || 0).toLocaleString()}
        </span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span>Active Referrals (${requiredRefs})</span>
        <span style="color:${(data.activeReferrals || 0) >= requiredRefs ? 'var(--success)' : 'var(--danger)'}">
          ${(data.activeReferrals || 0) >= requiredRefs ? '✅' : '❌'} ${data.activeReferrals || 0}
        </span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span>No Pending Request</span>
        <span style="color:${!hasPending ? 'var(--success)' : 'var(--danger)'}">
          ${!hasPending ? '✅' : '❌ Pending exists'}
        </span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span>Payment Info</span>
        <span style="color:${data.paymentMethod && data.paymentNumber ? 'var(--success)' : 'var(--danger)'}">
          ${data.paymentMethod && data.paymentNumber ? '✅ Saved' : '❌ Not set'}
        </span>
      </div>
    </div>
  `;

  document.getElementById("app").innerHTML = `
    <div class="page">
      <div class="hero-card">
        <div class="coin-display" style="margin:0;">
          <span class="coin-label">Available Balance</span>
          <div class="coin-amount">💰 ${Number(data.coin || 0).toLocaleString()}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">📋 Withdraw Requirements</div>
        ${reqHtml}
      </div>

      ${canWithdraw ? `
        <div class="card">
          <div class="card-header">💸 Request Withdraw</div>
          <p style="font-size:13px;color:var(--muted);margin-bottom:12px;">
            Payment: <b>${data.paymentMethod}</b> • ${data.paymentNumber}
          </p>
          <p style="font-size:13px;color:var(--muted);margin-bottom:14px;">
            You will request <b style="color:var(--success)">${Number(data.coin).toLocaleString()}</b> coins
          </p>
          <button class="btn-primary" id="withdrawBtn">Request Full Withdraw</button>
        </div>
      ` : `
        <div class="card notice-card">
          <div class="card-header">⚠️ Cannot Withdraw Yet</div>
          <p>Complete all requirements above. ${!data.paymentMethod ? 'Set payment info in Profile first.' : ''}</p>
          ${!data.paymentMethod || !data.paymentNumber ? `
            <button class="btn-primary" onclick="location.href='profile.html'">Go to Profile</button>
          ` : ""}
        </div>
      `}

      <div class="section-title">📜 Withdraw History</div>
      <div id="history">
        ${historyHtml || `
          <div class="card" style="text-align:center;color:var(--muted);">
            No withdraw history yet
          </div>
        `}
      </div>
    </div>
  `;

  const btn = document.getElementById("withdrawBtn");
  if (btn) {
    btn.onclick = async () => {
      if (!canWithdraw) return;

      btn.disabled = true;
      btn.innerText = "Submitting...";

      try {
        // Double check pending
        const check = await getDocs(pendingQ);
        if (!check.empty) {
          tg.showAlert("You already have a pending request");
          loadWithdraw();
          return;
        }

        await addDoc(collection(db, "withdraws"), {
          userId: String(user.id),
          username: data.username || "",
          firstName: data.firstName || "",
          coin: data.coin || 0,
          paymentMethod: data.paymentMethod,
          paymentNumber: data.paymentNumber,
          facebookLink: data.facebookLink || "",
          status: "pending",
          createdAt: serverTimestamp()
        });

        tg.showAlert("Withdraw request submitted successfully!");
        loadWithdraw();
      } catch (e) {
        console.error(e);
        tg.showAlert("Error: " + e.message);
        btn.disabled = false;
        btn.innerText = "Request Full Withdraw";
      }
    };
  }
}

loadWithdraw().catch(err => {
  console.error(err);
  document.getElementById("app").innerHTML = `
    <div class="loader-content">
      <h2>Error</h2>
      <p class="error-text">${err.message}</p>
    </div>
  `;
});
