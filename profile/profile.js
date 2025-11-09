// --- LOAD USER DATA ---
const username = localStorage.getItem("playerName") || "Player";
const userPoints = parseInt(localStorage.getItem("userPoints") || "0");

// Get previously claimed prizes (could be a list)
const claimedPrizes = JSON.parse(localStorage.getItem("claimedPrizes") || "[]");

// --- DOM ELEMENTS ---
const profileImage = document.getElementById("profileImage");
const profileName = document.getElementById("profileName");
const totalPoints = document.getElementById("totalPoints");
const prizeHistory = document.getElementById("prizeHistory");

// --- SET PROFILE INFO ---
profileImage.src = `../assets/${username.toLowerCase()}.png`;
profileName.textContent = username;
totalPoints.textContent = `🎯 Total points: ${userPoints}`;

// --- LOAD PRIZE HISTORY ---
if (claimedPrizes.length === 0) {
  prizeHistory.innerHTML = `<p style="opacity:0.7;">No prizes collected yet.</p>`;
} else {
  // Sort by most recent first
  claimedPrizes.sort((a, b) => new Date(b.claimedAt) - new Date(a.claimedAt));

  claimedPrizes.forEach(prize => {
    const tile = document.createElement("div");
    tile.className = "prize-tile";

    // Calculate expiry if "duration" exists
    let isExpired = false;
    let expiryLabel = "";

    if (prize.duration && prize.claimedAt) {
      const claimedTime = new Date(prize.claimedAt);
      const expiryTime = new Date(claimedTime.getTime() + prize.duration * 3600000); // hours → ms
      const now = new Date();

      if (now > expiryTime) {
        isExpired = true;
        expiryLabel = `<span class="expired-label">Expired</span>`;
        tile.classList.add("expired");
      }
    }

    tile.innerHTML = `
      <div>
        <div class="prize-title">${prize.emoji} ${prize.title}</div>
        <div class="prize-meta">${prize.points} pts</div>
      </div>
      ${expiryLabel}
    `;

    prizeHistory.appendChild(tile);
  });
}
