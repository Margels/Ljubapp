async function endGame() {
  const endBtn = document.getElementById("endBtn");
  endBtn.disabled = true;
  endBtn.style.opacity = "0.5";
  endBtn.textContent = "Waiting for opponent...";

  const playerRef = db.ref("results/" + username);

  // Save player's result
  await playerRef.set({
    points,
    finished: true
  });

  // Check all results
  const resultsSnap = await db.ref("results").once("value");
  const results = resultsSnap.val() || {};

  const allFinished = Object.values(results).every(p => p.finished);
  if (allFinished && Object.keys(results).length >= 2) {
    // Determine winner
    let winner = "Nobody";
    let maxPoints = 0;
    for (const [name, data] of Object.entries(results)) {
      if (data.points > maxPoints) {
        maxPoints = data.points;
        winner = name;
      }
    }

    // Save global summary
    await db.ref("gameSummary").set({ winner, maxPoints });
  }

  // Listen for game summary and redirect everyone when ready
  db.ref("gameSummary").on("value", snapshot => {
    const summary = snapshot.val();
    if (summary) {
      localStorage.setItem("playerName", username);
      localStorage.setItem("userPoints", points);
      window.location.href = "result.html";
    }
  });
}

