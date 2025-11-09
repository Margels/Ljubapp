// --- LOAD LOCAL DATA ---
const username = localStorage.getItem("playerName") || "Player";
const userPoints = parseInt(localStorage.getItem("userPoints") || "0");
const claimedPrize = JSON.parse(localStorage.getItem("claimedPrize") || "null");

// --- DOM ELEMENTS ---
const profileImage = document.getElementById("profileImage");
const profileName = document.getElementById("profileName");
const profilePoints = document.getElementById("profilePoints");

// --- SET CONTENT ---
profileName.textContent = username;
profilePoints.textContent = `🎯 Total points: ${userPoints}`;

// --- LOAD PROFILE IMAGE ---
const lowerName = username.toLowerCase();
const imagePath = `../assets/${lowerName}.png`;
profileImage.src = imagePath;

// --- OPTIONAL: show claimed prize ---
if (claimedPrize) {
  const prizeDiv = document.createElement("div");
  prizeDiv.innerHTML = `
    <p style="margin-top: 1rem; font-size: 1rem; opacity: 0.85;">
      Last prize claimed: ${claimedPrize.emoji} ${claimedPrize.title} (${claimedPrize.points} pts)
    </p>
  `;
  document.querySelector(".profile-container").appendChild(prizeDiv);
}
