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
let userPoints = parseInt(localStorage.getItem("userPoints") || "0");

// --- DOM ELEMENTS ---
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");
const pointsDisplay = document.getElementById("pointsDisplay");
const claimSection = document.getElementById("claimSection");
const prizeGrid = document.getElementById("prizeGrid");
const profileBtn = document.getElementById("profileBtn");
const confirmPrizeBtn = document.getElementById("confirmPrizeBtn");

let selectedPrize = null;

// --- LOAD WINNER INFO ---
db.ref("gameSummary").once("value").then(async snapshot => {
  const summary = snapshot.val();
  const winner = summary?.winner || "Nobody";
  const maxPoints = summary?.maxPoints || 0;

  if (winner === username) {
    // --- WINNER ---
    resultTitle.textContent = "Congratulations, you won 🎉";
    claimSection.classList.remove("hidden");
    loadPrizes();

    // Save latest points to Firebase (ensure user exists)
    await db.ref(`users/${username}`).update({ points: userPoints });

  } else {
    // --- LOSER ---
    resultTitle.textContent = "Better luck next time 🥀";
    profileBtn.classList.remove("hidden");

    // Ensure loser also has points stored in Firebase
    await db.ref(`users/${username}`).update({ points: userPoints });
  }

  resultText.textContent = `${winner} won with ${maxPoints} points!`;
  pointsDisplay.textContent = `🎯 Total: ${userPoints}`;
});

// --- LOAD PRIZES ---
function loadPrizes() {
  fetch("../files/prizes.json")
    .then(res => res.json())
    .then(prizes => {
      prizes.forEach(prize => {
        const card = document.createElement("div");
        card.className = "prize-card";
        card.dataset.emoji = prize.emoji;
        card.dataset.title = prize.title;
        card.dataset.points = prize.points;

        const canAfford = userPoints >= prize.points;

        card.innerHTML = `
          <div class="prize-emoji">${prize.emoji}</div>
          <div class="prize-title">${prize.title}</div>
          <div class="prize-points">${prize.points} pts</div>
        `;

        if (!canAfford) {
          card.classList.add("disabled");
          card.style.opacity = "0.4";
          card.style.cursor = "not-allowed";
        } else {
          card.addEventListener("click", () => {
            document.querySelectorAll(".prize-card").forEach(c => c.classList.remove("selected"));
            card.classList.add("selected");
            selectedPrize = prize;
            confirmPrizeBtn.classList.remove("hidden");
          });
        }

        prizeGrid.appendChild(card);
      });
    });
}

// --- CONFIRM PRIZE SELECTION ---
confirmPrizeBtn.addEventListener("click", async () => {
  if (!selectedPrize) return;

  // Deduct points
  userPoints -= selectedPrize.points;
  localStorage.setItem("userPoints", userPoints);

  // Prepare prize data (⚠️ unclaimed — no claimedAt yet)
  const prizeData = {
    title: selectedPrize.title,
    emoji: selectedPrize.emoji,
    points: selectedPrize.points,
    duration: selectedPrize.duration || {},
    status: "unclaimed"
  };

  const userRef = db.ref(`users/${username}`);

  // Save updated points and add prize to user history
  await userRef.update({ points: userPoints });
  await userRef.child("prizesCollected").push(prizeData);

  // Redirect to profile
  window.location.href = "../profile/profile.html";
});

// --- PROFILE BUTTON ---
profileBtn.addEventListener("click", async () => {
  // Make sure even losers get their current points saved
  await db.ref(`users/${username}`).update({ points: userPoints });
  window.location.href = "../profile/profile.html";
});
