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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --- VARIABLES ---
const username = localStorage.getItem("playerName") || "Player";
const userPoints = parseInt(localStorage.getItem("userPoints")) || 0;

const resultTitle = document.getElementById("resultTitle");
const winnerText = document.getElementById("winnerText");
const pointsDisplay = document.getElementById("pointsDisplay");

// --- GET GAME SUMMARY ---
db.ref("gameSummary").once("value").then(snapshot => {
  const summary = snapshot.val();
  if (!summary) {
    resultTitle.textContent = "Waiting for results...";
    return;
  }

  const winner = summary.winner;
  const maxPoints = summary.maxPoints;

  if (username === winner) {
    resultTitle.textContent = "Congratulations, you won 🎉";
  } else {
    resultTitle.textContent = "Better luck next time 🥀";
  }

  winnerText.textContent = `${winner} won with ${maxPoints} points!`;

  pointsDisplay.textContent = `${userPoints} 🎯`;
});
