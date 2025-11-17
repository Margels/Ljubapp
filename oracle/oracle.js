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

  // Fetch oracle game data
  const snapshot = await db.ref("oracle-game/questions").once("value");
  const data = snapshot.val();

  if (!data) return;

  let currentIndex = data.currentIndex;
  const currentQuestion = data[currentIndex];

  // Validate data
  if (!currentQuestion || !currentQuestion.timestamp) {
    showEmptyState(container);
    return;
  }

  // Convert timestamp to Date
  const questionTime = new Date(currentQuestion.timestamp);
  const now = new Date();

  // Conditions:
  // 1. not answered
  // 2. timestamp <= now
  const answered = currentQuestion.answerData?.answered === true;
  const timestampValid = questionTime <= now;

  if (!timestampValid || answered) {
    showEmptyState(container);
    return;
  }

  // If we reach here → show question
  showQuestionUI(container, currentQuestion, currentIndex);
});


// -----------------------------------------------------
// EMPTY STATE
// -----------------------------------------------------
function showEmptyState(container) {
  container.innerHTML = `
    <h1>No questions for you yet 💭</h1>
    <p class="description">
      Come back later for more future-predicting activities.
    </p>
  `;
}


// -----------------------------------------------------
// QUESTION UI
// -----------------------------------------------------
function showQuestionUI(container, questionObj, index) {
  // Keep the top points + description already in html
  // Append the question section
  const section = document.createElement("div");

  const shuffledOptions = shuffleArray(questionObj.answers.options);

  section.innerHTML = `
    <h2 style="margin-top: 2rem; font-size: 1.6rem;">${questionObj.question}</h2>

    <div id="answerOptions"></div>

    <button id="submitAnswer" disabled>Continue</button>
  `;

  container.appendChild(section);

  const optionsContainer = section.querySelector("#answerOptions");
  const submitButton = section.querySelector("#submitAnswer");

  let selectedAnswer = null;

  shuffledOptions.forEach((opt, i) => {
    const optionDiv = document.createElement("div");
    optionDiv.classList.add("ingredient"); // same styling as groceries
    optionDiv.textContent = opt;
    optionDiv.dataset.answer = opt;

    optionDiv.addEventListener("click", () => {
      selectedAnswer = opt;

      // Remove selection from all others
      optionsContainer.querySelectorAll(".ingredient").forEach(div => {
        div.classList.remove("checked");
      });

      // Mark current
      optionDiv.classList.add("checked");

      submitButton.disabled = false;
    });

    optionsContainer.appendChild(optionDiv);
  });

  // Submit answer
  submitButton.addEventListener("click", async () => {
    if (!selectedAnswer) return;

    // 1. Update Firebase currentIndex
    await firebase.database()
      .ref(`oracle-game/questions/currentIndex`)
      .set(index + 1);

    // 2. Save localStorage
    localStorage.setItem("currentGame", "oracle-game");

    // 3. Redirect
    window.location.href = "../result/result.html";
  });
}



// -----------------------------------------------------
// UTILITY — Shuffle
// -----------------------------------------------------
function shuffleArray(arr) {
  let a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
