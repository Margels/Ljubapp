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

    if (claimedPrizes.length === 0) {
      prizeHistory.innerHTML = `<p style="opacity:0.7;">No prizes collected yet.</p>`;
      return;
    }

    // Sort newest first
    claimedPrizes.sort((a, b) => new Date(b.claimedAt || 0) - new Date(a.claimedAt || 0));

    claimedPrizes.forEach(prize => renderPrizeTile(prize));
  });

// --- RENDER TILE FUNCTION ---
function renderPrizeTile(prize) {
  const tile = document.createElement("div");
  tile.className = "prize-tile";

  const duration = prize.duration || {};
  const claimedAt = prize.claimedAt ? new Date(prize.claimedAt) : null;

  let rightContent = "";
  let isExpired = false;

  // ----- EXPIRY CALCULATION -----
  if (claimedAt && (duration.minutes || duration.hours || duration.days)) {
    const now = new Date();
    let expiry;

    if (duration.minutes) {
      expiry = new Date(claimedAt.getTime() + duration.minutes * 60000);
    } else if (duration.hours) {
      expiry = new Date(claimedAt.getTime() + duration.hours * 3600000);
    } else if (duration.days) {
      if (duration.days === 1) {
        expiry = new Date(claimedAt);
        expiry.setHours(23, 59, 59, 999); // until midnight
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

      if (duration.days) rightContent = "Ongoing";
      else if (diffH > 0) rightContent = `${diffH}h left`;
      else rightContent = `${diffM}m left`;
    }
  }

  if (duration.uses) {
    const usesLeft = prize.usesLeft ?? duration.uses;
    if (usesLeft <= 0) {
      isExpired = true;
    } else {
      rightContent = `${usesLeft} use${usesLeft > 1 ? "s" : ""} left`;
    }
  }

  if (isExpired) {
    tile.style.opacity = "0.5";
    rightContent = "Expired";
  }

  // ----- TILE STRUCTURE -----
  tile.innerHTML = `
    <div>
      <div class="prize-title">${prize.emoji} ${prize.title}</div>
      <div class="prize-meta">${prize.points} pts</div>
    </div>
    <div class="tile-right">${rightContent}</div>
  `;

  // ----- CLAIM BUTTON -----
  if (!claimedAt && !isExpired) {
    const claimBtn = document.createElement("button");
    claimBtn.className = "claim-btn";
    claimBtn.textContent = "Claim";
    claimBtn.onclick = () => handleClaim(prize, tile, claimBtn);
    tile.appendChild(claimBtn);
  }

  prizeHistory.appendChild(tile);
}

// --- HANDLE CLAIM ---
function handleClaim(prize, tile, claimBtn) {
  claimBtn.disabled = true;
  tile.classList.add("claimed");

  const now = new Date();
  prize.claimedAt = now.toISOString();

  // For uses-based prizes
  if (prize.duration?.uses) {
    prize.usesLeft = prize.duration.uses - 1;

    if (prize.usesLeft > 0) {
      alert(`You now have ${prize.usesLeft} use${prize.usesLeft > 1 ? "s" : ""} left!`);
    } else {
      alert(`That was your last use of ${prize.title}.`);
    }
  }

  // Save updated prize info
  let claimedPrizes = JSON.parse(localStorage.getItem("claimedPrizes") || "[]");
  const index = claimedPrizes.findIndex(p => p.title === prize.title);
  if (index >= 0) claimedPrizes[index] = prize;
  else claimedPrizes.push(prize);
  localStorage.setItem("claimedPrizes", JSON.stringify(claimedPrizes));

  // Update display
  tile.querySelector(".tile-right").textContent =
    prize.duration?.uses
      ? `${prize.usesLeft ?? prize.duration.uses} use${
          (prize.usesLeft ?? prize.duration.uses) > 1 ? "s" : ""
        } left`
      : prize.duration?.days
      ? "Ongoing"
      : "0m left";

  claimBtn.remove();
}
