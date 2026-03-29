// Yatzy – single player (no upper/bonus rows), dice visible from start

(() => {
  // DOM
  const diceRow   = document.getElementById("diceRow");
  const rollBtn   = document.getElementById("rollBtn");
  const endTurnBtn= document.getElementById("endTurnBtn");
  const endGameBtn= document.getElementById("endGameBtn");
  const rollInfo  = document.getElementById("rollInfo");
  const scoreTable= document.getElementById("scoreTable");
  const totalCell = document.getElementById("grandTotal");

  // State
  const categories = [
    "ones","twos","threes","fours","fives","sixes",
    "threeKind","fourKind","fullHouse","smallStraight",
    "largeStraight","chance","yatzy"
  ];

  let dice  = [1,1,1,1,1];            // visible immediately
  let held  = [false,false,false,false,false];
  let rollsLeft = 3;
  let scored    = {};
  let suggested = {};

  const FACE = ["","⚀","⚁","⚂","⚃","⚄","⚅"];

  // Helpers
  const rand = () => 1 + Math.floor(Math.random()*6);
  const sum  = arr => arr.reduce((a,b)=>a+b,0);
  const cnts = () => {
    const c = Array(7).fill(0);
    for(const v of dice) c[v]++; return c;
  };

  function computeSuggestions(){
    const c = cnts();
    const s = {};
    s.ones   = c[1]*1; s.twos   = c[2]*2; s.threes = c[3]*3;
    s.fours  = c[4]*4; s.fives  = c[5]*5; s.sixes  = c[6]*6;

    s.threeKind = c.some(x=>x>=3) ? sum(dice) : 0;
    s.fourKind  = c.some(x=>x>=4) ? sum(dice) : 0;
    s.fullHouse = (c.includes(3) && c.includes(2)) ? 25 : 0;

    const has = i => c[i]>0;
    const small = (has(1)&&has(2)&&has(3)&&has(4)) ||
                  (has(2)&&has(3)&&has(4)&&has(5)) ||
                  (has(3)&&has(4)&&has(5)&&has(6));
    s.smallStraight = small ? 30 : 0;

    const large = (has(1)&&has(2)&&has(3)&&has(4)&&has(5)) ||
                  (has(2)&&has(3)&&has(4)&&has(5)&&has(6));
    s.largeStraight = large ? 40 : 0;

    s.chance = sum(dice);
    s.yatzy  = c.some(x=>x===5) ? 50 : 0;

    suggested = s;
  }

  function renderDice(){
    // Dice buttons already exist in HTML; just update faces/held
    diceRow.querySelectorAll(".die").forEach((el,i)=>{
      el.textContent = FACE[dice[i]];
      el.classList.toggle("held", held[i]);
    });
  }

  function updateScoreTable(){
    categories.forEach(cat=>{
      const row  = scoreTable.querySelector(`tr[data-cat="${cat}"]`);
      if(!row) return;
      const cell = row.querySelector("td.r");
      if (scored[cat] !== undefined){
        cell.textContent = scored[cat];
        row.classList.add("fixed");
      } else {
        cell.textContent = (rollsLeft < 3) ? (suggested[cat] ?? "—") : "—";
        row.classList.remove("fixed");
      }
    });
    totalCell.textContent = Object.values(scored).reduce((a,b)=>a+b,0);
  }

  function updateRollInfo(){
    rollInfo.textContent = `Rolls this turn: ${3-rollsLeft}/3`;
    rollBtn.disabled = rollsLeft===0;
  }

  function nextTurn(){
    held = [false,false,false,false,false];
    // Keep dice visible but reset to ⚀ to avoid random clutter
    dice = [1,1,1,1,1];
    rollsLeft = 3;
    computeSuggestions();
    renderDice();
    updateRollInfo();
    updateScoreTable();
  }

  // Actions
  function roll(){
    if(rollsLeft<=0) return;
    dice = dice.map((v,i)=> held[i] ? v : rand());
    rollsLeft--;
    computeSuggestions();
    renderDice();
    updateRollInfo();
    updateScoreTable();
  }

  function toggleHold(idx){
    if(rollsLeft===3) return; // you can only hold after first roll
    held[idx] = !held[idx];
    renderDice();
  }

  function score(cat){
    if(rollsLeft===3) return;           // must roll first
    if(scored[cat]!==undefined) return; // already taken
    scored[cat] = suggested[cat] ?? 0;
    nextTurn();
  }

  function endTurn(){ nextTurn(); }
  function endGame(){ scored={}; nextTurn(); }

  // Events
  rollBtn.addEventListener("click", roll);
  endTurnBtn.addEventListener("click", endTurn);
  endGameBtn.addEventListener("click", endGame);

  diceRow.addEventListener("click", e=>{
    const btn = e.target.closest(".die");
    if(!btn) return;
    toggleHold(+btn.dataset.index);
  });

  scoreTable.addEventListener("click", e=>{
    const row = e.target.closest("tr[data-cat]");
    if(!row) return;
    score(row.getAttribute("data-cat"));
  });

  // Initial paint (dice are already visible as ⚀ from HTML)
  computeSuggestions();
  renderDice();
  updateRollInfo();
  updateScoreTable();
})();
