# Grid Master v1.0

*A Robotic Game Master on a 12x12 Grid TTRPG*

## Abstract

Grid Master is a hybrid physical-digital game system where a UR5 robotic arm acts as the Game Master for a Tabletop Role-Playing Game. In this dungeon crawl, up to four players interact with a 12x12 modular terrain grid that expands according to their interactions with the game environment via physical button presses tracked by a custom Orange Pi setup and engage in a roleplay-inspired narrative managed through real-time game logic executed via CPEE. The system creates an immersive TTRPG experience by combining BPMN-style process automation with robotics and embedded computing.

## Motivation

By creating a process-oriented software architecture, I explored how human interaction, robotics, and automation may be integrated. The system demonstrates how complex decision-making and sequential gameplay logic, modeled after tabletop role-playing games such as Dungeons & Dragons, may be modeled, visualized, and implemented using a cloud-based process engine.

The system imagines the UR5 robot arm as the Game Master in a structured, rule-driven environment. By doing so, it demonstrates how a non-human entity can support gameplay that is heavily dependent on human participation by integrating a physical matrix interface, programmable robotic behavior, and process automation through CPEE.

In addition, it demonstrates how rapid human feedback may be coordinated with adaptive robotic movements, highlighting essential concepts in sustainable automation, digital twins, and human-computer collaboration.

## System Overview

The project integrates multiple components:

* **UR5 Robotic Arm** — Acts as the Game Master, physically placing and rotating terrain pieces and expanding the player grid based on player movement.
* **12x12 Grid** — Physical surface embedded with 144 mechanical keyboard switches for position detection.
* **Orange Pi Zero 2W** — Handles real-time key press detection via GPIO and sends movement data to the backend.
* **CPEE** — Cloud Process Execution Engine serves as the central game logic controller, managing game setup, player turns, assigning events, detecting end-game conditions, and calling robot actions.
* **Server** — Hosts the Bottle server (server.py) and manages game state communication between the CPEE, the Orange Pi, and the Visualizer.
* **Frontend Visualizer** — A web interface displays the grid and handles player setup and event interaction.

## Repository Structure

```
grid-master/
├── src/                # Python scripts (server + Orange Pi GPIO)
│   ├── server.py       # Backend server for forwarding and API handling
│   └── detect_key_presses.py  # Orange Pi GPIO matrix detection
├── frontend/           # index.html, scripts.js, styles.css
├── data/               # JSON game data (grid, players, events)
├── cpee/               # CPEE XML/SVG workflows (game logic)
├── hardware/           # STL files, wiring diagrams, screenshots
│   ├── diagrams/
│   ├── screenshots/
│   └── stl/
├── requirements.txt    # Python dependencies
├── .gitignore 
├── README.md 
```

## Technologies Used

| Component        | Stack                               |
| ---------------- | ----------------------------------- |
| Embedded Input   | Orange Pi Zero 2W + WiringOP        |
| Backend Server   | Python + Bottle                     |
| Process Engine   | CPEE (XML workflows)                |
| Robot Controller | UR5 Robot Arm                       |
| Frontend         | HTML, JS, CSS                       |
| Communication    | HTTP, JSON                          |

## Game Design Summary

* Players choose from 4 characters: **Rogue, Wizard, Cleric, or Barbarian**.
* Each character has unique stats such as Health, Armor, Movement Speed, and Ability Stats.
* Once the players are selected, the game turns start.
* Entire turn logic, event distribution, and robot coordination are handled by **CPEE**.
  * Physical movement input from the players drives the turn-based game loop.
  * Events might appear on a randomized probability at the top of a player's turn.
  * Game logic includes physical dice rolls, stat-based checks, event outcomes, and real-time feedback.
* Depending if terrain expansion is necessary, the CPEE instructs the UR5 to place new terrain to ensure continuous gameplay.

## How It Works

1. CPEE sets up the initial terrain piece, and game state.
2. A welcome message is displayed and players are prompted to choose their characters on the frontend.
3. Players place their minis on character symbols on the 12x12 grid. The Orange Pi detects the key press and sends it to the server which forwards it to CPEE.
4. Once all players are placed and initiative is set, CPEE enters a loop to manage initiative-based turns.
5. For each player turn:
  * CPEE:
    * Assigns a random event decided by a random probability.
    * Sends the current player, event data, and up-to-date game state to the frontend.
  * The Frontend:
    * Displays the current grid state.
    * Displays the CPEE-determined event and waits for a roll input.
    * Waits for the player to move.
6. Once the player movement is finalized, the server posts the updated player position, grid state, and event outcome to CPEE.
7. If the updated game state indicates a new terrain piece is needed, CPEE triggers UR5 rotation and placement routines.
8. If the updated game state indicates a certain terrain piece rotation is necessary, CPEE triggers UR5 to rotate the piece on the grid.
9. The turn loop continues until the game end conditions are met, which for now are that all players have found and reached their escape locations.

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

### UR5 Robot Setup

* Create or load programs (rotate, pick, place).
* Set robot to Remote Control mode.
* Robot responds to CPEE calls.

## Results

* Successfully tested 6x6 and 12x12 keyboard matrices.

Verified real-time GPIO input + JSON POST

CPEE integration reliably handles game flow and robot triggers

Frontend visualizer reacts live to game state and player turns

Noted issues: USB recognition on UR5 was unreliable, resolved manually

📊 Evaluation

Terrain placement works consistently and aligns well with expected grid coordinates

Movement detection via physical grid is accurate and responsive with <1s latency

Event flow and character turn transitions operate reliably using CPEE logic

Frontend provides clear visual feedback and worked in all tested browsers

Robot control timing was smooth, though UR5 file access required manual workarounds

## Immediate Improvements

* Refine visuals on the frontend to improve game immersion.
* Improve process latencies to make the game flow more smoothly.
* Fine-tune the UR5 programs to allow proper placement of terrain pieces on, off, and across the grid.

## Future Directions

* Add new game logic:
 ** Enemy initiative, movement, and action logic to allow players to overcome obstacles during the gameplay.
 ** Specialized player actions that can be used on turns such as Attack, or Heal.
 ** Experience points to allow player leveling up which would unlock new abilities.
* Add new game rulesets such that the game can be played with different objectives.  
* Integrate visual/audio effects on the frontend during turn phases to improve game immersion.
* Integrate speech recognition to allow players to interact with the system as they would in a real-life scenario.

## Demo Video

Here is a "short" demo of Grid Master in action, showing player interaction, event handling, and grid expansion:

🔗 [Watch on YouTube](https://youtu.be/abc123XYZ)

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
