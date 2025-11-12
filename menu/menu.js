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

// --- Get username ---
const username = (localStorage.getItem("playerName") || "Player").toLowerCase();
const menuContainer = document.getElementById("menu-container");

// --- Load plates JSON ---
async function loadPlates() {
  const response = await fetch("../files/plates.json"); // correct path
  const plates = await response.json();
  return plates;
}

// --- Martina view ---
async function showMartinaMenu() {
  const plates = await loadPlates();

  const title = document.createElement("h2");
  title.textContent = "What will you cook tonight?";
  menuContainer.appendChild(title);

  let selectedPlate = null;

  plates.forEach(plate => {
    const tile = document.createElement("label");
    tile.className = "ingredient";

    tile.innerHTML = `
      <input type="radio" name="plate" value="${plate.id}" />
      <span>${plate.name}</span>
    `;

    tile.addEventListener("click", () => {
      // Deselect others
      document.querySelectorAll("label.ingredient").forEach(t => t.classList.remove("checked"));
      tile.classList.add("checked");

      // Select the radio input
      tile.querySelector("input").checked = true;
      selectedPlate = plate.id;
    });

    menuContainer.appendChild(tile);
  });

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save";
  saveBtn.onclick = () => {
    if (!selectedPlate) return alert("Please select a plate!");
    db.ref(`menu/${selectedPlate}`).set({
      timestamp: new Date().toISOString(),
      rated: false,
      comments: ""
    }).then(() => alert("Plate saved!"));
  };

  menuContainer.appendChild(saveBtn);
}

// --- Renato view ---
async function showRenatoMenu() {
  const menuData = await db.ref("menu").get().then(snap => snap.val() || {});
  const unrated = Object.entries(menuData).find(([_, v]) => !v.rated);

  if (!unrated) {
    menuContainer.innerHTML = `<p style="opacity:0.6;">Today's menu is not available yet! Try again later.</p>`;
    return;
  }

  const [plateId, plate] = unrated;

  // Plate image
  const img = document.createElement("img");
  img.src = `files/${plateId}.jpg`; // or your actual image path
  img.style.width = "200px";
  img.style.borderRadius = "12px";
  img.style.marginBottom = "10px";
  menuContainer.appendChild(img);

  // Plate name
  const nameEl = document.createElement("p");
  nameEl.textContent = plateId.charAt(0).toUpperCase() + plateId.slice(1);
  nameEl.style.fontWeight = "bold";
  nameEl.style.marginBottom = "20px";
  menuContainer.appendChild(nameEl);

  // Title
  const title = document.createElement("h2");
  title.textContent = "How would you rate your dish?";
  menuContainer.appendChild(title);

  // Stars
  const starsDiv = document.createElement("div");
  starsDiv.className = "stars";
  let rating = 0;

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("span");
    star.textContent = "★";
    star.addEventListener("click", () => {
      rating = i;
      starsDiv.querySelectorAll("span").forEach((s, j) => {
        s.classList.toggle("selected", j < i);
      });
    });
    starsDiv.appendChild(star);
  }

  menuContainer.appendChild(starsDiv);

  // Textarea
  const textarea = document.createElement("textarea");
  textarea.placeholder = "Additional comments...";
  menuContainer.appendChild(textarea);

  // Submit button
  const submitBtn = document.createElement("button");
  submitBtn.textContent = "Submit";
  submitBtn.addEventListener("click", () => {
    if (!rating) return alert("Please rate the dish!");
    db.ref(`menu/${plateId}`).update({
      rated: true,
      rating,
      comments: textarea.value || "",
    }).then(() => alert("Thank you for your feedback!"));
  });

  menuContainer.appendChild(submitBtn);
}

// --- Main ---
if (username === "martina") {
  showMartinaMenu();
} else if (username === "renato") {
  showRenatoMenu();
}
