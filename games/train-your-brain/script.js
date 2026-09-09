const state={mode:"addition",difficulty:"simple",questionNumber:1,totalQuestions:10,score:0,correct:0,correctRun:0,streak:0,lives:5,answer:"",correctAnswer:0,startedAt:0,timerId:null,secondsLeft:30,sound:true,locked:false};
const info={addition:["Addition","＋"],subtraction:["Subtraction","−"],multiplication:["Multiplication","×"],division:["Division","÷"]};
const difficultyLabels={simple:"Simple",medium:"Medium",hard:"Hard"};
const difficultyRanges={simple:[1,120],medium:[121,225],hard:[226,300]};
const $=id=>document.getElementById(id);
function rand(min,max){return Math.floor(Math.random()*(max-min+1))+min}
function difficultyNumber(){const [min,max]=difficultyRanges[getEffectiveDifficulty()];return rand(min,max)}

function syncModeSelection(mode) {
  document.querySelectorAll(".mode-btn, .menu-option").forEach(btn => {
    const isActive = btn.dataset.mode === mode;
    btn.classList.toggle("active", isActive);
  });
  const modeMeta = info[mode] || info.addition;
  $("modeName").textContent = modeMeta[0];
  $("modeIcon").textContent = modeMeta[1];
  const difficultyButtons = document.querySelectorAll(".difficulty-option");
  difficultyButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.difficulty === state.difficulty));
}

function getEffectiveDifficulty() {
  const level = state.difficulty || "simple";
  return level in difficultyLabels ? level : "simple";
}

function makeQuestion(){
  let a,b,op,ans;

  if(state.mode==="addition"){
    a=difficultyNumber();b=difficultyNumber();
    op="+";ans=a+b;
  }
  else if(state.mode==="subtraction"){
    a=difficultyNumber();b=difficultyNumber();if(b>a)[a,b]=[b,a];
    op="−";ans=a-b;
  }
  else if(state.mode==="multiplication"){
    a=difficultyNumber();b=difficultyNumber();
    op="×";ans=a*b;
  }
  else{
    b=difficultyNumber();ans=difficultyNumber();a=b*ans;
    op="÷";
  }

  state.correctAnswer=ans;
  $("question").innerHTML=`${a} ${op} ${b} = <span>?</span>`;
  $("answerBox").textContent=state.answer||"?";
  $("feedback").textContent="";
  $("feedback").className="feedback";
  $("progress").textContent=`${state.questionNumber} / ${state.totalQuestions}`;
}
function stats(){$("score").textContent=state.score;$("streak").textContent=state.streak;$("lives").textContent=`❤️ `.repeat(state.lives)+`♡ `.repeat(5-state.lives);$("lives").setAttribute("aria-label",`${state.lives} lives remaining`);$("answerBox").textContent=state.answer||"?"}
function beep(good){
  if(!state.sound)return;
  try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=new C(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=good?720:190;g.gain.setValueAtTime(.08,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.15);o.start();o.stop(c.currentTime+.15)}catch(e){}
}
function submit(){
  if(state.locked)return;
  if(!state.answer){$("feedback").textContent="Enter an answer first!";$("feedback").className="feedback bad";beep(false);return}
  resolveAnswer(Number(state.answer)===state.correctAnswer);
}
function resolveAnswer(isCorrect,timedOut=false){
  if(state.locked)return;
  clearInterval(state.timerId);
  if(isCorrect){
    state.correct++;state.correctRun++;state.streak=Math.floor(state.correctRun/10);state.score+=10+Math.min(state.streak,10)*2;
    $("feedback").textContent="✅ Correct! Great job!";$("feedback").className="feedback good";beep(true)
  }else{
    state.correctRun=0;state.streak=0;state.lives=Math.max(0,state.lives-1);
    $("feedback").textContent=timedOut?`⌛ Time's up. Answer: ${state.correctAnswer}`:`❌ Not quite. Answer: ${state.correctAnswer}`;
    $("feedback").className="feedback bad";beep(false)
  }
  stats();state.locked=true;
  setTimeout(()=>{if(state.lives===0||state.questionNumber>=state.totalQuestions)finish();else{state.questionNumber++;state.answer="";state.locked=false;makeQuestion();stats();startQuestionTimer()}},850);
}
function clearAns(){if(state.locked)return;state.answer="";stats();$("feedback").textContent="";$("feedback").className="feedback"}
function digit(d){if(state.locked||state.answer.length>=5)return;if(state.answer==="0")state.answer="";state.answer+=d;stats()}
function back(){if(!state.locked){state.answer=state.answer.slice(0,-1);stats()}}
function time(){return state.startedAt?Math.floor((Date.now()-state.startedAt)/1000):0}
function fmt(s){return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0")}
function startQuestionTimer(){clearInterval(state.timerId);state.secondsLeft=30;$("timer").textContent=fmt(state.secondsLeft);state.timerId=setInterval(()=>{state.secondsLeft--;$("timer").textContent=fmt(Math.max(0,state.secondsLeft));if(state.secondsLeft<=0){clearInterval(state.timerId);resolveAnswer(false,true)}},1000)}
function finish(){
  const isGameOver=state.lives===0;
  clearInterval(state.timerId);$("finalScore").textContent=state.score;$("finalCorrect").textContent=`${state.correct}/${state.totalQuestions}`;$("finalTime").textContent=fmt(time());
  $("resultModal").querySelector("h2").textContent=isGameOver?"Game Over":"Great Job!";
  $("resultText").textContent=isGameOver?"Your 5 hearts are finished. Choose Home to start fresh.":state.correct>=8?"Amazing! Your brain is getting stronger!":state.correct>=5?"Nice work! Keep practicing every day!":"Good try! Practice again and beat your score!";
  $("modalRestart").textContent=isGameOver?"Home":"Play Again";
  $("resultModal").classList.remove("hidden")
}
function restart(){clearInterval(state.timerId);state.questionNumber=1;state.score=0;state.correct=0;state.correctRun=0;state.streak=0;state.lives=5;state.answer="";state.locked=false;state.startedAt=Date.now();$("resultModal").classList.add("hidden");$("modesPanel")?.classList.add("hidden");$("gameLayout")?.classList.add("playing");stats();makeQuestion();startQuestionTimer()}
function returnHome(){
  clearInterval(state.timerId);state.mode="addition";state.difficulty="simple";state.questionNumber=1;state.score=0;state.correct=0;state.correctRun=0;state.streak=0;state.lives=5;state.answer="";state.locked=false;state.startedAt=0;
  $("resultModal").classList.add("hidden");syncModeSelection(state.mode);stats();makeQuestion();$("timer").textContent="00:30";showModeMenu();
}

function showModeMenu(){
  clearInterval(state.timerId);
  const overlay = $("menuOverlay");
  const modePanel = $("modePanel");
  const difficultyPanel = $("difficultyPanel");
  const backButton = $("backToModesBtn");
  if (overlay) overlay.classList.remove("hidden");
  if (modePanel) modePanel.classList.remove("hidden");
  if (difficultyPanel) difficultyPanel.classList.add("hidden");
  if (backButton) backButton.classList.add("hidden");
  const title = $("modeMenuTitle");
  if (title) title.textContent = "Choose your mode";
  const shell = document.querySelector(".app-shell");
  if (shell) shell.classList.add("blurred");
}

function showDifficultyMenu(mode){
  const overlay = $("menuOverlay");
  const modePanel = $("modePanel");
  const difficultyPanel = $("difficultyPanel");
  const backButton = $("backToModesBtn");
  const title = $("modeMenuTitle");

  state.mode = mode;
  syncModeSelection(mode);

  if (overlay) overlay.classList.remove("hidden");
  if (modePanel) modePanel.classList.add("hidden");
  if (difficultyPanel) difficultyPanel.classList.remove("hidden");
  if (backButton) backButton.classList.remove("hidden");
  if (title) title.textContent = `${info[mode][0]} • Choose difficulty`;
  const shell = document.querySelector(".app-shell");
  if (shell) shell.classList.add("blurred");
}

function closeModeMenu(){
  const overlay = $("menuOverlay");
  if (overlay) overlay.classList.add("hidden");
  const shell = document.querySelector(".app-shell");
  if (shell) shell.classList.remove("blurred");
}

function chooseDifficulty(level){
  state.difficulty = level;
  syncModeSelection(state.mode);
  closeModeMenu();
  restart();
}

document.querySelectorAll(".mode-btn").forEach(b=>b.addEventListener("click",()=>showDifficultyMenu(b.dataset.mode)));
document.querySelectorAll(".menu-option").forEach(b=>b.addEventListener("click",()=>showDifficultyMenu(b.dataset.mode)));
document.querySelectorAll(".difficulty-option").forEach(b=>b.addEventListener("click",()=>chooseDifficulty(b.dataset.difficulty)));
$("backToModesBtn")?.addEventListener("click",()=>showModeMenu());
$("menuBtn")?.addEventListener("click",showModeMenu);
document.querySelectorAll(".key").forEach(b=>b.addEventListener("click",()=>b.dataset.key==="backspace"?back():digit(b.dataset.key)));
$("clearBtn").addEventListener("click",clearAns);$("submitBtn").addEventListener("click",submit);$("modalRestart").addEventListener("click",()=>state.lives===0?returnHome():restart());
$("soundBtn").addEventListener("click",()=>{state.sound=!state.sound;$("soundBtn").textContent=state.sound?"🔊":"🔇"});
document.addEventListener("keydown",e=>{
  if (!$("menuOverlay").classList.contains("hidden") || !$("resultModal").classList.contains("hidden")) return;
  if(/^\d$/.test(e.key))digit(e.key);else if(e.key==="Backspace")back();else if(e.key==="Enter")submit();else if(e.key==="Escape")clearAns()
});
showModeMenu();
syncModeSelection(state.mode);
