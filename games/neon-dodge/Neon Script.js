(() => {

  "use strict";


  // ==========================================================
  // ELEMENTS
  // ==========================================================

  const canvas =
    document.getElementById("gameCanvas");

  const ctx =
    canvas.getContext("2d");

  const shell =
    document.getElementById("gameShell");


  const scoreEl =
    document.getElementById("score");

  const bestEl =
    document.getElementById("best");

  const livesEl =
    document.getElementById("lives");


  const startOverlay =
    document.getElementById("startOverlay");

  const pauseOverlay =
    document.getElementById("pauseOverlay");

  const gameOverOverlay =
    document.getElementById("gameOverOverlay");


  // ==========================================================
  // GAME VARIABLES
  // ==========================================================

  const keys =
    new Set();


  let W = 900;

  let H = 650;

  let dpr = 1;


  let running = false;

  let paused = false;


  let lastTime = 0;

  let elapsed = 0;

  let score = 0;

  let lives = 3;

  let spawnTimer = 0;

  let difficulty = 1;

  let shake = 0;

  let boostTimer = 0;

  let fireTimer = 0;

  let rapidFireTimer = 0;

  let skillDropTimer = 3;

  let activeSkill = null;

  let skillEffectTimer = 0;

  let skillEffectLabel = "";


  let best =
    Number(
      localStorage.getItem(
        "neonDodgeBest"
      ) || 0
    );


  bestEl.textContent =
    best;


  // ==========================================================
  // PLAYER
  // ==========================================================

  const player = {

    x:450,

    y:560,

    w:34,

    h:48,

    speed:360,

    boostSpeed:590,

    invincible:0

  };


  // ==========================================================
  // OBJECT ARRAYS
  // ==========================================================

  const obstacles = [];

  const bullets = [];

  const skillDrops = [];

  const particles = [];


  const stars =
    Array.from(
      {length:100},
      () => ({

        x:Math.random(),

        y:Math.random(),

        s:
          Math.random()*2.5 + 0.5,

        v:
          Math.random()*0.035 + 0.01

      })
    );


  // ==========================================================
  // RESIZE
  // ==========================================================

  function resize(){

    const rect =
      shell.getBoundingClientRect();


    W =
      Math.max(
        320,
        rect.width
      );


    H =
      Math.max(
        500,
        rect.height
      );


    dpr =
      Math.min(
        window.devicePixelRatio || 1,
        2
      );


    canvas.width =
      Math.floor(W*dpr);


    canvas.height =
      Math.floor(H*dpr);


    canvas.style.width =
      W + "px";


    canvas.style.height =
      H + "px";


    ctx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );


    player.x =
      Math.min(
        Math.max(
          player.x,
          35
        ),
        W-35
      );


    player.y =
      H - 100;

  }


  window.addEventListener(
    "resize",
    resize
  );


  resize();


  // ==========================================================
  // RESET
  // ==========================================================

  function resetGame(){

    obstacles.length = 0;

    bullets.length = 0;

    skillDrops.length = 0;

    particles.length = 0;


    score = 0;

    lives = 3;

    elapsed = 0;

    spawnTimer = 0.5;

    difficulty = 1;

    shake = 0;

    boostTimer = 0;

    fireTimer = 0;

    rapidFireTimer = 0;

    skillDropTimer = 3;

    activeSkill = null;

    skillEffectTimer = 0;

    skillEffectLabel = "";

    updateSkillButton();
    updateSkillTimer();


    player.x =
      W / 2;


    player.y =
      H - 100;


    player.invincible = 0;


    updateHud();

  }


  // ==========================================================
  // HUD
  // ==========================================================

  function updateHud(){

    scoreEl.textContent =
      Math.floor(score);


    bestEl.textContent =
      best;


    livesEl.textContent =
      "❤".repeat(lives) +
      "♡".repeat(3-lives);

  }


  // ==========================================================
  // START
  // ==========================================================

  function startGame(){

    resetGame();


    running = true;

    paused = false;


    startOverlay
      .classList
      .add("hidden");


    pauseOverlay
      .classList
      .add("hidden");


    gameOverOverlay
      .classList
      .add("hidden");


    lastTime =
      performance.now();


    requestAnimationFrame(
      loop
    );

  }

  function restartGame(event){
    event?.preventDefault();
    event?.stopPropagation();
    startGame();
  }

  function returnToMenu(event){
    event?.preventDefault();
    event?.stopPropagation();
    running = false;
    paused = false;
    gameOverOverlay.classList.add("hidden");
    startOverlay.classList.remove("hidden");
  }


  // ==========================================================
  // GAME OVER
  // ==========================================================

  function gameOver(){

    running = false;

    paused = false;


    const final =
      Math.floor(score);


    if(final > best){

      best = final;


      localStorage.setItem(
        "neonDodgeBest",
        String(best)
      );

    }


    document
      .getElementById("finalScore")
      .textContent =
      final;


    document
      .getElementById("finalBest")
      .textContent =
      best;


    updateHud();


    gameOverOverlay
      .classList
      .remove("hidden");

  }


  // ==========================================================
  // PAUSE
  // ==========================================================

  function togglePause(force){

    if(!running){

      return;

    }


    paused =
      typeof force === "boolean"
        ? force
        : !paused;


    pauseOverlay
      .classList
      .toggle(
        "hidden",
        !paused
      );


    if(!paused){

      lastTime =
        performance.now();

    }

  }


  // ==========================================================
  // SPAWN OBSTACLE
  // ==========================================================

  function spawnObstacle(){

    const size =
      Math.random()*22 + 22;


    const speed =
      (180 + Math.random()*110) *
      difficulty;


    const kind =
      Math.random() < 0.25
        ? "diamond"
        : "meteor";


    obstacles.push({

      x:
        Math.random() *
        (W - size*2) +
        size,

      y:
        -size - 10,

      size,

      speed,

      rot:
        Math.random() *
        Math.PI*2,

      spin:
        (Math.random()-.5)*4,

      kind

    });

  }


  // ==========================================================
  // PARTICLES
  // ==========================================================

  function burst(
    x,
    y,
    count=16
  ){

    for(
      let i=0;
      i<count;
      i++
    ){

      const angle =
        Math.random() *
        Math.PI*2;


      const speed =
        Math.random()*180 + 60;


      particles.push({

        x,

        y,

        vx:
          Math.cos(angle) *
          speed,

        vy:
          Math.sin(angle) *
          speed,

        life:
          .5 +
          Math.random()*.5,

        max:
          .5 +
          Math.random()*.5,

        size:
          Math.random()*3 + 1

      });

    }

  }


  // ==========================================================
  // COLLISION
  // ==========================================================

  function rectCircleHit(
    px,
    py,
    pw,
    ph,
    cx,
    cy,
    r
  ){

    const closestX =
      Math.max(
        px,
        Math.min(
          cx,
          px+pw
        )
      );


    const closestY =
      Math.max(
        py,
        Math.min(
          cy,
          py+ph
        )
      );


    const dx =
      cx - closestX;


    const dy =
      cy - closestY;


    return (
      dx*dx +
      dy*dy <
      r*r
    );

  }


  // ==========================================================
  // PLAYER MOVEMENT
  // ==========================================================

  function movePlayer(dt){

    let direction = 0;


    if(
      keys.has("ArrowLeft") ||
      keys.has("a")
    ){

      direction -= 1;

    }


    if(
      keys.has("ArrowRight") ||
      keys.has("d")
    ){

      direction += 1;

    }


    const boosting =
      keys.has(" ") ||
      boostTimer > 0;


    const speed =
      boosting
        ? player.boostSpeed
        : player.speed;


    player.x +=
      direction *
      speed *
      dt;


    player.x =
      Math.max(
        player.w,
        Math.min(
          W-player.w,
          player.x
        )
      );


    if(boostTimer > 0){

      boostTimer -= dt;

    }

  }

  function autoFire(dt){
    fireTimer -= dt;

    if(fireTimer <= 0){
      bullets.push({
        x:player.x,
        y:player.y-player.h/2,
        speed:680,
        size:4
      });
      fireTimer = rapidFireTimer > 0 ? .14 : .28;
    }
  }

  function updateSkillButton(){
    const button = document.getElementById("skillBtn");
    if(!button) return;

    button.textContent = "✦";
    button.classList.toggle("skill-ready", Boolean(activeSkill));
    const label = activeSkill ? `Use ${activeSkill.label}` : "No skill collected";
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
  }

  function updateSkillTimer(){
    const wrap = document.getElementById("skillTimerWrap");
    const timer = document.getElementById("skillTimer");
    if(!wrap || !timer) return;

    const active = skillEffectTimer > 0;
    wrap.classList.toggle("hidden", !active);
    timer.textContent = active
      ? `${skillEffectLabel} ${Math.ceil(skillEffectTimer)}s`
      : "0s";
  }

  function spawnSkillDrop(){
    const skills = [
      {type:"rapid", label:"2X FIRE", color:"#47e6ff"},
      {type:"shield", label:"SHIELD", color:"#a78bfa"},
      {type:"speed", label:"SPEED 2X", color:"#ffcf5a"}
    ];
    const skill = skills[Math.floor(Math.random() * skills.length)];

    skillDrops.push({
      ...skill,
      x:Math.random() * (W - 44) + 22,
      y:-24,
      speed:100 + Math.random() * 45,
      size:17,
      rot:0
    });
  }

  function updateSkillDrops(dt){
    skillDropTimer -= dt;

    if(skillDropTimer <= 0){
      spawnSkillDrop();
      skillDropTimer = 5 + Math.random() * 4;
    }

    for(let i=skillDrops.length-1; i>=0; i--){
      const drop = skillDrops[i];
      drop.y += drop.speed * dt;
      drop.rot += dt * 2;

      const collected = rectCircleHit(
        player.x-player.w,
        player.y-player.h/2,
        player.w*2,
        player.h,
        drop.x,
        drop.y,
        drop.size
      );

      if(collected){
        activeSkill = drop;
        updateSkillButton();
        burst(drop.x, drop.y, 18);
        score += 12;
        skillDrops.splice(i,1);
        continue;
      }

      if(drop.y - drop.size > H){
        skillDrops.splice(i,1);
      }
    }
  }

  function activateSkill(){
    if(!activeSkill || !running || paused) return;

    const skill = activeSkill.type;
    const skillLabel = activeSkill.label;
    activeSkill = null;
    updateSkillButton();
    skillEffectTimer = 5;
    skillEffectLabel = skillLabel;
    updateSkillTimer();

    if(skill === "rapid"){
      rapidFireTimer = 5;
    }

    if(skill === "shield"){
      player.invincible = Math.max(player.invincible, 5);
    }

    if(skill === "speed"){
      boostTimer = 5;
    }
  }


  // ==========================================================
  // UPDATE GAME
  // ==========================================================

  function update(dt){

    elapsed += dt;


    difficulty =
      1 +
      Math.min(
        elapsed/45,
        1.8
      );


    movePlayer(dt);

    autoFire(dt);

    rapidFireTimer = Math.max(0, rapidFireTimer - dt);

    skillEffectTimer = Math.max(0, skillEffectTimer - dt);
    updateSkillTimer();

    updateSkillDrops(dt);


    spawnTimer -= dt;


    if(spawnTimer <= 0){

      spawnObstacle();


      const minGap =
        Math.max(
          .22,
          .75 -
          difficulty*.12
        );


      spawnTimer =
        minGap +
        Math.random()*.35;

    }


    player.invincible =
      Math.max(
        0,
        player.invincible-dt
      );

    for(let i=bullets.length-1; i>=0; i--){
      const bullet = bullets[i];
      bullet.y -= bullet.speed * dt;

      if(bullet.y < -20){
        bullets.splice(i,1);
        continue;
      }

      for(let j=obstacles.length-1; j>=0; j--){
        const obstacle = obstacles[j];
        const dx = bullet.x - obstacle.x;
        const dy = bullet.y - obstacle.y;
        const hitRadius = obstacle.size * .72 + bullet.size;

        if(dx*dx + dy*dy < hitRadius*hitRadius){
          burst(obstacle.x, obstacle.y, 28);
          bullets.splice(i,1);
          obstacles.splice(j,1);
          score += 18 + difficulty * 4;
          break;
        }
      }
    }


    // Obstacles
    for(
      let i=obstacles.length-1;
      i>=0;
      i--
    ){

      const obstacle =
        obstacles[i];


      obstacle.y +=
        obstacle.speed*dt;


      obstacle.rot +=
        obstacle.spin*dt;


      const hit =
        rectCircleHit(

          player.x-player.w,

          player.y-player.h/2,

          player.w*2,

          player.h,

          obstacle.x,

          obstacle.y,

          obstacle.size*.72

        );


      if(
        hit &&
        player.invincible <= 0
      ){

        lives -= 1;


        player.invincible =
          1.1;


        shake =
          .28;


        burst(
          obstacle.x,
          obstacle.y,
          22
        );


        obstacles.splice(
          i,
          1
        );


        if(lives <= 0){

          gameOver();

          return;

        }


        updateHud();

        continue;

      }


      if(
        obstacle.y -
        obstacle.size >
        H
      ){

        obstacles.splice(
          i,
          1
        );


        score +=
          7 +
          difficulty*2;


        updateHud();

      }

    }


    score +=
      dt *
      (12 + difficulty*5);


    // Particles
    for(
      let i=particles.length-1;
      i>=0;
      i--
    ){

      const particle =
        particles[i];


      particle.x +=
        particle.vx*dt;


      particle.y +=
        particle.vy*dt;


      particle.vy +=
        130*dt;


      particle.life -=
        dt;


      if(
        particle.life <= 0
      ){

        particles.splice(
          i,
          1
        );

      }

    }


    shake =
      Math.max(
        0,
        shake-dt
      );


    updateHud();

  }


  // ==========================================================
  // BACKGROUND
  // ==========================================================

  function drawBackground(){

    const gradient =
      ctx.createLinearGradient(
        0,
        0,
        0,
        H
      );


    gradient.addColorStop(
      0,
      "#0b1020"
    );


    gradient.addColorStop(
      1,
      "#04070e"
    );


    ctx.fillStyle =
      gradient;


    ctx.fillRect(
      0,
      0,
      W,
      H
    );


    // Horizon glow
    const glow =
      ctx.createRadialGradient(
        W/2,
        H*.78,
        10,
        W/2,
        H*.78,
        H*.45
      );


    glow.addColorStop(
      0,
      "rgba(92,76,210,.16)"
    );


    glow.addColorStop(
      1,
      "rgba(92,76,210,0)"
    );


    ctx.fillStyle =
      glow;


    ctx.fillRect(
      0,
      0,
      W,
      H
    );


    // Stars
    for(
      const star of stars
    ){

      star.y +=
        star.v*0.016;


      if(
        star.y > 1
      ){

        star.y = 0;

      }


      ctx.globalAlpha =
        .35 +
        star.s/4;


      ctx.fillStyle =
        "#cfd9ff";


      ctx.beginPath();


      ctx.arc(
        star.x*W,
        star.y*H,
        star.s,
        0,
        Math.PI*2
      );


      ctx.fill();

    }


    ctx.globalAlpha =
      1;


    // Grid
    ctx.strokeStyle =
      "rgba(105,123,185,.08)";


    ctx.lineWidth = 1;


    for(
      let x=0;
      x<W;
      x+=60
    ){

      ctx.beginPath();

      ctx.moveTo(x,0);

      ctx.lineTo(x,H);

      ctx.stroke();

    }


    for(
      let y=60;
      y<H;
      y+=60
    ){

      ctx.beginPath();

      ctx.moveTo(0,y);

      ctx.lineTo(W,y);

      ctx.stroke();

    }

  }


  // ==========================================================
  // PLAYER DRAW
  // ==========================================================

  function drawPlayer(){

    if(
      player.invincible > 0 &&
      Math.floor(
        player.invincible*12
      )%2 === 0
    ){

      return;

    }


    ctx.save();


    ctx.translate(
      player.x,
      player.y
    );


    // Glow
    ctx.shadowBlur =
      22;


    ctx.shadowColor =
      "#6d5bff";


    ctx.fillStyle =
      "#9a87ff";


    ctx.beginPath();


    ctx.moveTo(
      0,
      -player.h/2
    );


    ctx.lineTo(
      -player.w,
      player.h/2
    );


    ctx.lineTo(
      0,
      player.h/4
    );


    ctx.lineTo(
      player.w,
      player.h/2
    );


    ctx.closePath();


    ctx.fill();


    ctx.shadowBlur = 0;


    ctx.fillStyle =
      "#eef0ff";


    ctx.beginPath();


    ctx.moveTo(
      0,
      -16
    );


    ctx.lineTo(
      -8,
      10
    );


    ctx.lineTo(
      0,
      5
    );


    ctx.lineTo(
      8,
      10
    );


    ctx.closePath();


    ctx.fill();


    // Engine flame
    const flame =
      12 +
      Math.random()*10;


    const flameGradient =
      ctx.createLinearGradient(
        0,
        10,
        0,
        30+flame
      );


    flameGradient.addColorStop(
      0,
      "#47e6ff"
    );


    flameGradient.addColorStop(
      1,
      "rgba(71,230,255,0)"
    );


    ctx.fillStyle =
      flameGradient;


    ctx.beginPath();


    ctx.moveTo(
      -7,
      12
    );


    ctx.lineTo(
      0,
      12+flame
    );


    ctx.lineTo(
      7,
      12
    );


    ctx.closePath();


    ctx.fill();


    ctx.restore();

  }


  // ==========================================================
  // OBSTACLE DRAW
  // ==========================================================

  function drawObstacle(
    obstacle
  ){

    ctx.save();


    ctx.translate(
      obstacle.x,
      obstacle.y
    );


    ctx.rotate(
      obstacle.rot
    );


    ctx.shadowBlur =
      18;


    ctx.shadowColor =
      obstacle.kind === "diamond"
        ? "#47e6ff"
        : "#ff526b";


    if(
      obstacle.kind ===
      "diamond"
    ){

      ctx.fillStyle =
        "#47e6ff";


      ctx.beginPath();


      ctx.moveTo(
        0,
        -obstacle.size
      );


      ctx.lineTo(
        obstacle.size*.72,
        0
      );

      ctx.lineTo(
        0,
        obstacle.size
      );


      ctx.lineTo(
        -obstacle.size*.72,
        0
      );


      ctx.closePath();


      ctx.fill();


      ctx.shadowBlur = 0;


      ctx.fillStyle =
        "#bdf8ff";


      ctx.fillRect(
        -2,
        -obstacle.size*.5,
        4,
        obstacle.size
      );

    }


    else{

      ctx.fillStyle =
        "#ff526b";


      ctx.beginPath();


      const spikes = 9;


      for(
        let i=0;
        i<spikes*2;
        i++
      ){

        const angle =
          i*Math.PI/spikes;


        const radius =
          i%2===0
            ? obstacle.size
            : obstacle.size*.58;


        const x =
          Math.cos(angle)*radius;


        const y =
          Math.sin(angle)*radius;


        if(i === 0){

          ctx.moveTo(
            x,
            y
          );

        } else {

          ctx.lineTo(
            x,
            y
          );

        }

      }


      ctx.closePath();


      ctx.fill();


      ctx.shadowBlur = 0;


      ctx.fillStyle =
        "rgba(255,220,225,.65)";


      ctx.beginPath();


      ctx.arc(
        -obstacle.size*.2,
        -obstacle.size*.18,
        obstacle.size*.18,
        0,
        Math.PI*2
      );


      ctx.fill();

    }


    ctx.restore();

  }

  function drawBullet(bullet){
    ctx.save();
    ctx.shadowBlur = 16;
    ctx.shadowColor = "#47e6ff";
    ctx.fillStyle = "#bdf8ff";
    ctx.fillRect(bullet.x - 2, bullet.y - 12, 4, 16);
    ctx.restore();
  }

  function drawSkillDrop(drop){
    ctx.save();
    ctx.translate(drop.x, drop.y);
    ctx.rotate(drop.rot);
    ctx.shadowBlur = 20;
    ctx.shadowColor = drop.color;
    ctx.fillStyle = drop.color;
    ctx.fillRect(-drop.size, -drop.size, drop.size*2, drop.size*2);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 9px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(drop.label, drop.x, drop.y - drop.size - 8);
    ctx.restore();
  }


  // ==========================================================
  // PARTICLES
  // ==========================================================

  function drawParticles(){

    for(
      const particle of particles
    ){

      ctx.globalAlpha =
        Math.max(
          0,
          particle.life /
          particle.max
        );


      ctx.fillStyle =
        "#dfe5ff";


      ctx.fillRect(
        particle.x,
        particle.y,
        particle.size,
        particle.size
      );

    }


    ctx.globalAlpha = 1;

  }


  // ==========================================================
  // DRAW
  // ==========================================================

  function draw(){

    ctx.save();


    if(shake > 0){

      const power =
        shake * 14;


      ctx.translate(

        (Math.random()-.5) *
        power,

        (Math.random()-.5) *
        power

      );

    }


    drawBackground();


    for(
      const obstacle of obstacles
    ){

      drawObstacle(
        obstacle
      );

    }

    for(const bullet of bullets){
      drawBullet(bullet);
    }

    for(const drop of skillDrops){
      drawSkillDrop(drop);
    }


    drawParticles();


    drawPlayer();


    ctx.restore();

  }


  // ==========================================================
  // GAME LOOP
  // ==========================================================

  function loop(now){

    if(!running){

      return;

    }


    const dt =
      Math.min(
        .033,
        (now-lastTime)/1000
      );


    lastTime =
      now;


    if(!paused){

      update(dt);

    }


    draw();


    requestAnimationFrame(
      loop
    );

  }


  // ==========================================================
  // KEYBOARD
  // ==========================================================

  window.addEventListener(
    "keydown",
    event => {
      const key = event.key.length === 1
        ? event.key.toLowerCase()
        : event.key;

      if(
        [
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          " "
        ].includes(
          event.key
        )
      ){

        event.preventDefault();

      }


      if(
        key === "p" ||
        key === "Escape"
      ){

        togglePause();

        return;

      }


      keys.add(
        key
      );

    }
  );


  window.addEventListener(
    "keyup",
    event => {

      keys.delete(
        event.key.length === 1
          ? event.key.toLowerCase()
          : event.key
      );

    }
  );


  // ==========================================================
  // BUTTONS
  // ==========================================================

  document
    .getElementById("pauseBtn")
    .addEventListener(
      "click",
      () => togglePause()
    );


  document
    .getElementById("startBtn")
    .addEventListener(
      "click",
      startGame
    );

  document
    .getElementById("startBtn")
    .addEventListener(
      "pointerdown",
      event => {
        event.preventDefault();
        event.stopPropagation();
        startGame();
      }
    );


  document
    .getElementById("resumeBtn")
    .addEventListener(
      "click",
      () => togglePause(false)
    );


  document
    .getElementById("restartPauseBtn")
    .addEventListener(
      "click",
      startGame
    );


  document
    .getElementById("restartBtn")
    .addEventListener(
      "click",
      restartGame
    );

  document
    .getElementById("restartBtn")
    .addEventListener(
      "pointerdown",
      event => {
        event.preventDefault();
        event.stopPropagation();
        restartGame(event);
      }
    );


  document
    .getElementById("homeBtn")
    .addEventListener(
      "click",
      returnToMenu
    );

  document
    .getElementById("homeBtn")
    .addEventListener(
      "pointerdown",
      event => {
        event.preventDefault();
        event.stopPropagation();
        returnToMenu(event);
      }
    );


  // ==========================================================
  // MOBILE CONTROLS
  // ==========================================================

  let dragging = false;
  let lastTouchX = 0;

  const stopDragging = event => {
    if(event?.preventDefault) event.preventDefault();
    dragging = false;
  };

  const moveToTouch = clientX => {
    const rect = shell.getBoundingClientRect();
    player.x = Math.max(
      player.w,
      Math.min(W-player.w, clientX - rect.left)
    );
  };

  const canDrag = target => (
    running &&
    !paused &&
    !target.closest("button, a, .overlay")
  );

  const startDragging = (clientX, target, event) => {
    if(!canDrag(target)) return;
    event.preventDefault();
    dragging = true;
    lastTouchX = clientX;
  };

  shell.addEventListener("pointerdown", event => {
    startDragging(event.clientX, event.target, event);
    try {
      shell.setPointerCapture(event.pointerId);
    } catch {
    }
  });

  shell.addEventListener("pointermove", event => {
    if(!dragging) return;
    event.preventDefault();
    moveToTouch(event.clientX);
    lastTouchX = event.clientX;
  });

  shell.addEventListener("pointerup", stopDragging);
  shell.addEventListener("pointercancel", stopDragging);
  shell.addEventListener("lostpointercapture", stopDragging);

  document.addEventListener("touchstart", event => {
    const touch = event.touches[0];
    if(touch && event.target.closest("#gameShell")) {
      startDragging(touch.clientX, event.target, event);
    }
  }, {passive:false});

  document.addEventListener("touchmove", event => {
    if(!dragging) return;
    const touch = event.touches[0];
    if(!touch) return;
    event.preventDefault();
    moveToTouch(touch.clientX);
    lastTouchX = touch.clientX;
  }, {passive:false});

  document.addEventListener("touchend", stopDragging, {passive:false});
  document.addEventListener("touchcancel", stopDragging, {passive:false});

  window.addEventListener(
    "blur",
    () => {
      keys.clear();
    }
  );

  document
    .getElementById("skillBtn")
    .addEventListener(
      "pointerdown",
      event => {

        event.preventDefault();
        activateSkill();

      }
    );


  // ==========================================================
  // FIRST DRAW
  // ==========================================================

  draw();

})();
