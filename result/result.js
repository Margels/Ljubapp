// --- CONFIGURE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAhNkyI7aG6snk2hPergYyGdftBBN9M1h0",
  authDomain: "ljubapp.firebaseapp.com",
  databaseURL: "https://ljubapp-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ljubapp",
  storageBucket: "ljubapp.firebasestorage.app",
  messagingSenderId: "922849938749",
  appId: "1:922849938749:web:59c06714af609e478d0954"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --- LOAD LOCAL DATA ---
const username = localStorage.getItem("playerName") || "Player";
const userPoints = parseInt(localStorage.getItem("userPoints") || "0");

// --- DOM ELEMENTS ---
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");
const pointsDisplay = document.getElementById("pointsDisplay");
const claimSection = document.getElementById("claimSection");
const prizeGrid = document.getElementById("prizeGrid");
const profileBtn = document.getElementById("profileBtn");

// --- LOAD WINNER INFO ---
db.ref("gameSummary").once("value").then(snapshot => {
  const summary = snapshot.val();
  const winner = summary?.winner || "Nobody";
  const maxPoints = summary?.maxPoints || 0;

  if (winner === username) {
    resultTitle.textContent = "Congratulations, you won 🎉";
  } else {
    resultTitle.textContent = "Better luck next time 🥀";
  }

  resultText.textContent = `${winner} won with ${maxPoints} points!`;
  pointsDisplay.textContent = `🎯 Total: ${userPoints}`;

  if (winner === username) {
    claimSection.classList.remove("hidden");
    loadPrizes();
  } else {
    profileBtn.classList.remove("hidden");
  }
});

// --- LOAD PRIZES ---
function loadPrizes() {
  fetch("../files/prizes.json")
    .then(res => res.json())
    .then(prizes => {
      prizes.forEach(prize => {
        const card = document.createElement("div");
        card.className = "prize-card";
        card.innerHTML = `
          <div class="prize-emoji">${prize.emoji}</div>
          <div class="prize-title">${prize.title}</div>
          <div class="prize-points">${prize.points} pts</div>
        `;

        card.addEventListener("click", () => {
          document.querySelectorAll(".prize-card").forEach(c => c.classList.remove("selected"));
          card.classList.add("selected");
          // TODO: handle claiming logic later (save to DB or localStorage)
        });

        prizeGrid.appendChild(card);
      });
    });
}

profileBtn.addEventListener("click", () => {
  window.location.href = "../profile/profile.html"; // or wherever your profile page will be
});
