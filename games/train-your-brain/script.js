
const $ = (id) => document.getElementById(id);

// HTML elements
const scoreEl = $("score");
const timerEl = $("timer");
const bestEl = $("bestScore");
const questionEl = $("question");
const answersEl = $("answers");
const feedbackEl = $("feedback");
const questionNumberEl = $("questionNumber");
const progressEl = $("progressBar");
const startButton = $("startButton");
const modeSelect = $("mode");
const soundToggle = $("soundToggle");
const resultOverlay = $("resultOverlay");

// Game settings
const TOTAL_QUESTIONS = 10;
const BEST_KEY = "trainYourBrainPersonalBest";

const levels = {
    easy: {
        time: 15,
        min: 1,
        max: 10,
        multiply: 10,
        points: 10
    },

    medium: {
        time: 12,
        min: 10,
        max: 50,
        multiply: 20,
        points: 20
    },

    hard: {
        time: 9,
        min: 20,
        max: 99,
        multiply: 30,
        points: 30
    }
};

let difficulty = "easy";
let score = 0;
let questionIndex = 0;
let correctCount = 0;
let timeLeft = 15;
let timerId = null;
let locked = true;
let soundOn = true;
let bestScore = readBest();

// Read saved personal best
function readBest() {
    try {
        return Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch (error) {
        return 0;
    }
}

// Save personal best
function saveBest(value) {
    try {
        localStorage.setItem(BEST_KEY, String(value));
    } catch (error) {
        // Game can still run if storage is unavailable.
    }
}

// Random number
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Shuffle answers
function shuffle(items) {
    for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [items[i], items[j]] = [items[j], items[i]];
    }

    return items;
}

// Simple sound effect
function beep(frequency = 660, duration = 0.09) {
    if (!soundOn) return;

    try {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        const ctx = new AudioContextClass();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.frequency.value = frequency;
        oscillator.type = "sine";

        gain.gain.value = 0.07;

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start();

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + duration
        );

        oscillator.stop(ctx.currentTime + duration);

        oscillator.onended = () => ctx.close();
    } catch (error) {
        // Sound is optional.
    }
}

// Change difficulty before starting a round
function setDifficulty(level) {
    if (!levels[level] || !locked) return;

    difficulty = level;

    document.querySelectorAll(".difficulty").forEach((button) => {
        button.classList.toggle(
            "active",
            button.dataset.level === level
        );
    });

    timeLeft = levels[difficulty].time;

    timerEl.textContent = `${timeLeft.toFixed(1)}s`;
    timerEl.classList.remove("warning", "danger");
}

// Generate a math question
function makeQuestion() {
    const level = levels[difficulty];

    const chosenMode = modeSelect.value === "mixed"
        ? [
            "addition",
            "subtraction",
            "multiplication",
            "division"
        ][rand(0, 3)]
        : modeSelect.value;

    let a;
    let b;
    let answer;
    let symbol;

    if (chosenMode === "addition") {
        a = rand(level.min, level.max);
        b = rand(level.min, level.max);

        answer = a + b;
        symbol = "+";

    } else if (chosenMode === "subtraction") {
        a = rand(level.min, level.max);
        b = rand(level.min, level.max);

        if (b > a) {
            [a, b] = [b, a];
        }

        answer = a - b;
        symbol = "−";

    } else if (chosenMode === "multiplication") {
        a = rand(1, level.multiply);
        b = rand(1, level.multiply);

        answer = a * b;
        symbol = "×";

    } else {
        b = rand(
            1,
            difficulty === "easy" ? 10 :
            difficulty === "medium" ? 20 : 30
        );

        answer = rand(
            1,
            difficulty === "easy" ? 10 :
            difficulty === "medium" ? 20 : 30
        );

        a = b * answer;
        symbol = "÷";
    }

    return {
        text: `${a} ${symbol} ${b} = ?`,
        answer: answer
    };
}

// Create four different answer options
function makeChoices(correct) {
    const choices = new Set([correct]);

    const spread = Math.max(
        5,
        Math.ceil(Math.abs(correct) * 0.35)
    );

    while (choices.size < 4) {
        let candidate = correct + rand(-spread, spread);

        if (candidate < 0) {
            candidate = Math.abs(candidate) + 1;
        }

        if (candidate !== correct) {
            choices.add(candidate);
        }
    }

    return shuffle([...choices]);
}

// Display a question
function renderQuestion() {
    locked = false;

    const question = makeQuestion();

    questionEl.textContent = question.text;
    questionEl.dataset.answer = String(question.answer);

    questionNumberEl.textContent = String(questionIndex + 1);

    progressEl.style.width =
        `${(questionIndex / TOTAL_QUESTIONS) * 100}%`;

    feedbackEl.textContent = "Choose the correct answer";
    feedbackEl.className = "feedback";

    answersEl.innerHTML = "";

    makeChoices(question.answer).forEach((choice) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "answer-button";
        button.textContent = String(choice);

        button.addEventListener("click", () => {
            chooseAnswer(button, choice);
        });

        answersEl.appendChild(button);
    });

    startButton.disabled = true;
    startButton.textContent = "Game in progress…";
}

// Check selected answer
function chooseAnswer(button, choice) {
    if (locked) return;

    locked = true;

    const correct = Number(questionEl.dataset.answer);

    const allButtons = [
        ...answersEl.querySelectorAll("button")
    ];

    allButtons.forEach((item) => {
        item.disabled = true;

        if (Number(item.textContent) === correct) {
            item.classList.add("correct");
        }
    });

    if (choice === correct) {
        correctCount++;

        score += levels[difficulty].points;

        scoreEl.textContent = String(score);

        feedbackEl.textContent = "Correct! Great thinking ✨";
        feedbackEl.className = "feedback correct";

        beep(820);

    } else {
        button.classList.add("wrong");

        feedbackEl.textContent =
            `Not quite — the answer is ${correct}`;

        feedbackEl.className = "feedback incorrect";

        beep(220, 0.14);
    }

    window.setTimeout(nextQuestion, 650);
}

// Start countdown timer
function startTimer() {
    clearInterval(timerId);

    timeLeft = levels[difficulty].time;

    timerEl.textContent = `${timeLeft.toFixed(1)}s`;

    timerId = window.setInterval(() => {
        if (locked) return;

        timeLeft = Math.max(0, timeLeft - 0.1);

        timerEl.textContent = `${timeLeft.toFixed(1)}s`;

        timerEl.classList.toggle(
            "warning",
            timeLeft <= 5 && timeLeft > 3
        );

        timerEl.classList.toggle(
            "danger",
            timeLeft <= 3
        );

        if (timeLeft <= 0) {
            locked = true;

            [
                ...answersEl.querySelectorAll("button")
            ].forEach((button) => {
                button.disabled = true;

                if (
                    Number(button.textContent) ===
                    Number(questionEl.dataset.answer)
                ) {
                    button.classList.add("correct");
                }
            });

            feedbackEl.textContent =
                `Time's up! Answer: ${questionEl.dataset.answer}`;

            feedbackEl.className = "feedback incorrect";

            beep(180, 0.16);

            window.setTimeout(nextQuestion, 650);
        }
    }, 100);
}


function nextQuestion() {
    questionIndex++;

    if (questionIndex >= TOTAL_QUESTIONS) {
        finishGame();
        return;
    }

    // Reset timer for the next question
    clearInterval(timerId);
    timeLeft = levels[difficulty].time;

    timerEl.textContent = `${timeLeft.toFixed(1)}s`;
    timerEl.classList.remove("warning", "danger");

    startTimer();
    renderQuestion();
}

// Start or restart the game
function startGame() {
    clearInterval(timerId);

    resultOverlay.classList.add("hidden");

    score = 0;
    correctCount = 0;
    questionIndex = 0;

    scoreEl.textContent = "0";

    bestEl.textContent = String(bestScore);

    progressEl.style.width = "0%";

    timerEl.classList.remove("warning", "danger");

    startTimer();
    renderQuestion();
}

// Show the final result
function finishGame() {
    clearInterval(timerId);

    locked = true;

    progressEl.style.width = "100%";

    startButton.disabled = false;
    startButton.textContent = "Start Game →";

    const isNewBest = score > bestScore;

    if (isNewBest) {
        bestScore = score;
        saveBest(bestScore);
    }

    bestEl.textContent = String(bestScore);

    $("finalScore").textContent = String(score);

    $("accuracy").textContent =
        `${Math.round((correctCount / TOTAL_QUESTIONS) * 100)}%`;

    $("resultBest").textContent = String(bestScore);

    $("newBest").classList.toggle("hidden", !isNewBest);

    $("resultEmoji").textContent = isNewBest
        ? "🏆"
        : score >= TOTAL_QUESTIONS * levels[difficulty].points * 0.7
            ? "🎉"
            : "🧠";

    $("resultTitle").textContent = isNewBest
        ? "New personal best!"
        : score >= TOTAL_QUESTIONS * levels[difficulty].points * 0.7
            ? "Amazing work!"
            : "Keep practising!";

    $("resultMessage").textContent =
        `${correctCount} out of ${TOTAL_QUESTIONS} answers correct. ` +
        "Play again to improve your score.";

    resultOverlay.classList.remove("hidden");

    beep(isNewBest ? 980 : 620, 0.18);
}

// Difficulty buttons
document.querySelectorAll(".difficulty").forEach((button) => {
    button.addEventListener("click", () => {
        setDifficulty(button.dataset.level);
    });
});

// Start and restart buttons
startButton.addEventListener("click", startGame);

$("playAgain").addEventListener("click", startGame);

// Sound toggle
soundToggle.addEventListener("click", () => {
    soundOn = !soundOn;

    soundToggle.textContent = soundOn
        ? "🔊 Sound On"
        : "🔇 Sound Off";

    if (soundOn) {
        beep(660);
    }
});

// Mode selector
modeSelect.addEventListener("change", () => {
    if (locked) {
        feedbackEl.textContent =
            "Press Start Game when you're ready";
    }
});

// Initial display
bestEl.textContent = String(bestScore);

timerEl.textContent =
    `${levels[difficulty].time.toFixed(1)}s`;

$("questionTotal").textContent = String(TOTAL_QUESTIONS);


$("backToGame").addEventListener("click", () => {
    clearInterval(timerId);

    resultOverlay.classList.add("hidden");

    // Return to the initial game screen
    locked = true;
    score = 0;
    correctCount = 0;
    questionIndex = 0;
    timeLeft = levels[difficulty].time;

    scoreEl.textContent = "0";
    timerEl.textContent = `${timeLeft.toFixed(1)}s`;
    bestEl.textContent = String(bestScore);

    timerEl.classList.remove("warning", "danger");
    progressEl.style.width = "0%";

    questionEl.textContent = "Ready to play?";
    feedbackEl.textContent = "Press Start Game when you're ready";
    feedbackEl.className = "feedback";

    answersEl.innerHTML = "";

    questionNumberEl.textContent = "1";

    startButton.disabled = false;
    startButton.textContent = "Start Game →";
});



/* =====================================
   DAILY CHALLENGE - FIXED VERSION
===================================== */

const challengeButton = $("challengeButton");

const CHALLENGE_KEY = "trainYourBrainDailyChallenge";
const CHALLENGE_TIME = 210;
const CHALLENGE_TOTAL = 10;

let challengeMode = false;
let challengeFinished = false;
let challengeDay = 1;
let challengeSeconds = CHALLENGE_TIME;
let challengeTimerId = null;

function todayKey() {
    const d = new Date();

    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0")
    ].join("-");
}

function readChallenge() {
    try {
        return JSON.parse(localStorage.getItem(CHALLENGE_KEY)) || {
            unlockedDay: 1,
            lastAttemptDate: "",
            lastCompletedDate: "",
            lastScore: 0,
            lastAccuracy: 0
        };
    } catch (error) {
        return {
            unlockedDay: 1,
            lastAttemptDate: "",
            lastCompletedDate: "",
            lastScore: 0,
            lastAccuracy: 0
        };
    }
}

function writeChallenge(data) {
    try {
        localStorage.setItem(CHALLENGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Challenge progress could not be saved.");
    }
}

function updateChallengeButton() {
    if (!challengeButton) return;

    const data = readChallenge();
    const today = todayKey();
    const attemptedToday = data.lastAttemptDate === today;

    challengeButton.textContent = attemptedToday
        ? `🔒 Day ${data.unlockedDay} Completed Today`
        : `🏆 Daily Challenge · Day ${data.unlockedDay}`;

    challengeButton.disabled = attemptedToday;
}

function showBlastTransition(callback) {
    const app = document.querySelector(".app");

    if (!app) {
        callback();
        return;
    }

    app.classList.remove("blast-in");
    app.classList.add("blast-out");

    window.setTimeout(() => {
        callback();

        app.classList.remove("blast-out");
        app.classList.add("blast-in");

        window.setTimeout(() => {
            app.classList.remove("blast-in");
        }, 700);
    }, 650);
}

function startDailyChallenge() {
    const data = readChallenge();
    const today = todayKey();

    if (data.lastAttemptDate === today) {
        alert("Today's Challenge is locked. Come back tomorrow!");
        updateChallengeButton();
        return;
    }

    // Save the attempt immediately: leaving the game
    // will not allow another attempt on the same date.
    data.lastAttemptDate = today;
    writeChallenge(data);

    challengeDay = data.unlockedDay;
    challengeMode = true;
    challengeFinished = false;
    challengeSeconds = CHALLENGE_TIME;

    showBlastTransition(() => {
        clearInterval(timerId);
        clearInterval(challengeTimerId);

        score = 0;
        correctCount = 0;
        questionIndex = 0;
        locked = true;

        difficulty = "easy";
        modeSelect.value = "mixed";

        document.querySelectorAll(".difficulty").forEach((button) => {
            button.classList.toggle(
                "active",
                button.dataset.level === "easy"
            );
        });

        scoreEl.textContent = "0";
        questionNumberEl.textContent = "1";
        $("questionTotal").textContent = String(CHALLENGE_TOTAL);

        progressEl.style.width = "0%";
        resultOverlay.classList.add("hidden");

        // Challenge heading and UI
        const heading = document.querySelector(".game-heading h1");
        if (heading) {
            heading.textContent = `🏆 Daily Challenge — Day ${challengeDay}`;
        }

        const settings = document.querySelector(".settings-row");
        if (settings) settings.classList.add("challenge-hidden");

        if (challengeButton) {
            challengeButton.classList.add("challenge-hidden");
        }

        startButton.disabled = true;
        startButton.textContent = "Challenge in progress…";

        feedbackEl.textContent = "Answer all 10 questions before time runs out!";
        feedbackEl.className = "feedback";

        renderQuestion();
        startChallengeTimer();
        updateChallengeButton();
    });
}

function startChallengeTimer() {
    clearInterval(challengeTimerId);

    challengeSeconds = CHALLENGE_TIME;
    updateChallengeTimer();

    challengeTimerId = window.setInterval(() => {
        if (locked || challengeFinished) return;

        challengeSeconds = Math.max(0, challengeSeconds - 1);
        updateChallengeTimer();

        if (challengeSeconds <= 0) {
            finishDailyChallenge(false);
        }
    }, 1000);
}

function updateChallengeTimer() {
    const mins = Math.floor(challengeSeconds / 60);
    const secs = challengeSeconds % 60;

    timerEl.textContent =
        `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    timerEl.classList.toggle(
        "warning",
        challengeSeconds <= 30 && challengeSeconds > 10
    );

    timerEl.classList.toggle("danger", challengeSeconds <= 10);
}

function nextDailyQuestion() {
    if (challengeFinished) return;

    questionIndex++;

    if (questionIndex >= CHALLENGE_TOTAL) {
        finishDailyChallenge(true);
        return;
    }

    renderQuestion();
}

function finishDailyChallenge(completed) {
    if (challengeFinished) return;

    challengeFinished = true;
    locked = true;

    clearInterval(timerId);
    clearInterval(challengeTimerId);

    answersEl.querySelectorAll("button").forEach((button) => {
        button.disabled = true;
    });

    const data = readChallenge();

    data.lastScore = score;
    data.lastAccuracy = Math.round(
        (correctCount / CHALLENGE_TOTAL) * 100
    );

    if (completed) {
        data.lastCompletedDate = todayKey();
        data.unlockedDay = challengeDay + 1;
    }

    writeChallenge(data);

    $("finalScore").textContent = String(score);
    $("accuracy").textContent = `${data.lastAccuracy}%`;
    $("resultBest").textContent = String(bestScore);

    $("resultTitle").textContent = completed
        ? `Day ${challengeDay} Complete!`
        : "Challenge Failed";

    $("resultEmoji").textContent = completed ? "🏆" : "⏰";

    $("resultMessage").textContent = completed
        ? `You finished all ${CHALLENGE_TOTAL} questions! Your next challenge unlocks tomorrow.`
        : "Time ran out. Your attempt is used for today. Try again tomorrow.";

    $("newBest").classList.add("hidden");

    resultOverlay.classList.remove("hidden");

    updateChallengeButton();
}

// Challenge-specific answer progression
const normalChooseAnswer = chooseAnswer;

chooseAnswer = function(button, choice) {
    if (challengeMode) {
        if (locked || challengeFinished) return;

        locked = true;

        const correct = Number(questionEl.dataset.answer);

        answersEl.querySelectorAll("button").forEach((item) => {
            item.disabled = true;

            if (Number(item.textContent) === correct) {
                item.classList.add("correct");
            }
        });

        if (choice === correct) {
            correctCount++;
            score += 10;

            scoreEl.textContent = String(score);

            feedbackEl.textContent = "Correct! ✨";
            feedbackEl.className = "feedback correct";

            beep(820);
        } else {
            button.classList.add("wrong");

            feedbackEl.textContent = `Correct answer: ${correct}`;
            feedbackEl.className = "feedback incorrect";

            beep(220, 0.14);
        }

        window.setTimeout(nextDailyQuestion, 450);
        return;
    }

    normalChooseAnswer(button, choice);
};

// Replace the normal Start Game behaviour during Challenge
const normalStartGame = startGame;

startGame = function() {
    if (challengeMode) return;
    normalStartGame();
};

// Return to normal game after the Challenge result
$("backToGame").addEventListener("click", () => {
    if (!challengeMode) return;

    showBlastTransition(() => {
        clearInterval(timerId);
        clearInterval(challengeTimerId);

        challengeMode = false;
        challengeFinished = true;
        locked = true;

        resultOverlay.classList.add("hidden");

        const heading = document.querySelector(".game-heading h1");
        if (heading) {
            heading.textContent = "Ready to train your brain?";
        }

        const settings = document.querySelector(".settings-row");
        if (settings) settings.classList.remove("challenge-hidden");

        if (challengeButton) {
            challengeButton.classList.remove("challenge-hidden");
        }

        score = 0;
        correctCount = 0;
        questionIndex = 0;

        scoreEl.textContent = "0";
        questionNumberEl.textContent = "1";
        $("questionTotal").textContent = String(TOTAL_QUESTIONS);

        progressEl.style.width = "0%";
        timerEl.classList.remove("warning", "danger");
        timerEl.textContent = `${levels[difficulty].time.toFixed(1)}s`;

        questionEl.textContent = "Ready to play?";
        feedbackEl.textContent = "Press Start Game when you're ready";
        feedbackEl.className = "feedback";

        answersEl.innerHTML = "";

        startButton.disabled = false;
        startButton.textContent = "Start Game →";

        updateChallengeButton();
    });
});

// Play Again starts normal mode after a Challenge result.
// The used daily attempt cannot be repeated.
$("playAgain").addEventListener("click", () => {
    if (!challengeMode) return;

    alert("Today's Challenge is finished. Come back tomorrow!");
});

if (challengeButton) {
    challengeButton.addEventListener("click", startDailyChallenge);
}

updateChallengeButton();
