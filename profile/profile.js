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
const username = localStorage.getItem("playerName") || "Player";
const profileImage = document.getElementById("profileImage");
const profileName = document.getElementById("profileName");
const totalPoints = document.getElementById("totalPoints");
const prizeHistory = document.getElementById("prizeHistory");

// --- SET PROFILE INFO ---
profileImage.src = `../assets/${username.toLowerCase()}.png`;
profileName.textContent = username;

// --- LOAD USER DATA FROM FIREBASE ---
db.ref(`users/${username}`).once("value").then(snapshot => {
  const userData = snapshot.val();
  const points = userData?.points || 0;
  totalPoints.textContent = `🎯 Total points: ${points}`;

  const prizes = userData?.prizesCollected || {};
  const prizeArray = Object.values(prizes || {});

  if (prizeArray.length === 0) {
    prizeHistory.innerHTML = `<p style="opacity:0.7;">No prizes collected yet.</p>`;
    return;
  }

  // Sort newest first
  prizeArray.sort((a, b) => new Date(b.claimedAt) - new Date(a.claimedAt));
  prizeArray.forEach(p => renderPrizeTile(p));
});

// --- RENDER PRIZE TILE ---
function renderPrizeTile(prize) {
  const tile = document.createElement("div");
  tile.className = "prize-tile";

  let rightContent = "";
  let isExpired = false;
  const claimedAt = prize.claimedAt ? new Date(prize.claimedAt) : null;

  // Expiry check
  if (prize.duration && claimedAt) {
    const { minutes, hours, days } = prize.duration;
    let expiry;

    if (minutes) expiry = new Date(claimedAt.getTime() + minutes * 60000);
    else if (hours) expiry = new Date(claimedAt.getTime() + hours * 3600000);
    else if (days) expiry = new Date(claimedAt.getTime() + days * 86400000);

    if (expiry && new Date() > expiry) {
      isExpired = true;
    } else if (expiry) {
      const diffMs = expiry - new Date();
      const diffH = Math.floor(diffMs / 3600000);
      const diffM = Math.floor((diffMs % 3600000) / 60000);
      rightContent = diffH > 0 ? `${diffH}h left` : `${diffM}m left`;
    }
  }

  if (isExpired) {
    rightContent = "Expired";
    tile.style.border = "2px solid #d6496a";
    tile.querySelector = "expired-label";
  }

  tile.innerHTML = `
    <div>
      <div class="prize-title">${prize.emoji} ${prize.title}</div>
      <div class="prize-meta">${prize.points} pts</div>
    </div>
    <div class="tile-right">${rightContent}</div>
  `;

  prizeHistory.appendChild(tile);
}
