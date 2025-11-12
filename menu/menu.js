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
  const menuRef = db.ref("menu");
  const snapshot = await menuRef.get();
  const menuData = snapshot.val();

  // Find first unrated plate
  const unratedEntry = Object.entries(menuData || {}).find(([id, data]) => !data.rated);

  if (!unratedEntry) {
    const msg = document.createElement("p");
    msg.textContent = "Today's menu is not available yet! Try again later.";
    msg.style.color = "gray";
    menuContainer.appendChild(msg);
    return;
  }

  const [plateId, plateData] = unratedEntry;
  const plates = await loadPlates();
  const plate = plates.find(p => p.id === plateId);

  const title = document.createElement("h2");
  title.textContent = "Menu";
  menuContainer.appendChild(title);

  const img = document.createElement("img");
  img.src = plate.image;
  img.style.width = "120px";
  img.style.height = "120px";
  img.style.borderRadius = "12px";
  img.style.objectFit = "cover";
  img.style.marginBottom = "10px";
  menuContainer.appendChild(img);

  const nameEl = document.createElement("p");
  nameEl.textContent = plate.name;
  nameEl.style.fontWeight = "bold";
  nameEl.style.marginBottom = "10px";
  menuContainer.appendChild(nameEl);

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
    star.style.display = "inline-block";   // important for click
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
    db.ref(`menu/${plateId}`).update({
      rated: true,
      rating,
      comments: textarea.value
    }).then(() => alert("Thank you for your feedback!"));
  };

  menuContainer.appendChild(submitBtn);
}

// --- Main ---
if (username === "martina") {
  showMartinaMenu();
} else if (username === "renato") {
  showRenatoMenu();
}
