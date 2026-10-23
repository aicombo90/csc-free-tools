// Real like buttons for Dafadar Online Seva (blog articles + homepage love button).
// Uses the existing Ludo Firebase project (free tier) — counts are shared across all visitors.
// Firestore collection: siteLikes / doc = like id / field: count
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, runTransaction } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDLVrEDayBl28NXpiet5rfxQTyJM_R6l5I",
  authDomain: "ungoogly-gecko-6n56p.firebaseapp.com",
  projectId: "ungoogly-gecko-6n56p",
  storageBucket: "ungoogly-gecko-6n56p.firebasestorage.app",
  messagingSenderId: "701589307327",
  appId: "1:701589307327:web:476e47f7e483c622dcab0a"
};
// Named Firestore database used by this project (same as the Ludo game).
const DB_ID = "ai-studio-portaloflegendsm-ec7b0b01-745c-44b7-b660-e0ff4f8d2089";

let db = null;
try {
  const app = initializeApp(firebaseConfig, "siteLikesApp");
  db = getFirestore(app, DB_ID);
} catch (e) {
  console.warn("[site-likes] Firebase unavailable:", e);
}

function fmt(n) {
  n = Number(n) || 0;
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function likedKey(id) { return "dos_liked_" + id; }

async function loadCounts() {
  document.querySelectorAll("[data-like-id]").forEach(async (btn) => {
    const id = btn.getAttribute("data-like-id");
    const countEl = btn.querySelector(".like-count");
    if (localStorage.getItem(likedKey(id))) btn.classList.add("is-liked");
    if (!db) return;
    try {
      const snap = await getDoc(doc(db, "siteLikes", id));
      if (countEl) countEl.textContent = fmt(snap.exists() ? (snap.data().count || 0) : 0);
    } catch (e) { /* rules not set yet or offline — stays 0 */ }
  });
}

async function sendLike(btn) {
  const id = btn.getAttribute("data-like-id");
  if (!id || localStorage.getItem(likedKey(id))) return;
  const countEl = btn.querySelector(".like-count");
  // optimistic UI
  btn.classList.add("is-liked");
  btn.classList.add("like-pop");
  setTimeout(() => btn.classList.remove("like-pop"), 600);
  const prev = countEl ? countEl.textContent : "0";
  if (countEl) countEl.textContent = fmt((parseFloat(prev) || 0) + 1);
  localStorage.setItem(likedKey(id), "1");
  if (!db) return;
  try {
    // Read-then-write in a transaction with a LITERAL count.
    // The published Firestore rules validate (new count == old count + 1);
    // that comparison only works with literal numbers — FieldValue.increment()
    // arrives as a transform sentinel that the rules reject, so we never use it.
    await runTransaction(db, async (tx) => {
      const ref = doc(db, "siteLikes", id);
      const snap = await tx.get(ref);
      const cur = snap.exists() ? (Number(snap.data().count) || 0) : 0;
      tx.set(ref, { count: cur + 1 }, { merge: true });
    });
    const snap = await getDoc(doc(db, "siteLikes", id));
    if (countEl && snap.exists()) countEl.textContent = fmt(snap.data().count || 0);
  } catch (e) {
    // write failed (e.g. rules not pasted yet) — revert optimistic UI
    console.warn("[site-likes] like failed:", e);
    btn.classList.remove("is-liked");
    localStorage.removeItem(likedKey(id));
    if (countEl) countEl.textContent = prev;
  }
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-like-id]");
  if (btn) { e.preventDefault(); sendLike(btn); }
});

document.addEventListener("DOMContentLoaded", loadCounts);
