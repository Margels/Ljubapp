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

// --- DOM ELEMENTS ---
const profileImage = document.getElementById("profileImage");
const profileName = document.getElementById("profileName");
const totalPointsEl = document.getElementById("totalPoints");
const prizeHistory = document.getElementById("prizeHistory");
const emptyMessage = document.getElementById("emptyMessage");

// --- LOAD USER INFO ---
const username = localStorage.getItem("playerName") || "Player";
profileName.textContent = username;
profileImage.src = `../assets/${username.toLowerCase()}.png`;

// --- LOAD TOTAL POINTS FROM FIREBASE ---
db.ref(`results/${username}/points`).once("value").then(snapshot => {
  const points = snapshot.val() || 0;
  totalPointsEl.textContent = points;
});

// --- LOAD PRIZES HISTORY FROM FIREBASE ---
db.ref(`claimedPrizes/${username}`).once("value").then(snapshot => {
  const claimed = snapshot.val();
  if (!claimed) {
    emptyMessage.classList.remove("hidden");
    return;
  }

  Object.values(claimed).reverse().forEach(prize => {
    const tile = document.createElement("div");
    tile.className = "prize-tile";

    const info = document.createElement("div");
    info.className = "prize-info";
    info.innerHTML = `
      <div class="prize-title">${prize.emoji} ${prize.title}</div>
      <div class="prize-points">${prize.points} pts</div>
    `;

    const rightSide = document.createElement("div");
    const btn = document.createElement("button");
    btn.className = "claim-btn";
    btn.textContent = "Claim";
    btn.disabled = true; // non-selectable history tiles

    const status = document.createElement("span");
    status.className = "status-text";
    status.textContent = prize.status || "";

    rightSide.appendChild(btn);
    rightSide.appendChild(status);

    tile.appendChild(info);
    tile.appendChild(rightSide);
    prizeHistory.appendChild(tile);
  });
});
