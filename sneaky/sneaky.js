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

const username = (localStorage.getItem("playerName") || "Player").toLowerCase();
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
container.appendChild(timerLabel);

// Set 27 Nov 2025 11:00 Finnish time (UTC+2)
const gameStart = new Date(Date.UTC(2025, 10, 20, 22, 20, 0)); // 11:00 Finnish UTC+2
const gameEnd = new Date(gameStart.getTime() + 4 * 60 * 60 * 1000);

function updateTimer() {
  const now = new Date();
  const remaining = gameEnd - now;
  if (remaining <= 0) {
    timerLabel.textContent = "Time's up!";
    redirectToResult();
    return;
  }
  const hrs = Math.floor(remaining / (1000 * 60 * 60));
  const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((remaining % (1000 * 60)) / 1000);
  timerLabel.textContent = `Time left: ${hrs}h ${mins}m ${secs}s`;
}
setInterval(updateTimer, 1000);
updateTimer();

// --- Upload button ---
const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = "image/*";
fileInput.capture = "environment"; // camera only
fileInput.id = "fileInput";
container.appendChild(fileInput);

const uploadLabel = document.createElement("label");
uploadLabel.textContent = "Upload +";
uploadLabel.className = "upload-label";
uploadLabel.onclick = () => fileInput.click();
container.appendChild(uploadLabel);

// Results placeholder (permanent)
const resultsDiv = document.createElement("div");
resultsDiv.id = "results";
container.appendChild(resultsDiv);

// Loader
const loader = document.createElement("p");
loader.textContent = "Validating photos…";
loader.style.display = "none";
loader.style.marginTop = "20px";
loader.style.opacity = "0.7";
container.appendChild(loader);

// --- Hide upload if already submitted ---
async function checkExistingUpload() {
  const snap = await db.ref(`sneaky-game/${username}`).get();
  if (snap.exists()) {
    const data = snap.val();
    uploadLabel.style.display = "none";
    fileInput.style.display = "none";
    resultsDiv.textContent = `You had ${data.valid} valid photos out of ${data.uploaded} uploaded.`;
    return true;
  }
  return false;
}
checkExistingUpload();

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
  if (areaRatio < 0.03) return false; // ensure face is visible

  return true; // accept any detected face
}

// --- Handle uploads ---
fileInput.addEventListener("change", async () => {
  const files = Array.from(fileInput.files);
  if (!files.length) return;

  loader.style.display = "block";
  uploadLabel.style.display = "none";

  let validCount = 0;
  for (const f of files) {
    if (await validatePhoto(f)) validCount++;
  }

  loader.style.display = "none";

  // --- Save to Firebase ---
  const userRef = db.ref(`sneaky-game/${username}`);
  await userRef.set({
    uploaded: files.length,
    valid: validCount
  });

  resultsDiv.textContent = `You had ${validCount} valid photos out of ${files.length} uploaded.`;

  // Hide upload permanently
  fileInput.style.display = "none";
  uploadLabel.style.display = "none";

  // --- Check for opponent ---
  const snapshot = await db.ref("sneaky-game").get();
  const players = snapshot.val() || {};
  const otherPlayers = Object.keys(players).filter(u => u !== username);

  if (!otherPlayers.length) return;

  // both players finished
  localStorage.setItem("userPoints", 0);
  localStorage.setItem("currentGame", "sneaky-game");

  const resultRef = db.ref(`sneaky-game/${username}/result`);
  const resultSnap = await resultRef.get();
  if (resultSnap.exists()) {
    window.location.href = "../profile/profile.html";
    return;
  }

  const other = players[otherPlayers[0]];
  let winner = username;
  if ((other.valid || 0) > validCount) winner = otherPlayers[0];

  if (winner === username) localStorage.setItem("userPoints", 10);
  resultRef.set({ winner });
  redirectToResult();
});

// --- Redirect to result ---
function redirectToResult() {
  window.location.href = "../result/result.html";
}
