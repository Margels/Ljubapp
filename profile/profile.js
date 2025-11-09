document.addEventListener("DOMContentLoaded", async () => {
  const totalPoints = localStorage.getItem("totalPoints") || 0;
  document.getElementById("totalPoints").textContent = totalPoints;

  const profileName = localStorage.getItem("userName") || "Martina";
  document.getElementById("profileName").textContent = profileName;
  document.getElementById("profileImage").src = `../assets/${profileName.toLowerCase()}.png`;

  const prizes = await fetch("../data/prizes.json").then(res => res.json());
  renderPrizeHistory(prizes);
});

function renderPrizeHistory(prizes) {
  const container = document.getElementById("prizeHistory");
  container.innerHTML = "";

  prizes.forEach(prize => {
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

    const status = document.createElement("span");
    status.className = "status-text";

    btn.addEventListener("click", () => handleClaim(prize, btn, status, tile));

    rightSide.appendChild(btn);
    rightSide.appendChild(status);

    tile.appendChild(info);
    tile.appendChild(rightSide);
    container.appendChild(tile);
  });
}

function handleClaim(prize, btn, status, tile) {
  btn.classList.add("claimed");

  const duration = prize.duration;
  const now = new Date();

  if (duration.minutes || duration.hours) {
    const expiry = new Date(now.getTime() +
      (duration.minutes || 0) * 60000 +
      (duration.hours || 0) * 3600000
    );

    updateCountdown(status, expiry, tile);
    const interval = setInterval(() => {
      const timeLeft = expiry - new Date();
      if (timeLeft <= 0) {
        clearInterval(interval);
        tile.classList.add("expired");
        status.textContent = "Expired";
      } else {
        updateCountdown(status, expiry, tile);
      }
    }, 1000);

  } else if (duration.days) {
    status.textContent = "Ongoing";
  } else if (duration.uses) {
    let remaining = duration.uses;
    remaining -= 1;

    if (remaining > 0) {
      alert(`${remaining} uses left after this!`);
      status.textContent = `${remaining} uses left`;
      prize.duration.uses = remaining;
    } else {
      tile.classList.add("expired");
      status.textContent = "Expired";
    }
  }
}

function updateCountdown(status, expiry) {
  const diff = expiry - new Date();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);

  if (hours > 0) {
    status.textContent = `${hours}h left`;
  } else if (mins > 0) {
    status.textContent = `${mins}m left`;
  } else {
    status.textContent = "Expired";
  }
}
