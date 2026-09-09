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

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

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
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const safelySetText = (selector, value) => {
  const el = $(selector);
  if (el) el.textContent = value;
};
const safelyToggleClass = (selector, className, force) => {
  const el = $(selector);
  if (el) el.classList.toggle(className, force);
};

let currentUser = null;
let guestProfile = loadGuestProfile();
let userProfile = loadUserProfile();
let recentIds = loadRecent();

function loadGuestProfile() {
  try {
    const profile = JSON.parse(
      localStorage.getItem("gamehub_guest_profile") || "null"
    );
    if (!profile) return null;
    return {
      name: profile.name || "",
      dob: profile.dob || "",
      about: profile.about || "",
      gender: profile.gender || "",
      favoriteGame: profile.favoriteGame || "",
      occupation: profile.occupation || "",
      isGuest: true
    };
  } catch {
    return null;
  }
}

function loadUserProfile() {
  try {
    const profile = JSON.parse(
      localStorage.getItem("gamehub_user_profile") || "null"
    );
    if (!profile) return {};
    return {
      about: profile.about || "",
      gender: profile.gender || "",
      favoriteGame: profile.favoriteGame || "",
      occupation: profile.occupation || "",
      dob: profile.dob || ""
    };
  } catch {
    return {};
  }
}

function saveGuestProfile(profile) {
  if (!profile) {
    localStorage.removeItem("gamehub_guest_profile");
    return;
  }

  localStorage.setItem(
    "gamehub_guest_profile",
    JSON.stringify(profile)
  );
}

function saveUserProfile(profile) {
  if (!profile) {
    localStorage.removeItem("gamehub_user_profile");
    return;
  }

  localStorage.setItem(
    "gamehub_user_profile",
    JSON.stringify(profile)
  );
}

function getProfileCompletion(profile = getActiveProfile()) {
  const data = profile || {};
  const checks = [
    Boolean(data.about && data.about.trim()),
    Boolean(data.gender),
    Boolean(data.favoriteGame && data.favoriteGame.trim()),
    Boolean(data.occupation && data.occupation.trim()),
    Boolean(data.dob)
  ];

  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

function getActiveProfile() {
  return currentUser ? userProfile : guestProfile;
}

function syncProfileUI() {
  const activeProfile = getActiveProfile() || {};
  const displayName = currentUser
    ? (currentUser.displayName || currentUser.email || "Player")
    : (guestProfile?.name || "Guest");
  const initials = displayName.trim().charAt(0).toUpperCase() || "G";
  const percent = getProfileCompletion(activeProfile);

  const avatarText = $("#avatarText");
  const profileAvatar = $("#profileAvatar");
  const profileName = $("#profileName");
  const profileRole = $("#profileRole");
  const currentAbout = $("#profileAbout");
  const profileGender = $("#profileGender");
  const profileFavoriteGame = $("#profileFavoriteGame");
  const profileOccupation = $("#profileOccupation");
  const profileDob = $("#profileDob");
  const percentEl = $("#profilePercent");
  const bar = $("#profileBar");

  if (avatarText) avatarText.textContent = initials;
  if (profileAvatar) profileAvatar.textContent = initials;
  if (profileName) profileName.textContent = displayName;
  if (profileRole) profileRole.textContent = currentUser ? "Logged in" : "Guest account";
  if (currentAbout) currentAbout.value = activeProfile.about || "";
  if (profileGender) profileGender.value = activeProfile.gender || "";
  if (profileFavoriteGame) profileFavoriteGame.value = activeProfile.favoriteGame || "";
  if (profileOccupation) profileOccupation.value = activeProfile.occupation || "";
  if (profileDob) profileDob.value = activeProfile.dob || "";
  if (percentEl) percentEl.textContent = `${percent}%`;
  if (bar) bar.style.width = `${percent}%`;
}

function saveProfileFields() {
  const profile = currentUser ? userProfile : guestProfile;
  if (!profile) return;

  profile.about = $("#profileAbout")?.value.trim() || "";
  profile.gender = $("#profileGender")?.value || "";
  profile.favoriteGame = $("#profileFavoriteGame")?.value.trim() || "";
  profile.occupation = $("#profileOccupation")?.value.trim() || "";
  profile.dob = $("#profileDob")?.value || "";

  if (currentUser) {
    saveUserProfile(profile);
  } else {
    saveGuestProfile(profile);
  }

  syncProfileUI();
}

function toggleProfilePanel(forceOpen) {
  const panel = $("#profilePanel");
  if (!panel) return;

  if (typeof forceOpen === "boolean") {
    panel.classList.toggle("hidden", !forceOpen);
    return;
  }

  panel.classList.toggle("hidden");
}

function closeProfilePanel() {
  toggleProfilePanel(false);
}

const games = [
  {id:"neon-dodge", title:"Neon Dodge", category:"Arcade", type:"Featured", emoji:"⚡", color:"color-1", rating:"4.9", url:"Game/GameHub-Neon-Dodge/games/neon-dodge/Neon%20GAME.html"},
  {id:"neon-racer", title:"Neon Racer", category:"Driving", type:"Popular", emoji:"🏎️", color:"color-1", rating:"4.8"},
  {id:"block-blitz", title:"Block Blitz", category:"Puzzle", type:"Featured", emoji:"🧱", color:"color-2", rating:"4.7"},
  {id:"pixel-warzone", title:"Pixel Warzone", category:"Shooting", type:"Popular", emoji:"🔫", color:"color-3", rating:"4.9"},
  {id:"castle-defense", title:"Castle Defense", category:"Strategy", type:"Featured", emoji:"🏰", color:"color-4", rating:"4.6"},
  {id:"armored-bots", title:"Armored Bots", category:"Action", type:"Featured", emoji:"🤖", color:"color-5", rating:"4.8"},
  {id:"shop-simulator", title:"Shop Simulator", category:"Simulation", type:"New", emoji:"🛒", color:"color-6", rating:"4.5"},
  {id:"empire-city", title:"Empire City", category:"Strategy", type:"New", emoji:"🏙️", color:"color-7", rating:"4.7"},
  {id:"sky-pilot", title:"Sky Pilot", category:"Sports", type:"New", emoji:"✈️", color:"color-8", rating:"4.4"},
  {id:"hex-stack", title:"Hexa Stack", category:"Puzzle", type:"New", emoji:"🔷", color:"color-9", rating:"4.9"},
  {id:"bodycam", title:"Bodycam Shooter", category:"Shooting", type:"Updated", emoji:"🎯", color:"color-10", rating:"4.6"},
  {id:"candy-pop", title:"Candy Pop", category:"Arcade", type:"Popular", emoji:"🍭", color:"color-11", rating:"4.5"},
  {id:"traffic-fury", title:"Traffic Fury", category:"Driving", type:"Popular", emoji:"🚗", color:"color-12", rating:"4.8"},
  {id:"word-quest", title:"Word Quest", category:"Word", type:"Popular", emoji:"🔤", color:"color-13", rating:"4.7"},
  {id:"space-dodge", title:"Space Dodge", category:"Arcade", type:"New", emoji:"🚀", color:"color-14", rating:"4.6"},
  {id:"mini-golf", title:"Mini Golf", category:"Sports", type:"New", emoji:"⛳", color:"color-15", rating:"4.5"}
];

function loadRecent() {
  try { return JSON.parse(localStorage.getItem("gamehub_recent") || "[]"); }
  catch { return []; }
}

function saveRecent() {
  localStorage.setItem("gamehub_recent", JSON.stringify(recentIds.slice(0, 10)));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function gameCard(game, featured=false) {
  return `
    <article class="${featured ? "featured-card " + (game.id === "neon-dodge" ? "large" : "medium") : "game-card"}"
             data-game-id="${game.id}" tabindex="0">
      <div class="${featured ? "featured-art" : "game-art"} ${game.color}">${game.emoji}</div>
      <div class="game-content">
        <div class="game-title">${escapeHtml(game.title)}</div>
        <div class="game-meta">${escapeHtml(game.category)} • ★ ${game.rating}</div>
      </div>
      <div class="play-chip">Play</div>
    </article>`;
}

function renderHome() {
  $("#featuredGrid").innerHTML = games.slice(0,7).map(g => gameCard(g,true)).join("");
  $("#newGrid").innerHTML = games.filter(g => g.type==="New").slice(0,8).map(g => gameCard(g)).join("");
  $("#popularGrid").innerHTML = games.filter(g => g.type==="Popular").slice(0,8).map(g => gameCard(g)).join("");
  updateResultsNote(games.length);
  bindGameClicks();
}

function renderRecent() {
  const recent = recentIds.map(id => games.find(g => g.id===id)).filter(Boolean);
  $("#recentGrid").innerHTML = recent.map(g => gameCard(g)).join("");
  $("#recentEmpty").classList.toggle("hidden", recent.length !== 0);
  updateResultsNote(recent.length);
  bindGameClicks();
}

function renderSearch(query) {
  const q = query.trim().toLowerCase();
  const results = q
    ? games.filter(g => `${g.title} ${g.category} ${g.type}`.toLowerCase().includes(q))
    : [];
  $("#searchGrid").innerHTML = results.map(g => gameCard(g)).join("");
  $("#searchEmpty").classList.toggle("hidden", results.length !== 0);
  updateResultsNote(results.length);
  bindGameClicks();
}

function updateResultsNote(count) {
  safelySetText("#resultsNote", `${count} ${count === 1 ? "game" : "games"}`);
}

function setActiveNav(section) {
  $$(".nav-item").forEach(btn => btn.classList.toggle("active", btn.dataset.section===section));
}

function closeSidebar() {
  const sidebar = $("#sidebar");
  const mobileMenu = $("#mobileMenu");
  if (sidebar) sidebar.classList.remove("open");
  if (mobileMenu) {
    mobileMenu.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-label", "Open menu");
  }
}

function toggleSidebar() {
  const sidebar = $("#sidebar");
  const mobileMenu = $("#mobileMenu");
  if (!sidebar) return;

  const isOpen = sidebar.classList.toggle("open");
  if (mobileMenu) {
    mobileMenu.setAttribute("aria-expanded", String(isOpen));
    mobileMenu.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  }
}

function showSection(section) {
  $$(".game-section").forEach(s => s.classList.add("hidden"));
  const title = $("#pageTitle");
  if (title) title.textContent = "Top games today";

  if (section==="home" || section==="popular") {
    $("#featuredSection")?.classList.remove("hidden");
    $("#newSection")?.classList.remove("hidden");
    $("#popularSection")?.classList.remove("hidden");
    if (section==="popular" && title) title.textContent = "Popular games";
  } else if (section==="new") {
    $("#newSection")?.classList.remove("hidden");
    if (title) title.textContent = "New games";
  } else if (section==="recent") {
    $("#recentSection")?.classList.remove("hidden");
    renderRecent();
    if (title) title.textContent = "Recently played";
  } else {
    $("#featuredSection")?.classList.remove("hidden");
    if (title) title.textContent = `${section.charAt(0).toUpperCase()}${section.slice(1)} games`;
  }

  setActiveNav(section);
  window.scrollTo({top:0,behavior:"smooth"});
  closeSidebar();
}

function openSearch(query) {
  $$(".game-section").forEach(s => s.classList.add("hidden"));
  $("#searchSection")?.classList.remove("hidden");
  const pageTitle = $("#pageTitle");
  if (pageTitle) pageTitle.textContent = `Search: ${query}`;
  renderSearch(query);
  setActiveNav("");
  window.scrollTo({top:0,behavior:"smooth"});
}

function bindGameClicks() {
  $$(".game-card, .featured-card").forEach(card => {
    if (card.dataset.bound === "true") return;
    card.dataset.bound = "true";
    const handler = () => {
      const game = games.find(g => g.id===card.dataset.gameId);
      if (!game) return;
      recentIds = [game.id, ...recentIds.filter(id => id!==game.id)].slice(0,10);
      saveRecent();
      if (currentUser) {
        const ref = doc(db,"users",currentUser.uid);
        getDoc(ref).then(snap => {
          if (!snap.exists()) {
            return setDoc(ref,{
              uid:currentUser.uid,
              displayName:currentUser.displayName || "Player",
              email:currentUser.email || "",
              recentGames:recentIds,
              favorites:[],
              createdAt:Date.now(),
              updatedAt:Date.now()
            });
          }
          return updateDoc(ref,{recentGames:arrayUnion(game.id),updatedAt:Date.now()});
        }).catch(err => console.warn("Cloud recent save:",err));
      }
      if (game.url) {
        window.location.href = game.url;
        return;
      }
      showToast(`"${game.title}" selected. Add the real game later.`);
    };
    card.addEventListener("click",handler);
    card.addEventListener("keydown",e => {
      if (e.key==="Enter" || e.key===" ") { e.preventDefault(); handler(); }
    });
  });
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add("hidden"), 3200);
}

function openLoginModal() {
  const forgotPassword = $("#forgotPassword");
  if (forgotPassword) forgotPassword.classList.add("hidden");
  const loginModal = $("#loginModal");
  if (loginModal) loginModal.classList.remove("hidden");
}

function closeLoginModal() {
  const loginModal = $("#loginModal");
  if (loginModal) loginModal.classList.add("hidden");
}

function getUserInitial(user) {
  const source =
    (user?.displayName && user.displayName.trim()) ||
    (user?.email && user.email.trim()) ||
    "G";

  return source.charAt(0).toUpperCase();
}

// ============================================================
// GUEST PROFILE
// ============================================================
function openGuestModal() {
  $("#guestName").value = guestProfile?.name || "";
  $("#guestDob").value = guestProfile?.dob || "";
  $("#guestModal").classList.remove("hidden");
}

function closeGuestModal() {
  $("#guestModal").classList.add("hidden");
}

function continueAsGuest() {
  const name = $("#guestName").value.trim();
  const dob = $("#guestDob").value;

  if (!name) {
    showToast("Enter your name.");
    return;
  }

  if (!dob) {
    showToast("Select your date of birth.");
    return;
  }

  guestProfile = {
    name,
    dob,
    about: guestProfile?.about || "",
    gender: guestProfile?.gender || "",
    favoriteGame: guestProfile?.favoriteGame || "",
    occupation: guestProfile?.occupation || "",
    isGuest: true
  };

  saveGuestProfile(guestProfile);

  currentUser = null;

  closeGuestModal();
  updateAuthUI(null);
  toggleProfilePanel(true);

  showToast(`Welcome, ${name}!`);
}

function updateAuthUI(user) {
  currentUser = user;

  const hasGuest = !user && !!guestProfile;
  const hasIdentity = !!user || hasGuest;

  safelyToggleClass("#guestStatus", "hidden", hasIdentity);
  safelyToggleClass("#openLogin", "hidden", hasIdentity);
  safelyToggleClass("#userMenu", "hidden", !hasIdentity);

  if (user) {
    const displayName = user.displayName || user.email || "Player";
    safelySetText("#avatarText", displayName.charAt(0).toUpperCase());
    syncProfileUI();
    loadUserData(user);
    ensureUserDocument(user);
    return;
  }

  if (guestProfile) {
    syncProfileUI();
    return;
  }

  safelySetText("#avatarText", "G");
  closeProfilePanel();
}
async function ensureUserDocument(user) {
  try {
    const ref = doc(db,"users",user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref,{
        uid:user.uid,
        displayName:user.displayName || "Player",
        email:user.email || "",
        photoURL:user.photoURL || "",
        recentGames:recentIds,
        favorites:[],
        createdAt:Date.now(),
        updatedAt:Date.now()
      });
    }
  } catch(err) {
    console.warn("User document save skipped:",err);
  }
}

async function loadUserData(user) {
  try {
    const snap = await getDoc(doc(db,"users",user.uid));
    if (!snap.exists()) return;
    const data = snap.data();
    if (Array.isArray(data.recentGames)) {
      recentIds = [...new Set([...data.recentGames,...recentIds])].slice(0,10);
      saveRecent();
    }
  } catch(err) {
    console.warn("User cloud data load skipped:",err);
  }
}

async function loginWithEmail() {

  const email =
    $("#loginEmail").value.trim();

  const password =
    $("#loginPassword").value;

  if (!email || !password) {
    showToast("Enter your email and password.");
    return;
  }

  try {

    const result =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    // Successful login: reload Home page.
    // Firebase preserves the signed-in session.
    window.location.replace(
      "index.html?login=success"
    );

  } catch (error) {

    console.error("Login error:", error);

    $("#forgotPassword")
      .classList
      .remove("hidden");

    if (error.code === "auth/invalid-email") {
      showToast("Please enter a valid email.");
    } else if (error.code === "auth/too-many-requests") {
      showToast("Too many attempts. Try again later.");
    } else if (error.code === "auth/operation-not-allowed") {
      showToast("Email/Password sign-in is not enabled in Firebase.");
    } else {
      showToast("Email or password is incorrect.");
    }
  }
}

async function sendReset() {
  const email = $("#resetEmail").value.trim();

  if (!email) {
    showToast("Enter your email first.");
    return;
  }

  try {
    await sendPasswordResetEmail(auth,email);
    $("#resetModal").classList.add("hidden");
    $("#loginModal").classList.add("hidden");
    showToast("Reset email sent. Check your Gmail inbox and spam folder.");
  } catch(error) {
    console.error("Reset password:",error);
    showToast("Could not send reset email.");
  }
}

async function socialLogin(providerName) {

  try {

    const provider =
      providerName === "google"
        ? googleProvider
        : facebookProvider;

    const result =
      await signInWithPopup(
        auth,
        provider
      );

    const user = result.user;

    await ensureUserDocument(user);

    // Successful social login: reload Home page.
    window.location.replace(
      "index.html?login=success"
    );

  } catch (error) {

    console.error(
      "Social login error:",
      error
    );

    let message = "Login failed.";

    if (
      error.code ===
      "auth/popup-closed-by-user"
    ) {
      message =
        "Login popup was closed.";
    } else if (
      error.code ===
      "auth/popup-blocked"
    ) {
      message =
        "Please allow popups for this website.";
    } else if (
      error.code ===
      "auth/unauthorized-domain"
    ) {
      message =
        "Add your GitHub domain in Firebase Authorized domains.";
    } else if (
      error.code ===
      "auth/operation-not-allowed"
    ) {
      message =
        "This login provider is not enabled in Firebase.";
    } else if (error.message) {
      message =
        error.message;
    }

    showToast(message);
  }
}

function init() {
  if (!$("#pageTitle") || !$("#featuredGrid") || !$("#searchInput")) {
    return;
  }

  renderHome();

  $$(".nav-item").forEach(btn =>
    btn.addEventListener("click",() => showSection(btn.dataset.section))
  );

  $$(".text-link").forEach(btn =>
    btn.addEventListener("click",() => showSection(btn.dataset.section))
  );

  $$(".category-item").forEach(btn =>
    btn.addEventListener("click",() => {
      $("#searchInput").value = btn.dataset.category;
      openSearch(btn.dataset.category);
    })
  );

  $$("[data-home]").forEach(el =>
    el.addEventListener("click",e => {
      e.preventDefault();
      $("#searchInput").value = "";
      showSection("home");
    })
  );

  $("#searchInput").addEventListener("input",e => {
    const value = e.target.value.trim();
    if (value) openSearch(value);
    else showSection("home");
  });

  $("#avatarButton").addEventListener("click",() => {
    if (!guestProfile && !currentUser) return;
    toggleProfilePanel();
  });

  $("#closeProfileBtn").addEventListener("click", closeProfilePanel);

  $("#profileAbout").addEventListener("input", saveProfileFields);
  $("#profileGender").addEventListener("change", saveProfileFields);
  $("#profileFavoriteGame").addEventListener("input", saveProfileFields);
  $("#profileOccupation").addEventListener("input", saveProfileFields);
  $("#profileDob").addEventListener("change", saveProfileFields);

  $("#logoutBtn").addEventListener("click", () => {
    if (currentUser) {
      signOut(auth).catch(() => {});
    } else {
      guestProfile = null;
      saveGuestProfile(null);
    }

    userProfile = {};
    saveUserProfile(userProfile);
    currentUser = null;
    updateAuthUI(null);
    closeProfilePanel();
    showToast("Logged out.");
  });

  $("#openLogin").addEventListener("click",openLoginModal);
  $("#closeLogin").addEventListener("click",closeLoginModal);

  $("#loginForm").addEventListener("submit",e => {
    e.preventDefault();
    loginWithEmail();
  });

  $("#forgotPassword").addEventListener("click",() => {
    $("#resetEmail").value = $("#loginEmail").value.trim();
    $("#resetModal").classList.remove("hidden");
  });

  $("#closeReset").addEventListener("click",() =>
    $("#resetModal").classList.add("hidden")
  );

  $("#backToLogin").addEventListener("click",() => {
    $("#resetModal").classList.add("hidden");
    openLoginModal();
  });

  $("#sendResetEmail").addEventListener("click",sendReset);

  $("#continueGuest").addEventListener(
    "click",
    () => {
      closeLoginModal();
      openGuestModal();
    }
  );

  $("#closeGuest").addEventListener(
    "click",
    closeGuestModal
  );

  $("#startGuest").addEventListener(
    "click",
    continueAsGuest
  );

  $("#guestModal").addEventListener(
    "click",
    event => {
      if (event.target.id === "guestModal") {
        closeGuestModal();
      }
    }
  );

  $("#googleLogin").addEventListener(
    "click",
    () => socialLogin("google")
  );

  $("#facebookLogin").addEventListener(
    "click",
    () => socialLogin("facebook")
  );

  // Only open signup when the user is NOT already logged in.

  $("#mobileMenu").addEventListener(
    "click",
    toggleSidebar
  );

  document.addEventListener(
    "click",
    event => {
      const sidebar = $("#sidebar");
      const mobileMenu = $("#mobileMenu");
      if (
        sidebar?.classList.contains("open") &&
        !sidebar.contains(event.target) &&
        !mobileMenu?.contains(event.target)
      ) {
        closeSidebar();
      }
    }
  );

  $("#loginModal").addEventListener("click",e => {
    if (e.target.id==="loginModal") {
      closeLoginModal();
    }
  });

  $("#resetModal").addEventListener("click",e => {
    if (e.target.id==="resetModal") {
      $("#resetModal").classList.add("hidden");
    }
  });

  document.addEventListener("keydown",e => {
    if (e.key==="Escape") {
      closeLoginModal();
      $("#resetModal").classList.add("hidden");
      closeSidebar();
    }
  });

  onAuthStateChanged(auth,user => {
    updateAuthUI(user);
  });

  const params = new URLSearchParams(window.location.search);

  if (params.get("signup")==="success") {
    setTimeout(() => {
      showToast("Account created successfully!");
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    },500);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// ============================================================
// URL ACTIONS
// ============================================================
const pageParams =
  new URLSearchParams(
    window.location.search
  );

if (
  pageParams.get("openLogin") === "1"
) {
  setTimeout(() => {
    openLoginModal();

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );
  }, 150);
}

if (
  pageParams.get("login") === "success"
) {
  setTimeout(() => {
    showToast(
      "Login successful! Welcome to GameHub."
    );

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );
  }, 350);
}
