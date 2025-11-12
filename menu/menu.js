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
const username = localStorage.getItem("playerName") || "Player";
const menuContainer = document.getElementById("menu-container");

async function loadPlates() {
  const response = await fetch("/files/plates.json");
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
      <img src="${plate.image}" class="tile-img" />
      <span class="tile-label">${plate.name}</span>
      <input type="radio" name="plate" value="${plate.id}" style="display:none" />
    `;

    tile.addEventListener("click", () => {
      // deselect others
      document.querySelectorAll("label.ingredient").forEach(t => t.classList.remove("checked"));
      tile.classList.add("checked");
      selectedPlate = plate.id;
      tile.querySelector("input").checked = true;
    });

    menuContainer.appendChild(tile);
  });

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save";
  saveBtn.onclick = () => {
    if (!selectedPlate) return alert("Please select a plate!");
    db.ref(`menu/martina`).set({
      selectedPlate,
      rated: false,
      comments: "",
      timestamp: new Date().toISOString()
    }).then(() => alert("Plate saved!"));
  };

  menuContainer.appendChild(saveBtn);
}

// --- Renato view ---
async function showRenatoMenu() {
  const menuRef = db.ref("menu/martina");
  const snapshot = await menuRef.get();
  const data = snapshot.val();

  if (!data || !data.selectedPlate || data.rated) {
    const msg = document.createElement("p");
    msg.textContent = "Today's menu is not available yet! Try again later.";
    msg.style.color = "gray";
    menuContainer.appendChild(msg);
    return;
  }

  const plates = await loadPlates();
  const plate = plates.find(p => p.id === data.selectedPlate);

  const title = document.createElement("h2");
  title.textContent = "Menu";
  menuContainer.appendChild(title);

  const img = document.createElement("img");
  img.src = plate.image;
  img.className = "tile-img";
  img.style.marginBottom = "10px";
  menuContainer.appendChild(img);

  const subtitle = document.createElement("p");
  subtitle.textContent = "How would you rate your dish?";
  menuContainer.appendChild(subtitle);

  // star rating
  const starsDiv = document.createElement("div");
  starsDiv.className = "stars";
  let rating = 0;

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("span");
    star.textContent = "★";
    star.addEventListener("click", () => {
      rating = i;
      starsDiv.querySelectorAll("span").forEach((s,j) => {
        s.classList.toggle("selected", j < i);
      });
    });
    starsDiv.appendChild(star);
  }

  menuContainer.appendChild(starsDiv);

  const textarea = document.createElement("textarea");
  textarea.placeholder = "Additional comments...";
  menuContainer.appendChild(textarea);

  const submitBtn = document.createElement("button");
  submitBtn.textContent = "Submit";
  submitBtn.onclick = () => {
    if (rating === 0) return alert("Please select a rating!");
    menuRef.update({
      rated: true,
      rating,
      comments: textarea.value
    }).then(() => alert("Thank you for your feedback!"));
  };

  menuContainer.appendChild(submitBtn);
}

// --- Main ---
if (username.toLowerCase() === "martina") {
  showMartinaMenu();
} else if (username.toLowerCase() === "renato") {
  showRenatoMenu();
}
