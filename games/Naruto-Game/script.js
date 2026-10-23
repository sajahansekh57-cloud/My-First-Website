/* =========================================================
   SHINOBI CHRONICLES — 2D action/RPG engine
   HTML5 Canvas, local-image sprites, keyboard/touch controls,
   10 missions, character jutsu, boss fight and procedural audio.
========================================================= */
"use strict";

/* ---------- Roster and character skills ---------- */
const CHARACTERS = [
  {id:"naruto",name:"Naruto Uzumaki",short:"Naruto",role:"Jinchuriki",symbol:"N",element:"🔥",accent:"#ff8b42",image:"naruto.png",basic:"Kunai Combo",special:"Rasengan",ultimate:"Shadow Clone Barrage",damage:15},
  {id:"minato",name:"Minato Namikaze",short:"Minato",role:"Yellow Flash",symbol:"四",element:"⚡",accent:"#f4c95d",image:"minato.png",basic:"Flash Strike",special:"Flying Raijin",ultimate:"Yellow Flash Blitz",damage:17},
  {id:"sasuke",name:"Sasuke Uchiha",short:"Sasuke",role:"Rogue Shinobi",symbol:"佐",element:"⚡",accent:"#9b8cff",image:"sasuke.png",basic:"Sword Slash",special:"Chidori",ultimate:"Susanoo Burst",damage:16},
  {id:"itachi",name:"Itachi Uchiha",short:"Itachi",role:"Akatsuki",symbol:"鼬",element:"🌑",accent:"#e85c72",image:"itachi.png",basic:"Crow Strike",special:"Amaterasu",ultimate:"Tsukuyomi",damage:16},
  {id:"hashirama",name:"Hashirama Senju",short:"Hashirama",role:"First Hokage",symbol:"森",element:"🌿",accent:"#62ce9a",image:"hashirama.png",basic:"Wooden Palm",special:"Wood Dragon",ultimate:"Deep Forest Bloom",damage:18},
  {id:"jiraiya",name:"Jiraiya",short:"Jiraiya",role:"Toad Sage",symbol:"自",element:"🐸",accent:"#e36d55",image:"jiraiya.png",basic:"Sage Fist",special:"Toad Flame",ultimate:"Sage Art: Giant Rasengan",damage:17},
  {id:"pain",name:"Pain",short:"Pain",role:"Six Paths",symbol:"天",element:"🌀",accent:"#d65b79",image:"pain.png",basic:"Almighty Push",special:"Shinra Tensei",ultimate:"Planetary Devastation",damage:17},
  {id:"boruto",name:"Boruto Uzumaki",short:"Boruto",role:"Next Generation",symbol:"ボ",element:"💠",accent:"#68bffb",image:"Boruto Uzumaki.png",basic:"Swift Kunai",special:"Vanishing Rasengan",ultimate:"Karma Surge",damage:15},
  {id:"orochimaru",name:"Orochimaru",short:"Orochimaru",role:"Forbidden Arts",symbol:"蛇",element:"🐍",accent:"#b0a0da",image:"orochimaru.png",basic:"Snake Strike",special:"Serpent Coil",ultimate:"Eight Branches Assault",damage:15},
  {id:"madara",name:"Madara Uchiha",short:"Madara",role:"Legendary Uchiha",symbol:"斑",element:"🔥",accent:"#e74e4e",image:"Madara Uchiha.png",basic:"Gunbai Strike",special:"Fire Style: Great Flame",ultimate:"Perfect Susanoo",damage:21}
];

const LEVELS = [
  {n:1,title:"Break the Stone Barrier",objective:"Move across the arena and destroy the stone barrier.",type:"barrier",accent:"#c0a17c",tag:"TRAINING MISSION",reward:"Chakra Control"},
  {n:2,title:"Rogue Ninja Outpost",objective:"Defeat the rogue ninja and secure the outpost.",type:"fight",accent:"#6ba3e8",tag:"ROGUE NINJA",reward:"Quick Recovery"},
  {n:3,title:"Forest Ambush",objective:"Survive the forest ambush and defeat the enemy.",type:"fight",accent:"#55c68c",tag:"AMBUSH",reward:"Sharper Kunai"},
  {n:4,title:"Hidden Rain Pursuit",objective:"Break through the rain ninja defense.",type:"fight",accent:"#4fc6d7",tag:"PURSUIT",reward:"Jutsu Focus"},
  {n:5,title:"Akatsuki Encounter",objective:"Defeat an Akatsuki-level opponent.",type:"fight",accent:"#dd5b73",tag:"HIGH THREAT",reward:"Chakra Surge"},
  {n:6,title:"Valley of Echoes",objective:"Overcome an elite rogue ninja.",type:"fight",accent:"#b394f3",tag:"ELITE FIGHT",reward:"Heavy Impact"},
  {n:7,title:"Summoning Grounds",objective:"Defeat the reinforced shinobi guard.",type:"fight",accent:"#f09a57",tag:"REINFORCED",reward:"Jutsu Mastery"},
  {n:8,title:"Five Kage Frontline",objective:"Push through the frontline warrior.",type:"fight",accent:"#e6c45c",tag:"WAR FRONT",reward:"Battle Instinct"},
  {n:9,title:"Road to the Final War",objective:"Defeat the final guard before the boss.",type:"fight",accent:"#eb6c8d",tag:"FINAL GUARD",reward:"Ultimate Control"},
  {n:10,title:"Uchiha Madara (100x Power)",objective:"Survive the ultimate showdown. Boss has 300 HP.",type:"boss",accent:"#ff3b57",tag:"BOSS LEVEL",reward:"Legendary Shinobi"}
];

/* The first five characters use the requested image files. Missing images
   automatically fall back to the canvas-drawn character, so the game runs
   even before these image files are added beside index.html. */
const IMAGE_CACHE = new Map();
for (const character of CHARACTERS) {
  if (character.image) {
    const image = new Image();
    image.src = character.image;
    IMAGE_CACHE.set(character.id, image);
  }
}

/* ---------- App and battle state ---------- */
const state = {
  selectedCharacter: CHARACTERS[0], screen:"characters", level:1,
  highestCleared:loadHighestCleared(), paused:false, battleEnded:false,
  lastFrame:0, keys:new Set(), audioContext:null, toastTimer:null,
  player:null, enemy:null, barrier:null, projectiles:[], particles:[],
  shake:0, flash:0, missionStart:0, lastHudUpdate:0
};
const $ = id => document.getElementById(id);

// Keep positions and health-bar values within their allowed range.
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
const canvas = $("battleCanvas");
const ctx = canvas.getContext("2d");
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_Y = 408;

/* ---------- Progress saved locally on this browser ---------- */
function loadHighestCleared() {
  try { return Math.max(0,Math.min(10,Number(localStorage.getItem("shinobi_chronicles_cleared") || 0))); }
  catch (_) { return 0; }
}
function saveHighestCleared() {
  try { localStorage.setItem("shinobi_chronicles_cleared",String(state.highestCleared)); }
  catch (_) { /* Still playable when storage is blocked. */ }
}
function powerRank() { return Math.min(5,Math.floor(state.highestCleared / 2)); }

/* ---------- Screen navigation ---------- */
function showScreen(name) {
  state.screen = name;
  $("characterScreen").classList.toggle("hidden",name !== "characters");
  $("levelScreen").classList.toggle("hidden",name !== "levels");
  $("battleScreen").classList.toggle("hidden",name !== "battle");
  if (name !== "battle") {
    state.paused = false;
    $("pauseOverlay").classList.add("hidden");
    $("battleResultOverlay").classList.add("hidden");
  }
  updatePowerLabel();
  window.scrollTo({top:0,behavior:"smooth"});
}

function renderCharacters() {
  const grid = $("characterGrid");
  grid.innerHTML = CHARACTERS.map((character,index) => {
    const imageHTML = character.image
      ? `<img src="${character.image}" alt="${character.name}" loading="lazy" onerror="this.style.display='none'">`
      : "";
    return `<button type="button" class="char-card ${character.id === state.selectedCharacter.id ? "selected" : ""}" data-character="${character.id}" style="--accent:${character.accent}">
      <div class="char-portrait"><span class="char-fallback">${character.symbol}</span>${imageHTML}<span class="char-index">${String(index+1).padStart(2,"0")}</span><span class="char-element">${character.element}</span></div>
      <div class="char-meta"><h3>${character.name}</h3><div class="char-role">${character.role}</div><div class="char-skill">${character.special}<br><span style="color:#72839a">ULT: ${character.ultimate}</span></div></div></button>`;
  }).join("");
  grid.querySelectorAll(".char-card").forEach(card => card.addEventListener("click",() => selectCharacter(card.dataset.character)));
  updateCharacterSummary();
}

function selectCharacter(id) {
  const found = CHARACTERS.find(character => character.id === id);
  if (!found) return;
  state.selectedCharacter = found;
  document.querySelectorAll(".char-card").forEach(card => card.classList.toggle("selected",card.dataset.character === id));
  updateCharacterSummary();
  updatePowerLabel();
}

function updateCharacterSummary() {
  const character = state.selectedCharacter;
  $("selectedMiniPortrait").textContent = character.symbol;
  $("selectedMiniPortrait").style.background = `linear-gradient(135deg,${character.accent},#141a2a)`;
  $("selectedCharacterName").textContent = character.name;
  $("selectedCharacterSkill").textContent = `${character.special} • ${character.ultimate}`;
  $("mapCharacterLabel").textContent = `${character.name} selected`;
  $("playerHudName").textContent = character.short;
  $("playerHudAvatar").textContent = character.symbol;
  $("playerHudAvatar").style.background = `linear-gradient(135deg,${character.accent},#1a2031)`;
  $("specialButtonName").textContent = character.special;
  $("ultimateButtonName").textContent = character.ultimate;
}

function updatePowerLabel() {
  $("powerRankLabel").textContent = `POWER RANK ${powerRank()}`;
  $("missionsCleared").textContent = `${state.highestCleared} / 10`;
  const locked = state.highestCleared < 1;
  $("ultimateButtonHint").textContent = locked ? "L • CLEAR LEVEL 1 TO UNLOCK" : "L • 60 chakra";
  if (state.player) $("ultimateBtn").disabled = locked || state.player.chakra < 60 || state.player.cooldownUltimate > 0 || state.battleEnded;
}

function renderLevels() {
  $("levelGrid").innerHTML = LEVELS.map(level => {
    const cleared = state.highestCleared >= level.n;
    const boss = level.n === 10;
    return `<button type="button" class="level-card ${boss ? "boss-level" : ""} ${cleared ? "cleared" : ""}" data-level="${level.n}" style="--level-accent:${level.accent}">
      <div class="level-num">LEVEL ${String(level.n).padStart(2,"0")}</div><h3>${level.title}</h3>
      <p>${level.n === 1 ? "Break the barrier of stone." : boss ? "Final battle • 300 HP boss" : level.objective}</p>
      <div class="level-foot"><span>${cleared ? "Cleared" : level.tag}</span><span>${boss ? "☠" : cleared ? "✓" : "➜"}</span></div></button>`;
  }).join("");
  $("levelGrid").querySelectorAll(".level-card").forEach(card => card.addEventListener("click",() => {
    const level = Number(card.dataset.level);
    if (level === 10) openBossWarning(); else startBattle(level);
  }));
}

/* ---------- Web Audio: generated tones, no external sound files ---------- */
function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!state.audioContext) state.audioContext = new AudioContextClass();
  if (state.audioContext.state === "suspended") state.audioContext.resume();
  return state.audioContext;
}
function playAttackSound() {
  const audio = getAudioContext(); if (!audio) return;
  const now = audio.currentTime, osc = audio.createOscillator(), gain = audio.createGain();
  osc.type = "sine"; osc.frequency.setValueAtTime(260,now); osc.frequency.exponentialRampToValueAtTime(75,now+.16);
  gain.gain.setValueAtTime(.12,now); gain.gain.exponentialRampToValueAtTime(.001,now+.18);
  osc.connect(gain); gain.connect(audio.destination); osc.start(now); osc.stop(now+.19);
}
function playJutsuSound() {
  const audio = getAudioContext(); if (!audio) return;
  const now = audio.currentTime, osc = audio.createOscillator(), gain = audio.createGain();
  osc.type = "sawtooth"; osc.frequency.setValueAtTime(160,now); osc.frequency.exponentialRampToValueAtTime(760,now+.12); osc.frequency.exponentialRampToValueAtTime(110,now+.48);
  gain.gain.setValueAtTime(.001,now); gain.gain.exponentialRampToValueAtTime(.13,now+.04); gain.gain.exponentialRampToValueAtTime(.001,now+.5);
  osc.connect(gain); gain.connect(audio.destination); osc.start(now); osc.stop(now+.52);
}
function playDangerAlarm() {
  const audio = getAudioContext(); if (!audio) return;
  const now = audio.currentTime;
  for (let i=0;i<6;i++) {
    const osc=audio.createOscillator(),gain=audio.createGain(),start=now+i*.19;
    osc.type="square"; osc.frequency.setValueAtTime(i%2===0?880:620,start);
    gain.gain.setValueAtTime(.0001,start); gain.gain.exponentialRampToValueAtTime(.07,start+.015); gain.gain.exponentialRampToValueAtTime(.0001,start+.13);
    osc.connect(gain); gain.connect(audio.destination); osc.start(start); osc.stop(start+.14);
  }
}

/* ---------- Boss warning and mission startup ---------- */
function openBossWarning() { $("bossWarningOverlay").classList.remove("hidden"); playDangerAlarm(); }
function closeBossWarning() { $("bossWarningOverlay").classList.add("hidden"); }

function startBattle(levelNumber) {
  const level = LEVELS.find(entry => entry.n === levelNumber);
  if (!level) return;
  closeBossWarning();
  state.level=levelNumber; state.paused=false; state.battleEnded=false;
  state.projectiles=[]; state.particles=[]; state.shake=0; state.flash=0; state.missionStart=performance.now();
  state.player={x:145,hp:100,maxHp:100,chakra:100,maxChakra:100,facing:1,moveSpeed:245,attackTimer:0,attackType:"basic",hurtTimer:0,cooldownBasic:0,cooldownSpecial:0,cooldownUltimate:0,invulnerable:0,stepTime:0};
  state.barrier=levelNumber===1?{x:852,hp:120,maxHp:120,width:68,height:138,hurtTimer:0}:null;

  if (levelNumber===1) {
    state.enemy=null;
    $("enemyTypeLabel").textContent="STONE BARRIER"; $("enemySubLabel").textContent="Break the stone to pass";
    $("missionTitle").textContent="Break the Stone Barrier";
    $("missionObjective").textContent="Move close, then use a Basic Attack or Jutsu on the barrier.";
  } else {
    const boss=levelNumber===10, maxHp=boss?300:55+levelNumber*17;
    state.enemy={x:815,hp:maxHp,maxHp,damage:boss?22:5+levelNumber*1.45,speed:boss?48:34+levelNumber*4.5,attackCooldown:boss?1.08:1.35-Math.min(.3,levelNumber*.02),hurtTimer:0,attackTimer:0,isBoss:boss,name:boss?"Uchiha Madara (100x Power)":`Rogue Ninja ${levelNumber-1}`};
    $("enemyTypeLabel").textContent=boss?"MADARA • 100X":"ROGUE NINJA";
    $("enemySubLabel").textContent=boss?"Legendary boss • 300 HP":`Threat level ${levelNumber-1}`;
    $("missionTitle").textContent=level.title; $("missionObjective").textContent=level.objective;
  }
  $("battleLevelTag").textContent=`LEVEL ${String(levelNumber).padStart(2,"0")} • ${level.tag}`;
  $("pauseOverlay").classList.add("hidden"); $("battleResultOverlay").classList.add("hidden");
  updateCharacterSummary(); updateHud(true); showScreen("battle");
  if (levelNumber===10) playDangerAlarm();
  drawArena();
}

function updateHud(force=false) {
  if (!state.player) return;
  const p=state.player;
  $("playerHpText").textContent=`${Math.ceil(p.hp)} / ${p.maxHp} HP`;
  $("chakraText").textContent=`${Math.floor(p.chakra)} / ${p.maxChakra}`;
  $("playerHpFill").style.width=`${Math.max(0,p.hp/p.maxHp*100)}%`;
  $("chakraFill").style.width=`${Math.max(0,p.chakra/p.maxChakra*100)}%`;
  const target=state.barrier||state.enemy;
  if (target) { $("enemyHpText").textContent=`${Math.ceil(target.hp)} / ${target.maxHp} HP`; $("enemyHpFill").style.width=`${Math.max(0,target.hp/target.maxHp*100)}%`; }
  else { $("enemyHpText").textContent="—"; $("enemyHpFill").style.width="0%"; }
  $("ultimateBtn").disabled=state.highestCleared<1||p.chakra<60||p.cooldownUltimate>0||state.battleEnded;
  $("specialJutsuBtn").disabled=p.chakra<25||p.cooldownSpecial>0||state.battleEnded;
  $("basicAttackBtn").disabled=p.cooldownBasic>0||state.battleEnded;
  if (force) updatePowerLabel();
}

/* ---------- Damage, particles, and attacks ---------- */
function spawnBurst(x,y,color,count=14,speed=190) {
  for(let i=0;i<count;i++) { const angle=Math.random()*Math.PI*2,velocity=35+Math.random()*speed; state.particles.push({x,y,vx:Math.cos(angle)*velocity,vy:Math.sin(angle)*velocity,life:.3+Math.random()*.48,maxLife:.78,size:2+Math.random()*4,color}); }
}
function showToast(message) {
  const toast=$("toast"); toast.textContent=message; toast.classList.remove("hidden"); clearTimeout(state.toastTimer); state.toastTimer=setTimeout(()=>toast.classList.add("hidden"),2100);
}
function applyTargetDamage(damage,effect="hit") {
  if (state.battleEnded) return;
  const target=state.barrier||state.enemy; if(!target)return;
  target.hp=Math.max(0,target.hp-damage); target.hurtTimer=.18;
  state.shake=Math.max(state.shake,effect==="ultimate"?12:effect==="special"?7:3);
  const x=target.x; spawnBurst(x,GROUND_Y-(state.barrier?72:55),effect==="ultimate"?"#ffe58a":effect==="special"?"#65d7ff":"#ff8754",effect==="ultimate"?34:effect==="special"?20:9,effect==="ultimate"?270:170);
  updateHud(); if(target.hp<=0)finishBattle(true);
}
function basicAttack() {
  if(state.screen!=="battle"||state.paused||state.battleEnded||!state.player)return;
  const p=state.player;if(p.cooldownBasic>0)return;
  p.cooldownBasic=.34;p.attackTimer=.22;p.attackType="basic";p.x=clamp(p.x+p.facing*22,42,WIDTH-45);playAttackSound();
  const target=state.barrier||state.enemy;if(!target)return;
  if(Math.abs(target.x-p.x)<=(state.barrier?122:115))applyTargetDamage(state.selectedCharacter.damage+powerRank()*2,"hit");
  else {showToast("Move closer for a Basic Attack!");spawnBurst(p.x+p.facing*40,GROUND_Y-60,"#ffffff",5,90);}
  updateHud();
}
function specialJutsu() {
  if(state.screen!=="battle"||state.paused||state.battleEnded||!state.player)return;
  const p=state.player;if(p.cooldownSpecial>0)return;if(p.chakra<25){showToast("Not enough chakra!");return;}
  p.chakra-=25;p.cooldownSpecial=.65;p.attackTimer=.32;p.attackType="special";playJutsuSound();
  state.projectiles.push({x:p.x+p.facing*45,y:GROUND_Y-62,vx:p.facing*570,r:15,life:1.8,damage:26+powerRank()*5+Math.floor(state.selectedCharacter.damage*.65),color:state.selectedCharacter.accent,targetType:state.barrier?"barrier":"enemy"});
  spawnBurst(p.x+p.facing*40,GROUND_Y-62,state.selectedCharacter.accent,12,140);updateHud();
}
function ultimateSkill() {
  if(state.screen!=="battle"||state.paused||state.battleEnded||!state.player)return;
  const p=state.player;if(state.highestCleared<1){showToast("Clear Level 1 to unlock your Ultimate Skill!");return;}if(p.cooldownUltimate>0)return;if(p.chakra<60){showToast("You need 60 chakra for the Ultimate!");return;}
  p.chakra-=60;p.cooldownUltimate=2.4;p.attackTimer=.65;p.attackType="ultimate";state.flash=.28;playJutsuSound();
  const target=state.barrier||state.enemy;if(target){spawnBurst(target.x,GROUND_Y-(state.barrier?80:70),"#fff4a6",48,340);applyTargetDamage(72+powerRank()*12+Math.floor(state.selectedCharacter.damage*1.2),"ultimate");}
  showToast(`${state.selectedCharacter.ultimate}!`);updateHud();
}

/* ---------- Runtime battle update ---------- */
function updateBattle(dt) {
  if(!state.player||state.battleEnded||state.paused)return;
  const p=state.player;
  p.cooldownBasic=Math.max(0,p.cooldownBasic-dt);p.cooldownSpecial=Math.max(0,p.cooldownSpecial-dt);p.cooldownUltimate=Math.max(0,p.cooldownUltimate-dt);p.attackTimer=Math.max(0,p.attackTimer-dt);p.hurtTimer=Math.max(0,p.hurtTimer-dt);p.invulnerable=Math.max(0,p.invulnerable-dt);p.chakra=Math.min(p.maxChakra,p.chakra+5.2*dt);
  const left=state.keys.has("ArrowLeft")||state.keys.has("a"),right=state.keys.has("ArrowRight")||state.keys.has("d");
  if(left&&!right){p.x-=p.moveSpeed*dt;p.facing=-1;p.stepTime+=dt*12;}else if(right&&!left){p.x+=p.moveSpeed*dt;p.facing=1;p.stepTime+=dt*12;}
  p.x=clamp(p.x,42,WIDTH-45);

  if(state.enemy){
    const e=state.enemy;e.hurtTimer=Math.max(0,e.hurtTimer-dt);e.attackTimer=Math.max(0,e.attackTimer-dt);e.attackCooldown-=dt;
    const distance=p.x-e.x,absDistance=Math.abs(distance);
    if(absDistance>(e.isBoss?105:76)){e.x+=Math.sign(distance)*e.speed*dt;e.x=clamp(e.x,60,WIDTH-55);}
    else if(e.attackCooldown<=0){
      e.attackCooldown=e.isBoss?1.08:1.35-Math.min(.3,state.level*.02);e.attackTimer=.28;
      if(p.invulnerable<=0){p.hp=Math.max(0,p.hp-e.damage);p.hurtTimer=.24;p.invulnerable=.38;p.x=clamp(p.x+Math.sign(distance)*22,42,WIDTH-45);state.shake=Math.max(state.shake,e.isBoss?9:5);spawnBurst(p.x,GROUND_Y-56,"#ff4057",e.isBoss?17:9,155);playAttackSound();if(p.hp<=0){updateHud();finishBattle(false);}}
    }
  }

  for(let i=state.projectiles.length-1;i>=0;i--){
    const shot=state.projectiles[i];shot.x+=shot.vx*dt;shot.life-=dt;const target=state.barrier||state.enemy;let hit=false;
    if(target&&shot.targetType==="barrier"&&state.barrier)hit=Math.abs(shot.x-target.x)<target.width/2+shot.r;
    else if(target&&state.enemy)hit=Math.abs(shot.x-state.enemy.x)<(state.enemy.isBoss?65:42)+shot.r;
    if(hit){applyTargetDamage(shot.damage,"special");spawnBurst(shot.x,shot.y,shot.color,18,210);state.projectiles.splice(i,1);}
    else if(shot.life<=0||shot.x< -40||shot.x>WIDTH+40)state.projectiles.splice(i,1);
  }
  for(let i=state.particles.length-1;i>=0;i--){const ptl=state.particles[i];ptl.x+=ptl.vx*dt;ptl.y+=ptl.vy*dt;ptl.vx*=Math.pow(.18,dt);ptl.vy+=90*dt;ptl.life-=dt;if(ptl.life<=0)state.particles.splice(i,1);}
  state.shake=Math.max(0,state.shake-26*dt);state.flash=Math.max(0,state.flash-dt);
  if(performance.now()-state.lastHudUpdate>90){updateHud();state.lastHudUpdate=performance.now();}
}

/* ---------- Canvas drawing ---------- */
function drawArena() {
  ctx.save();
  const sx=state.shake>0?(Math.random()-.5)*state.shake:0,sy=state.shake>0?(Math.random()-.5)*state.shake*.55:0;ctx.translate(sx,sy);
  const sky=ctx.createLinearGradient(0,0,0,HEIGHT);sky.addColorStop(0,state.level===10?"#24152b":"#182b45");sky.addColorStop(.6,state.level===10?"#4a1a2e":"#38516a");sky.addColorStop(1,"#192438");ctx.fillStyle=sky;ctx.fillRect(0,0,WIDTH,HEIGHT);
  ctx.globalAlpha=.75;ctx.beginPath();ctx.arc(785,90,state.level===10?47:34,0,Math.PI*2);ctx.fillStyle=state.level===10?"#b73556":"#d3deea";ctx.fill();ctx.globalAlpha=1;
  drawMountainLayer("#26374c",270,140,90);drawMountainLayer("#202c40",320,120,50);
  for(let i=0;i<15;i++){const x=i*76-10,h=35+((i*37)%65);ctx.fillStyle=i%2?"#151f30":"#192437";ctx.fillRect(x,GROUND_Y-h-5,54,h+8);ctx.beginPath();ctx.moveTo(x-7,GROUND_Y-h-5);ctx.lineTo(x+26,GROUND_Y-h-28);ctx.lineTo(x+61,GROUND_Y-h-5);ctx.closePath();ctx.fill();if(i%3===0){ctx.fillStyle=state.level===10?"#ed475a":"#f0bb73";ctx.globalAlpha=.42;ctx.fillRect(x+16,GROUND_Y-h+8,5,8);ctx.globalAlpha=1;}}
  for(let i=0;i<32;i++){const x=(i*89+37)%WIDTH,y=35+((i*47)%285);ctx.globalAlpha=.18+(i%3)*.12;ctx.fillStyle=state.level===10?"#ff5b76":"#93d9ff";ctx.fillRect(x,y,2,2);}ctx.globalAlpha=1;
  ctx.fillStyle="#101827";ctx.fillRect(0,GROUND_Y,WIDTH,HEIGHT-GROUND_Y);const floor=ctx.createLinearGradient(0,GROUND_Y,0,HEIGHT);floor.addColorStop(0,"#344256");floor.addColorStop(1,"#121a29");ctx.fillStyle=floor;ctx.fillRect(0,GROUND_Y,WIDTH,HEIGHT-GROUND_Y);
  ctx.strokeStyle=state.level===10?"#a93552":"#4a667f";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,GROUND_Y);ctx.lineTo(WIDTH,GROUND_Y);ctx.stroke();
  for(let x=-20;x<WIDTH;x+=90){ctx.strokeStyle="#ffffff0b";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,GROUND_Y+2);ctx.lineTo(x+50,HEIGHT);ctx.stroke();}
  if(state.barrier)drawBarrier(state.barrier);
  const p=state.player;
  if(p){let lunge=0;if(p.attackTimer>0){const duration=p.attackType==="ultimate"?.65:p.attackType==="special"?.32:.22,strength=p.attackType==="ultimate"?34:p.attackType==="special"?21:17;lunge=p.facing*strength*Math.sin((p.attackTimer/duration)*Math.PI);}drawFighter(p.x+lunge,GROUND_Y,state.selectedCharacter,p.facing,{hurt:p.hurtTimer>0,attack:p.attackTimer>0,walking:state.keys.has("ArrowLeft")||state.keys.has("ArrowRight")||state.keys.has("a")||state.keys.has("d"),phase:p.stepTime});}
  if(state.enemy){const e=state.enemy,enemyCharacter=e.isBoss?CHARACTERS.find(ch=>ch.id==="madara"):null;drawFighter(e.x,GROUND_Y,enemyCharacter,p?Math.sign((p.x-e.x)||-1):-1,{enemy:true,boss:e.isBoss,hurt:e.hurtTimer>0,attack:e.attackTimer>0,walking:true,phase:performance.now()/100});drawCanvasHealthBar(e.x,GROUND_Y-(e.isBoss?158:124),e.hp,e.maxHp,e.isBoss?150:92);ctx.fillStyle=e.isBoss?"#ff9baa":"#e1e7f0";ctx.font=e.isBoss?"bold 14px system-ui":"bold 11px system-ui";ctx.textAlign="center";ctx.fillText(e.name,e.x,GROUND_Y-(e.isBoss?169:135));}
  for(const shot of state.projectiles){ctx.save();ctx.shadowBlur=22;ctx.shadowColor=shot.color;const radius=shot.r+Math.sin(performance.now()/40)*2;const orb=ctx.createRadialGradient(shot.x-5,shot.y-5,2,shot.x,shot.y,radius*1.7);orb.addColorStop(0,"#fff");orb.addColorStop(.25,shot.color);orb.addColorStop(1,"#2279ff00");ctx.fillStyle=orb;ctx.beginPath();ctx.arc(shot.x,shot.y,radius*1.7,0,Math.PI*2);ctx.fill();ctx.restore();}
  for(const particle of state.particles){ctx.globalAlpha=Math.max(0,Math.min(1,particle.life/particle.maxLife));ctx.fillStyle=particle.color;ctx.shadowBlur=9;ctx.shadowColor=particle.color;ctx.fillRect(particle.x,particle.y,particle.size,particle.size);}ctx.globalAlpha=1;ctx.shadowBlur=0;
  if(state.level===10){ctx.fillStyle="#7c1028b8";ctx.fillRect(0,0,WIDTH,32);ctx.fillStyle="#ffeaf0";ctx.font="900 13px system-ui";ctx.textAlign="center";ctx.fillText("DANGER • UCHIHA MADARA • 100X POWER",WIDTH/2,21);}else{ctx.fillStyle="#07101db8";ctx.fillRect(0,0,220,28);ctx.fillStyle="#e5edf7";ctx.font="800 11px system-ui";ctx.textAlign="left";ctx.fillText(`LEVEL ${String(state.level).padStart(2,"0")} / ${LEVELS[state.level-1].tag}`,12,18);}
  if(state.flash>0){ctx.fillStyle=`rgba(255,245,190,${Math.min(.45,state.flash*1.7)})`;ctx.fillRect(0,0,WIDTH,HEIGHT);}ctx.restore();
}

function drawMountainLayer(color,baseY,height,phase){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,baseY);for(let x=0;x<=WIDTH;x+=55){const y=baseY-height*(.3+((Math.sin(x*.021+phase)+1)*.26));ctx.lineTo(x,y);}ctx.lineTo(WIDTH,GROUND_Y);ctx.lineTo(0,GROUND_Y);ctx.closePath();ctx.fill();}
function drawBarrier(b){const x=b.x,y=GROUND_Y-b.height;ctx.fillStyle="#080d14aa";ctx.beginPath();ctx.ellipse(x,GROUND_Y+4,55,11,0,0,Math.PI*2);ctx.fill();const stone=ctx.createLinearGradient(x-45,y,x+45,GROUND_Y);stone.addColorStop(0,"#abb0b5");stone.addColorStop(.45,"#666d77");stone.addColorStop(1,"#353d49");ctx.fillStyle=stone;ctx.beginPath();ctx.moveTo(x-34,y+18);ctx.lineTo(x-23,y);ctx.lineTo(x+29,y+4);ctx.lineTo(x+38,y+23);ctx.lineTo(x+32,GROUND_Y);ctx.lineTo(x-37,GROUND_Y);ctx.closePath();ctx.fill();ctx.strokeStyle="#d4d8dc";ctx.lineWidth=2;ctx.stroke();ctx.strokeStyle="#303744";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-5,y+19);ctx.lineTo(x-17,y+54);ctx.lineTo(x+1,y+70);ctx.lineTo(x-9,y+97);ctx.moveTo(x+24,y+34);ctx.lineTo(x+7,y+48);ctx.lineTo(x+17,y+67);ctx.stroke();drawCanvasHealthBar(x,y-15,b.hp,b.maxHp,105);ctx.fillStyle="#fff";ctx.font="bold 12px system-ui";ctx.textAlign="center";ctx.fillText("STONE BARRIER",x,y-25);}
function drawCanvasHealthBar(x,y,hp,maxHp,width){ctx.save();ctx.fillStyle="#07101dbb";ctx.fillRect(x-width/2,y,width,7);const pct=clamp(hp/maxHp,0,1);ctx.fillStyle=pct>.5?"#ff5c68":"#ffb347";ctx.fillRect(x-width/2,y,width*pct,7);ctx.strokeStyle="#ffffff80";ctx.lineWidth=1;ctx.strokeRect(x-width/2,y,width,7);ctx.restore();}

function drawFighter(x,ground,character,facing,options={}){
  const isEnemy=!!options.enemy,isBoss=!!options.boss,height=isBoss?142:108,width=isBoss?108:78;
  ctx.save();ctx.globalAlpha=isBoss?.36:.26;ctx.fillStyle="#000";ctx.beginPath();ctx.ellipse(x,ground+2,isBoss?50:34,9,0,0,Math.PI*2);ctx.fill();ctx.restore();
  if(isBoss||options.attack||(!isEnemy&&state.player&&state.player.chakra>85)){ctx.save();const color=isBoss?"#f23b59":(character?.accent||"#5acbff");ctx.globalAlpha=isBoss?.35:.2;ctx.shadowBlur=22;ctx.shadowColor=color;ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,ground-height/2,width*.46,height*.48,0,0,Math.PI*2);ctx.fill();ctx.restore();}
  if(options.hurt){ctx.save();ctx.globalAlpha=.48;ctx.fillStyle="#ff304e";ctx.fillRect(x-width/2,ground-height,width,height);ctx.restore();}
  const actual=character||(!isEnemy?state.selectedCharacter:null),image=actual&&IMAGE_CACHE.get(actual.id);
  if(!isEnemy&&image&&image.complete&&image.naturalWidth>0){ctx.save();ctx.translate(x,0);if(facing<0)ctx.scale(-1,1);ctx.drawImage(image,-width/2,ground-height,width,height);ctx.restore();return;}
  ctx.save();ctx.translate(x,0);if(facing<0)ctx.scale(-1,1);const accent=isEnemy?(isBoss?"#b82b45":"#566171"):(character?.accent||"#ff8b42"),headY=ground-height+(isBoss?24:19),stride=options.walking?Math.sin(options.phase||0)*6:0;
  ctx.fillStyle=isEnemy?"#171b25":"#1b2636";roundRect(ctx,-24,ground-33+stride,18,33,6,true);roundRect(ctx,7,ground-33-stride,18,33,6,true);ctx.fillStyle=accent;roundRect(ctx,-28,ground-10+stride,23,10,4,true);roundRect(ctx,5,ground-10-stride,23,10,4,true);
  ctx.fillStyle=isEnemy?"#202633":accent;ctx.beginPath();ctx.moveTo(-27,ground-76);ctx.lineTo(24,ground-76);ctx.lineTo(31,ground-35);ctx.lineTo(-31,ground-35);ctx.closePath();ctx.fill();ctx.fillStyle="#101725";ctx.fillRect(-29,ground-48,58,7);
  const swing=options.attack?-13:stride*.55;ctx.strokeStyle=isEnemy?"#242b38":accent;ctx.lineWidth=12;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-23,ground-69);ctx.lineTo(-38,ground-51+swing);ctx.moveTo(21,ground-69);ctx.lineTo(37+(options.attack?10:0),ground-55-swing);ctx.stroke();
  ctx.fillStyle=isEnemy?"#aa8f82":"#efc5a7";ctx.beginPath();ctx.arc(0,headY+23,isBoss?24:20,0,Math.PI*2);ctx.fill();ctx.fillStyle=isEnemy?"#17151b":(["itachi","madara","sasuke"].includes(character?.id)?"#15151e":accent);ctx.beginPath();ctx.moveTo(-22,headY+19);ctx.lineTo(-17,headY-2);ctx.lineTo(-4,headY+5);ctx.lineTo(4,headY-8);ctx.lineTo(16,headY+4);ctx.lineTo(24,headY+19);ctx.closePath();ctx.fill();ctx.fillStyle=isBoss?"#9a233b":"#242b35";ctx.fillRect(-19,headY+12,38,7);ctx.fillStyle="#c8d3df";ctx.fillRect(-4,headY+13,9,4);ctx.fillStyle=isBoss?"#ff3c61":"#17151a";ctx.fillRect(5,headY+26,7,3);ctx.strokeStyle="#563d3b";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(7,headY+37);ctx.lineTo(13,headY+36);ctx.stroke();
  if(isBoss){ctx.fillStyle="#743044";ctx.beginPath();ctx.moveTo(-31,ground-72);ctx.lineTo(-45,ground-57);ctx.lineTo(-36,ground-32);ctx.lineTo(-25,ground-39);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(31,ground-72);ctx.lineTo(45,ground-57);ctx.lineTo(36,ground-32);ctx.lineTo(25,ground-39);ctx.closePath();ctx.fill();}ctx.restore();
}
function roundRect(c,x,y,w,h,r,fill){const q=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+q,y);c.arcTo(x+w,y,x+w,y+h,q);c.arcTo(x+w,y+h,x,y+h,q);c.arcTo(x,y+h,x,y,q);c.arcTo(x,y,x+w,y,q);if(fill)c.fill();}

/* ---------- Victory/defeat and progression ---------- */
function finishBattle(victory){
  if(state.battleEnded)return;state.battleEnded=true;state.paused=false;$("pauseOverlay").classList.add("hidden");$("battleResultOverlay").classList.remove("hidden");
  if(victory){const newRecord=state.level>state.highestCleared;state.highestCleared=Math.max(state.highestCleared,state.level);saveHighestCleared();$("resultSymbol").textContent="✦";$("resultSymbol").style.color="#50e2a0";$("resultKicker").textContent="MISSION CLEARED";$("resultTitle").textContent=state.level===10?"Legendary Victory!":"Mission Complete!";const level=LEVELS[state.level-1];$("resultMessage").textContent=newRecord?`You unlocked ${level.reward}! Power Rank is now ${powerRank()}. Your jutsu grow stronger with every victory.`:`Mission cleared. ${level.reward} is in your arsenal. Keep improving your Power Rank.`;$("nextLevelBtn").classList.toggle("hidden",state.level>=10);$("resultMapBtn").textContent=state.level>=10?"Return to Level Map":"Level Map";}
  else{$("resultSymbol").textContent="☠";$("resultSymbol").style.color="#ff5269";$("resultKicker").textContent="SHINOBI DOWN";$("resultTitle").textContent="Mission Failed";$("resultMessage").textContent="Recover, adjust your timing, and try the mission again.";$("nextLevelBtn").classList.add("hidden");}
  updateHud(true);renderLevels();
}
function togglePause(){if(state.screen!=="battle"||state.battleEnded)return;state.paused=!state.paused;$("pauseOverlay").classList.toggle("hidden",!state.paused);$("pauseBtn").textContent=state.paused?"▶ Resume":"Ⅱ Pause";}

/* ---------- Button, keyboard and touch controls ---------- */
function bindControls(){
  $("continueToLevels").addEventListener("click",()=>{renderLevels();showScreen("levels");});
  $("backToCharacters").addEventListener("click",()=>showScreen("characters"));
  $("pauseBtn").addEventListener("click",togglePause);$("resumeBtn").addEventListener("click",togglePause);
  $("leaveBattleBtn").addEventListener("click",()=>{state.paused=false;renderLevels();showScreen("levels");});
  $("basicAttackBtn").addEventListener("click",basicAttack);$("specialJutsuBtn").addEventListener("click",specialJutsu);$("ultimateBtn").addEventListener("click",ultimateSkill);
  $("cancelBossBtn").addEventListener("click",closeBossWarning);$("enterBossBtn").addEventListener("click",()=>startBattle(10));
  $("bossWarningOverlay").addEventListener("click",event=>{if(event.target===$("bossWarningOverlay"))closeBossWarning();});
  $("retryBtn").addEventListener("click",()=>startBattle(state.level));$("nextLevelBtn").addEventListener("click",()=>startBattle(Math.min(10,state.level+1)));
  $("resultMapBtn").addEventListener("click",()=>{renderLevels();showScreen("levels");});

  document.querySelectorAll(".direction-btn").forEach(button=>{
    const key=button.dataset.direction==="left"?"ArrowLeft":"ArrowRight";
    const down=event=>{event.preventDefault();state.keys.add(key);button.classList.add("pressed");try{if(button.setPointerCapture&&event.pointerId!==undefined)button.setPointerCapture(event.pointerId);}catch(_){}};
    const up=event=>{event.preventDefault();state.keys.delete(key);button.classList.remove("pressed");};
    button.addEventListener("pointerdown",down);button.addEventListener("pointerup",up);button.addEventListener("pointercancel",up);button.addEventListener("lostpointercapture",up);button.addEventListener("contextmenu",event=>event.preventDefault());
  });
  window.addEventListener("keydown",event=>{
    const key=event.key.length===1?event.key.toLowerCase():event.key;
    if(["ArrowLeft","ArrowRight"," "].includes(event.key))event.preventDefault();
    if(key==="Escape"){if(!$("bossWarningOverlay").classList.contains("hidden"))closeBossWarning();else if(state.screen==="battle"&&!state.battleEnded)togglePause();return;}
    state.keys.add(key);if(event.repeat)return;if(key==="j")basicAttack();if(key==="k")specialJutsu();if(key==="l")ultimateSkill();
  });
  window.addEventListener("keyup",event=>{const key=event.key.length===1?event.key.toLowerCase():event.key;state.keys.delete(key);});
  window.addEventListener("blur",()=>state.keys.clear());
}

/* ---------- Main animation loop ---------- */
function gameLoop(timestamp){const dt=state.lastFrame?Math.min((timestamp-state.lastFrame)/1000,.035):0;state.lastFrame=timestamp;if(state.screen==="battle"){updateBattle(dt);drawArena();}requestAnimationFrame(gameLoop);}
function init(){renderCharacters();updateCharacterSummary();renderLevels();updatePowerLabel();bindControls();requestAnimationFrame(gameLoop);}
init();
