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
description.textContent = "Can you take sneaky pictures of your opponent without them realising? You have 3 hours to try and take as many as you can, but remember: in order to be valid, your enemy must be visible, but also unaware. Whoever takes the most valid photos wins 10 points!";
container.appendChild(description);

// Upload button
const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.multiple = true;
fileInput.accept = "image/*";
container.appendChild(fileInput);

const uploadLabel = document.createElement("label");
uploadLabel.textContent = "Upload +";
uploadLabel.className = "upload-label";
uploadLabel.htmlFor = fileInput.id = "fileInput";
container.appendChild(uploadLabel);

// Results placeholder
const resultsDiv = document.createElement("div");
resultsDiv.id = "results";
container.appendChild(resultsDiv);

// --- Load face model ---
let model;
faceLandmarksDetection.load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh)
  .then(m => model = m);

// --- Utility: validate photo ---
async function validatePhoto(file) {
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await img.decode();

  const predictions = await model.estimateFaces({input: img, returnTensors: false, flipHorizontal: false});
  if (!predictions.length) return false; // no face detected

  const face = predictions[0];
  const keypoints = face.scaledMesh;

  // Simple yaw check: approximate head rotation
  const leftEye = keypoints[33]; // left eye corner
  const rightEye = keypoints[263]; // right eye corner
  const dx = rightEye[0] - leftEye[0];
  const dy = rightEye[1] - leftEye[1];
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Acceptable if head rotated slightly (not facing exactly sideways)
  if (Math.abs(angle) > 30) return false;

  return true; // valid sneaky photo
}

// --- Handle uploads ---
fileInput.addEventListener("change", async () => {
  const files = Array.from(fileInput.files);
  if (!files.length) return;

  let validCount = 0;
  for (const f of files) {
    if (await validatePhoto(f)) validCount++;
  }

  alert(`Uploaded ${files.length} photos.\nValid sneaky photos: ${validCount}`);

  // --- Save to Firebase ---
  const userRef = db.ref(`sneaky-game/${username}`);
  await userRef.set({
    uploaded: files.length,
    valid: validCount
  });

  // --- Check for opponent ---
  const snapshot = await db.ref("sneaky-game").get();
  const players = snapshot.val() || {};
  const otherPlayers = Object.keys(players).filter(u => u !== username);

  if (!otherPlayers.length) {
    resultsDiv.textContent = `You had ${validCount} valid photos out of ${files.length} uploaded.`;
  } else {
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
    resultRef.set({winner});
    window.location.href = "../result/result.html";
  }
});
