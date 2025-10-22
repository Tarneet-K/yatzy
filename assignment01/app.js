// ====== Assignment 1 Yatzy (single player) ======

const DICE_COUNT = 5;
const MAX_ROLLS = 3;

let dice = Array(DICE_COUNT).fill(1);
let held = Array(DICE_COUNT).fill(false);
let rollsThisTurn = 0;
let scoredCategories = {}; // { catName: number }
let totalScore = 0;
let gameOver = false;

const statusEl    = document.getElementById('status');
const diceRow     = document.getElementById('diceRow');
const rollBtn     = document.getElementById('rollBtn');
const endTurnBtn  = document.getElementById('endTurnBtn');
const endGameBtn  = document.getElementById('endGameBtn');
const rollCountEl = document.getElementById('rollCount');
const scoreBody   = document.getElementById('scoreBody');
const totalEl     = document.getElementById('totalScore');

const gameModal     = document.getElementById('gameModal');
const finalMsgEl    = document.getElementById('finalMessage');
const newGameBtn    = document.getElementById('newGameBtn');
const closeModalBtn = document.getElementById('closeModalBtn');

// ---- UI init
renderDice();
attachScoreRowHandlers();
updateStatus('Press Roll to start (up to 3 rolls per turn).');

rollBtn.addEventListener('click', () => {
  if (gameOver) return;
  if (rollsThisTurn >= MAX_ROLLS) {
    updateStatus('You have used all 3 rolls. Choose a category or end turn.');
    return;
  }
  rollUnheldDice();
  rollsThisTurn++;
  rollCountEl.textContent = rollsThisTurn;
  updateStatus('Click dice to hold/unhold. Click a category to score.');
});

endTurnBtn.addEventListener('click', () => {
  if (gameOver) return;
  if (rollsThisTurn === 0) {
    updateStatus('You haven’t rolled yet. Press Roll first.');
    return;
  }
  updateStatus('Choose a category to score, or press End Game.');
});

endGameBtn.addEventListener('click', () => {
  if (gameOver) return;
  const ok = confirm('End the game now? Your current total will be final.');
  if (ok) endGame({ reason: 'manual' });
});

newGameBtn.addEventListener('click', newGame);
closeModalBtn.addEventListener('click', () => gameModal.hidden = true);

// ---- Dice helpers
function rollUnheldDice() {
  for (let i = 0; i < DICE_COUNT; i++) {
    if (!held[i]) {
      dice[i] = Math.floor(Math.random() * 6) + 1;
    }
  }
  renderDice();
}

function renderDice() {
  diceRow.innerHTML = '';
  dice.forEach((val, i) => {
    const d = document.createElement('button');
    d.className = 'die' + (held[i] ? ' held' : '');
    d.type = 'button';
    d.setAttribute('aria-pressed', held[i] ? 'true' : 'false');
    d.title = held[i] ? 'Held' : 'Click to hold';
    d.textContent = face(val);
    d.addEventListener('click', () => toggleHold(i));
    diceRow.appendChild(d);
  });
}

function toggleHold(i) {
  if (gameOver) return;
  if (rollsThisTurn === 0) return; // only after first roll
  held[i] = !held[i];
  renderDice();
}

function face(n) {
  const map = ['⚀','⚁','⚂','⚃','⚄','⚅'];
  return map[n-1] ?? String(n);
}

function updateStatus(msg) {
  statusEl.textContent = msg;
}

// ---- Scorecard interactions
function attachScoreRowHandlers() {
  [...scoreBody.querySelectorAll('tr')].forEach(row => {
    const cat = row.dataset.cat;
    if (!cat) return; // divider rows
    row.addEventListener('click', () => scoreCategory(cat, row));
  });
}

function scoreCategory(cat, row) {
  if (gameOver) return;
  // prevent re-scoring
  if (scoredCategories[cat] != null) {
    updateStatus('That category is already scored.');
    return;
  }
  // must have rolled
  if (rollsThisTurn === 0) {
    updateStatus('Roll first, then choose a category.');
    return;
  }

  const v = computeScore(cat, dice.slice());
  scoredCategories[cat] = v;
  totalScore += v;

  row.classList.add('scored');
  row.querySelector('.val').textContent = v;

  // next turn
  newTurn();
}

function newTurn() {
  dice = Array(DICE_COUNT).fill(1);
  held = Array(DICE_COUNT).fill(false);
  rollsThisTurn = 0;
  rollCountEl.textContent = '0';
  totalEl.textContent = totalScore;
  renderDice();

  // if all categories (13) are scored -> end
  if (Object.keys(scoredCategories).length >= 13) {
    endGame({ reason: 'maxCategories' });
  } else {
    updateStatus('New turn. Press Roll.');
  }
}

// ---- Scoring logic
function computeScore(cat, arr) {
  const counts = countVals(arr);
  const sum = arr.reduce((a,b)=>a+b,0);
  switch (cat) {
    // Upper section
    case 'ones':   return counts[1] * 1;
    case 'twos':   return counts[2] * 2;
    case 'threes': return counts[3] * 3;
    case 'fours':  return counts[4] * 4;
    case 'fives':  return counts[5] * 5;
    case 'sixes':  return counts[6] * 6;

    // Lower section
    case 'threeKind':    return hasOfAKind(counts,3) ? sum : 0;
    case 'fourKind':     return hasOfAKind(counts,4) ? sum : 0;
    case 'fullHouse':    return isFullHouse(counts) ? 25 : 0;
    case 'smallStraight':return isSmallStraight(arr) ? 30 : 0;
    case 'largeStraight':return isLargeStraight(arr) ? 40 : 0;
    case 'chance':       return sum;
    case 'yatzy':        return hasOfAKind(counts,5) ? 50 : 0;
    default: return 0;
  }
}
function countVals(arr){
  const c = {1:0,2:0,3:0,4:0,5:0,6:0};
  for (const v of arr) c[v]++;
  return c;
}
function hasOfAKind(counts, n){
  return Object.values(counts).some(v => v>=n);
}
function isFullHouse(counts){
  const vals = Object.values(counts);
  return vals.includes(3) && vals.includes(2);
}
function isSmallStraight(arr){
  const u = [...new Set(arr)].sort((a,b)=>a-b).join('');
  return u.includes('12345') || u.includes('23456');
}
function isLargeStraight(arr){
  const s = arr.slice().sort((a,b)=>a-b).join('');
  return s === '12345' || s === '23456';
}

// ---- End game & modal
function endGame({ reason = 'manual' } = {}) {
  gameOver = true;

  rollBtn.disabled = true;
  endTurnBtn.disabled = true;
  endGameBtn.disabled = true;
  [...document.querySelectorAll('.die')].forEach(d => d.disabled = true);
  [...scoreBody.querySelectorAll('tr')].forEach(tr => tr.style.pointerEvents='none');

  const used = Object.keys(scoredCategories).length;
  const msg = reason === 'maxCategories'
    ? `You scored all ${used} categories.`
    : `You ended the game.`;
  finalMsgEl.innerHTML = `${msg}<br><strong>Your final score: ${totalScore}</strong>`;
  gameModal.hidden = false;

  updateStatus('Game over.');
}

function newGame() {
  // reset all state
  dice = Array(DICE_COUNT).fill(1);
  held = Array(DICE_COUNT).fill(false);
  rollsThisTurn = 0;
  scoredCategories = {};
  totalScore = 0;
  gameOver = false;

  // re-enable UI
  rollBtn.disabled = false;
  endTurnBtn.disabled = false;
  endGameBtn.disabled = false;
  [...scoreBody.querySelectorAll('tr')].forEach(tr => {
    tr.classList.remove('scored');
    const cell = tr.querySelector('.val');
    if (cell) cell.textContent = '';
    tr.style.pointerEvents = '';
  });
  [...document.querySelectorAll('.die')].forEach(d => d.disabled = false);

  rollCountEl.textContent = '0';
  totalEl.textContent = '0';
  gameModal.hidden = true;

  renderDice();
  updateStatus('New game — Press Roll to start.');
}
