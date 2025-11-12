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
const menuContainer = document.getElementById("menu-container");

// --- Load plates JSON ---
async function loadPlates() {
  const response = await fetch("../files/plates.json");
  const plates = await response.json();
  return plates;
}

// --- Reusable navigation button ---
function createNavigationButton() {
  const btn = document.createElement("button");
  btn.textContent = "Return to navigation";
  btn.addEventListener("click", () => (window.location.href = "../navigation.html"));
  return btn;
}

// --- Martina view ---
async function showMartinaMenu() {
  const menuData = await db.ref("menu").get().then(snap => snap.val() || {});
  const hasUnrated = Object.values(menuData).some(v => !v.rated);

  if (hasUnrated) {
    const stopCard = document.createElement("div");
    stopCard.className = "stop-card";
    stopCard.innerHTML = `
      <div class="stop-icon">⚠️</div>
      <p>Let Renato rate his latest plate first</p>
    `;
    stopCard.appendChild(createNavigationButton());
    menuContainer.appendChild(stopCard);
    return;
  }

  const plates = await loadPlates();

  if (!plates.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No plates available right now.";
    menuContainer.appendChild(empty);

    menuContainer.appendChild(createNavigationButton());
    return;
  }

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
      document.querySelectorAll("label.ingredient").forEach(t => t.classList.remove("checked"));
      tile.classList.add("checked");
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
    const title = document.createElement("h2");
    title.textContent = "Nothing to see here";
    menuContainer.appendChild(title);

    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = "Today's menu is not available yet! Try again later.";
    menuContainer.appendChild(emptyState);

    menuContainer.appendChild(createNavigationButton());
    return;
  }

  const [plateId, plate] = unrated;
  const plates = await loadPlates();
  const plateInfo = plates.find(p => p.id === plateId);

  // Menu title above plate image
  const menuTitle = document.createElement("h2");
  menuTitle.textContent = "Menu";
  menuTitle.style.marginBottom = "10px";
  menuContainer.appendChild(menuTitle);

  // Plate image
  if (plateInfo?.image) {
    const img = document.createElement("img");
    img.src = plateInfo.image;
    img.style.width = "200px";
    img.style.borderRadius = "12px";
    img.style.marginBottom = "10px";
    menuContainer.appendChild(img);
  }

  // Plate name (bigger and bolder)
  const nameEl = document.createElement("p");
  nameEl.textContent = plateInfo?.name || plateId;
  nameEl.style.fontWeight = "700";
  nameEl.style.fontSize = "1.6rem";
  nameEl.style.marginBottom = "15px";
  menuContainer.appendChild(nameEl);

  // Question (smaller, medium weight)
  const title = document.createElement("h2");
  title.textContent = "How would you rate your dish?";
  title.style.fontWeight = "500";
  title.style.fontSize = "1.2rem";
  title.style.marginBottom = "15px";
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
  textarea.style.border = "1px solid rgba(255,255,255,0.2)";
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
    }).then(() => {
      alert("Thank you for your feedback!");
      setTimeout(() => (window.location.href = "../navigation.html"), 1000);
    });
  });

  menuContainer.appendChild(submitBtn);
}

// --- Main ---
if (username === "martina") {
  showMartinaMenu();
} else if (username === "renato") {
  showRenatoMenu();
}
