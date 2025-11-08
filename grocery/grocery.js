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
const username = prompt("Enter your name 👋"); // you and your bf can enter different names
const ingredientsContainer = document.getElementById("ingredients");
const pointsDisplay = document.getElementById("points");
let points = 0;

// --- LOAD INGREDIENTS FROM JSON ---
fetch("../files/ingredients.json")
  .then(res => res.json())
  .then(ingredients => {
    ingredients.forEach(name => {
      const div = document.createElement("div");
      div.className = "ingredient";
      div.innerHTML = `<input type="checkbox"> <span>${name}</span>`;
      ingredientsContainer.appendChild(div);

      const checkbox = div.querySelector("input");
      const ingredientKey = name.replace(/\s+/g, "_");

      // Listen for live updates
      db.ref(`ingredients/${ingredientKey}`).on("value", snapshot => {
        const data = snapshot.val();
        if (data && data.selectedBy && data.selectedBy !== username) {
          div.classList.add("unavailable");
          checkbox.disabled = true;
        } else {
          div.classList.remove("unavailable");
          checkbox.disabled = false;
        }
      });

      // Handle selection
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          div.classList.add("checked");
          points++;
          db.ref(`ingredients/${ingredientKey}`).set({ selectedBy: username });
        } else {
          div.classList.remove("checked");
          points--;
          db.ref(`ingredients/${ingredientKey}`).remove();
        }
        pointsDisplay.textContent = `Points: ${points}`;
      });
    });
  });

// --- GAME OVER ---
function endGame() {
  const resultsRef = db.ref("results/" + username);
  resultsRef.set({ points });

  db.ref("results").once("value").then(snapshot => {
    const data = snapshot.val() || {};
    let winner = "Nobody yet!";
    let maxPoints = 0;

    for (const [user, info] of Object.entries(data)) {
      if (info.points > maxPoints) {
        maxPoints = info.points;
        winner = user;
      }
    }

    alert(`🏁 Game Over! Winner: ${winner} with ${maxPoints} points!`);
  });
}

document.getElementById("endBtn").addEventListener("click", endGame);
