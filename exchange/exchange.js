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

// --- GLOBALS ---
const username = (localStorage.getItem("playerName") || "Player").toLowerCase();
const container = document.getElementById("exchange-container");
const GAME_PATH = "exchange-game";
localStorage.setItem("userPoints", "0"); // prevent cheating

let questionsData = [];

// --- LOAD QUESTIONS JSON ---
async function loadQuestions() {
  const res = await fetch("../files/exchange.json");
  const data = await res.json();
  questionsData = data.questions;
}

// --- INITIALIZE USER GAME FOLDER ---
async function initGameFolder() {
  const userRef = db.ref(`${GAME_PATH}/${username}`);
  const snap = await userRef.get();

  if (!snap.exists()) {
    await userRef.set({
      timestamp: null,
      currentIndex: 0,
      correctAnswers: 0
    });
  }
}

// --- CHECK IF GAME FINISHED FOR BOTH USERS ---
async function evaluateGameIfFinished() {
  const gameSummaryRef = db.ref(`${GAME_PATH}/gameSummary`);
  const summarySnap = await gameSummaryRef.get();

  // If summary already exists → redirect based on winner
  if (summarySnap.exists()) {
    const { winner } = summarySnap.val();
    localStorage.setItem("currentGame", "exchange");
    localStorage.setItem("userPoints", winner === username ? "10" : "0");

    if (winner === username) {
      window.location.href = "../result/result.html";
    } else {
      window.location.href = "../result/result.html";
    }
    return true;
  }

  // Otherwise check both players
  const martinaSnap = await db.ref(`${GAME_PATH}/martina`).get();
  const renatoSnap = await db.ref(`${GAME_PATH}/renato`).get();

  if (!martinaSnap.exists() || !renatoSnap.exists()) return false;

  const M = martinaSnap.val();
  const R = renatoSnap.val();

  const lastIndex = questionsData.length - 1;

  if (M.currentIndex > lastIndex && R.currentIndex > lastIndex) {
    let winner = null;

    if (M.correctAnswers > R.correctAnswers) winner = "martina";
    else if (R.correctAnswers > M.correctAnswers) winner = "renato";
    else {
      // tie → timestamp
      winner = (M.timestamp < R.timestamp) ? "martina" : "renato";
    }

    await gameSummaryRef.set({
      winner,
      maxPoints: winner === "martina" ? M.correctAnswers : R.correctAnswers
    });

    localStorage.setItem("currentGame", "exchange");
    localStorage.setItem("userPoints", winner === username ? "10" : "0");

    window.location.href = "../result/result.html";
    return true;
  }

  return false;
}

// --- RENDER CURRENT QUESTION ---
async function renderQuestion() {
  const userRef = db.ref(`${GAME_PATH}/${username}`);
  const userData = (await userRef.get()).val();
  const index = userData.currentIndex;
  const q = questionsData[index];

  container.innerHTML = ""; // clear

  // Title
  const title = document.createElement("h2");
  title.textContent = "Cultural exchange 🗺️";
  container.appendChild(title);

  // Description
  const desc = document.createElement("p");
  desc.className = "description";
  desc.innerHTML = `How well do you know your partner's language?<br><br>
  Find out through this little quiz. The first to finish the quiz with the most correct answers, wins 10 points!`;
  container.appendChild(desc);

  // language for placeholder
  const answerBlock = q.answers[username];
  const languageName = answerBlock.language;

  // Replace %@ placeholder
  const questionTitle = document.createElement("h2");
  questionTitle.textContent = q.question.replace("%@", languageName);
  container.appendChild(questionTitle);

  // Answers
  let selected = null;

  answerBlock.options.forEach(opt => {
    const tile = document.createElement("label");
    tile.className = "answer-tile";
    tile.innerHTML = `
      <input type="radio" name="answer" value="${opt}">
      <span>${opt}</span>
    `;

    tile.addEventListener("click", () => {
      document.querySelectorAll(".answer-tile").forEach(t => t.classList.remove("checked"));
      tile.classList.add("checked");
      tile.querySelector("input").checked = true;
      selected = opt;
    });

    container.appendChild(tile);
  });

  // Button
  const btn = document.createElement("button");
  btn.textContent = (index === questionsData.length - 1) ? "Submit" : "Continue >";

  // (You said you'll tell me later what happens on submit — so I only attach stub)
  btn.addEventListener("click", () => {
    if (!selected) return alert("Please choose an answer!");
    console.log("Submit clicked");
  });

  container.appendChild(btn);
}

// --- MAIN FLOW ---
(async function main() {
  await loadQuestions();
  await initGameFolder();

  const finished = await evaluateGameIfFinished();
  if (!finished) {
    await renderQuestion();
  }
})();
