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
  return await response.json();
}

// --- Reusable navigation button ---
function createNavigationButton(text = "Return to navigation") {
  const btn = document.createElement("button");
  btn.textContent = text;
  btn.addEventListener("click", () => (window.location.href = "../navigation.html"));
  return btn;
}

// --- Build a "best voted" list from Firebase menu entries (rating must exist) ---
async function getBestVotedFromFirebase() {
  // Reads menu/ and returns array [{ id, name, avg, votes }]
  const [menuSnap, plates] = await Promise.all([
    db.ref("menu").get().then(s => s.val() || {}),
    loadPlates()
  ]);

  // build map id -> plateName
  const platesMap = {};
  (plates || []).forEach(p => { platesMap[p.id] = p.name || p.id; });

  // collect rated entries
  const ratedEntries = Object.entries(menuSnap)
    .map(([id, data]) => {
      if (data && typeof data.rating === "number") {
        return {
          id,
          name: platesMap[id] || id,
          rating: data.rating,
          timestamp: data.timestamp || null
        };
      }
      return null;
    })
    .filter(Boolean);

  if (ratedEntries.length === 0) return [];

  // If there can be multiple entries per plate (e.g. multiple ratings stored), group by id
  const grouped = ratedEntries.reduce((acc, e) => {
    if (!acc[e.id]) acc[e.id] = { name: e.name, total: 0, votes: 0 };
    acc[e.id].total += e.rating;
    acc[e.id].votes += 1;
    return acc;
  }, {});

  const result = Object.entries(grouped).map(([id, g]) => ({
    id,
    name: g.name,
    avg: g.total / g.votes,
    votes: g.votes
  }));

  // sort descending by average rating then by votes
  result.sort((a, b) => {
    if (b.avg === a.avg) return b.votes - a.votes;
    return b.avg - a.avg;
  });

  return result;
}

// --- Render a best-voted block (returns element) ---
function renderBestVotedBlock(items) {
  const wrap = document.createElement("div");
  wrap.style.marginTop = "20px";
  wrap.style.width = "100%";
  wrap.style.maxWidth = "560px";
  wrap.style.marginLeft = "auto";
  wrap.style.marginRight = "auto";

  const subtitle = document.createElement("p");
  subtitle.textContent = "Best voted dishes so far:";
  subtitle.style.opacity = "0.85";
  subtitle.style.marginBottom = "8px";
  subtitle.style.fontWeight = "600";
  wrap.appendChild(subtitle);

  items.forEach((it, idx) => {
    const tile = document.createElement("div");
    tile.style.backgroundColor = "rgba(255,255,255,0.2)";
    tile.style.borderRadius = "8px";
    tile.style.padding = "8px 12px";
    tile.style.margin = "6px auto";
    tile.style.width = "90%";
    tile.style.maxWidth = "480px";
    tile.style.display = "flex";
    tile.style.justifyContent = "space-between";
    tile.style.alignItems = "center";
    tile.style.fontSize = "0.95rem";
    tile.innerHTML = `<span>${idx + 1}. ${it.name}</span><span style="opacity:0.95">⭐ ${it.avg.toFixed(1)} (${it.votes})</span>`;
    wrap.appendChild(tile);
  });

  return wrap;
}

// --- Martina view ---
async function showMartinaMenu() {
  menuContainer.innerHTML = ""; // clear
  const menuData = await db.ref("menu").get().then(snap => snap.val() || {});
  const hasUnrated = Object.values(menuData).some(v => !v.rated);

  if (hasUnrated) {
    const stopCard = document.createElement("div");
    stopCard.className = "stop-card";
    stopCard.innerHTML = `
      <div class="stop-icon">⚠️</div>
      <p>Let Renato rate his latest plate first</p>
    `;
    stopCard.appendChild(createNavigationButton("Return to navigation"));
    menuContainer.appendChild(stopCard);
    return;
  }

  const plates = await loadPlates();

  if (!plates.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No plates available right now.";
    menuContainer.append(empty, createNavigationButton("Return to navigation"));
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
      document.querySelectorAll(".ingredient").forEach(t => t.classList.remove("checked"));
      tile.classList.add("checked");
      tile.querySelector("input").checked = true;
      selectedPlate = plate.id;
    });
    menuContainer.appendChild(tile);
  });

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save";
  saveBtn.onclick = async () => {
    if (!selectedPlate) return alert("Please select a plate!");
    // Save then redirect immediately
    await db.ref(`menu/${selectedPlate}`).set({
      timestamp: new Date().toISOString(),
      rated: false,
      comments: ""
    });
    // immediate redirect
    window.location.href = "../navigation.html";
  };
  menuContainer.appendChild(saveBtn);
}

// --- Renato view ---
async function showRenatoMenu() {
  menuContainer.innerHTML = ""; // clear

  const menuData = await db.ref("menu").get().then(snap => snap.val() || {});
  const unrated = Object.entries(menuData).find(([_, v]) => !v.rated);

  // if no unrated plate, show empty state + best voted block if any
  if (!unrated) {
    // empty image
    const emptyImg = document.createElement("img");
    emptyImg.src = "../assets/plates/000empty.png";
    emptyImg.className = "empty-image";
    menuContainer.appendChild(emptyImg);

    // title + empty message
    const title = document.createElement("h2");
    title.textContent = "Nothing to see here";
    menuContainer.appendChild(title);

    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = "Today's menu is not available yet! Try again later.";
    menuContainer.appendChild(emptyState);

    // nav button
    menuContainer.appendChild(createNavigationButton("Go Back"));

    // show best voted dishes from firebase (if any)
    const best = await getBestVotedFromFirebase();
    if (best.length) {
      const bestBlock = renderBestVotedBlock(best);
      menuContainer.appendChild(bestBlock);
    }

    return;
  }

  // There is an unrated plate: show rating UI
  const [plateId] = unrated;
  const plates = await loadPlates();
  const plateInfo = plates.find(p => p.id === plateId);

  // Create a content wrapper (to hide after submit)
  const contentWrapper = document.createElement("div");
  contentWrapper.id = "content";
  menuContainer.appendChild(contentWrapper);

  const menuTitle = document.createElement("h2");
  menuTitle.textContent = "Menu";
  contentWrapper.appendChild(menuTitle);

  // image (if available)
  if (plateInfo?.image) {
    const img = document.createElement("img");
    img.src = plateInfo.image;
    img.style.width = "200px";
    img.style.borderRadius = "12px";
    img.style.marginBottom = "10px";
    contentWrapper.appendChild(img);
  }

  const nameEl = document.createElement("p");
  nameEl.className = "plate-name";
  nameEl.textContent = plateInfo?.name || plateId;
  contentWrapper.appendChild(nameEl);

  const q = document.createElement("h2");
  q.textContent = "How would you rate your dish?";
  q.style.fontWeight = "500";
  q.style.fontSize = "1.2rem";
  contentWrapper.appendChild(q);

  // --- STARS (full-star only) ---
  const starsDiv = document.createElement("div");
  starsDiv.className = "stars";
  let rating = 0;
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("span");
    star.textContent = "★";
    star.style.userSelect = "none";
    star.addEventListener("click", () => {
      rating = i;
      starsDiv.querySelectorAll("span").forEach((s, j) => {
        s.classList.toggle("selected", j < i);
      });
    });
    starsDiv.appendChild(star);
  }
  contentWrapper.appendChild(starsDiv);

  const textarea = document.createElement("textarea");
  textarea.placeholder = "Additional comments...";
  contentWrapper.appendChild(textarea);

  const submitBtn = document.createElement("button");
  submitBtn.textContent = "Submit";
  submitBtn.addEventListener("click", async () => {
    if (!rating) return alert("Please rate the dish!");

    // hide content immediately (prevent double-click)
    contentWrapper.classList.add("fade-out");

    // update Firebase
    await db.ref(`menu/${plateId}`).update({
      rated: true,
      rating,
      comments: textarea.value || ""
    });

    // show best voted list briefly (optional) before redirect
    const best = await getBestVotedFromFirebase();
    if (best.length) {
      const bestBlock = renderBestVotedBlock(best);
      menuContainer.appendChild(bestBlock);
    }

    // quick confirmation (non-blocking)
    const msg = document.createElement("p");
    msg.textContent = "Thank you for your feedback!";
    msg.style.marginTop = "16px";
    msg.style.opacity = "0.95";
    menuContainer.appendChild(msg);

    // redirect shortly after (gives user a moment to see thank you)
    setTimeout(() => (window.location.href = "../navigation.html"), 900);
  });
  contentWrapper.appendChild(submitBtn);
}

// --- Main ---
if (username === "martina") {
  showMartinaMenu();
} else if (username === "renato") {
  showRenatoMenu();
}
