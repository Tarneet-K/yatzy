// server.js
const express = require("express");
const path = require("path");
const {
  CATEGORIES,
  createNewGame,
  rollDice,
  scoreCategory
} = require("./gameLogic");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// serve frontend
app.use(express.static(path.join(__dirname, "public")));

// single in-memory game
let game = createNewGame();

// current state
app.get("/api/state", (_req, res) => {
  res.json({ game, categories: CATEGORIES });
});

// new game
app.post("/api/new-game", (_req, res) => {
  game = createNewGame();
  res.json({ game, categories: CATEGORIES });
});

// roll dice
app.post("/api/roll", (req, res) => {
  const { holds } = req.body;

  try {
    game = rollDice(game, Array.isArray(holds) ? holds : [false, false, false, false, false]);
    res.json({ game, categories: CATEGORIES });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// score a category
app.post("/api/score", (req, res) => {
  const { category } = req.body;

  try {
    game = scoreCategory(game, category);
    res.json({ game, categories: CATEGORIES });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🎲 Yatzy Assignment 2 server running at http://localhost:${PORT}`);
});
