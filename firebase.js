import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDHQG9kMxa1tXFhz-kE9Gv-E9fmSMeQZJI",
  authDomain: "part-time-job-ddd61.firebaseapp.com",
  projectId: "part-time-job-ddd61",
  storageBucket: "part-time-job-ddd61.firebasestorage.app",
  messagingSenderId: "577415240920",
  appId: "1:577415240920:web:33db0ce1688a7a5b590bad",
  measurementId: "G-P25V5XGS26"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
