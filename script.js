
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
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

const FIREBASE_READY = !Object.values(firebaseConfig).some(v => String(v).includes("PASTE_"));

let auth = null;
let db = null;
let googleProvider = null;
let facebookProvider = null;

if (FIREBASE_READY) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  facebookProvider = new FacebookAuthProvider();
}

/* Demo catalog — replace/add your own games later. */
const games = [
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

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

let currentUser = null;
let recentIds = loadGuestRecent();

function loadGuestRecent() {
  try { return JSON.parse(localStorage.getItem("gamehub_recent") || "[]"); }
  catch { return []; }
}
function saveGuestRecent() {
  localStorage.setItem("gamehub_recent", JSON.stringify(recentIds.slice(0,10)));
}

function escapeHtml(value){
  return String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
}

function gameCard(game, featured=false){
  return `
    <article class="${featured ? "featured-card " + (game.id === "block-blitz" ? "large" : "medium") : "game-card"}" data-game-id="${game.id}" tabindex="0">
      <div class="${featured ? "featured-art" : "game-art"} ${game.color}">${game.emoji}</div>
      <div class="game-content">
        <div class="game-title">${escapeHtml(game.title)}</div>
        <div class="game-meta">${escapeHtml(game.category)} • ★ ${game.rating}</div>
      </div>
      <div class="play-chip">Play</div>
    </article>`;
}

function renderHome(){
  const featured = games.slice(0,7);
  const newGames = games.filter(g => g.type === "New").slice(0,8);
  const popular = games.filter(g => g.type === "Popular").slice(0,8);

  $("#featuredGrid").innerHTML = featured.map(g => gameCard(g, true)).join("");
  $("#newGrid").innerHTML = newGames.map(g => gameCard(g)).join("");
  $("#popularGrid").innerHTML = popular.map(g => gameCard(g)).join("");
  updateResultsNote(games.length);
}

function renderRecent(){
  const ids = recentIds;
  const recent = ids.map(id => games.find(g => g.id === id)).filter(Boolean);
  $("#recentGrid").innerHTML = recent.map(g => gameCard(g)).join("");
  $("#recentEmpty").classList.toggle("hidden", recent.length !== 0);
  updateResultsNote(recent.length);
}

function renderSearch(query){
  const q = query.trim().toLowerCase();
  const results = q
    ? games.filter(g => `${g.title} ${g.category} ${g.type}`.toLowerCase().includes(q))
    : [];
  $("#searchGrid").innerHTML = results.map(g => gameCard(g)).join("");
  $("#searchEmpty").classList.toggle("hidden", results.length !== 0);
  updateResultsNote(results.length);
}

function updateResultsNote(count){
  $("#resultsNote").textContent = `${count} ${count === 1 ? "game" : "games"}`;
}

function setActiveNav(section){
  $$(".nav-item").forEach(btn => btn.classList.toggle("active", btn.dataset.section === section));
}

function showSection(section){
  $$(".game-section").forEach(s => s.classList.add("hidden"));
  $("#pageTitle").textContent = "Top games today";

  if(section === "home" || section === "popular"){
    $("#featuredSection").classList.remove("hidden");
    $("#newSection").classList.remove("hidden");
    $("#popularSection").classList.remove("hidden");
    if(section === "popular") $("#pageTitle").textContent = "Popular games";
  } else if(section === "new"){
    $("#newSection").classList.remove("hidden");
    $("#pageTitle").textContent = "New games";
  } else if(section === "recent"){
    $("#recentSection").classList.remove("hidden");
    renderRecent();
    $("#pageTitle").textContent = "Recently played";
  } else {
    $("#featuredSection").classList.remove("hidden");
    $("#pageTitle").textContent = `${section[0].toUpperCase()}${section.slice(1)} games`;
  }

  setActiveNav(section);
  window.scrollTo({top:0, behavior:"smooth"});
  closeSidebar();
}

function openSearch(query){
  $$(".game-section").forEach(s => s.classList.add("hidden"));
  $("#searchSection").classList.remove("hidden");
  $("#pageTitle").textContent = `Search: ${query}`;
  renderSearch(query);
  setActiveNav("");
  window.scrollTo({top:0, behavior:"smooth"});
}

async function markRecent(gameId){
  recentIds = [gameId, ...recentIds.filter(id => id !== gameId)].slice(0,10);
  saveGuestRecent();

  if(currentUser && db){
    try{
      const ref = doc(db, "users", currentUser.uid);
      const snap = await getDoc(ref);
      if(!snap.exists()){
        await setDoc(ref, {recentGames: recentIds, favorites: [], updatedAt: Date.now()});
      }else{
        await updateDoc(ref, {recentGames: arrayUnion(gameId), updatedAt: Date.now()});
      }
    }catch(err){
      console.warn("Cloud save failed:", err);
    }
  }
}

function showToast(message){
  const t = $("#toast");
  t.textContent = message;
  t.classList.remove("hidden");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => t.classList.add("hidden"), 2600);
}

function launchGame(game){
  markRecent(game.id);
  showToast(`"${game.title}" selected. Add your game URL in script.js to make it playable.`);
  // Later replace with:
  // window.location.href = `games/${game.id}/index.html`;
}

function bindGameClicks(){
  $$(".game-card, .featured-card").forEach(card => {
    const handler = () => launchGame(games.find(g => g.id === card.dataset.gameId));
    card.addEventListener("click", handler);
    card.addEventListener("keydown", e => {
      if(e.key === "Enter" || e.key === " ") { e.preventDefault(); handler(); }
    });
  });
}

function openLoginModal(){
  $("#forgotPassword").classList.add("hidden");
  $("#loginModal").classList.remove("hidden");
}
function closeLoginModal(){ $("#loginModal").classList.add("hidden"); }

function updateAuthUI(user){
  currentUser = user;
  $("#guestStatus").classList.toggle("hidden", !!user);
  $("#openLogin").classList.toggle("hidden", !!user);
  $("#userMenu").classList.toggle("hidden", !user);

  if(user){
    const name = user.displayName || "Player";
    $("#userName").textContent = name;
    $("#userEmail").textContent = user.email || "Signed-in player";
    $("#avatarText").textContent = name.trim().charAt(0).toUpperCase();
  }
}


// ============================================================
// EMAIL + PASSWORD LOGIN
// ============================================================
async function emailPasswordLogin(email, password) {

  try {

    const result =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    closeLoginModal();

    $("#forgotPassword")
      .classList
      .add("hidden");

    showToast(
      `Welcome back, ${
        result.user.displayName ||
        result.user.email ||
        "Player"
      }!`
    );

  } catch (error) {

    console.error(
      "Email login error:",
      error
    );

    let message = "Login failed.";

    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/user-not-found"
    ) {

      message =
        "Email or password is incorrect.";

      $("#forgotPassword")
        .classList
        .remove("hidden");

    } else if (
      error.code === "auth/invalid-email"
    ) {

      message =
        "Please enter a valid email address.";

    } else if (
      error.code === "auth/too-many-requests"
    ) {

      message =
        "Too many attempts. Please try again later.";

    } else if (
      error.code === "auth/operation-not-allowed"
    ) {

      message =
        "Enable Email/Password in Firebase Authentication.";

    } else if (error.message) {

      message =
        error.message;

    }

    showToast(message);
  }
}


// ============================================================
// FORGOT PASSWORD
// ============================================================
function openResetModal(prefillEmail = "") {

  $("#resetEmail").value =
    prefillEmail;

  $("#resetModal")
    .classList
    .remove("hidden");
}

function closeResetModal() {

  $("#resetModal")
    .classList
    .add("hidden");
}

async function sendResetEmail() {

  const email =
    $("#resetEmail")
      .value
      .trim();

  if (!email) {

    showToast(
      "Enter your Gmail/email first."
    );

    return;
  }

  try {

    await sendPasswordResetEmail(
      auth,
      email
    );

    closeResetModal();
    closeLoginModal();

    showToast(
      "Reset email sent. Check your Gmail inbox and spam folder."
    );

  } catch (error) {

    console.error(
      "Password reset error:",
      error
    );

    let message =
      "Could not send reset email.";

    if (
      error.code ===
      "auth/invalid-email"
    ) {

      message =
        "Please enter a valid email.";

    } else if (
      error.code ===
      "auth/too-many-requests"
    ) {

      message =
        "Too many attempts. Please try again later.";

    } else if (
      error.code ===
      "auth/operation-not-allowed"
    ) {

      message =
        "Email/Password authentication is not enabled.";

    } else if (error.message) {

      message =
        error.message;

    }

    showToast(message);
  }
}


async function socialLogin(providerName){
  if(!FIREBASE_READY){
    showToast("Firebase setup is needed before Google/Facebook login works.");
    return;
  }
  try{
    const provider = providerName === "google" ? googleProvider : facebookProvider;
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if(!snap.exists()){
      await setDoc(ref, {
        displayName: user.displayName || "Player",
        email: user.email || "",
        photoURL: user.photoURL || "",
        recentGames: recentIds,
        favorites: [],
        updatedAt: Date.now()
      });
    }else{
      const cloud = snap.data();
      if(Array.isArray(cloud.recentGames) && cloud.recentGames.length){
        recentIds = [...new Set([...cloud.recentGames, ...recentIds])].slice(0,10);
        saveGuestRecent();
      }
    }
    closeLoginModal();
    showToast(`Welcome, ${user.displayName || "Player"}!`);
  }catch(err){
    console.error(err);
    showToast(err?.message || "Login failed.");
  }
}

async function logout(){
  if(auth){
    try{ await signOut(auth); }catch{}
  }
  currentUser = null;
  updateAuthUI(null);
  $("#userDropdown").classList.remove("open");
  showToast("Signed out.");
}

function closeSidebar(){ $("#sidebar").classList.remove("open"); }

function init(){
  renderHome();
  bindGameClicks();

  $$(".nav-item").forEach(btn => btn.addEventListener("click", () => showSection(btn.dataset.section)));
  $$(".text-link").forEach(btn => btn.addEventListener("click", () => showSection(btn.dataset.section)));
  $$(".category-item").forEach(btn => btn.addEventListener("click", () => {
    $("#searchInput").value = btn.dataset.category;
    openSearch(btn.dataset.category);
  }));

  $$("[data-home]").forEach(el => el.addEventListener("click", e => {
    e.preventDefault();
    $("#searchInput").value = "";
    showSection("home");
  }));

  $("#searchInput").addEventListener("input", e => {
    const value = e.target.value.trim();
    if(value) openSearch(value);
    else showSection("home");
  });

  $("#openLogin").addEventListener("click", openLoginModal);
  $("#closeLogin").addEventListener("click", closeLoginModal);

  $("#loginForm").addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const email =
        $("#loginEmail").value.trim();

      const password =
        $("#loginPassword").value;

      await emailPasswordLogin(
        email,
        password
      );
    }
  );

  $("#forgotPassword").addEventListener(
    "click",
    () => {
      openResetModal(
        $("#loginEmail").value.trim()
      );
    }
  );

  $("#closeReset").addEventListener(
    "click",
    closeResetModal
  );

  $("#backToLogin").addEventListener(
    "click",
    () => {
      closeResetModal();
      openLoginModal();
    }
  );

  $("#sendResetEmail").addEventListener(
    "click",
    sendResetEmail
  );

  $("#resetModal").addEventListener(
    "click",
    (event) => {
      if (event.target.id === "resetModal") {
        closeResetModal();
      }
    }
  );

  $("#continueGuest").addEventListener("click", closeLoginModal);
  $("#googleLogin").addEventListener("click", () => socialLogin("google"));
  $("#facebookLogin").addEventListener("click", () => socialLogin("facebook"));
  $("#mobileMenu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
  $("#avatarBtn").addEventListener("click", () => $("#userDropdown").classList.toggle("open"));
  $("#logoutBtn").addEventListener("click", logout);

  $("#loginModal").addEventListener("click", e => {
    if(e.target.id === "loginModal") closeLoginModal();
  });

  document.addEventListener("keydown", e => {
    if(e.key === "Escape"){
      closeLoginModal();
      closeSidebar();
    }
  });

  if(auth){
    onAuthStateChanged(auth, updateAuthUI);
  }else{
    updateAuthUI(null);
  }
}

init();
