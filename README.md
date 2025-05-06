# Grid Master v1.0

*A Robotic Game Master on a 12x12 Grid TTRPG*

## Abstract

Grid Master is a hybrid physical-digital game system where a UR5 co-bot arm acts as the Game Master for a Tabletop Role-Playing Game. In this dungeon crawl, up to four players interact with a 12x12 modular terrain grid that expands according to their interactions with the game environment via physical button presses tracked by a custom Orange Pi setup and engage in a roleplay-inspired narrative managed through real-time game logic executed via CPEE. The system creates an immersive TTRPG experience by combining BPMN-style process automation with robotics and embedded computing.

## Motivation

By creating a process-oriented software architecture, I explored how human interaction, robotics, and automation may be integrated. The system demonstrates how complex decision-making and sequential gameplay logic, modeled after tabletop role-playing games such as Dungeons & Dragons, may be modeled, visualized, and implemented using a cloud-based process engine.

The system imagines the UR5 co-bot arm as the Game Master in a structured, rule-driven environment. By doing so, it demonstrates how a non-human entity can support gameplay that is heavily dependent on human participation by integrating a physical matrix interface, programmable robotic behavior, and process automation through CPEE.

In addition, it demonstrates how rapid human feedback may be coordinated, highlighting essential concepts in sustainable automation, digital twins, and human-computer interaction.

## System Overview

The project integrates multiple components:

* **UR5 Co-bot Arm** — Acts as the Game Master, physically placing and rotating terrain pieces and expanding the player grid based on player movement.
* **12x12 Grid** — Physical surface embedded with 144 mechanical keyboard switches for position detection.
* **Orange Pi Zero 2W** — Handles real-time key press detection via GPIO and sends movement data to the backend.
* **CPEE** — Cloud Process Execution Engine serves as the central game logic controller, managing game setup, player turns, assigning events, detecting end-game conditions, and calling co-bot actions.
* **Server** — Hosts the Bottle server (server.py) and manages game state communication between the CPEE, the Orange Pi, and the Visualizer.
* **Frontend Visualizer** — A web interface displays the grid and handles player setup and event interaction.

## Repository Structure

```
grid-master/
├── src/                            # Python scripts (server + Orange Pi GPIO)
│   ├── server.py                   # Backend server for forwarding and API handling
│   └── detect_key_presses.py       # Orange Pi GPIO matrix detection
├── frontend/                       # index.html, scripts.js, styles.css
├── data/                           # JSON game data (grid, players, events)
├── cpee/                           # CPEE XML/SVG workflows (game logic)
├── hardware/                       # STL files, wiring diagrams, screenshots
│   ├── diagrams/
│   ├── screenshots/
│   └── stl/
├── requirements.txt
├── .gitignore 
├── README.md 
```

## Technologies Used

| Component        | Stack                               |
| ---------------- | ----------------------------------- |
| Physical Input   | Orange Pi Zero 2W + WiringOP        |
| Backend Server   | Python + Bottle                     |
| Process Engine   | CPEE (XML workflows)                |
| Robot Helper     | UR5 Co-bot Arm                      |
| Frontend         | HTML, JS, CSS                       |
| Communication    | HTTP, JSON                          |

## Game Design Summary

* Players choose from 4 characters: **Rogue, Wizard, Cleric, or Barbarian**.
* Each character has unique stats such as Health, Armor, Movement Speed, and Ability Stats.
* Once the players are selected, the game starts.
* On a player's turn:
  * An event, randomly determined by CPEE, is displayed on the user interface, such as a Flame Trap, or a Ghost Attack.
  * If a die roll(ie. a Saving Throw) is required, the player is asked to roll their die and add their ability modifier to the check, and input their roll.
  * Depending on the outcome(success or failure), the player suffers the effects of the event(ie. a decrease in Health).
  * Then the player moves their mini to the position they want to move(They are only allowed to move a number of cells equal to their character's speed).
* Once the player movement is finalized, one of the following may occur:
  * If the player does not reach the end of a terrain piece, the next player in the initiative order continues with their turn.
  * If the player reaches an exit on a terrain piece and the piece IS on the edge of a grid, that terrain piece is rotated on the grid so the player can continue exploring a different arrangement of the environment.
  * If the player reaches an exit on a terrain piece and the piece IS NOT the edge of a grid, a new terrain piece is inserted onto the grid so the players can continue exploring the environment.

## How It Works

1. CPEE sets up the initial terrain piece by randomly assigning a rotation(transposes the matrix), placing it on the grid, and updating the game state(which cells in the 12x12 hold which terrain piece, ie. terrain A or terrain E).
2. A welcome message is displayed on the user interface and players are prompted to choose their characters.
3. To do so, the players place their minis on character symbols on the 12x12 grid. The Orange Pi detects the key press and sends it to the server which forwards it to CPEE.
4. Once all players are placed and the initiative is set, CPEE enters a loop to manage initiative-based turns.
5. For each player turn:
  * CPEE:
    * Determines a random event from the seven available events, decided by a random probability.
    * Sends the current player, event data, and up-to-date game state to the user interface and asynchronously waits for new player data.
  * The user interface:
    * Displays the current grid state.
    * Displays the CPEE-determined event and waits for a roll input.
    * Waits for the player to move.
6. Once the event and the player movement are finalized, the server posts the updated player position, grid state, and event outcome to CPEE.
7. CPEE continues the process flow.
8. If the updated game state indicates a new terrain piece is needed, CPEE determines a random terrain piece and rotation, updates the game state with the new terrain piece, and instructs the UR5 to rotate and place that terrain piece on the grid.
9. If the updated game state indicates a certain terrain piece rotation is necessary, CPEE transposes the new rotation, updates the game state with the updated terrain piece, and triggers the UR5 to rotate the terrain piece on the grid.
10. The turn loop continues until the game end conditions are met, which for now is that all players have reached their escape locations.

## Setup Instructions

### Grid Matrix Setup

Depending on the size of the grid, in this case 12x12, insert keyboard switches to each cell. The switches are then connected in rows and columns such that 12 continuous rows and 12 continuous columns are created. At the ends of each row and column, connect Dupont wires such that one end is stripped and soldered directly to the switches on the matrix, and the female ends can plug onto the GPIO header pins on the Orange Pi.

### Orange Pi Setup

This project sets up an **Orange Pi Zero 2W** running **Armbian** to automatically:

#### 1. Flash Armbian Image

* For this project, an [armbian.com](https://www.armbian.com/orange-pi-zero-2/) image was found to be the most suitable.
* I flashed the SD with the image using Balena Etcher.

#### 2. Install WiringOP

Once the system was booted up, I installed WiringOP to have access to the GPIO pins.

```bash
git clone https://github.com/zhaolei/WiringOP.git -b h3
cd WiringOP
chmod +x ./build
sudo ./build
```

#### 3. Automating Orange Pi

For ease of use, I also made it so the Orange Pi automatically connects to Wi-Fi using a WPA configuration, automatically logs in to the user terminal through an autologin directive, and automatically starts running the key press detection script (`detect_key_presses.py`) by enabling a service.

### Lehre Server Setup

* Install dependency:
* Run `src/server.py`
* Host `frontend/index.html`

### UR5 Co-bot Setup

* Create or load programs (rotate, pick, place).
* Set co-bot to Remote Control mode.
* The co-bot responds to CPEE calls.

## Results & Evaluation

* The 12x12 keyboard matrix accurately detects and posts key presses, however the response speed can be improved to decrease delay on detection and posting.
* CPEE handles game flow and initiative order correctly and determines game continue conditions.
* CPEE decides events for each turn and correctly updates player data based on information returned from the server.
* CPEE determines if grid expansion is required, correctly determines the next terrain piece rotation and placement, and updates the game state accordingly.
* CPEE determines if terrain rotation is required and updates the game state accordingly.
* Frontend provides clear visual feedback and updates according to the current game state.
* Frontend reacts to player input regarding dice rolls and movements.
* Though the UR5 rotates and places terrain pieces, fine-tuning is required to allow for more accurate placement of tiles on the expected grid coordinates.

## Immediate Improvements

* Refine visuals on the frontend to improve game immersion.
* Improve key press detection and posting speed to decrease latency and make the game flow more smoothly.
* Fine-tune the UR5 programs to allow proper placement of terrain pieces on, off, and across the grid, and fully integrate on CPEE.

## Future Directions

* Add new game logic:
  * Enemy initiative, movement, and action logic to allow players to overcome obstacles during the gameplay.
  * Specialized player actions that can be used on turns such as Attack, or Heal.
  * Experience points to allow player leveling up which would unlock new abilities.
* Add new game rulesets such that the game can be played with different objectives.  
* Integrate visual/audio effects on the frontend during turn phases to improve game immersion.
* Integrate speech recognition to allow players to interact with the system as they would in a real-life scenario.

## Demo Video

Here is a "short" demo of Grid Master in action, showing player interaction, event handling, and grid expansion:

🔗 [Watch on YouTube](https://youtu.be/abc123XYZ) - Working on it, it's a bit long.

## Credits

* **Course**: Sustainable Process Automation: Humans, Software, and the Mediator Pattern (TUM)
* **Student**: Zeka(Zack) Dizdar, Matriculation No: 03771147
* **Supervisor**: Dr. Jürgen Mangler

## References

* [CPEE Documentation](https://cpee.org/)
* [Mangler, Juergen, and Stefanie Rinderle-Ma. *Cloud Process Execution Engine: Architecture and Interfaces* (2022)](https://arxiv.org/abs/2208.12214)
* [Orange Pi Zero 2W User Manual (v1.1)](https://drive.google.com/file/d/1K_spg7JaCM1ylp_LiVXpsoFRr6O7jnBA/view?usp=sharing) – Shenzhen Xunlong Software Co., Ltd.
* [Armbian Project](https://www.armbian.com/)
* [WiringOP GPIO Access](https://github.com/zhaolei/WiringOP)
* [Universal Robots URScript Guide](https://www.universal-robots.com/articles/)
