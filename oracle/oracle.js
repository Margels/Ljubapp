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


document.addEventListener("DOMContentLoaded", async () => {
  const container = document.querySelector(".oracle-container");

  // Load username
  const username = localStorage.getItem("playerName");
  if (!username) {
    container.innerHTML = `<h1>Error</h1><p>No username found.</p>`;
    return;
  }

  // Load user points
  const userSnapshot = await db.ref(`users/${username}/points`).once("value");
  const userPoints = userSnapshot.val() ?? 0;

  // Load oracle data
  const snapshot = await db.ref("oracle-game/questions").once("value");
  const data = snapshot.val();

  if (!data) {
    container.innerHTML = `<h1>Error loading game</h1>`;
    return;
  }

  let currentIndex = data.currentIndex;
  const question = data[currentIndex];

  if (!question || !question.timestamp) {
    showEmpty(container);
    return;
  }

  const now = new Date();
  const unlockTime = new Date(question.timestamp);
  const answered = question.answerData?.answered === true;

  if (answered || now < unlockTime) {
    showEmpty(container);
    return;
  }

  renderPage(container, question, userPoints, currentIndex);
});


// ---------------------------------------------------
// EMPTY STATE
// ---------------------------------------------------
function showEmpty(container) {
  container.innerHTML = `
    <h1>No questions for you yet 💭</h1>
    <p class="description">Come back later for more future-predicting activities.</p>
  `;
}



// ---------------------------------------------------
// MAIN PAGE
// ---------------------------------------------------
function renderPage(container, questionObj, points, index) {
  container.innerHTML = `
    <h1>Have you been paying attention? 👂🏻</h1>

    <p class="description">
      Listen and watch carefully: <strong>your opponent has been dropping hints about what will happen next</strong>! 
      Use this information to answer the question below and win 5 points 🔮 <br><br>
      Careful: some hints might be lies! If you're wrong, your opponent earns 5 points. <br><br>
      If you choose the close answer, both of you earn <strong>2 points</strong>. <br><br>
      Good luck, Oracle!
    </p>

    <h2 id="pointsLabel">Points: <span id="pointsValue">${points}</span></h2>

    <h2 style="margin-top: 2rem; font-size: 1.6rem;">${questionObj.question}</h2>

    <div id="answerOptions"></div>

    <button id="submitAnswer" disabled>Continue</button>
  `;

  const optionsContainer = container.querySelector("#answerOptions");
  const submitButton = container.querySelector("#submitAnswer");

  const shuffled = shuffleArray(questionObj.answers.options);
  let selected = null;

  shuffled.forEach(answer => {
    const div = document.createElement("div");
    div.className = "answer-tile";
    div.textContent = answer;

    div.addEventListener("click", () => {
      selected = answer;

      optionsContainer.querySelectorAll(".answer-tile")
        .forEach(t => t.classList.remove("checked"));

      div.classList.add("checked");
      submitButton.disabled = false;
    });

    optionsContainer.appendChild(div);
  });

  // ---------------------------------------------------
  // SUBMIT logic with Firebase writes
  // ---------------------------------------------------
  submitButton.addEventListener("click", async () => {
    if (!selected) return;

    const correct = questionObj.answers.correct;
    const close = questionObj.answers.close;

    let winner = "";
    let maxPoints = 0;

    const martinaRef = db.ref("users/Martina/points");
    const martinaPointsSnap = await martinaRef.once("value");
    let martinaPoints = martinaPointsSnap.val() ?? 0;

    // Determine result
    if (selected === correct) {
      winner = "Renato";
      maxPoints = 5;
      
      if (username === "Renato") {
        localStorage.setItem("userPoints", 5);
        }

    } else if (selected === close) {
      winner = "Both";
      maxPoints = 2;

      martinaPoints += 2;
      if (username === "Renato") {
        localStorage.setItem("userPoints", 2);
        }

    } else {
      winner = "Martina";
      maxPoints = 5;

      martinaPoints += 5;
    }

    // Write game summary
    await db.ref("oracle-game/questions/" + index + "/gameSummary").set({
      winner,
      maxPoints
    });

    // Save Martina points automatically
    await martinaRef.set(martinaPoints);

    // Move to next question
    await db.ref("oracle-game/questions/currentIndex").set(index + 1);

    // Store selected answer for result page
    localStorage.setItem("oracle-answer-picked", selected);
    localStorage.setItem("currentGame", "oracle-game/questions/" + index);

    window.location.href = "../result/result.html";
  });
}



// ---------------------------------------------------
// SHUFFLE
// ---------------------------------------------------
function shuffleArray(arr) {
  let a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
