# Grid Master v1.0

*A Robotic Game Master on a 12x12 Grid TTRPG*

## Abstract

Grid Master is a hybrid physical-digital game system where a UR5 robotic arm acts as a dynamic Game Master for a Tabletop Role-Playing Game. Upto 4 Players can explore a 12x12 modular terrain grid, interact via physical button presses tracked by a custom Orange Pi matrix, and engage in a TTRPG-inspired narrative managed through real-time game logic executed via CPEE. The system blends robotics, embedded computing, and BPMN-style process automation to create an immersive dungeon crawler experience.

## Motivation

The goal of this project was to explore how automation, robotics, and human interaction can be orchestrated through process-oriented software architecture. Inspired by tabletop role-playing games like Dungeons & Dragons, the system reimagines the role of a Game Master as a robotic mediator within a structured, rule-driven environment.

By combining physical interfaces (keyboard matrix), programmable robot behavior (UR5), and process automation (CPEE), this project demonstrates how human-centric gameplay can be moderated and managed by a non-human agent. It highlights how complex decision-making and sequential logic can be visualized, modeled, and executed using cloud-based process engines.

This system also showcases how real-time human input (via physical movement) can be integrated with dynamic robot action, illustrating key concepts in sustainable automation, digital twins, and human-machine symbiosis.

## System Overview

The project integrates multiple components:

* **UR5 Robotic Arm** — Acts as the Game Master, physically placing and rotating terrain pieces and expanding the player grid based on player movement.
* **12x12 Grid** — Physical surface embedded with 144 mechanical keyboard switches for position detection.
* **Orange Pi Zero 2W** — Handles real-time key press detection via GPIO and sends movement data to the backend.
* **CPEE** — Cloud Process Execution Engine serves as the central game logic controller, managing game setup, player turns, assigning events, detecting end game conditions, and calling robot actions.
* **Server** — Hosts the Bottle server (server.py) and forwards updated player and grid state to CPEE.
* **Frontend Visualizer** — A web interface displays the grid, handles player setup, and event interaction.

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
├── requirements.txt    # Combined Python dependencies
├── .gitignore          # Clean repo management
├── README.md           # This write-up
```

## Technologies Used

| Component        | Stack                               |
| ---------------- | ----------------------------------- |
| Embedded Input   | Orange Pi Zero 2W + WiringOP        |
| Backend Server   | Python + Bottle                     |
| Process Engine   | CPEE (XML workflows)                |
| Robot Controller | UR5 Robot Arm (via USB + IP)        |
| Frontend         | HTML, JS, CSS (manual + auto logic) |
| Communication    | HTTP, JSON                          |

## How It Works

1. CPEE sends a welcome message and character setup prompt to the frontend.
2. Players step on character symbols on the 12x12 grid. Orange Pi detects movement and sends it to the server.
3. Once all players are placed and initiative is set, CPEE enters a loop to manage initiative-based turns.
4. For each player turn:

   * CPEE assigns a random event
   * Sends the current player and event data to the frontend
   * Waits for updated player + grid state based on movement data and dice checks
5. If the updated state indicates a new terrain piece is needed, CPEE triggers UR5 rotation and placement routines.
6. The turn loop continues until the game end conditions are met, which for now are that all players have found and reached their escape locations.

## Game Design Summary

* Players choose from 4 characters: **Rogue, Wizard, Cleric, or Barbarian**.
* Each character has unique stats (HP, armor, movement, stats).
* Physical input drives a digital turn-based game loop.
* Dynamic terrain placement via UR5 ensures modular gameplay.
* Game logic includes physical dice rolls, stat-based checks, event outcomes, and real-time feedback.
* Entire turn logic, event distribution, and robot coordination is handled by **CPEE**.

## Setup Instructions

### Lehre Server Setup

* Install dependency:

  ```bash
  pip install bottle
  ```

* Run `src/server.py`
* Host `frontend/index.html`

### Orange Pi Setup

This project sets up an **Orange Pi Zero 2W** running **Armbian** to automatically:

* Use **WiringOP** for accessing GPIO pins via terminal
* Connect to **Wi-Fi** on boot
* Enable **auto-login** to terminal
* Run a **GPIO key press detection script** (`detect_key_presses.py`)

#### 1. Flash Armbian Image

* Download from [armbian.com](https://www.armbian.com/orange-pi-zero-2/)
* Flash with Raspberry Pi Imager or Balena Etcher

#### 2. Install WiringOP

```bash
git clone https://github.com/zhaolei/WiringOP.git -b h3
cd WiringOP
chmod +x ./build
sudo ./build
```

#### 3. Connect to Wi-Fi Automatically

Edit WPA config:

```bash
sudo nano /etc/wpa_supplicant/wifi.conf
```

Configure `wifi.service` and enable it.

#### 4. Enable Auto-Login:

```bash
sudo systemctl edit getty@tty1
```

Add autologin directive.

#### 5. Auto-Run Script on Boot:

Create `detect-keys.service`:

```bash
sudo nano /etc/systemd/system/detect-keys.service
```

Set it to run `/home/your_username/detect_key_presses.py` with log output. Enable the service:

```bash
sudo systemctl enable detect-keys.service
```

The Orange Pi will now auto-login, auto-connect to wifi and run the grid input script on boot.

### UR5 Robot Setup

* Load programs via USB stick (rotate, pick, place).
* Set robot to Remote Control mode.
* Robot responds to CPEE calls triggered from backend.
