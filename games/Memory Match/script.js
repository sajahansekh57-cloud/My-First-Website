
(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  const board = $("board");
  const movesEl = $("moves");
  const pairsEl = $("pairs");
  const timeEl = $("time");
  const cardCountEl = $("cardCount");
  const scoreEl = $("score");
  const messageEl = $("message");

  const restartButton = $("restartButton");
  const challengeButton = $("challengeButton");
  const playAgainButton = $("playAgainButton");
  const backToGameButton = $("backToGame");

  const winPanel = $("winPanel");
  const resultTitle = $("resultTitle");
  const resultText = $("resultText");

  const challengeInfo = $("challengeInfo");
  const challengeDate = $("challengeDate");
  const challengeStatus = $("challengeStatus");

  const boomOverlay = $("boomOverlay");
  const gamePanel = document.querySelector(".game-panel");

  if (
    !board || !movesEl || !pairsEl || !timeEl ||
    !messageEl || !winPanel || !restartButton ||
    !playAgainButton
  ) {
    console.error("Memory Match: Required HTML elements are missing.");
    return;
  }

  const symbols = [
    "🍓", "🚀", "🐼", "🎸", "🌈", "⚽",
    "🍕", "🦊", "🌟", "🐸", "🐵", "🍉"
  ];

  const MAX_CARDS = 12;
  const MAX_LEVEL = 30;
  const MAX_HEARTS = 3;
  const PREVIEW_SECONDS = 3;
  const POINTS_PER_PAIR = 20;

  const DAILY_KEY = "memoryMatchDailyV5";
  const BEST_KEY = "memoryMatchBestV5";

  let level = 1;
  let totalCards = 2;
  let moves = 0;
  let score = 0;
  let hearts = MAX_HEARTS;
  let seconds = 0;
  let matchedPairs = 0;

  let firstCard = null;
  let secondCard = null;

  let lockBoard = true;
  let previewActive = false;
  let gameFinished = false;
  let levelCompleted = false;
  let isDailyChallenge = false;

  let timerId = null;
  let previewId = null;
  let mismatchTimeout = null;
  let boomTimeout = null;
  let levelTimeout = null;
  let roundToken = 0;

  // Create missing supporting elements if needed.
  let heartsEl = $("hearts");

  if (!heartsEl) {
    heartsEl = document.createElement("div");
    heartsEl.id = "hearts";
    heartsEl.className = "hearts";
    heartsEl.setAttribute("aria-live", "polite");

    const stats = document.querySelector(".stats");
    if (stats) {
      stats.insertAdjacentElement("afterend", heartsEl);
    } else {
      board.insertAdjacentElement("beforebegin", heartsEl);
    }
  }

  let previewEl = $("previewCountdown");

  if (!previewEl) {
    previewEl = document.createElement("div");
    previewEl.id = "previewCountdown";
    previewEl.className = "preview-countdown";
    previewEl.setAttribute("aria-live", "polite");
    previewEl.hidden = true;
    heartsEl.insertAdjacentElement("afterend", previewEl);
  }

  let levelEl = $("level");

  if (!levelEl) {
    levelEl = document.createElement("div");
    levelEl.id = "level";
    levelEl.className = "level-display";
    levelEl.setAttribute("aria-live", "polite");
    previewEl.insertAdjacentElement("afterend", levelEl);
  }

  // Local date, formatted as YYYY-MM-DD.
  function todayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function formatTime(value) {
    const minutes = String(Math.floor(value / 60)).padStart(2, "0");
    const secs = String(value % 60).padStart(2, "0");

    return `${minutes}:${secs}`;
  }

  function readDailyRecord() {
    try {
      const data = JSON.parse(localStorage.getItem(DAILY_KEY) || "{}");
      return data && typeof data === "object" ? data : {};
    } catch {
      return {};
    }
  }

  function hasCompletedDaily() {
    return Object.prototype.hasOwnProperty.call(
      readDailyRecord(),
      todayKey()
    );
  }

  function saveDailyResult() {
    const data = readDailyRecord();

    data[todayKey()] = {
      completed: true,
      score,
      level,
      seconds
    };

    try {
      localStorage.setItem(DAILY_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Could not save daily result.", error);
    }
  }

  function updateChallengeInfo() {
    if (!challengeInfo || !challengeDate || !challengeStatus) return;

    challengeInfo.hidden = !isDailyChallenge;

    if (isDailyChallenge) {
      challengeDate.textContent = `Date: ${todayKey()}`;
      challengeStatus.textContent = hasCompletedDaily()
        ? "Today's challenge completed"
        : "Daily Challenge in progress";
    }
  }

  function updateStats() {
    movesEl.textContent = String(moves);
    pairsEl.textContent = `${matchedPairs} / ${totalCards / 2}`;
    timeEl.textContent = formatTime(seconds);

    if (cardCountEl) {
      cardCountEl.textContent = `${totalCards} / ${MAX_CARDS}`;
    }

    if (scoreEl) {
      scoreEl.textContent = String(score);
    }

    heartsEl.textContent =
      "❤️".repeat(hearts) + "🖤".repeat(MAX_HEARTS - hearts);

    heartsEl.setAttribute(
      "aria-label",
      `${hearts} of ${MAX_HEARTS} hearts remaining`
    );

    levelEl.textContent = `LEVEL ${level} / ${MAX_LEVEL}`;
  }

  function clearTimers() {
    if (timerId !== null) clearInterval(timerId);
    if (previewId !== null) clearInterval(previewId);
    if (mismatchTimeout !== null) clearTimeout(mismatchTimeout);
    if (boomTimeout !== null) clearTimeout(boomTimeout);
    if (levelTimeout !== null) clearTimeout(levelTimeout);

    timerId = null;
    previewId = null;
    mismatchTimeout = null;
    boomTimeout = null;
    levelTimeout = null;
  }

  function startTimer() {
    if (
      timerId !== null ||
      gameFinished ||
      previewActive ||
      levelCompleted
    ) {
      return;
    }

    timerId = window.setInterval(() => {
      if (gameFinished || levelCompleted || previewActive) return;

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
    const card = document.createElement("button");

    card.type = "button";
    card.className = "card is-flipped";
    card.dataset.symbol = symbol;
    card.dataset.index = String(index);

    card.setAttribute("aria-label", `Preview card ${index + 1}`);

    card.innerHTML = `
      <span class="card-inner">
        <span class="card-face card-back" aria-hidden="true">?</span>
        <span class="card-face card-front" aria-hidden="true">${symbol}</span>
      </span>
    `;

    card.addEventListener("click", () => flipCard(card));

    return card;
  }

  function renderBoard() {
    board.innerHTML = "";

    const pairCount = totalCards / 2;
    const chosenSymbols = symbols.slice(0, pairCount);
    const deck = shuffle([...chosenSymbols, ...chosenSymbols]);

    deck.forEach((symbol, index) => {
      board.appendChild(createCard(symbol, index));
    });

    const columns = totalCards <= 4 ? 2 : 4;

    board.style.gridTemplateColumns =
      `repeat(${columns}, minmax(0, 1fr))`;
  }

  function showAllCards() {
    board.querySelectorAll(".card").forEach(card => {
      card.classList.add("is-flipped");

      card.setAttribute(
        "aria-label",
        `Preview card ${Number(card.dataset.index) + 1}: ${card.dataset.symbol}`
      );
    });
  }

  function hideAllCards() {
    board.querySelectorAll(".card").forEach(card => {
      if (card.classList.contains("is-matched")) return;

      card.classList.remove("is-flipped");

      card.setAttribute(
        "aria-label",
        `Hidden card ${Number(card.dataset.index) + 1}`
      );
    });
  }

  function startPreview() {
    if (gameFinished || levelCompleted) return;

    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }

    if (previewId !== null) {
      clearInterval(previewId);
      previewId = null;
    }

    previewActive = true;
    lockBoard = true;

    let remaining = PREVIEW_SECONDS;
    const currentToken = roundToken;

    previewEl.hidden = false;
    previewEl.textContent = `MEMORIZE THE CARDS: ${remaining}`;

    showAllCards();

    previewId = window.setInterval(() => {
      if (currentToken !== roundToken) return;

      remaining -= 1;

      if (remaining > 0) {
        previewEl.textContent = `MEMORIZE THE CARDS: ${remaining}`;
        return;
      }

      clearInterval(previewId);
      previewId = null;

      hideAllCards();
      previewEl.hidden = true;
      previewActive = false;
      lockBoard = false;

      messageEl.textContent = "Find the matching pairs!";
      startTimer();
    }, 1000);
  }

  function resetGame(daily = false) {
    roundToken += 1;
    clearTimers();

    level = 1;
    totalCards = 2;
    moves = 0;
    score = 0;
    hearts = MAX_HEARTS;
    seconds = 0;
    matchedPairs = 0;

    firstCard = null;
    secondCard = null;

    lockBoard = true;
    previewActive = false;
    gameFinished = false;
    levelCompleted = false;
    isDailyChallenge = daily;

    winPanel.hidden = true;
    previewEl.hidden = true;

    if (boomOverlay) boomOverlay.hidden = true;
    if (gamePanel) gamePanel.classList.remove("game-over");

    restartButton.disabled = false;
    playAgainButton.disabled = false;
    playAgainButton.textContent = "Play Again";

    if (challengeButton) {
      challengeButton.disabled = hasCompletedDaily();
    }

    messageEl.textContent = "Remember the cards!";

    renderBoard();
    updateStats();
    updateChallengeInfo();
    startPreview();
  }

  function flipCard(card) {
    if (
      lockBoard ||
      previewActive ||
      gameFinished ||
      levelCompleted ||
      card.classList.contains("is-flipped") ||
      card.classList.contains("is-matched")
    ) {
      return;
    }

    card.classList.add("is-flipped");

    card.setAttribute(
      "aria-label",
      `Card ${Number(card.dataset.index) + 1}: ${card.dataset.symbol}`
    );

    if (!firstCard) {
      firstCard = card;
      messageEl.textContent = "Choose the second card.";
      return;
    }

    secondCard = card;
    moves += 1;
    lockBoard = true;

    if (firstCard.dataset.symbol === secondCard.dataset.symbol) {
      firstCard.classList.add("is-matched");
      secondCard.classList.add("is-matched");

      firstCard.disabled = true;
      secondCard.disabled = true;

      matchedPairs += 1;
      score += POINTS_PER_PAIR;

      firstCard = null;
      secondCard = null;

      updateStats();

      if (matchedPairs === totalCards / 2) {
        completeLevel();
      } else {
        lockBoard = false;
        messageEl.textContent = "Correct pair! Keep going.";
      }

      return;
    }

    hearts -= 1;
    updateStats();

    messageEl.textContent = "Not a match!";

    const currentToken = roundToken;

    mismatchTimeout = window.setTimeout(() => {
      if (currentToken !== roundToken || gameFinished) return;

      [firstCard, secondCard].forEach(cardToHide => {
        if (!cardToHide) return;

        cardToHide.classList.remove("is-flipped");

        cardToHide.setAttribute(
          "aria-label",
          `Hidden card ${Number(cardToHide.dataset.index) + 1}`
        );
      });

      firstCard = null;
      secondCard = null;
      mismatchTimeout = null;

      if (hearts <= 0) {
        finishGame();
      } else {
        lockBoard = false;
        messageEl.textContent = "Wrong pair! One heart lost. Try again.";
      }
    }, 650);
  }

  function completeLevel() {
    clearTimers();

    levelCompleted = true;
    lockBoard = true;
    previewActive = false;

    winPanel.hidden = false;

    if (resultTitle) {
      resultTitle.textContent = level >= MAX_LEVEL
        ? "YOU WON THE GAME! 🏆"
        : "GREAT! 🎉";
    }

    if (resultText) {
      resultText.textContent =
        `+${POINTS_PER_PAIR * (totalCards / 2)} points this level. ` +
        `Total score: ${score} • Level ${level} • Time ${formatTime(seconds)}`;
    }

    playAgainButton.textContent =
      level >= MAX_LEVEL ? "Play Again" : "Next Level";

    restartButton.disabled = true;

    messageEl.textContent = level >= MAX_LEVEL
      ? "Congratulations! You completed every level."
      : "Level completed! Press Next Level.";

    if (level >= MAX_LEVEL) {
      gameFinished = true;

      if (isDailyChallenge) {
        saveDailyResult();
      }

      saveBestScore();
      updateChallengeInfo();
    }
  }

  function nextLevel() {
    if (!levelCompleted || gameFinished) return;

    if (level >= MAX_LEVEL) {
      resetGame(false);
      return;
    }

    roundToken += 1;
    clearTimers();

    level += 1;

    // Level 1: 2 cards; Level 2: 4; Level 3: 6 ...
    // Maximum: 12 cards.
    totalCards = Math.min(level * 2, MAX_CARDS);

    moves = 0;
    matchedPairs = 0;
    firstCard = null;
    secondCard = null;

    lockBoard = true;
    previewActive = false;
    levelCompleted = false;

    winPanel.hidden = true;
    playAgainButton.textContent = "Play Again";
    restartButton.disabled = false;

    if (boomOverlay) boomOverlay.hidden = true;
    if (gamePanel) gamePanel.classList.remove("game-over");

    renderBoard();
    updateStats();

    messageEl.textContent = `Level ${level}: memorize the cards!`;

    startPreview();
  }

  function saveBestScore() {
    try {
      const previous = JSON.parse(localStorage.getItem(BEST_KEY) || "{}");

      if (!Number.isFinite(previous.score) || score > previous.score) {
        localStorage.setItem(
          BEST_KEY,
          JSON.stringify({
            score,
            level,
            seconds,
            date: todayKey()
          })
        );
      }
    } catch (error) {
      console.error("Could not save best score.", error);
    }
  }

  function finishGame() {
    if (gameFinished) return;

    clearTimers();

    gameFinished = true;
    levelCompleted = false;
    lockBoard = true;
    previewActive = false;

    if (gamePanel) gamePanel.classList.add("game-over");
    if (boomOverlay) boomOverlay.hidden = false;

    if (resultTitle) resultTitle.textContent = "GAME OVER!";

    if (resultText) {
      resultText.textContent =
        `Level ${level} • Score ${score} • Time ${formatTime(seconds)}`;
    }

    winPanel.hidden = true;

    restartButton.disabled = true;
    playAgainButton.disabled = false;

    if (challengeButton) challengeButton.disabled = true;

    saveBestScore();

    if (isDailyChallenge) {
      saveDailyResult();
    }

    updateChallengeInfo();

    const currentToken = roundToken;

    boomTimeout = window.setTimeout(() => {
      if (currentToken !== roundToken) return;

      if (boomOverlay) boomOverlay.hidden = true;

      winPanel.hidden = false;
      boomTimeout = null;
    }, 1000);
  }

  restartButton.addEventListener("click", () => {
    resetGame(isDailyChallenge);
  });

  playAgainButton.addEventListener("click", () => {
    if (levelCompleted && !gameFinished) {
      nextLevel();
    } else {
      resetGame(false);
    }
  });

  if (backToGameButton) {
    backToGameButton.addEventListener("click", () => {
      resetGame(false);
    });
  }

  if (challengeButton) {
    challengeButton.addEventListener("click", () => {
      if (hasCompletedDaily()) {
        messageEl.textContent =
          "Today's Daily Challenge has already been completed.";
        return;
      }

      resetGame(true);
    });
  }

  // Start the first game.
  resetGame(false);
})();
