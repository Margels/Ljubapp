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

// Reload after 30 seconds of inactivity
let idleTimer;
function resetTimer() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    window.location.replace("../navigation.html");
  }, 30000); // 30 seconds
}

window.onload = resetTimer;
document.onmousemove = resetTimer;
document.ontouchstart = resetTimer;
document.onkeydown = resetTimer;

// --- LOAD USER DATA ---
const username = localStorage.getItem("playerName") || "Player";

// --- DOM ELEMENTS ---
const profileImage = document.getElementById("profileImage");
const profileName = document.getElementById("profileName");
const totalPoints = document.getElementById("totalPoints");
const prizeHistory = document.getElementById("prizeHistory");

// --- SET PROFILE INFO ---
profileImage.src = `../assets/${username.toLowerCase()}.png`;
profileName.textContent = username;
totalPoints.textContent = "🎯 Total points: ...";
localStorage.removeItem("currentGame")

// --- DISABLE BACK NAVIGATION UNIVERSALLY ---
window.history.pushState(null, null, window.location.href);
window.addEventListener("popstate", function () {
  window.history.pushState(null, null, window.location.href);
});

// Redirect to navigation if reloaded
window.addEventListener("beforeunload", () => {
  localStorage.setItem("redirectToNav", "true");
});

// --- LOAD DATA FROM FIREBASE ---
const userRef = db.ref(`users/${username}`);

userRef.once("value").then(snapshot => {
  const userData = snapshot.val();

  // --- POINTS ---
  const points = userData?.points ?? 0;
  totalPoints.textContent = `🎯 Total points: ${points}`;
  localStorage.setItem("userPoints", points); // keep in sync with localStorage just in case

  // --- PRIZES ---
  const prizes = userData?.prizesCollected || {};
  const prizeArray = Object.keys(prizes).map(id => ({ id, ...prizes[id] }));

  if (prizeArray.length === 0) {
    prizeHistory.innerHTML = `<p style="opacity:0.7;">No prizes collected yet.</p>`;
    return;
  }

  // Sort newest first
  prizeArray.sort((a, b) => new Date(b.claimedAt || 0) - new Date(a.claimedAt || 0));

  prizeArray.forEach(prize => {
  const tile = renderPrizeTile(prize);
  if (prize.status === "claimed" && prize.duration) {
    updateTileTimer(tile, prize);
    }  
  });

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
  if (prize.status !== "claimed" && !isExpired) {
    const claimBtn = document.createElement("button");
    claimBtn.className = "claim-btn";
    claimBtn.textContent = "Claim";
    claimBtn.onclick = () => handleClaim(prize, tile, claimBtn);
    tile.appendChild(claimBtn);
  }

  prizeHistory.appendChild(tile);
  return tile;
}

// --- HANDLE CLAIM (Firebase version) ---
function handleClaim(prize, tile, claimBtn) {
  claimBtn.disabled = true;
  tile.classList.add("claimed");

  const now = new Date();
  prize.claimedAt = now.toISOString();
  prize.status = "claimed";

  // For uses-based prizes
  if (prize.duration?.uses) {
    prize.usesLeft = (prize.usesLeft ?? prize.duration.uses) - 1;

    if (prize.usesLeft > 0) {
      alert(`You now have ${prize.usesLeft} use${prize.usesLeft > 1 ? "s" : ""} left!`);
    } else {
      alert(`That was your last use of ${prize.title}.`);
    }
  }

  // Update in Firebase
  const prizeRef = db.ref(`users/${username}/prizesCollected/${prize.id}`);
  prizeRef.update({
    claimedAt: prize.claimedAt,
    status: prize.status,
    usesLeft: prize.usesLeft ?? null
  });

  // Update UI text properly
  updateTileTimer(tile, prize);
  claimBtn.remove();
}

// --- Helper: updates countdown text ---
function updateTileTimer(tile, prize) {
  const rightElement = tile.querySelector(".tile-right");
  if (!prize.claimedAt || !prize.duration) return;

  const claimedAt = new Date(prize.claimedAt);
  let expiry = null;
  
  if (prize.duration.minutes) {
    expiry = new Date(claimedAt.getTime() + prize.duration.minutes * 60000);
  } else if (prize.duration.hours) {
    expiry = new Date(claimedAt.getTime() + prize.duration.hours * 3600000);
  } else if (prize.duration.days) {
    if (prize.duration.days === 1) {
      expiry = new Date(claimedAt);
      expiry.setHours(23, 59, 59, 999); // until midnight
    } else {
      expiry = new Date(claimedAt.getTime() + prize.duration.days * 24 * 3600000);
    }
  }


  function refreshTimer() {
    const now = new Date();
    const diffMs = expiry - now;
    if (diffMs <= 0) {
      rightElement.textContent = "Expired";
      tile.style.opacity = "0.5";
      clearInterval(interval);
      return;
    }

    const diffM = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffM / 60);
    const display =
      diffH > 0 ? `${diffH}h ${diffM % 60}m left` : `${diffM}m left`;

    rightElement.textContent = display;
  }

  refreshTimer();
  const interval = setInterval(refreshTimer, 60000); // update every minute
}
