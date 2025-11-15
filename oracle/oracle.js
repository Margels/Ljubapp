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

// --- LOAD LOGGED PLAYER ---
const player = localStorage.getItem("playerName") || "Player";

// --- DOM ELEMENTS ---
const pointsValue = document.getElementById("pointsValue");

// --- FETCH POINTS FROM FIREBASE ---
db.ref(`users/${player}/points`).on("value", snapshot => {
  if (snapshot.exists()) {
    pointsValue.textContent = snapshot.val();
  } else {
    pointsValue.textContent = "0";
  }
});
