// profile/profile.js
// Loads profile picture & username from localStorage (unchanged behavior),
// then loads authoritative points + prizes history from Firebase.
// If Firebase has no points, we fall back to localStorage so the label always appears.

// --- CONFIGURE FIREBASE (same config you've used elsewhere) ---
const firebaseConfig = {
  apiKey: "AIzaSyAhNkyI7aG6snk2hPergYyGdftBBN9M1h0",
  authDomain: "ljubapp.firebaseapp.com",
  databaseURL: "https://ljubapp-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ljubapp",
  storageBucket: "ljubapp.firebasestorage.app",
  messagingSenderId: "922849938749",
  appId: "1:922849938749:web:59c06714af609e478d0954"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// --- LOCAL FALLBACKS (do not change where picture/name are read) ---
const username = localStorage.getItem("playerName") || "Player";
const localPointsFallback = parseInt(localStorage.getItem("userPoints") || "0");

// --- DOM ELEMENTS (must match your HTML) ---
const profileImage = document.getElementById("profileImage");
const profileName = document.getElementById("profileName");
const totalPoints = document.getElementById("totalPoints");
const prizeHistory = document.getElementById("prizeHistory");

// quick safety: if DOM missing, stop and log
if (!profileImage || !profileName || !totalPoints || !prizeHistory) {
  console.error("profile.js: missing DOM elements. Check profile.html contains profileImage/profileName/totalPoints/prizeHistory elements.");
}

// --- 1) bootstrap image + name immediately from localStorage (keeps existing behavior) ---
try {
  profileImage.src = `../assets/${username.toLowerCase()}.png`;
} catch (e) {
  console.warn("profile.js: failed to set profile image:", e);
}
profileName.textContent = username;

// --- Helper: render empty state ---
function renderNoPrizesMessage() {
  prizeHistory.innerHTML = `<p style="opacity:0.7;">No prizes collected yet.</p>`;
}

// --- Helper: create tile DOM (keeps your CSS classes) ---
function createPrizeTile(prize) {
  const tile = document.createElement("div");
  tile.className = "prize-tile";

  const duration = prize.duration || {};
  const claimedAt = prize.claimedAt ? new Date(prize.claimedAt) : null;

  let rightContent = "";
  let isExpired = false;

  // compute expiry if applicable
  if (claimedAt && (duration.minutes || duration.hours || duration.days)) {
    const now = new Date();
    let expiry;

    if (duration.minutes) {
      expiry = new Date(claimedAt.getTime() + duration.minutes * 60000);
    } else if (duration.hours) {
      expiry = new Date(claimedAt.getTime() + duration.hours * 3600000);
    } else if (duration.days) {
      if (duration.days === 1) {
        // treat days:1 as "until midnight"
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
      if (duration.days) rightContent = "Ongoing";
      else if (diffH > 0) rightContent = `${diffH}h left`;
      else rightContent = `${diffM}m left`;
    }
  }

  // uses-based logic
  if (duration.uses) {
    const usesLeft = typeof prize.usesLeft !== "undefined" ? prize.usesLeft : duration.uses;
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

  tile.innerHTML = `
    <div>
      <div class="prize-title">${prize.emoji} ${prize.title}</div>
      <div class="prize-meta">${prize.points} pts</div>
    </div>
    <div class="tile-right">${rightContent}</div>
  `;

  // if the prize is not yet claimed, show claim button (if you want)
  // Note: we are not enabling claim button flow here unless prize.status === "unclaimed"
  if ((!prize.claimedAt || prize.status === "unclaimed") && !isExpired) {
    // show a Claim button so user can activate / start the prize (optional)
    const claimBtn = document.createElement("button");
    claimBtn.className = "claim-btn";
    claimBtn.textContent = "Claim";
    // disabled by default — we'll wire to update Firebase if you want.
    claimBtn.disabled = false;
    // For now, clicking Claim will write 'claimedAt' and update Firebase record status to 'claimed'
    claimBtn.addEventListener("click", async () => {
      claimBtn.disabled = true;
      // mark this prize in firebase as claimed (set claimedAt and status)
      const userRef = db.ref(`users/${username}/prizesCollected/${prize._id}`);
      const nowISO = new Date().toISOString();
      await userRef.update({
        claimedAt: nowISO,
        status: "claimed",
        usesLeft: prize.duration?.uses ?? prize.usesLeft ?? null
      });
      // update UI immediately
      tile.querySelector(".tile-right").textContent = prize.duration?.days ? "Ongoing" : (prize.duration?.minutes ? `${prize.duration.minutes}m left` : (prize.duration?.hours ? `${prize.duration.hours}h left` : ""));
      tile.classList.add("claimed");
    });

    tile.appendChild(claimBtn);
  }

  return tile;
}

// --- MAIN: load user data from Firebase (points + prizes)
// We use once() so we fetch current snapshot; handle missing nodes gracefully.
(function loadFromFirebase() {
  const userRef = db.ref(`users/${username}`);

  userRef.once("value")
    .then(snapshot => {
      const userData = snapshot.val() || {};

      // Points: if firebase has points, use it. otherwise fallback to localStorage value.
      const firebasePoints = typeof userData.points !== "undefined" ? userData.points : null;
      const displayPoints = firebasePoints !== null ? firebasePoints : localPointsFallback;
      totalPoints.textContent = `🎯 Total: ${displayPoints}`;

      // Prizes: prefer firebase data; if not present, show the no-prizes message
      const prizesObj = userData.prizesCollected || null;

      if (!prizesObj || Object.keys(prizesObj).length === 0) {
        renderNoPrizesMessage();
        return;
      }

      // Convert firebase keyed object into array with id saved for updates
      const prizeArray = Object.entries(prizesObj).map(([id, p]) => {
        p._id = id; // keep id for updates
        return p;
      });

      // sort newest-first by claimedAt or by push key if claimedAt missing
      prizeArray.sort((a, b) => {
        const aT = a.claimedAt ? new Date(a.claimedAt).getTime() : 0;
        const bT = b.claimedAt ? new Date(b.claimedAt).getTime() : 0;
        return bT - aT;
      });

      // Clear DOM then render each tile
      prizeHistory.innerHTML = "";
      prizeArray.forEach(prize => {
        const tile = createPrizeTile(prize);
        prizeHistory.appendChild(tile);
      });
    })
    .catch(err => {
      console.error("profile.js: failed to load user data from Firebase:", err);
      // fallback: show the 'no prizes' message so UI is not blank
      renderNoPrizesMessage();
      // still show fallback points
      totalPoints.textContent = `🎯 Total: ${localPointsFallback}`;
    });
})();
