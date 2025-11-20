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

// Upload button
const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.multiple = true;
fileInput.accept = "image/*";
fileInput.id = "fileInput";
container.appendChild(fileInput);

const uploadLabel = document.createElement("label");
uploadLabel.textContent = "Upload +";
uploadLabel.className = "upload-label";
uploadLabel.onclick = () => fileInput.click();
container.appendChild(uploadLabel);

// Results placeholder
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
db.ref(`sneaky-game/${username}`).get().then(snap => {
  if (snap.exists()) {
    const data = snap.val();
    uploadLabel.style.display = "none";
    fileInput.style.display = "none";
    resultsDiv.textContent =
      `You had ${data.valid} valid photos out of ${data.uploaded} uploaded.`;
  }
});

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

  // Accept only if one face is detected
  if (!faces || faces.length !== 1) return false;

  // Check face is large enough
  const face = faces[0];
  const box = face.box;
  const areaRatio = (box.width * box.height) / (img.width * img.height);
  if (areaRatio < 0.03) return false;

  return true; // Accept all detected faces
}

// --- Handle uploads ---
fileInput.addEventListener("change", async () => {
  const files = Array.from(fileInput.files);
  if (!files.length) return;

  // Show loader
  loader.style.display = "block";
  uploadLabel.style.display = "none";

  let validCount = 0;
  for (const f of files) {
    if (await validatePhoto(f)) validCount++;
  }

  // Hide loader
  loader.style.display = "none";

  // --- Save to Firebase ---
  const userRef = db.ref(`sneaky-game/${username}`);
  await userRef.set({
    uploaded: files.length,
    valid: validCount
  });

  resultsDiv.textContent =
    `You had ${validCount} valid photos out of ${files.length} uploaded.`;

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
  window.location.href = "../result/result.html";
});
