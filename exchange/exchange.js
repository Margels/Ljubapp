// --- CONFIGURE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAhNkyI7aG6snk2hPergYyGdftBBN9M1h0",
  authDomain: "ljubapp.firebaseapp.com",
  databaseURL: "https://ljubapp-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ljubapp",
  storageBucket: "ljubapp.firebasedestorage.app",
  messagingSenderId: "922849938749",
  appId: "1:922849938749:web:59c06714af609e478d0954"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const username = localStorage.getItem("playerName") || "Player";
localStorage.setItem("userPoints", 0); // reset possible cheating
localStorage.setItem("currentGame", "cultural-exchange");

const container = document.getElementById("exchange-container");

// --- LOAD QUESTIONS JSON FROM FIREBASE ---
async function loadQuestions() {
  const snap = await db.ref("exchange-game/questions").get();
  return snap.val();
}

// --- INITIALIZE USER GAME FOLDER IF NEEDED ---
async function initializeUserGame() {
  const userRef = db.ref(`exchange-game/${username}`);
  const userSnap = await userRef.get();

  if (!userSnap.exists()) {
    await userRef.set({
      timestamp: null,
      currentIndex: 0,
      correctAnswers: 0
    });
  }
}

// --- CHECK GAME SUMMARY REDIRECT ---
async function checkGameSummary() {
  const summarySnap = await db.ref("exchange-game/gameSummary").get();

  if (!summarySnap.exists()) return false;

  const summary = summarySnap.val();

  if (summary.winner === username) {
    localStorage.setItem("userPoints", summary.maxPoints);
    window.location.href = "../result/result.html";
  } else {
    localStorage.setItem("userPoints", 0);
    window.location.href = "../result/result.html";
  }

  return true;
}

// --- CHECK IF BOTH USERS FINISHED AND DETERMINE WINNER ---
async function checkEndGame() {
  const martinaRef = db.ref("exchange-game/Martina");
  const renatoRef = db.ref("exchange-game/Renato");

  const [mSnap, rSnap] = await Promise.all([martinaRef.get(), renatoRef.get()]);

  if (!mSnap.exists() || !rSnap.exists()) return;

  const M = mSnap.val();
  const R = rSnap.val();

  const Mdone = M.currentIndex > 14;
  const Rdone = R.currentIndex > 14;

  if (!Mdone || !Rdone) return; // both not finished yet

  // --- Determine winner ---
  let winner = null;
  let maxPoints = null;

  if (M.correctAnswers > R.correctAnswers) {
    winner = "Martina";
    maxPoints = M.correctAnswers;
  } else if (R.correctAnswers > M.correctAnswers) {
    winner = "Renato";
    maxPoints = R.correctAnswers;
  } else {
    // tie → check timestamps
    winner = (new Date(M.timestamp) < new Date(R.timestamp)) ? "Martina" : "Renato";
    maxPoints = winner === "Martina" ? M.correctAnswers : R.correctAnswers;
  }

  // Save summary only once
  await db.ref("exchange-game/gameSummary").set({ winner, maxPoints });

  localStorage.setItem("userPoints", winner === username ? maxPoints : 0);
  window.location.href = "../result/result.html";
}



// --- RENDER INTRO TEXT (UI COMES LATER) ---
function renderIntro() {
  container.innerHTML = `
    <h2>Cultural exchange 🗺️</h2>
    <p>
      How well do you know your partner's language?<br><br>
      Find out through this little quiz. The first to finish the quiz with the most correct answers, wins 10 points!
    </p>
  `;
}

// --- MAIN LOGIC EXECUTION ---
(async function start() {
  renderIntro();

  await initializeUserGame();

  const summaryHandled = await checkGameSummary();
  if (summaryHandled) return;

  await checkEndGame();

  // No redirect means: continue to question rendering later
})();
