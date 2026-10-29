
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

/* =========================================
   FIREBASE
========================================= */

const firebaseConfig = {
  apiKey: "AIzaSyA5WKh6tXIXLFxWAwmY1z5bBBPV8DVJPUM",
  authDomain: "gamehub-for-sajahan.firebaseapp.com",
  projectId: "gamehub-for-sajahan",
  storageBucket: "gamehub-for-sajahan.firebasestorage.app",
  messagingSenderId: "610152819687",
  appId: "1:610152819687:web:d6b531420d1136e13aab42",
  measurementId: "G-EBBQQB06WH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

let currentUser = null;
let guestProfile = loadGuestProfile();
let recentIds = loadRecent();
let activeSection = "home";
let activeCategory = "";

/* =========================================
   CENTRAL GAME REGISTRY
   Add new games to this array.
========================================= */

const games = [
  {
    id: "train-your-brain",
    title: "Train Your Brain",
    category: "Puzzle",
    type: "Featured",
    emoji: "🧠",
    color: "color-2",
    rating: "4.8",
    url: "games/train-your-brain/index.html"
  },
  {
    id: "memory-match",
    title: "Memory Match",
    category: "Puzzle",
    type: "Updated",
    emoji: "🎯",
    color: "color-10",
    rating: "4.6",
    url: "games/Memory Match/index.html"
  },
  {
    id: "naruto-shinobi",
    title: "Shinobi Chronicles",
    category: "Action",
    type: "New",
    emoji: "🍥",
    color: "color-6",
    rating: "4.8",
    url: "games/Naruto-Game/index.html"
  },
  {
    id: "neon-dodge",
    title: "Neon Dodge",
    category: "Arcade",
    type: "Featured",
    emoji: "✈️",
    color: "color-1",
    rating: "4.9",
    url: "games/neon-dodge/index.html"
  },
  {
    id: "sky-scramble",
    title: "Sky Scramble",
    category: "Arcade",
    type: "Featured",
    emoji: "⚡",
    color: "color-3",
    rating: "4.7",
    url: "games/sky-scramble/index.html"
  },
  {
    id: "neon-racer",
    title: "Neon Racer",
    category: "Driving",
    type: "Popular",
    emoji: "🏎️",
    color: "color-1",
    rating: "4.8"
  },
  {
    id: "block-blitz",
    title: "Block Blitz",
    category: "Puzzle",
    type: "Featured",
    emoji: "🧱",
    color: "color-2",
    rating: "4.7"
  },
  {
    id: "pixel-warzone",
    title: "Pixel Warzone",
    category: "Shooting",
    type: "Popular",
    emoji: "🎯",
    color: "color-3",
    rating: "4.9"
  },
  {
    id: "castle-defense",
    title: "Castle Defense",
    category: "Strategy",
    type: "Featured",
    emoji: "🏰",
    color: "color-4",
    rating: "4.6"
  },
  {
    id: "armored-bots",
    title: "Armored Bots",
    category: "Action",
    type: "Featured",
    emoji: "🤖",
    color: "color-5",
    rating: "4.8"
  },
  {
    id: "shop-simulator",
    title: "Shop Simulator",
    category: "Simulation",
    type: "New",
    emoji: "🛒",
    color: "color-6",
    rating: "4.5"
  },
  {
    id: "empire-city",
    title: "Empire City",
    category: "Strategy",
    type: "New",
    emoji: "🏙️",
    color: "color-7",
    rating: "4.7"
  },
  {
    id: "sky-pilot",
    title: "Sky Pilot",
    category: "Sports",
    type: "New",
    emoji: "✈️",
    color: "color-8",
    rating: "4.4"
  },
  {
    id: "hex-stack",
    title: "Hexa Stack",
    category: "Puzzle",
    type: "New",
    emoji: "🔷",
    color: "color-9",
    rating: "4.9"
  },
  {
    id: "candy-pop",
    title: "Candy Pop",
    category: "Arcade",
    type: "Popular",
    emoji: "🍭",
    color: "color-11",
    rating: "4.5"
  },
  {
    id: "traffic-fury",
    title: "Traffic Fury",
    category: "Driving",
    type: "Popular",
    emoji: "🚗",
    color: "color-12",
    rating: "4.8"
  },
  {
    id: "word-quest",
    title: "Word Quest",
    category: "Word",
    type: "Popular",
    emoji: "🔤",
    color: "color-13",
    rating: "4.7"
  },
  {
    id: "space-dodge",
    title: "Space Dodge",
    category: "Arcade",
    type: "New",
    emoji: "🚀",
    color: "color-14",
    rating: "4.6"
  },
  {
    id: "mini-golf",
    title: "Mini Golf",
    category: "Sports",
    type: "New",
    emoji: "⛳",
    color: "color-15",
    rating: "4.5"
  }
];

/* =========================================
   STORAGE HELPERS
========================================= */

function loadGuestProfile() {
  try {
    return JSON.parse(
      localStorage.getItem("gamehub_guest_profile") || "null"
    );
  } catch {
    return null;
  }
}

function saveGuestProfile(profile) {
  if (profile) {
    localStorage.setItem(
      "gamehub_guest_profile",
      JSON.stringify(profile)
    );
  } else {
    localStorage.removeItem("gamehub_guest_profile");
  }
}

function loadRecent() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("gamehub_recent") || "[]"
    );
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveRecent() {
  localStorage.setItem(
    "gamehub_recent",
    JSON.stringify(recentIds.slice(0, 10))
  );
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

/* =========================================
   GAME CARDS
========================================= */

function gameCard(game) {
  return `
    <article class="game-card"
      data-game-id="${escapeHtml(game.id)}"
      tabindex="0"
      role="button"
      aria-label="Play ${escapeHtml(game.title)}">

      <div class="game-art ${escapeHtml(game.color || "color-1")}">
        ${escapeHtml(game.emoji || "🎮")}
      </div>

      <div class="game-content">
        <div class="game-title">${escapeHtml(game.title)}</div>
        <div class="game-meta">
          ${escapeHtml(game.category)} · ★ ${escapeHtml(game.rating || "—")}
        </div>
      </div>

      <div class="play-chip">Play</div>
    </article>
  `;
}

function renderGrid(selector, list) {
  const element = $(selector);
  if (!element) return;

  element.innerHTML = list.map(gameCard).join("");
}

function renderHome() {
  const featured = games.filter(game =>
    game.type === "Featured"
  );

  renderGrid("#featuredGrid", featured);
  renderGrid("#allGrid", games);

  const count = $("#allGameCount");
  if (count) count.textContent = `${games.length} games`;

  renderRecent();
  renderTaggedSections();
}

function renderTaggedSections() {
  renderGrid(
    "#newGrid",
    games.filter(game => game.type === "New")
  );

  renderGrid(
    "#popularGrid",
    games.filter(game => game.type === "Popular")
  );

  renderGrid(
    "#updatedGrid",
    games.filter(game => game.type === "Updated")
  );

  // Add type: "Original" to games intended for this section.
  renderGrid(
    "#originalsGrid",
    games.filter(game => game.type === "Original")
  );

  // Add multiplayer: true to games supporting multiplayer.
  renderGrid(
    "#multiplayerGrid",
    games.filter(game => game.multiplayer === true)
  );
}

function renderRecent() {
  const recentGames = recentIds
    .map(id => games.find(game => game.id === id))
    .filter(Boolean);

  renderGrid("#recentGrid", recentGames);

  const empty = $("#recentEmpty");
  if (empty) empty.hidden = recentGames.length > 0;
}

function renderCategory(category) {
  const results = games.filter(
    game => game.category.toLowerCase() === category.toLowerCase()
  );

  const title = $("#categoryTitle");
  if (title) title.textContent = `${category} Games`;

  renderGrid("#categoryGrid", results);

  const empty = $("#categoryEmpty");
  if (empty) empty.hidden = results.length > 0;
}

function renderSearch(query) {
  const q = query.trim().toLowerCase();

  const results = games.filter(game =>
    `${game.title} ${game.category} ${game.type}`
      .toLowerCase()
      .includes(q)
  );

  const title = $("#searchTitle");
  if (title) title.textContent = `Results for "${query}"`;

  renderGrid("#searchGrid", results);

  const empty = $("#searchEmpty");
  if (empty) empty.hidden = results.length > 0;
}

/* =========================================
   NAVIGATION
========================================= */

function hideAllSections() {
  $$(".page-section").forEach(section => {
    section.hidden = true;
    section.classList.remove("active");
  });
}

function showPage(id) {
  hideAllSections();

  const section = document.getElementById(id);
  if (section) {
    section.hidden = false;
    section.classList.add("active");
  }
}

function setActiveNav(name) {
  $$(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.section === name
    );
  });
}

function showSection(name) {
  activeSection = name;
  activeCategory = "";

  const sectionMap = {
    home: "homeSection",
    all: "homeSection",
    recent: "homeSection",
    new: "newSection",
    popular: "popularSection",
    updated: "updatedSection",
    originals: "originalsSection",
    multiplayer: "multiplayerSection",
    leaderboards: "leaderboardsSection"
  };

  showPage(sectionMap[name] || "homeSection");
  setActiveNav(name);

  // Home displays all games, including featured games.
  if (name === "home") {
    renderHome();
    $("#featuredSection")?.scrollIntoView({ behavior: "smooth" });
  } else if (name === "all") {
    renderGrid("#allGrid", games);
    $("#allSection")?.scrollIntoView({ behavior: "smooth" });
  } else if (name === "recent") {
    renderRecent();
    $("#recentSection")?.scrollIntoView({ behavior: "smooth" });
  } else if (name === "new" || name === "popular" ||
             name === "updated" || name === "originals" ||
             name === "multiplayer" || name === "leaderboards") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  closeSidebar();
}

function openCategory(category) {
  activeCategory = category;
  activeSection = "category";

  showPage("categorySection");
  setActiveNav("");

  renderCategory(category);
  window.scrollTo({ top: 0, behavior: "smooth" });

  closeSidebar();
}

function openSearch(query) {
  if (!query.trim()) {
    showSection("home");
    return;
  }

  activeSection = "search";
  activeCategory = "";

  showPage("searchSection");
  setActiveNav("");

  renderSearch(query);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function closeSidebar() {
  $("#sidebar")?.classList.remove("open");
}

function toggleSidebar() {
  $("#sidebar")?.classList.toggle("open");
}

/* =========================================
   GAME LAUNCHING
========================================= */

function playGame(id) {
  const game = games.find(item => item.id === id);
  if (!game) return;

  if (!game.url) {
    showToast(`${game.title} is not available yet.`);
    return;
  }

  recentIds = [
    game.id,
    ...recentIds.filter(existingId => existingId !== game.id)
  ].slice(0, 10);

  saveRecent();
  renderRecent();

  // Keep relative paths working on GitHub Pages.
  window.location.href = game.url;
}

document.addEventListener("click", event => {
  const card = event.target.closest("[data-game-id]");
  if (card) playGame(card.dataset.gameId);
});

document.addEventListener("keydown", event => {
  if (
    (event.key === "Enter" || event.key === " ") &&
    event.target.matches("[data-game-id]")
  ) {
    event.preventDefault();
    playGame(event.target.dataset.gameId);
  }
});

/* =========================================
   TOAST
========================================= */

let toastTimer;

function showToast(message) {
  const container = $("#toastContainer");
  if (!container) {
    console.info(message);
    return;
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;

  container.appendChild(toast);

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.remove(), 3200);
}

/* =========================================
   MODALS
========================================= */

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.hidden = false;
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.hidden = true;
}

document.addEventListener("click", event => {
  const closeButton = event.target.closest("[data-close-modal]");

  if (closeButton) {
    const modal = closeButton.closest(".modal-overlay");
    if (modal) modal.hidden = true;
  }

  if (
    event.target.classList.contains("modal-overlay")
  ) {
    event.target.hidden = true;
  }
});

/* =========================================
   GUEST PROFILE
========================================= */

function updateProfileUI() {
  const name = currentUser?.displayName ||
    currentUser?.email ||
    guestProfile?.name ||
    "Guest";

  const profileName = $("#profileName");
  const profileEmail = $("#profileEmail");
  const profileAvatar = $("#profileAvatar");
  const authArea = $("#authArea");

  if (profileName) profileName.textContent = name;

  if (profileEmail) {
    profileEmail.textContent = currentUser?.email || "Guest account";
  }

  if (profileAvatar) {
    profileAvatar.textContent = name.charAt(0).toUpperCase();
  }

  if (authArea) {
    if (currentUser || guestProfile) {
      authArea.innerHTML = `
        <button class="avatar-btn" id="openProfileButton"
          type="button" aria-label="Open profile">
          ${escapeHtml(name.charAt(0).toUpperCase())}
        </button>
      `;
    } else {
      authArea.innerHTML = "";
    }
  }
}

function continueAsGuest() {
  const name = $("#guestName")?.value.trim();

  if (!name) {
    showToast("Please enter a nickname.");
    return;
  }

  guestProfile = { name, isGuest: true };
  saveGuestProfile(guestProfile);

  closeModal("guestProfileModal");
  closeModal("loginModal");
  updateProfileUI();

  showToast(`Welcome, ${name}!`);
}

document.addEventListener("click", event => {
  if (event.target.closest("#openProfileButton")) {
    const panel = $("#profilePanel");
    if (panel) panel.hidden = !panel.hidden;
  }

  if (event.target.closest("[data-close-profile]")) {
    const panel = $("#profilePanel");
    if (panel) panel.hidden = true;
  }

  if (event.target.closest("#saveGuestProfile")) {
    continueAsGuest();
  }

  if (event.target.closest("#logoutButton")) {
    if (currentUser) {
      signOut(auth).catch(error => {
        console.error(error);
        showToast("Could not log out.");
      });
    } else {
      guestProfile = null;
      saveGuestProfile(null);
      updateProfileUI();
    }

    closeModal("profilePanel");
    const panel = $("#profilePanel");
    if (panel) panel.hidden = true;
    showToast("Logged out.");
  }
});

/* =========================================
   LOGIN / SIGNUP BUTTONS
========================================= */

$("#loginButton")?.addEventListener("click", () => {
  openModal("loginModal");
});

$("#signupButton")?.addEventListener("click", () => {
  window.location.href = "signup.html";
});

$("#guestLoginButton")?.addEventListener("click", () => {
  closeModal("loginModal");
  openModal("guestProfileModal");
});

$("#loginForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  const email = $("#loginEmail")?.value.trim();
  const password = $("#loginPassword")?.value;

  if (!email || !password) {
    showToast("Enter your email and password.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    closeModal("loginModal");
    showToast("Login successful!");
  } catch (error) {
    console.error("Login error:", error);
    showToast("Login failed. Check your email and password.");
  }
});

$("#googleLoginButton")?.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, googleProvider);
    closeModal("loginModal");
    showToast("Google login successful!");
  } catch (error) {
    console.error(error);
    showToast("Google login failed. Check Firebase settings.");
  }
});

$("#facebookLoginButton")?.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, facebookProvider);
    closeModal("loginModal");
    showToast("Facebook login successful!");
  } catch (error) {
    console.error(error);
    showToast("Facebook login failed. Check Firebase settings.");
  }
});

$("#forgotPasswordButton")?.addEventListener("click", async () => {
  const email =
    $("#resetEmail")?.value.trim() ||
    $("#loginEmail")?.value.trim();

  if (!email) {
    openModal("resetPasswordModal");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    closeModal("loginModal");
    closeModal("resetPasswordModal");
    showToast("Password reset email sent.");
  } catch (error) {
    console.error(error);
    showToast("Could not send reset email. Check the email address.");
  }
});

$("#resetPasswordForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  const email = $("#resetEmail")?.value.trim();
  if (!email) {
    showToast("Enter your email.");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    closeModal("resetPasswordModal");
    showToast("Password reset email sent.");
  } catch (error) {
    console.error(error);
    showToast("Could not send reset email.");
  }
});

$("#logoutButton")?.addEventListener("click", () => {
  if (currentUser) signOut(auth).catch(console.error);
  else {
    guestProfile = null;
    saveGuestProfile(null);
    updateProfileUI();
  }

  const panel = $("#profilePanel");
  if (panel) panel.hidden = true;
});

/* =========================================
   SPIDER CLOCK
========================================= */

function updateClock() {
  const now = new Date();

  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const milliseconds = now.getMilliseconds();

  const hour = $("#ghHour");
  const minute = $("#ghMinute");
  const second = $("#ghSecond");

  if (hour) {
    hour.style.transform =
      `rotate(${(hours + minutes / 60) * 30}deg)`;
  }

  if (minute) {
    minute.style.transform =
      `rotate(${(minutes + seconds / 60) * 6}deg)`;
  }

  if (second) {
    second.style.transform =
      `rotate(${(seconds + milliseconds / 1000) * 6}deg)`;
  }

  requestAnimationFrame(updateClock);
}

$("#spiderClock")?.addEventListener("click", () => {
  const overlay = $("#ghHorrorLayer");
  if (!overlay) return;

  overlay.hidden = false;

  setTimeout(() => {
    overlay.hidden = true;
  }, 5000);
});

$("#closeHorrorEffect")?.addEventListener("click", () => {
  const overlay = $("#ghHorrorLayer");
  if (overlay) overlay.hidden = true;
});

/* =========================================
   EVENT WIRING
========================================= */

document.addEventListener("click", event => {
  const sectionButton = event.target.closest("[data-section]");

  if (sectionButton) {
    showSection(sectionButton.dataset.section);
    return;
  }

  const categoryButton = event.target.closest("[data-category]");

  if (categoryButton) {
    openCategory(categoryButton.dataset.category);
  }
});

$("#searchForm")?.addEventListener("submit", event => {
  event.preventDefault();
  openSearch($("#searchInput")?.value || "");
});

$("#searchInput")?.addEventListener("input", event => {
  const value = event.target.value.trim();

  if (!value) {
    showSection("home");
  } else {
    openSearch(value);
  }
});

$("#menuToggle")?.addEventListener("click", toggleSidebar);

document.addEventListener("click", event => {
  const sidebar = $("#sidebar");
  const toggle = $("#menuToggle");

  if (
    sidebar?.classList.contains("open") &&
    !sidebar.contains(event.target) &&
    !toggle?.contains(event.target)
  ) {
    closeSidebar();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    $$(".modal-overlay").forEach(modal => {
      modal.hidden = true;
    });

    const overlay = $("#ghHorrorLayer");
    if (overlay) overlay.hidden = true;

    closeSidebar();

    const panel = $("#profilePanel");
    if (panel) panel.hidden = true;
  }
});

/* =========================================
   AUTH STATE
========================================= */

onAuthStateChanged(auth, user => {
  currentUser = user;
  updateProfileUI();

  if (user) {
    closeModal("loginModal");
    closeModal("guestProfileModal");
  }
});

/* =========================================
   INITIALIZE
========================================= */

function init() {
  renderHome();
  updateProfileUI();
  updateClock();

  const params = new URLSearchParams(window.location.search);

  if (params.get("signup") === "success") {
    showToast("Account created successfully!");
  }

  if (params.get("login") === "success") {
    showToast("Welcome back to GameHub!");
  }

  if (params.get("openLogin") === "1") {
    openModal("loginModal");
  }

  if (
    params.has("signup") ||
    params.has("login") ||
    params.has("openLogin")
  ) {
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
