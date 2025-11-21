// --- CONFIGURE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAhNkyI7aG6snk2hPergYyGdftBBN9M1h0",
  authDomain: "ljubapp.firebaseapp.com",
  databaseURL: "https://ljubapp-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ljubapp",
  storageBucket: "ljubapp.firebasedestorage.app",
  messagingSenderId: "922849938749",
  appId: "1:922849938749:web:59c06714af609e478d0954"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const username = localStorage.getItem("playerName") || "Player";
const container = document.getElementById("game-container");

// --- Page structure ---
const title = document.createElement("h2");
title.textContent = "Sneaky peeky 📸";
container.appendChild(title);

const description = document.createElement("p");
description.innerHTML =
  "Can you take sneaky pictures of your opponent without them realising?<br><br>" +
  "You have 3 hours to try and take as many as you can, but remember: in order to be valid, your enemy must be visible, but also unaware. Whoever takes the most valid photos wins 10 points!";
container.appendChild(description);

// --- Timer ---
const timerLabel = document.createElement("p");
timerLabel.style.marginTop = "10px";
timerLabel.style.fontWeight = "bold";
timerLabel.style.fontSize = "1.2rem";
container.appendChild(timerLabel);

// 27 Nov 2025, 11:00 Italy time (UTC+1)
const gameStart = new Date("2025-11-20T22:00:00Z").getTime(); // UTC + 2
const gameDuration = 4 * 60 * 60 * 1000; // 4 hours

function updateTimer() {
  const now = new Date().getTime();
  const endTime = gameStart + gameDuration;
  let remaining = endTime - now;

  if (remaining <= 0) {
    timerLabel.textContent = "Time is up!";
    redirectToResult();
    return;
  }

  const h = Math.floor(remaining / (1000 * 60 * 60));
  const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((remaining % (1000 * 60)) / 1000);
  timerLabel.textContent = `Time remaining: ${h}h ${m}m ${s}s`;
}
setInterval(updateTimer, 1000);
updateTimer();

// --- Upload button ---
const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.capture = "environment"; // camera only
fileInput.accept = "image/*";
fileInput.id = "fileInput";
fileInput.style.display = "none";
container.appendChild(fileInput);

const uploadLabel = document.createElement("label");
uploadLabel.textContent = "Take Photo 📷";
uploadLabel.className = "upload-label";
uploadLabel.onclick = () => fileInput.click();
container.appendChild(uploadLabel);

// Loader
const loader = document.createElement("p");
loader.textContent = "Validating photos…";
loader.style.display = "none";
loader.style.marginTop = "10px";
loader.style.opacity = "0.7";
container.appendChild(loader);

// Results placeholder
const resultsDiv = document.createElement("div");
resultsDiv.id = "results";
resultsDiv.style.marginTop = "10px";
container.appendChild(resultsDiv);

// --- Load existing counts from Firebase ---
let uploadedCount = 0;
let validCount = 0;

async function loadCounts() {
  const snap = await db.ref(`sneaky-game/${username}`).get();
  if (snap.exists()) {
    const data = snap.val();
    uploadedCount = data.uploaded || 0;
    validCount = data.valid || 0;
    updateResultsText();
  }
}

function updateResultsText() {
  resultsDiv.textContent = `You had ${validCount} valid photos out of ${uploadedCount} uploaded.`;
}
loadCounts();

// --- Load face model ---
let model;
(async () => {
  model = await faceDetection.createDetector(
    faceDetection.SupportedModels.MediaPipeFaceDetector,
    {
      runtime: "mediapipe",
      solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4",
    }
  );
  console.log("Face model loaded");
})();

// --- Utility: validate photo ---
async function validatePhoto(file) {
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await img.decode();

  if (!model) return false;

  const faces = await model.estimateFaces(img);
  if (!faces || faces.length !== 1) return false;

  const face = faces[0];
  const box = face.box;
  const areaRatio = (box.width * box.height) / (img.width * img.height);
  if (areaRatio < 0.03) return false;

  return true;
}

// --- Redirect logic ---
async function redirectToResult() {
  const playerName = username;
  localStorage.setItem("currentGame", "sneaky-game");

  // Check if points were claimed
  const summaryRef = db.ref("sneaky-game/gameSummary");
  const summarySnap = await summaryRef.get();

  // One player has already claimed points
  if (summarySnap.exists()) {
    const summary = summarySnap.val();

    // If tie, grant the second player their points
    if (summary.winner === "both") {
      const claimedBy = summary.claimedBy || [];

      // If user has already claimed, redirect
      if (claimedBy.includes(playerName)) {
        window.location.href = "../result/result.html";
        return;
      }

      // If user hasn't yet claimed, update points and redirect
      claimedBy.push(playerName);
      await summaryRef.update({ claimedBy });
      localStorage.setItem("userPoints", 5);
      window.location.href = "../result/result.html";
      return;
    }

    // If not a tie, just redirect
    window.location.href = "../result/result.html";
    return;
  }

  // Determine outcome
  const snapshot = await db.ref("sneaky-game").get();
  const players = snapshot.val() || {};
  const otherPlayers = Object.keys(players).filter(u => u !== playerName);

  // Set points and winner
  let points = 0;
  let winnerName = "";
  let maxPoints = 0;

  // Both players participated
  if (otherPlayers.length) {
    const other = players[otherPlayers[0]];
    const otherValid = other.valid || 0;

    // User wins
    if (validCount > otherValid) {
      points = 10;
      winnerName = playerName;
      maxPoints = validCount;
      // Create summary
      await summaryRef.set({
        winner: winnerName,
        maxPoints
      });
      
    // User loses
    } else if (validCount < otherValid) {
      points = 0;

    // Users tie
    } else {
      points = 5;
      winnerName = "both";
      maxPoints = validCount;
      // Create summary including claimedBy with this user
      await summaryRef.set({
        winner: "both",
        maxPoints,
        claimedBy: [playerName]
      });
    }
    
  // Only one player has played
  } else {
    points = 10;
    winnerName = playerName;
    maxPoints = validCount;
    await summaryRef.set({
      winner: winnerName,
      maxPoints
    });
  }

  // Save locally and redirect
  localStorage.setItem("userPoints", points);
  localStorage.setItem("currentGame", "sneaky-game");
  window.location.href = "../result/result.html";
}

// --- Handle uploads ---
fileInput.addEventListener("change", async () => {
  const files = Array.from(fileInput.files);
  if (!files.length) return;

  // Show loader
  loader.style.display = "block";
  uploadLabel.style.display = "none";

  for (const f of files) {
    uploadedCount++;
    if (await validatePhoto(f)) validCount++;
    // Update firebase after each photo
    await db.ref(`sneaky-game/${username}`).set({
      uploaded: uploadedCount,
      valid: validCount
    });
    updateResultsText();
  }

  // Hide loader, show upload button again
  loader.style.display = "none";
  uploadLabel.style.display = "inline-block";

  // Optional: if timer ran out, check redirect
  const now = new Date().getTime();
  if (now > gameStart + gameDuration) {
    redirectToResult();
  }
});
