// ============================================================
// GAMEHUB - COMPLETE JAVASCRIPT
// Firebase Google/Facebook Login + Firestore + Game Portal
// ============================================================

// -----------------------------
// 1. Firebase Imports
// -----------------------------

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// ============================================================
// 2. Firebase Configuration
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyA5WKh6tXIXLFxWAwmY1z5bBBPV8DVJPUM",
  authDomain: "gamehub-for-sajahan.firebaseapp.com",
  projectId: "gamehub-for-sajahan",
  storageBucket: "gamehub-for-sajahan.firebasestorage.app",
  messagingSenderId: "610152819687",
  appId: "1:610152819687:web:d6b531420d1136e13aab42",
  measurementId: "G-EBBQQB06WH"
};


// ============================================================
// 3. Initialize Firebase
// ============================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

const facebookProvider = new FacebookAuthProvider();


// ============================================================
// 4. Firebase Ready
// ============================================================

const FIREBASE_READY = true;


// ============================================================
// 5. Game List
// ============================================================

const games = [

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
    emoji: "🔫",
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
    id: "bodycam",
    title: "Bodycam Shooter",
    category: "Shooting",
    type: "Updated",
    emoji: "🎯",
    color: "color-10",
    rating: "4.6"
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


// ============================================================
// 6. Helper Functions
// ============================================================

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => [
  ...document.querySelectorAll(selector)
];


// ============================================================
// 7. User Data
// ============================================================

let currentUser = null;


// ============================================================
// 8. Guest Recent Games
// ============================================================

let recentIds = loadGuestRecent();

function loadGuestRecent() {

  try {

    const saved = localStorage.getItem("gamehub_recent");

    return saved ? JSON.parse(saved) : [];

  } catch (error) {

    console.error("Could not load recent games:", error);

    return [];

  }

}


function saveGuestRecent() {

  try {

    localStorage.setItem(
      "gamehub_recent",
      JSON.stringify(recentIds.slice(0, 10))
    );

  } catch (error) {

    console.error("Could not save recent games:", error);

  }

}


// ============================================================
// 9. HTML Safety
// ============================================================

function escapeHtml(value) {

  return String(value).replace(
    /[&<>"']/g,
    (character) => {

      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      };

      return map[character];

    }
  );

}


// ============================================================
// 10. Create Game Card
// ============================================================

function gameCard(game, featured = false) {

  const cardClass = featured
    ? `featured-card ${
        game.id === "block-blitz"
          ? "large"
          : "medium"
      }`
    : "game-card";

  return `
    <article
      class="${cardClass}"
      data-game-id="${game.id}"
      tabindex="0"
    >

      <div
        class="${featured ? "featured-art" : "game-art"} ${game.color}"
      >
        ${game.emoji}
      </div>

      <div class="game-content">

        <div class="game-title">
          ${escapeHtml(game.title)}
        </div>

        <div class="game-meta">
          ${escapeHtml(game.category)}
          • ★ ${game.rating}
        </div>

      </div>

      <div class="play-chip">
        Play
      </div>

    </article>
  `;

}


// ============================================================
// 11. Render Home
// ============================================================

function renderHome() {

  const featured = games.slice(0, 7);

  const newGames = games
    .filter(game => game.type === "New")
    .slice(0, 8);

  const popular = games
    .filter(game => game.type === "Popular")
    .slice(0, 8);


  $("#featuredGrid").innerHTML =
    featured
      .map(game => gameCard(game, true))
      .join("");


  $("#newGrid").innerHTML =
    newGames
      .map(game => gameCard(game))
      .join("");


  $("#popularGrid").innerHTML =
    popular
      .map(game => gameCard(game))
      .join("");


  updateResultsNote(games.length);

  bindGameClicks();

}


// ============================================================
// 12. Render Recent Games
// ============================================================

function renderRecent() {

  const recent = recentIds
    .map(id => games.find(game => game.id === id))
    .filter(Boolean);


  $("#recentGrid").innerHTML =
    recent
      .map(game => gameCard(game))
      .join("");


  $("#recentEmpty").classList.toggle(
    "hidden",
    recent.length !== 0
  );


  updateResultsNote(recent.length);

  bindGameClicks();

}


// ============================================================
// 13. Search
// ============================================================

function renderSearch(query) {

  const cleanQuery = query
    .trim()
    .toLowerCase();


  const results = cleanQuery
    ? games.filter(game => {

        const text = `
          ${game.title}
          ${game.category}
          ${game.type}
        `.toLowerCase();

        return text.includes(cleanQuery);

      })
    : [];


  $("#searchGrid").innerHTML =
    results
      .map(game => gameCard(game))
      .join("");


  $("#searchEmpty").classList.toggle(
    "hidden",
    results.length !== 0
  );


  updateResultsNote(results.length);

  bindGameClicks();

}


// ============================================================
// 14. Result Count
// ============================================================

function updateResultsNote(count) {

  const element = $("#resultsNote");

  if (!element) {
    return;
  }

  element.textContent =
    `${count} ${count === 1 ? "game" : "games"}`;

}


// ============================================================
// 15. Active Navigation
// ============================================================

function setActiveNav(section) {

  $$(".nav-item").forEach(button => {

    button.classList.toggle(
      "active",
      button.dataset.section === section
    );

  });

}


// ============================================================
// 16. Show Website Section
// ============================================================

function showSection(section) {

  $$(".game-section").forEach(sectionElement => {

    sectionElement.classList.add("hidden");

  });


  const pageTitle = $("#pageTitle");

  if (pageTitle) {

    pageTitle.textContent =
      "Top games today";

  }


  if (
    section === "home" ||
    section === "popular"
  ) {

    $("#featuredSection").classList.remove("hidden");

    $("#newSection").classList.remove("hidden");

    $("#popularSection").classList.remove("hidden");


    if (section === "popular") {

      pageTitle.textContent =
        "Popular games";

    }

  }


  else if (section === "new") {

    $("#newSection").classList.remove("hidden");

    pageTitle.textContent =
      "New games";

  }


  else if (section === "recent") {

    $("#recentSection").classList.remove("hidden");

    renderRecent();

    pageTitle.textContent =
      "Recently played";

  }


  else {

    $("#featuredSection").classList.remove("hidden");

    pageTitle.textContent =
      `${section.charAt(0).toUpperCase()}${section.slice(1)} games`;

  }


  setActiveNav(section);

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  closeSidebar();

}


// ============================================================
// 17. Open Search Page
// ============================================================

function openSearch(query) {

  $$(".game-section").forEach(sectionElement => {

    sectionElement.classList.add("hidden");

  });


  $("#searchSection")
    .classList
    .remove("hidden");


  $("#pageTitle").textContent =
    `Search: ${query}`;


  renderSearch(query);

  setActiveNav("");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


// ============================================================
// 18. Save Recent Game
// ============================================================

async function markRecent(gameId) {

  recentIds = [
    gameId,
    ...recentIds.filter(id => id !== gameId)
  ].slice(0, 10);


  saveGuestRecent();


  // Logged-in user
  if (currentUser && db) {

    try {

      const userReference =
        doc(
          db,
          "users",
          currentUser.uid
        );


      const userSnapshot =
        await getDoc(userReference);


      if (!userSnapshot.exists()) {

        await setDoc(
          userReference,
          {

            displayName:
              currentUser.displayName || "Player",

            email:
              currentUser.email || "",

            photoURL:
              currentUser.photoURL || "",

            recentGames:
              recentIds,

            favorites: [],

            updatedAt:
              Date.now()

          }
        );

      }

      else {

        await updateDoc(
          userReference,
          {

            recentGames:
              arrayUnion(gameId),

            updatedAt:
              Date.now()

          }
        );

      }

    }

    catch (error) {

      console.error(
        "Cloud save error:",
        error
      );

    }

  }

}


// ============================================================
// 19. Toast Message
// ============================================================

function showToast(message) {

  const toast = $("#toast");

  if (!toast) {
    return;
  }


  toast.textContent = message;

  toast.classList.remove("hidden");


  clearTimeout(showToast.timer);


  showToast.timer =
    setTimeout(() => {

      toast.classList.add("hidden");

    }, 3000);

}


// ============================================================
// 20. Launch Game
// ============================================================

function launchGame(game) {

  if (!game) {
    return;
  }


  markRecent(game.id);


  showToast(
    `"${game.title}" selected. Game will be connected here later.`
  );


  /*
    পরে যখন আসল game বানাবেন,
    তখন এখানেই game open করবেন।

    Example:

    window.location.href =
      `games/${game.id}/index.html`;

  */

}


// ============================================================
// 21. Bind Game Clicks
// ============================================================

function bindGameClicks() {

  $$(".game-card, .featured-card")
    .forEach(card => {

      // Prevent duplicate listeners
      if (card.dataset.bound === "true") {
        return;
      }

      card.dataset.bound = "true";


      const handleGameClick = () => {

        const game =
          games.find(
            item =>
              item.id ===
              card.dataset.gameId
          );


        launchGame(game);

      };


      card.addEventListener(
        "click",
        handleGameClick
      );


      card.addEventListener(
        "keydown",
        event => {

          if (
            event.key === "Enter" ||
            event.key === " "
          ) {

            event.preventDefault();

            handleGameClick();

          }

        }
      );

    });

}


// ============================================================
// 22. Login Modal
// ============================================================

function openLoginModal() {

  $("#loginModal")
    .classList
    .remove("hidden");

}


function closeLoginModal() {

  $("#loginModal")
    .classList
    .add("hidden");

}


// ============================================================
// 23. Update Login UI
// ============================================================

function updateAuthUI(user) {

  currentUser = user;


  $("#guestStatus")
    .classList
    .toggle("hidden", !!user);


  $("#openLogin")
    .classList
    .toggle("hidden", !!user);


  $("#userMenu")
    .classList
    .toggle("hidden", !user);


  if (user) {

    const name =
      user.displayName ||
      "Player";


    $("#userName").textContent =
      name;


    $("#userEmail").textContent =
      user.email ||
      "Signed-in player";


    $("#avatarText").textContent =
      name
        .trim()
        .charAt(0)
        .toUpperCase();


    // Try to load cloud recent games
    loadUserData(user);

  }

}


// ============================================================
// 24. Load User Data From Firestore
// ============================================================

async function loadUserData(user) {

  if (!db || !user) {
    return;
  }


  try {

    const userReference =
      doc(
        db,
        "users",
        user.uid
      );


    const userSnapshot =
      await getDoc(userReference);


    if (!userSnapshot.exists()) {
      return;
    }


    const data =
      userSnapshot.data();


    if (
      Array.isArray(data.recentGames)
    ) {

      recentIds = [
        ...new Set([
          ...data.recentGames,
          ...recentIds
        ])
      ].slice(0, 10);


      saveGuestRecent();

    }

  }

  catch (error) {

    console.error(
      "Could not load user data:",
      error
    );

  }

}


// ============================================================
// 25. Google / Facebook Login
// ============================================================

async function socialLogin(providerName) {

  if (!FIREBASE_READY) {

    showToast(
      "Firebase is not ready."
    );

    return;

  }


  try {

    let provider;


    if (
      providerName === "google"
    ) {

      provider =
        googleProvider;

    }


    else if (
      providerName === "facebook"
    ) {

      provider =
        facebookProvider;

    }


    else {

      showToast(
        "Invalid login provider."
      );

      return;

    }


    const result =
      await signInWithPopup(
        auth,
        provider
      );


    const user =
      result.user;


    // Firestore user reference
    const userReference =
      doc(
        db,
        "users",
        user.uid
      );


    const userSnapshot =
      await getDoc(userReference);


    if (!userSnapshot.exists()) {

      await setDoc(
        userReference,
        {

          uid:
            user.uid,

          displayName:
            user.displayName ||
            "Player",

          email:
            user.email ||
            "",

          photoURL:
            user.photoURL ||
            "",

          recentGames:
            recentIds,

          favorites: [],

          createdAt:
            Date.now(),

          updatedAt:
            Date.now()

        }
      );

    }

    else {

      const cloudData =
        userSnapshot.data();


      if (
        Array.isArray(
          cloudData.recentGames
        )
      ) {

        recentIds = [
          ...new Set([
            ...cloudData.recentGames,
            ...recentIds
          ])
        ].slice(0, 10);


        saveGuestRecent();

      }

    }


    closeLoginModal();


    showToast(
      `Welcome ${
        user.displayName ||
        "Player"
      }!`
    );

  }

  catch (error) {

    console.error(
      "Login Error:",
      error
    );


    let message =
      "Login failed.";


    if (
      error.code ===
      "auth/popup-closed-by-user"
    ) {

      message =
        "Login window was closed.";

    }

    else if (
      error.code ===
      "auth/popup-blocked"
    ) {

      message =
        "Browser blocked the popup. Please allow popups for this website.";

    }

    else if (
      error.code ===
      "auth/unauthorized-domain"
    ) {

      message =
        "Your GitHub domain is not authorized in Firebase.";

    }

    else if (
      error.code ===
      "auth/operation-not-allowed"
    ) {

      message =
        "This login provider is not enabled in Firebase.";

    }

    else if (
      error.code ===
      "auth/network-request-failed"
    ) {

      message =
        "Network problem. Please check your internet.";

    }

    else if (error.message) {

      message =
        error.message;

    }


    showToast(message);

  }

}


// ============================================================
// 26. Logout
// ============================================================

async function logout() {

  try {

    await signOut(auth);

    currentUser = null;


    $("#userDropdown")
      .classList
      .remove("open");


    showToast(
      "You have been signed out."
    );

  }

  catch (error) {

    console.error(
      "Logout error:",
      error
    );


    showToast(
      "Could not sign out."
    );

  }

}


// ============================================================
// 27. Mobile Sidebar
// ============================================================

function closeSidebar() {

  $("#sidebar")
    .classList
    .remove("open");

}


// ============================================================
// 28. Initialize Website
// ============================================================

function init() {

  // Home
  renderHome();


  // Main navigation
  $$(".nav-item")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          showSection(
            button.dataset.section
          );

        }
      );

    });


  // See all buttons
  $$(".text-link")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          showSection(
            button.dataset.section
          );

        }
      );

    });


  // Categories
  $$(".category-item")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const category =
            button.dataset.category;


          $("#searchInput").value =
            category;


          openSearch(category);

        }
      );

    });


  // Home buttons / logo
  $$("[data-home]")
    .forEach(element => {

      element.addEventListener(
        "click",
        event => {

          event.preventDefault();

          $("#searchInput").value =
            "";

          showSection("home");

        }
      );

    });


  // Search
  $("#searchInput")
    .addEventListener(
      "input",
      event => {

        const value =
          event.target.value.trim();


        if (value) {

          openSearch(value);

        }

        else {

          showSection("home");

        }

      }
    );


  // Login modal
  $("#openLogin")
    .addEventListener(
      "click",
      openLoginModal
    );


  $("#closeLogin")
    .addEventListener(
      "click",
      closeLoginModal
    );


  $("#continueGuest")
    .addEventListener(
      "click",
      closeLoginModal
    );


  // Google
  $("#googleLogin")
    .addEventListener(
      "click",
      () => {

        socialLogin("google");

      }
    );


  // Facebook
  $("#facebookLogin")
    .addEventListener(
      "click",
      () => {

        socialLogin("facebook");

      }
    );


  // Mobile menu
  $("#mobileMenu")
    .addEventListener(
      "click",
      () => {

        $("#sidebar")
          .classList
          .toggle("open");

      }
    );


  // Avatar dropdown
  $("#avatarBtn")
    .addEventListener(
      "click",
      event => {

        event.stopPropagation();

        $("#userDropdown")
          .classList
          .toggle("open");

      }
    );


  // Logout
  $("#logoutBtn")
    .addEventListener(
      "click",
      logout
    );


  // Close login modal by clicking background
  $("#loginModal")
    .addEventListener(
      "click",
      event => {

        if (
          event.target.id ===
          "loginModal"
        ) {

          closeLoginModal();

        }

      }
    );


  // Keyboard ESC
  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape"
      ) {

        closeLoginModal();

        closeSidebar();

      }

    }
  );


  // Close user dropdown when clicking outside
  document.addEventListener(
    "click",
    event => {

      const userMenu =
        $(".user-menu");


      if (
        userMenu &&
        !userMenu.contains(event.target)
      ) {

        $("#userDropdown")
          .classList
          .remove("open");

      }

    }
  );


  // Firebase authentication listener
  onAuthStateChanged(
    auth,
    user => {

      updateAuthUI(user);

    }
  );

}


// ============================================================
// 29. Start Website
// ============================================================

init();