// public/app.js

let holds = [false, false, false, false, false];

function pipFor(value) {
  switch (value) {
    case 1: return "⚀";
    case 2: return "⚁";
    case 3: return "⚂";
    case 4: return "⚃";
    case 5: return "⚄";
    case 6: return "⚅";
    default: return value;
  }
}

// ---- local preview scoring (uses same rules as server) ----
function computeScoreForCategory(dice, category) {
  const sorted = [...dice].sort((a, b) => a - b);
  const counts = {};
  for (const d of sorted) counts[d] = (counts[d] || 0) + 1;
  const countArray = Object.values(counts);
  const sumAll = sorted.reduce((a, b) => a + b, 0);

  switch (category) {
    case "ones":   return sorted.filter(d => d === 1).reduce((a, b) => a + b, 0);
    case "twos":   return sorted.filter(d => d === 2).reduce((a, b) => a + b, 0);
    case "threes": return sorted.filter(d => d === 3).reduce((a, b) => a + b, 0);
    case "fours":  return sorted.filter(d => d === 4).reduce((a, b) => a + b, 0);
    case "fives":  return sorted.filter(d => d === 5).reduce((a, b) => a + b, 0);
    case "sixes":  return sorted.filter(d => d === 6).reduce((a, b) => a + b, 0);

    case "threeKind":
      return countArray.some(c => c >= 3) ? sumAll : 0;

    case "fourKind":
      return countArray.some(c => c >= 4) ? sumAll : 0;

    case "fullHouse":
      return (countArray.includes(3) && countArray.includes(2)) ? 25 : 0;

    case "smallStraight": {
      const uniq = [...new Set(sorted)];
      const has1234 = [1, 2, 3, 4].every(v => uniq.includes(v));
      const has2345 = [2, 3, 4, 5].every(v => uniq.includes(v));
      const has3456 = [3, 4, 5, 6].every(v => uniq.includes(v));
      return (has1234 || has2345 || has3456) ? 30 : 0;
    }

    case "largeStraight": {
      const uniq = [...new Set(sorted)];
      const is12345 = [1, 2, 3, 4, 5].every(v => uniq.includes(v));
      const is23456 = [2, 3, 4, 5, 6].every(v => uniq.includes(v));
      return (is12345 || is23456) ? 40 : 0;
    }

    case "yatzy":
      return countArray.some(c => c === 5) ? 50 : 0;

    case "chance":
      return sumAll;

    default:
      return 0;
  }
}

// ---- API helpers ----

async function fetchState() {
  const res = await fetch("/api/state");
  return res.json(); // { game, categories }
}

async function startNewGame() {
  holds = [false, false, false, false, false];

  const res = await fetch("/api/new-game", {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  const data = await res.json();
  renderGame(data.game);
}

async function rollDice() {
  const res = await fetch("/api/roll", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ holds })
  });
  const data = await res.json();
  renderGame(data.game);
}

async function scoreCategory(category) {
  const res = await fetch("/api/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category })
  });

  const data = await res.json();
  if (data.error) {
    alert(data.error);
    return;
  }

  // reset holds for next turn
  holds = [false, false, false, false, false];
  renderGame(data.game);
}

// ---- RENDERING ----

function renderGame(game) {
  renderDice(game);
  renderRollInfo(game);
  renderScores(game);
  renderTotal(game);

  if (game.gameOver) {
    alert(`Game over! Final score: ${game.totalScore}`);
  }
}

function renderDice(game) {
  const diceRow = document.getElementById("diceRow");
  if (!diceRow) return;

  const diceButtons = diceRow.querySelectorAll(".die");

  game.dice.forEach((value, index) => {
    const btn = diceButtons[index];
    if (!btn) return;

    btn.textContent = pipFor(value);

    if (holds[index]) {
      btn.classList.add("die--held");
    } else {
      btn.classList.remove("die--held");
    }
  });
}

function renderRollInfo(game) {
  const rollInfo = document.getElementById("rollInfo");
  if (!rollInfo) return;

  const used = 3 - game.rollsLeft;
  rollInfo.textContent = `Rolls this turn: ${used}/3`;
}

function renderScores(game) {
  const dice = game.dice;

  // for each row (category) in table:
  document.querySelectorAll("tr[data-cat]").forEach(row => {
    const cat = row.getAttribute("data-cat");
    const scoreCell = row.querySelector("td.r");
    if (!scoreCell) return;

    const lockedScore = game.scores[cat];

    let display;
    if (lockedScore !== null && typeof lockedScore === "number") {
      // already chosen category → show locked score
      display = lockedScore;
    } else {
      // not chosen yet → show preview based on current dice
      display = computeScoreForCategory(dice, cat);
    }

    scoreCell.textContent = display;
  });
}

function renderTotal(game) {
  const grandTotal = document.getElementById("grandTotal");
  if (grandTotal) {
    grandTotal.textContent = game.totalScore;
  }
}

// ---- EVENTS ----

document.addEventListener("DOMContentLoaded", async () => {
  const rollBtn = document.getElementById("rollBtn");
  if (rollBtn) {
    rollBtn.addEventListener("click", rollDice);
  }

  const endGameBtn = document.getElementById("endGameBtn");
  if (endGameBtn) {
    endGameBtn.addEventListener("click", startNewGame);
  }

  const diceRow = document.getElementById("diceRow");
  if (diceRow) {
    diceRow.querySelectorAll(".die").forEach(btn => {
      btn.addEventListener("click", () => {
        const index = Number(btn.dataset.index);
        if (Number.isNaN(index)) return;

        holds[index] = !holds[index];
        btn.classList.toggle("die--held", holds[index]);
      });
    });
  }

  // click rows to lock score into that category
  document.querySelectorAll("tr[data-cat]").forEach(row => {
    const cat = row.getAttribute("data-cat");
    row.addEventListener("click", () => {
      scoreCategory(cat);
    });
    row.style.cursor = "pointer";
  });

  const data = await fetchState();
  renderGame(data.game);
});
