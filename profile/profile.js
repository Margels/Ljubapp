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
fetch("../prizes.json")
  .then(res => res.json())
  .then(prizes => renderPrizeHistory(prizes));

function renderPrizeHistory(prizes) {
  prizeHistory.innerHTML = "";

  prizes.forEach(prize => {
    const tile = document.createElement("div");
    tile.className = "prize-tile";

    const claimButton = document.createElement("button");
    claimButton.className = "claim-btn";
    claimButton.textContent = "Claim";

    // Check if already claimed and load state
    const stored = JSON.parse(localStorage.getItem(`claimed_${prize.title}`) || "null");
    let state = stored ? stored : null;

    if (state) {
      const expiry = getExpiry(state);
      const now = new Date();

      if (expiry && now > expiry) {
        tile.classList.add("expired");
        claimButton.textContent = "Expired";
        claimButton.disabled = true;
      } else {
        updateClaimButton(claimButton, prize, state);
        startCountdown(claimButton, prize, state);
      }
    }

    claimButton.addEventListener("click", () => {
      if (!state) {
        const now = new Date();
        state = {
          claimedAt: now.toISOString(),
          usesLeft: prize.duration.uses || null
        };
        localStorage.setItem(`claimed_${prize.title}`, JSON.stringify(state));
        updateClaimButton(claimButton, prize, state);
        startCountdown(claimButton, prize, state);
      } else if (prize.duration.uses) {
        if (state.usesLeft > 1) {
          alert(`You have ${state.usesLeft - 1} uses left after this.`);
          state.usesLeft--;
          localStorage.setItem(`claimed_${prize.title}`, JSON.stringify(state));
          updateClaimButton(claimButton, prize, state);
        } else {
          state.usesLeft = 0;
          tile.classList.add("expired");
          claimButton.textContent = "Expired";
          claimButton.disabled = true;
          localStorage.setItem(`claimed_${prize.title}`, JSON.stringify(state));
        }
      }
    });

    tile.innerHTML = `
      <div>
        <div class="prize-title">${prize.emoji} ${prize.title}</div>
        <div class="prize-meta">${prize.points} pts</div>
      </div>
    `;

    tile.appendChild(claimButton);
    prizeHistory.appendChild(tile);
  });
}

// --- UTILITIES ---
function getExpiry(state) {
  const { claimedAt, duration } = state;
  const claimedTime = new Date(claimedAt);

  if (!duration) return null;

  const now = new Date();

  if (duration.days) {
    const expiry = new Date(claimedTime);
    expiry.setHours(23, 59, 59, 999);
    return expiry;
  }

  let expiry = new Date(claimedTime);
  if (duration.hours) expiry.setHours(expiry.getHours() + duration.hours);
  if (duration.minutes) expiry.setMinutes(expiry.getMinutes() + duration.minutes);
  return expiry;
}

function updateClaimButton(btn, prize, state) {
  const duration = prize.duration;
  if (duration.days) {
    btn.textContent = "Ongoing";
    btn.disabled = true;
  } else if (duration.hours || duration.minutes) {
    btn.textContent = "Calculating...";
  } else if (duration.uses) {
    btn.textContent = `Use (${state.usesLeft} left)`;
  }
}

function startCountdown(btn, prize, state) {
  if (!prize.duration.hours && !prize.duration.minutes) return;

  const expiry = getExpiry({
    claimedAt: state.claimedAt,
    duration: prize.duration
  });

  const interval = setInterval(() => {
    const now = new Date();
    const diff = expiry - now;

    if (diff <= 0) {
      clearInterval(interval);
      btn.textContent = "Expired";
      btn.disabled = true;
      btn.closest(".prize-tile").classList.add("expired");
      return;
    }

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      btn.textContent = `${hours}h left`;
    } else {
      btn.textContent = `${minutes}m left`;
    }
  }, 1000 * 60);
}
