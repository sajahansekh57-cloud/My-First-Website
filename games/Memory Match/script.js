(() => {
  "use strict";

  // Keep this game's variables and functions scoped so they do not conflict
  // with Train Your Brain or other games on the website.
  const board = document.getElementById("board");
  const movesEl = document.getElementById("moves");
  const pairsEl = document.getElementById("pairs");
  const timeEl = document.getElementById("time");
  const messageEl = document.getElementById("message");
  const difficultyEl = document.getElementById("difficulty");
  const restartButton = document.getElementById("restartButton");
  const playAgainButton = document.getElementById("playAgainButton");
  const winPanel = document.getElementById("winPanel");
  const resultText = document.getElementById("resultText");

  if (!board || !movesEl || !pairsEl || !timeEl) return;

  const symbols = ["🍓", "🚀", "🐼", "🎸", "🌈", "⚽", "🍕", "🦊", "🌟", "🐸"];
  const pairCounts = { easy: 6, normal: 8, hard: 10 };
  const bestKey = "memoryMatchBestV1";

  let firstCard = null;
  let secondCard = null;
  let lockBoard = false;
  let moves = 0;
  let matchedPairs = 0;
  let totalPairs = pairCounts[difficultyEl.value] || 8;
  let seconds = 0;
  let timerId = null;
  let hasStarted = false;

  function formatTime(totalSeconds) {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const secs = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${secs}`;
  }

  function updateStats() {
    movesEl.textContent = String(moves);
    pairsEl.textContent = `${matchedPairs} / ${totalPairs}`;
    timeEl.textContent = formatTime(seconds);
  }

  function stopTimer() {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }

  function startTimer() {
    if (timerId !== null || !hasStarted) return;
    timerId = window.setInterval(() => {
      seconds += 1;
      timeEl.textContent = formatTime(seconds);
    }, 1000);
  }

  function shuffle(items) {
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  function createCard(symbol, index) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "card";
    button.dataset.symbol = symbol;
    button.dataset.index = String(index);
    button.setAttribute("aria-label", `Hidden card ${index + 1}`);
    button.innerHTML = `
      <span class="card-inner">
        <span class="card-face card-back" aria-hidden="true">?</span>
        <span class="card-face card-front" aria-hidden="true">${symbol}</span>
      </span>
    `;
    button.addEventListener("click", () => flipCard(button));
    return button;
  }

  function resetGame() {
    stopTimer();
    firstCard = null;
    secondCard = null;
    lockBoard = false;
    moves = 0;
    matchedPairs = 0;
    seconds = 0;
    hasStarted = false;
    totalPairs = pairCounts[difficultyEl.value] || 8;
    winPanel.hidden = true;
    messageEl.textContent = "Choose two cards to find a pair.";
    board.innerHTML = "";

    const deck = shuffle([...symbols.slice(0, totalPairs), ...symbols.slice(0, totalPairs)]);
    deck.forEach((symbol, index) => board.appendChild(createCard(symbol, index)));
    board.style.gridTemplateColumns = totalPairs === 10 ? "repeat(5, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))";
    updateStats();
  }

  function flipCard(card) {
    if (lockBoard || card.classList.contains("is-flipped") || card.classList.contains("is-matched")) return;

    if (!hasStarted) {
      hasStarted = true;
      startTimer();
    }

    card.classList.add("is-flipped");
    card.setAttribute("aria-label", `Card ${Number(card.dataset.index) + 1}: ${card.dataset.symbol}`);

    if (!firstCard) {
      firstCard = card;
      messageEl.textContent = "Pick one more card.";
      return;
    }

    secondCard = card;
    moves += 1;
    updateStats();

    if (firstCard.dataset.symbol === secondCard.dataset.symbol) {
      firstCard.classList.add("is-matched");
      secondCard.classList.add("is-matched");
      firstCard.disabled = true;
      secondCard.disabled = true;
      matchedPairs += 1;
      firstCard = null;
      secondCard = null;
      updateStats();

      if (matchedPairs === totalPairs) {
        finishGame();
      } else {
        messageEl.textContent = "Match found! Keep going.";
      }
      return;
    }

    lockBoard = true;
    messageEl.textContent = "Not a match. Try to remember them.";
    window.setTimeout(() => {
      if (firstCard) {
        firstCard.classList.remove("is-flipped");
        firstCard.setAttribute("aria-label", `Hidden card ${Number(firstCard.dataset.index) + 1}`);
      }
      if (secondCard) {
        secondCard.classList.remove("is-flipped");
        secondCard.setAttribute("aria-label", `Hidden card ${Number(secondCard.dataset.index) + 1}`);
      }
      firstCard = null;
      secondCard = null;
      lockBoard = false;
    }, 750);
  }

  function finishGame() {
    stopTimer();
    lockBoard = true;
    messageEl.textContent = "You matched every pair.";
    const movesBest = Number(localStorage.getItem(`${bestKey}_${difficultyEl.value}`));
    const isNewBest = !movesBest || moves < movesBest;
    if (isNewBest) {
      localStorage.setItem(`${bestKey}_${difficultyEl.value}`, String(moves));
    }
    resultText.textContent = `${moves} moves • ${formatTime(seconds)}${isNewBest ? " • New best moves!" : ""}`;
    winPanel.hidden = false;
  }

  restartButton.addEventListener("click", resetGame);
  playAgainButton.addEventListener("click", resetGame);
  difficultyEl.addEventListener("change", resetGame);

  resetGame();
})();
