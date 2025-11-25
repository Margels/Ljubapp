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
localStorage.setItem("currentGame", "present-game");

const container = document.getElementById("present-container");

const gameRef = db.ref("present-game");
let currentIndex = 0;
let gameData = {};

// --- LOAD GAME DATA ---
async function loadGame() {
  const snap = await gameRef.get();
  if (!snap.exists()) {
    console.error("No present-game data found in Firebase!");
    container.innerHTML = `<p>Game data missing.</p>`;
    return;
  }

  gameData = snap.val();
  currentIndex = snap.val().currentIndex ?? 0;

  renderPage();
}

// --- RENDER PAGE ---
function renderPage() {
  const entry = gameData[currentIndex];

  if (!entry) {
    container.innerHTML = `<p>Invalid question index.</p>`;
    return;
  }

  container.innerHTML = `
    <h2>Guess the present 🎁</h2>
  `;

  if (username === "Renato") {
    // --- RENDER RENATO VIEW ---
    container.innerHTML += `
      <p>
        Can you guess which present is which?<br><br>
        Here's a little hint: pick the present that you think corresponds to this description!
      </p>

      <h3>${entry.hint || "No hint available"}</h3>
    `;
  } else if (username === "Martina") {
    // --- RENDER MARTINA VIEW ---
    container.innerHTML += `
      <p>
        Don't let your partner see this!<br>
        Here's the answer to their question — make sure they guess it right...
      </p>

      <h3>${entry.answer}</h3>

      <p class="footer-text">Did Renato guess the present?</p>

      <button id="btn-correct">He guessed it!</button>
      <button id="btn-wrong" class="secondary-btn">He didn't guess...</button>
    `;

    // Buttons don't do anything yet — will add logic later
    document.getElementById("btn-correct").addEventListener("click", () => {
      alert("Button tapped — action to be added later.");
    });

    document.getElementById("btn-wrong").addEventListener("click", () => {
      alert("Button tapped — action to be added later.");
    });
  }
}

// --- MAIN ---
loadGame();
