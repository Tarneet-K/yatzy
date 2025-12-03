// gameLogic.js

// Category names match your HTML data-cat attributes
const CATEGORIES = [
  "ones", "twos", "threes", "fours", "fives", "sixes",
  "threeKind", "fourKind", "fullHouse",
  "smallStraight", "largeStraight",
  "chance", "yatzy"
];

function createNewGame() {
  return {
    dice: [1, 1, 1, 1, 1],
    rollsLeft: 3,
    usedCategories: Object.fromEntries(CATEGORIES.map(c => [c, false])),
    scores: Object.fromEntries(CATEGORIES.map(c => [c, null])),
    upperTotal: 0,
    bonus: 0,
    totalScore: 0,
    gameOver: false
  };
}

function rollDice(game, holds = [false, false, false, false, false]) {
  if (game.gameOver || game.rollsLeft <= 0) return game;

  const newDice = game.dice.map((value, index) =>
    holds[index] ? value : 1 + Math.floor(Math.random() * 6)
  );

  game.dice = newDice;
  game.rollsLeft -= 1;
  recomputeTotals(game);
  return game;
}

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

function scoreCategory(game, category) {
  if (!CATEGORIES.includes(category)) {
    throw new Error("Unknown category");
  }
  if (game.usedCategories[category]) {
    throw new Error("Category already used");
  }

  const score = computeScoreForCategory(game.dice, category);

  game.usedCategories[category] = true;
  game.scores[category] = score;
  game.rollsLeft = 3; // new turn

  recomputeTotals(game);
  game.gameOver = CATEGORIES.every(c => game.usedCategories[c]);

  return game;
}

function recomputeTotals(game) {
  const upperCats = ["ones", "twos", "threes", "fours", "fives", "sixes"];

  game.upperTotal = upperCats.reduce((sum, cat) => {
    const s = game.scores[cat];
    return sum + (typeof s === "number" ? s : 0);
  }, 0);

  game.bonus = game.upperTotal >= 63 ? 35 : 0;

  const baseTotal = Object.values(game.scores)
    .filter(v => typeof v === "number")
    .reduce((a, b) => a + b, 0);

  game.totalScore = baseTotal + game.bonus;
}

module.exports = {
  CATEGORIES,
  createNewGame,
  rollDice,
  scoreCategory,
  computeScoreForCategory
};
