// --- LOAD USER DATA ---
const username = localStorage.getItem("playerName") || "Player";
const userPoints = parseInt(localStorage.getItem("userPoints") || "0");

// --- DOM ELEMENTS ---
const profileImage = document.getElementById("profileImage");
const profileName = document.getElementById("profileName");
const totalPoints = document.getElementById("totalPoints");
const prizeHistory = document.getElementById("prizeHistory");

// --- SET PROFILE INFO ---
profileImage.src = `../assets/${username.toLowerCase()}.png`;
profileName.textContent = username;
totalPoints.textContent = `🎯 Total points: ${userPoints}`;

// --- LOAD PRIZES ---
fetch("../files/prizes.json")
  .then(res => res.json())
  .then(prizes => {
    const claimedPrizes = JSON.parse(localStorage.getItem("claimedPrizes") || "[]");

    // If none claimed, show message
    if (claimedPrizes.length === 0) {
      prizeHistory.innerHTML = `<p style="opacity:0.7;">No prizes collected yet.</p>`;
      return;
    }

    // Sort by most recent first
    claimedPrizes.sort((a, b) => new Date(b.claimedAt) - new Date(a.claimedAt));

    claimedPrizes.forEach(prize => {
      const tile = document.createElement("div");
      tile.className = "prize-tile";

      const duration = prize.duration || {};
      const claimedAt = prize.claimedAt ? new Date(prize.claimedAt) : null;

      let rightLabel = "";
      let isExpired = false;

      // ----- TIME-BASED EXPIRY -----
      if (claimedAt && (duration.minutes || duration.hours || duration.days)) {
        const now = new Date();
        let expiry;

        if (duration.minutes) {
          expiry = new Date(claimedAt.getTime() + duration.minutes * 60000);
        } else if (duration.hours) {
          expiry = new Date(claimedAt.getTime() + duration.hours * 3600000);
        } else if (duration.days) {
          if (duration.days === 1) {
            // Until midnight
            expiry = new Date(claimedAt);
            expiry.setHours(23, 59, 59, 999);
          } else {
            expiry = new Date(claimedAt.getTime() + duration.days * 24 * 3600000);
          }
        }

        if (now > expiry) {
          isExpired = true;
        } else {
          const diffMs = expiry - now;
          const diffH = Math.floor(diffMs / 3600000);
          const diffM = Math.floor((diffMs % 3600000) / 60000);

          if (duration.days) rightLabel = "Ongoing";
          else if (diffH > 0) rightLabel = `${diffH}h left`;
          else rightLabel = `${diffM}m left`;
        }
      }

      // ----- USE-BASED EXPIRY -----
      if (duration.uses) {
        const usesLeft = prize.usesLeft ?? duration.uses;
        if (usesLeft <= 0) {
          isExpired = true;
        } else {
          rightLabel = `${usesLeft} use${usesLeft > 1 ? "s" : ""} left`;
        }
      }

      // Expired override
      if (isExpired) {
        rightLabel = "Expired";
        tile.style.opacity = "0.5";
      }

      tile.innerHTML = `
        <div>
          <div class="prize-title">${prize.emoji} ${prize.title}</div>
          <div class="prize-meta">${prize.points} pts</div>
        </div>
        <div class="tile-right">${rightLabel}</div>
      `;

      prizeHistory.appendChild(tile);
    });
  });
