// THIS IS A HORRIBLE .js FILE. IT WILL BE REFACTORED LATER ON.

let characterTemplates = [];
const startPositions = {};
let playerSelections = [];
let waitingForTurn = false;

// ----------------------------------------------

function findStartPositions() {
  for (let row of game_state) {
    for (let cell of row) {
      if (cell.effect === "rogueS") startPositions["rogue"] = cell.global;
      if (cell.effect === "wizardS") startPositions["wizard"] = cell.global;
      if (cell.effect === "clericS") startPositions["cleric"] = cell.global;
      if (cell.effect === "barbarianS") startPositions["barbarian"] = cell.global;
    }
  }
  console.log(startPositions)
}

function getMod(score) {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function getColorClass(id) {
  switch (id) {
    case "rogue": return "rogue-card";
    case "wizard": return "wizard-card";
    case "cleric": return "cleric-card";
    case "barbarian": return "barbarian-card";
    default: return "";
  }
}

function renderCharacterCards() {
  const container = document.getElementById("character-selection");
  characterTemplates.forEach(player => {
    const card = document.createElement("div");
    card.className = `player-card ${getColorClass(player.id)}`;
    card.innerHTML = `
      <h3>${player.id.toUpperCase()}</h3>
      <div><strong>Health:</strong> ${player.hp}</div>
      <div><strong>Evasion:</strong> ${player.ac}</div>
      <div><strong>Speed:</strong> ${player.movement} cells</div>
      <div><strong>Symbol: ${player.symbol.toUpperCase()}</div>
      <div><strong>STR:</strong> ${player.STR} (${getMod(player.STR)}), <strong>AGI:</strong> ${player.DEX} (${getMod(player.DEX)})</div>
      <div><strong>FIN:</strong> ${player.CON} (${getMod(player.CON)}), <strong>KNO:</strong> ${player.INT} (${getMod(player.INT)})</div>
      <div><strong>INS:</strong> ${player.WIS} (${getMod(player.WIS)}), <strong>CHA:</strong> ${player.CHA} (${getMod(player.CHA)})</div>
    `;
    container.appendChild(card);
  });
}

function renderPlayerSidebar(player) {
  const sidebar = document.getElementById("sidebar");
  sidebar.innerHTML = ""; // Clear previous

  const card = document.createElement("div");
  card.className = `player-card ${getColorClass(player.id)}`;
  card.innerHTML = `
    <h3>${player.id.toUpperCase()}</h3>
    <div class="stat-line"><span class="stat-label">Health:</span><span class="stat-text"> ${player.hp} / ${player.max_hp}</span></div>
    <div class="stat-line"><span class="stat-label">Evasion:</span><span class="stat-text"> ${player.ac}</span></div>
    <div class="stat-line"><span class="stat-label">Speed:</span><span class="stat-text"> ${player.movement} Cells</span></div>
    <div class="stat-line"><span class="stat-label">Symbol:</span><span class="stat-text"> ${player.symbol.toUpperCase()}</span></div>
    <div class="stat-line"><span class="stat-label">Strength:</span><span class="stat-text"> ${player.STR} (${getMod(player.STR)})</span></div>
    <div class="stat-line"><span class="stat-label">Agility:</span><span class="stat-text"> ${player.DEX} (${getMod(player.DEX)})</span></div>
    <div class="stat-line"><span class="stat-label">Finesse:</span><span class="stat-text"> ${player.CON} (${getMod(player.CON)})</span></div>
    <div class="stat-line"><span class="stat-label">Knowledge:</span><span class="stat-text"> ${player.INT} (${getMod(player.INT)})</span></div>
    <div class="stat-line"><span class="stat-label">Instinct:</span><span class="stat-text"> ${player.WIS} (${getMod(player.WIS)})</span></div>
    <div class="stat-line"><span class="stat-label">Charisma:</span><span class="stat-text"> ${player.CHA} (${getMod(player.CHA)})</span></div>
  `;
  sidebar.appendChild(card);
}

function rollDice(dice) {
  if (!dice) return 0;
  const [count, sides] = dice.toLowerCase().split('d').map(Number);
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
}

// ----------------------------------------------

function askPlayerCount() {
  const container = document.getElementById("player-count-input");
  container.innerHTML = `
    <p>How many victims will be entering the Dungeon today? (1-4)</p>
    <input id="player-count" type="number" min="1" max="4" />
    <button onclick="collectSelections()">Next</button>
  `;
}

async function askPlayersToPlace(count) {
  for (let i = 0; i < count; i++) {
    await askSinglePlayer(i);
  }

  // All players placed! Now move to initiative phase
  askInitiativesWithData(playerSelections);
}

function collectSelections() {
  const count = parseInt(document.getElementById("player-count").value);
  if (isNaN(count) || count < 1 || count > 4) {
    alert("Enter a number between 1 and 4");
    return;
  }

  const container = document.getElementById("individual-selection-inputs");
  container.innerHTML = "";

  findStartPositions();
  askPlayersToPlace(count);
}

async function askSinglePlayer(playerIndex) {
  const availableCharacters = Object.keys(startPositions).filter(c => !playerSelections.some(sel => sel.id === c));

  document.getElementById("individual-selection-inputs").innerHTML = `<p>Player ${playerIndex + 1}: Place your miniature on your chosen symbol.</p>`;

  while (true) {
    const move = await waitForMovement();

    if (!move || !move.position) {
      console.warn("No movement detected, retrying...");
      continue;
    }

    const [row, col] = move.position;

    // Match movement to available start positions
    const matchedCharacter = availableCharacters.find(char => {
      const [startRow, startCol] = startPositions[char];
      return row === startRow && col === startCol;
    });

    if (!matchedCharacter) {
      document.getElementById("individual-selection-inputs").innerHTML += `<p style="color:red;">Invalid position. Please place your pawn correctly.</p>`;
      continue;
    }

    const userConfirmed = confirm(`Player ${playerIndex + 1}: Did you choose ${matchedCharacter.toUpperCase()}?`);
    if (userConfirmed) {
      playerSelections.push({ id: matchedCharacter });
      break;
    }
  }
}

async function waitForMovement() {
  try {
    const res = await fetch("https://lehre.bpm.in.tum.de/ports/5103/wait_for_move");
    const data = await res.json();
    if (data.status === "timeout") return null;
    return data;
  } catch (err) {
    console.warn("Failed to fetch movement:", err);
    return null;
  }
}

function askInitiativesWithData(selections) {
  document.getElementById("individual-selection-inputs").style.display = "none";
  document.getElementById("player-count-input").style.display = "none";
  document.getElementById("character-selection").style.display = "none";

  // Show initiative inputs
  const initiativeContainer = document.getElementById("initiative-inputs");
  initiativeContainer.innerHTML = `<h3>Enter Initiative Rolls(add your Agility and Instinct modifiers to the rolls)</h3>`;
  window.inputLabels = selections.map(sel => ({ charId: sel.id }));

  selections.forEach((char, index) => {
    initiativeContainer.innerHTML += `
      <div class="initiative-row">
        <label for="init-${index}">Player ${index + 1} (${char.id.toUpperCase()}): </label>
        <input id="init-${index}" type="number" min="1" max="30" required />
      </div>
    `;
  });

  initiativeContainer.innerHTML += `
    <div id="initiative-error" style="color: red; margin-top: 10px;"></div>
    <div style="margin-top: 20px;">
      <button onclick="submitInitiatives(${selections.length})">Begin Game</button>
    </div>
  `;
}

function submitInitiatives(count) {
  const players_data = [];
  const errorDiv = document.getElementById("initiative-error");
  errorDiv.textContent = ""; // Clear old errors

  for (let i = 0; i < count; i++) {
    const input = document.getElementById(`init-${i}`);
    const roll = parseInt(input.value);

    if (isNaN(roll) || roll <= 0 || roll > 30) {
      errorDiv.textContent = "Please enter a valid initiative between 1 and 30.";
      return;
    }

    const charId = inputLabels[i].charId;
    const original = characterTemplates.find(c => c.id === charId);
    const player = { ...original }; // clone

    player.initiative = roll + player.init_bonus;

    // Find the position from game_state
    const position = startPositions[charId];
    if (position) {
      player.position = position;
      const [x, y] = position;
      const cell = game_state.find(row => row.find(c => c.global[0] === x && c.global[1] === y))?.find(c => c.global[0] === x && c.global[1] === y);
      if (cell) {
        cell.occupied = charId;
      } else {
        console.warn(`Could not update occupied cell for ${charId} at [${x}, ${y}]`);
      }
    } else {
      console.warn(`Starting position not found for ${charId}`);
    }

    players_data.push(player);
  }

  // Sort by initiative
  players_data.sort((a, b) => b.initiative - a.initiative);

  // Send Data Back
  console.log(players_data);
  console.log(game_state);
  sendSetupToCPEE(players_data, game_state, callbackUrl);
  document.getElementById("initiative-inputs").style.display = "none";
  document.getElementById("setup-container").style.display = "none";
  setTimeout(() => {
    fetchGridAndWalls();
    document.getElementById("visualizer-container").style.display = "block";
  }, 5000);
}

function sendSetupToCPEE(players_data, game_state, callbackUrl) {
  fetch("https://lehre.bpm.in.tum.de/ports/5103/finishSetup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      players: players_data,
      game_state: game_state,
      callback_url: callbackUrl
    })
  })
  .then(res => {
    if (!res.ok) throw new Error("Failed to send to CPEE");
    return res.json();
  })
  .then(data => {
    console.log("Sent to CPEE:", data);
    setTimeout(() => {
      pollTurnData();  // START polling after setup is complete!
    }, 2000);
  })
  .catch(err => {
    console.error("Error sending to CPEE:", err);
  });
}

async function loadWelcomeMessage() {
  try {
    const res = await fetch("/~ge87max/welcome.json?t=" + Date.now());
    const data = await res.json();
    document.getElementById("welcome-message").innerHTML = data.message.replace(/\n/g, "<br>");

    // Try fetching the character setup right after welcome message
    const setupRes = await fetch("/~ge87max/character_setup.json?t=" + Date.now());
    const setupData = await setupRes.json();

    if (!setupData || !setupData.characters || !Array.isArray(setupData.characters)) {
      console.warn("No valid setup data. Staying on welcome screen.");
      document.getElementById("welcome-message").innerHTML += "<br><br><em>Waiting for setup data...</em>";
      return;
    }

    // If valid, proceed after 3s
    setTimeout(() => {
      document.getElementById("welcome-container").style.display = "none";
      document.getElementById("setup-container").style.display = "block";
      characterTemplates = setupData.characters;
      game_state = setupData.grid;
      callbackUrl = setupData.callback;
      renderCharacterCards();
      askPlayerCount();
    }, 3000);

  } catch (err) {
    console.error("Error loading welcome or setup:", err);
    document.getElementById("welcome-message").innerText = "Welcome message could not be loaded.";
  }
}

async function fetchCharacterSetup() {
  try {
    const res = await fetch("https://lehre.bpm.in.tum.de/~ge87max/character_setup.json?t=" + Date.now());
    const data = await res.json();

    if (!data || !data.characters || !Array.isArray(data.characters)) {
      console.warn("No valid setup data.");
      return;
    }

    characterTemplates = data.characters;
    game_state = data.grid;
    callbackUrl = data.callback;

    renderCharacterCards();
    askPlayerCount();
  } catch (err) {
    console.error("Failed to fetch setup:", err);
  }
}

async function fetchGridAndWalls() {
  const timestamp = Date.now();
  const [gridRes, terrainRes, playerRes] = await Promise.all([
    fetch(`/~ge87max/grid.json?t=${timestamp}`),
    fetch(`/~ge87max/terrain_pieces.json?t=${timestamp}`),
    fetch(`/~ge87max/player_data.json?t=${timestamp}`)
  ]);

  const grid = await gridRes.json();
  const terrainPieces = await terrainRes.json();
  const players = await playerRes.json();
  renderGrid(grid, terrainPieces, players);
}

async function fetchTurnData() {
  try {
    const res = await fetch("/~ge87max/turn_data.json?t=" + Date.now());
    const data = await res.json();

    const currentPlayer = data.current_player;
    const currentEvent = data.current_event;

    renderPlayerSidebar(currentPlayer);
    renderEventArea(currentPlayer, currentEvent);

  } catch (err) {
    console.error("Failed to fetch turn data:", err);
  }
}

function renderEventArea(player, event) {
  const container = document.getElementById("event-area");
  container.innerHTML = `
    <h3>Event: ${event.name}</h3>
    <p>${event.description}</p>
  `;

  if (event.id == 0) {
    waitForMovementInput(player);
  } else if (event.id == 7) {
    handleEventResolution(player, event, 0);
  } else {
    container.innerHTML += `
      <label for="event-roll">Enter your roll(make sure you add the modifier for the ability score):</label>
      <input id="event-roll" type="number" min="1" max="25" />
      <button onclick="resolveEvent('${player.id}', ${event.id})">Submit Roll</button>
    `;
  }
}

async function resolveEvent(playerId, eventId) {
  const rollInput = document.getElementById("event-roll");
  const rollValue = parseInt(rollInput.value);

  if (isNaN(rollValue) || rollValue < 1 || rollValue > 25) {
    alert("Please enter a valid roll(no less than 1, no more than 25)");
    return;
  }

  const res = await fetch("/~ge87max/turn_data.json?t=" + Date.now());
  const data = await res.json();
  const player = data.current_player;
  const event = data.current_event;

  handleEventResolution(player, event, rollValue);
}

function handleEventResolution(player, event, roll) {
  const dc = event.dc;
  const effect = event.effect;
  const dice = event.dice;
  const successText = event.on_success;
  const failText = event.on_fail;
  let outcomeText = "";

  if (event.name === "Heal!") {
    const healAmount = rollDice(dice);
    player.hp = Math.min(player.hp + healAmount, player.max_hp);
    outcomeText = `You heal for ${healAmount} HP!`;
  } else {
    const pass = roll >= dc;
    const damageAmount = rollDice(dice);

    if (pass) {
      if (effect === "none") {
        outcomeText = `${successText} You take no damage.`;
      } else if (effect === "half") {
        const halfDamage = Math.max(1, Math.floor(damageAmount / 2));
        player.hp -= halfDamage;
        outcomeText = `${successText} You take only ${halfDamage} damage.`;
      }
    } else {
      if (effect === "none" || effect === "half") {
        player.hp -= damageAmount;
        outcomeText = `${failText} You take ${damageAmount} damage.`;
      }
    }
  }

  const container = document.getElementById("event-area");
  container.innerHTML = `<p>${outcomeText}</p>`;

  renderPlayerSidebar(player);

  setTimeout(() => {
    waitForMovementInput(player);
  }, 1500);
}

async function waitForMovementInput(player) {
  const eventArea = document.getElementById("event-area");
  eventArea.innerHTML += `<p id="movement-wait">Waiting for movement...</p>`;

  while (true) {
    try {
      const res = await fetch("https://lehre.bpm.in.tum.de/ports/5103/wait_for_move");
      const move = await res.json();

      if (move && move.position) {
        const [newRow, newCol] = move.position;

        // Check if revealed (occupied or terrain)
        const cell = game_state[newRow - 1][newCol - 1];
        if (!cell || (!cell.terrainID && !cell.occupied)) {
          const errorMsg = document.getElementById("movement-error");
          if (!errorMsg) {
            const newError = document.createElement("p");
            newError.id = "movement-error";
            newError.style.color = "red";
            newError.textContent = "Invalid move. Try again.";
            eventArea.appendChild(newError);
          }
          continue;
        }

        // Ask for confirmation
        const confirmMove = confirm(`${player.id.toUpperCase()}, are you moving to [${newRow}, ${newCol}]?`);
        if (!confirmMove) {
          console.log("Player rejected move, waiting again...");
          continue;
        }

        // Movement distance check (Diagonal Allowed)
        const [oldRow, oldCol] = player.position;
        const rowDistance = Math.abs(newRow - oldRow);
        const colDistance = Math.abs(newCol - oldCol);
        const totalDistance = rowDistance + colDistance;  // simple movement (no diagonals)

        if (totalDistance > player.movement) {
          alert(`Something fishy going on... Please place your mini back on [${oldRow}, ${oldCol}] and move only up to ${player.movement} squares.`);
          continue;
        }

        // Valid move
        player.position = [newRow, newCol];
        renderPlayerSidebar(player);

        // Clear any previous error message
        const existingError = document.getElementById("movement-error");
        if (existingError) existingError.remove();

        setTimeout(() => {
          finishPlayerTurn(player);
        }, 500);
        break;
      }
    } catch (err) {
      console.warn("No movement detected yet...");
    }
  }
}

async function finishPlayerTurn(player) {
  try {
    const callbackRes = await fetch("/~ge87max/callback.json");
    const callbackData = await callbackRes.json();

    await fetch("https://lehre.bpm.in.tum.de/ports/5103/finishPlayerTurn", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        current_player: player,
        callback_url: callbackData.url
      })
    });

    console.log("Turn finished and sent to CPEE!");
    waitingForTurn = false;  // <-- ALLOW polling for next turn again here!

  } catch (err) {
    console.error("Error finishing turn:", err);
  }
}

function pollTurnData() {
  setInterval(async () => {
    if (waitingForTurn) return; // If a turn is already being played, don't fetch new one yet

    try {
      const res = await fetch("/~ge87max/turn_data.json?t=" + Date.now());
      if (!res.ok) {
        console.warn("turn_data.json not available yet. Server response:", res.status);
        return; // No turn data yet
      }

      const data = await res.json();
      if (data && data.current_player && data.current_event !== null) {
        waitingForTurn = true;
        console.log("New turn data received:", data);
        setTimeout(async () => {
          await refreshGridAndSidebar(data.current_player);
          renderEventArea(data.current_player, data.current_event);
        }, 2000);
      } else {
        console.warn("Turn data file was loaded but missing expected fields:", data);
      }
    } catch (err) {
      console.warn("Error fetching turn data:", err);
    }
  }, 3000); // Every 3 seconds
}

async function refreshGridAndSidebar(currentPlayer) {
  const timestamp = Date.now();
  try {
    const [gridRes, terrainRes, playerRes] = await Promise.all([
      fetch(`/~ge87max/grid.json?t=${timestamp}`),
      fetch(`/~ge87max/terrain_pieces.json?t=${timestamp}`),
      fetch(`/~ge87max/player_data.json?t=${timestamp}`)
    ]);

    const grid = await gridRes.json();
    const terrainPieces = await terrainRes.json();
    const players = await playerRes.json();

    window.game_state = grid; // Update global
    window.terrainPieces = terrainPieces;
    window.players = players;

    renderGrid(grid, terrainPieces, players); // Assuming you have a renderGrid() that builds the divs
    renderPlayerSidebar(currentPlayer); // Only the current player's card updates

  } catch (err) {
    console.error("Failed refreshing grid and sidebar:", err);
  }
}

function renderGrid(grid, terrainPieces, players) {
  const gridDiv = document.getElementById("grid");
  gridDiv.innerHTML = "";

  // STEP 1: Build wall data
  const wallData = {}

  for (let piece of terrainPieces) {
    const { placement, horizontal_walls, vertical_walls } = piece;
    const rowStart = (Math.floor(placement / 10) - 1) * 4;
    const colStart = (placement % 10 - 1) * 4;

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const gRow = rowStart + r;
        const gCol = colStart + c;
        const key = `${gRow},${gCol}`;

        wallData[key] = {
          wallTop: vertical_walls[c][r] === 1,
          wallBottom: vertical_walls[c][r+1] === 1,
          wallLeft: horizontal_walls[r][c] === 1,
          wallRight: horizontal_walls[r][c+1] === 1,
        };
      }
    }
  }

  // STEP 2: Render Grid
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const cell = grid[row][col];
      const div = document.createElement("div");
      div.className = "cell";

      if (cell.terrainID) {
        div.classList.add("terrain");
      }

      if (cell.occupied !== false && cell.occupied !== null) {
        div.classList.add("occupied");
        const playerId = cell.occupied.toLowerCase();
        div.classList.add(playerId);
        div.innerText = playerId[0].toUpperCase();
      }

      const wall = wallData[`${row},${col}`];
      if (wall) {
        const leftNeighbor = wallData[`${row},${col - 1}`];
        const topNeighbor = wallData[`${row - 1},${col}`];

        if (wall.wallTop) {
          div.classList.add("wall-top");
        }
        if (wall.wallLeft) {
          div.classList.add("wall-left");
        }
        if (wall.wallRight) {
          div.classList.add("wall-right");
        }
        if (wall.wallBottom) {
          div.classList.add("wall-bottom");
        }
      }

      div.title = `Pos: ${cell.global}\nTerrain: ${cell.terrainID || "None"}\nPlayer: ${cell.occupied || "None"}`;
      gridDiv.appendChild(div);
    }
  }
}

loadWelcomeMessage();
