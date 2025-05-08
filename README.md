# Grid Master v1.0

*A Robotic Game Master on a 12x12 Grid TTRPG*

## Abstract

Grid Master is a hybrid physical-digital game system where a UR5 co-bot arm acts as the Game Master for a custom Tabletop Role-Playing Game. In this dungeon crawl, up to four players interact with a 12x12 modular grid with terrain on top which expands according to their interactions with the game environment via physical button presses tracked by a custom Orange Pi setup and engage in a roleplay-inspired narrative managed through real-time game logic executed via CPEE. The system creates an immersive TTRPG experience by combining BPMN-style process automation with robotics and embedded computing.

## Motivation

By creating a process-oriented software architecture, the project explores how human interaction, robotics, and automation may be integrated. The system demonstrates how complex decision-making and sequential gameplay logic, modeled after tabletop role-playing games such as Dungeons & Dragons, may be modeled, visualized, and implemented using a cloud-based process engine.

The system imagines the UR5 co-bot arm as the Game Master in a structured, rule-driven environment. By doing so, it demonstrates how a non-human entity can support gameplay that is heavily dependent on human participation by integrating a physical matrix interface, programmable robotic behavior, and process automation through CPEE.

In addition, it demonstrates how rapid human feedback may be coordinated, highlighting essential concepts in sustainable automation, digital twins, and human-computer interaction.

## Game Design Summary

* Players can choose from 4 characters: **Rogue, Wizard, Cleric, or Barbarian**.
* Each character has unique stats such as Health, Armor, Movement Speed, and Ability Stats(Strength, Agility, Finesse, Knowledge, Insight, Charisma).
* Once the players are selected, the game starts. The players aim to find their individual and character-specific exit points in the dungeon that expands with further terrain tiles as they explore the environment.
* On a player's turn:
  * The player has an event that occurs to them which may allow them to:
     1. Continue their turn normally.
     2. Prompt them to make a certain saving throw depending on the event, such as a Flame Trap, or a Ghost Attack, for which they may lose health depending on if they succeed or fail the check, or,
     3. Get healed, such as by "finding a Healing Potion".
  * The player can then move their mini to the position they want to move(They are only allowed to move a number of cells equal to their character's speed).
* If at any point a player drops to 0 health, they die and are removed from the initiative order. The remaining players need to explore the remainder of the environment and find their exit points before they are all spent.
* Once the player movement is finalized, one of the following may occur:
  * If the player does not reach the end of a terrain piece, the next player in the initiative order continues with their turn.
  * If the player reaches an exit on a terrain piece and the piece IS on the edge of a grid, that terrain piece is rotated on the grid so the player can continue exploring a different arrangement of the environment.
  * If the player reaches an exit on a terrain piece and the piece IS NOT the edge of a grid, a new terrain piece is inserted onto the grid so the players can continue exploring the environment.
* The game ends when all players are standing at their exit positions - the symbols their players are related to(ie. Triangle for Rogue, Pentagon for Cleric etc.). The game also ends if all players are reduced to 0 health and removed from the initiative order.

## System Overview

The project integrates multiple components:

* **UR5 Co-bot Arm** — Acts as the Game Master, physically placing and rotating terrain pieces and expanding the player grid based on player movement.
* **12x12 Grid** — Physical surface embedded with 144 mechanical keyboard switches for position detection.
* **Orange Pi Zero 2W** — Handles real-time key press detection via GPIO and sends movement data to the backend.
* **CPEE** — Cloud Process Execution Engine serves as the central game logic controller, managing game setup, turn progression, and player data, detecting end-game conditions, and calling co-bot actions.
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

## How It Works

1. CPEE contains the template data for the grid, terrains, players, and events and stores, manipulates, and resets them as the game progresses. The JSON files are as follows:
    * **character_template:** is an array of objects, each object representing a character with different key-value pairs that represent the traits of that character such as Health, Evasion, Speed, and Ability Scores.
    * **terrains:** is an array of objects, each object representing a 4x4 terrain piece with different key-value pairs that represent the structure of the terrain piece:
      * **id:** the ID of the terrain, to keep track of which terrain is being managed or manipulated.
      * **home:** home position of the terrain piece in the terrain storage and to keep track of rotation, pick up, and drop off.
      * **placement:** placement of the terrain piece on the grid, can be one of nine values, to keep track of of rotation, pick up, and drop off.
      * **rotation:** keeps track of the rotation of the terrain piece internally.
      * **cells:** is an array of four arrays, each array representing a row of the terrain piece, and each array contaning 4 objects, representing the columns. These objects contain the following key-value pairs:
        * **effect:** keeps track if the cell is an entrace or exit of a certain character.
        * **occupied:** keeps track if the cell is occupied by a player or not.
        * **exit:** keeps track if the cell leads to an exit out of the terrain or not.
      * **horizontal_walls:** is an array of four arrays, each array representing one of the four rows of the terrain, and the five values in each of these arrays are either set to 0, for no wall, or 1 for a wall.
      * **vertical_walls:** is an array of four arrays, each array representing one of the four columns of the terrain, and the five values in each of these arrays are either set to 0, for no wall, or 1 for a wall.
    * **events:** is an array of objects, each object representing one of the seven events that may occur at the top of a player's turn. The different key-value pairs of each object represent the structure and function of the individual event:
      * **id:** the ID of the event, to keep track of which event is being used for a given player's turn.
      * **name:** the title of the event
      * **description:** flavor text for the description of the event. Tells the player what happens and if a roll is necessary or not.
      * **dc:** the difficulty rating of the event which the die roll has to match or beat meaning a success, or a failure otherwise.
      * **dice:** the number and type of dice required for the damage or hea roll, if present, for the event.
      * **effect:** the effect of the event, such as damage or heal.
      * **on_success:** the effect of the event if the roll was a success.
      * **on_fail:** the effect of the event if the roll was a failure.
    * **grid/mosaic:** is an array of twelve arrays, each array representing a row, where each row array contains 12 objects, each object representing the column in the row. The key-value pairs of these objects are as follows:
      * **global:** an array of two values that keeps track of the row and column number of the cell itself globally.
      * **terrainID:** contains the id of the terrain piece currently placed on that cell, null otherwise.
      * **occupied:** contains the id of the character currently occupying that cell, null otherwise.
      * **effect:** keeps track of the start or end condition for a specific character, null otherwise.
      * **exit:** keeps track if a cell in a terrain piece represents an exit out of that terrain piece or not.
2. CPEE sets up the initial terrain piece by randomly assigning a rotation(transposes the matrix), placing it on the center of the grid, and updating the game_state data element, which uses the grid template and updates the cells in the mosaic to represent which terrain pieces they hold, ie. terrain A or terrain E, and if they have any effects or exits. The transposing of the matrix means that both the cells themselves are rotated clockwise in either 0, 90, 180, or 270 degrees, as well as the horizontal wall and vertical wall arrays.
    * In the case that a UR5 co-bot is being used:
      * The CPEE first checks if a random rotation other than 0 was chosen for the given terrain piece. If so, it first sets the input values for the co-bot API with two separate service calls, one for the home placement of the terrain piece and the other for the rotation determined. Then it makes the service call to the ur5 co-bot API, which uses those input values, to rotate the given terrain pieces a number of times, clockwise and 90 degrees. If the rotation is 0, this step is skipped.
      * Once the rotation of the terrain piece is handled, the CPEE once again sets the input values for the co-bot API with two separate service calls, one for the home placement of the terrain piece, and the other for the grid placement of the terrain piece. Then it makes the service call to the ur5 co-bot API, which uses those input values, to pick up the given terrain piece from its home position and place it to its target position on the grid.
    * In the case that a UR5 co-bot is NOT being used:
      * The CPEE first checks if a random rotation other than 0 was chosen for the given terrain. If so, it makes a service call to the server which simply informs the players via printing to rotate a certain terrain piece with an id on a certain home placement to be rotated a certain number of times clockwise and 90 degrees.
      * Once the rotation of the terrain piece is handled, the CPEE then makes another service call to the server which simply informs the players via printing to place a certain terrain piece at a home position to a target position on the grid.
3. Once the initial terrain piece is placed, CPEE initiates a welcome message to be displayed on the user interface where the players are then prompted to choose their characters. To do so, the players place their minis on cells holding their character symbols on the terrain piece which is placed on the mosaic. The Orange Pi detects the key press and sends it to the server which keeps track of the players selected without sending the data back to CPEE.
4. The server then prompts the players who selected their characters to roll for initiative and input their rolls into the user interface. Once all players enter their initiatives, and the players are ordered in decreasing initiative, the server sends the data back to CPEE, which updates the player_data with the initiative order and enters a loop to manage the initiative-based turns.
5. For each player turn:
    * CPEE:
      * Updates the game state visualizer by sending the updated game state and the updated player data to the server, which forwards it to the UI.
      * Determines a random event from the seven available events, decided by a random probability.
      * Sends the current player, event data, and up-to-date game state to the server, which forwards it to the user interface and asynchronously waits for new player data.
    * The user interface:
      * Displays the current game state of the grid with the positions of the terrains, walls, exits, and players.
      * Displays the determined event at the top of the player's turn and waits for a roll input if required. Otherwise, the player is prompted to continue with their movement.
      * Waits for the player to move. The player can pick up their mini and place it to the location they wish to go to, bound by the number of cells they can move(their speed).
6. Once the key press is detected by the Orange Pi and received by the system and the user interface, the server updates the health and position of the current player as well as the game state and puts the updated player position, grid state, and event outcome to CPEE. CPEE then updates the player data, and the game state data locally as well. And sets certain data elements that need to be refreshed for the next player to null.
7. CPEE then checks the current game state:
    * If any player is on an "exit" cell:
      * CPEE identifies the direction a new terrain is needed to be placed.
      * It then determines a random terrain piece where an "exit" on a given terrain piece with a certain rotation matches the "exit" on the terrain piece the player is on.
      * It then updates the cells of the grid with information from the new terrain piece, whose cells, and wall arrays are transposed if a rotation is required.
      * If a UR5 co-bot is being employed, CPEE follows a similar rule as described above to make the co-bot rotate and place the new terrain piece to its new target position.
      * If a UR5 co-bit is not being employed, CPEE follows a similar rule as described above to inform the player to rotate and place the new terrain piece to its new target position.
    * If any player is on an "exit" cell at one of the top, bottom, leftmost, or rightmost edges of the grid:
      * CPEE identifies the terrain piece that the player is on.
      * It then rotates the terrain piece once, 90 degrees, and clockwise, transposing the cell and wall arrays in the game state data element which updates the grid accordingly.
      * If a UR5 co-bot is being employed, CPEE simply makes a service call to the co-bot to rotate the terrain piece in the grid once, 90 degrees, and clockwise, and place it at the same position on the grid. 
      * If a UR5 co-bit is not being employed, CPEE simply makes a service call to the server which informs the players via printing to rotate the terrain piece in the grid once, 90 degrees, and clockwise, and place it at the same position on the grid.
    * If no expansion is required, CPEE continues the turn loop from step 5.
8. The turn loop continues until the game end conditions are met, which for now is that all players are standing in cells on the grid which have the end effect specific to their characters OR that all players have been slain and removed from the initiative order.

**Note #1:** The CPEE currently has two pathways in rotating and placing the terrain pieces: with a co-bot and without. Once the co-bot programs are completed, the non-ur5 pathways will be removed.
**Note #2:** Removal of edge terrain pieces was omitted for phase 1 of the project, but will be added in future phases.
**Note #3:** Rotation of terrain pieces to their true north when being removed from the grid was omitted for phase 1 of the project, but will be added in future phases.

## UR5 Co-bot Program Descriptions

For the purposes of this project, the co-bot currently contains six programs. For the co-bot, the terrain storage and the grid are both divided into 3 rows and 3 columns. The terrain storage base coordinates and the grid base coordinates are set variables at the holder position of the terrain piece at the first row and first column position, so 11. Each program calculates the offset of a wanted terrain piece from the base position.

1. **move_to_base:** Moves the co-bot to its home/base position.
2. **move_on_grid:** Takes in a target home position(ie. 11, 12, 13, 21, 22, 23, 31, 32, or 33) and a target grid position(similarly 11, 12, 13, etc.), calculates the real coordinates of pick up and placement using the offset from the storage base coordinate and the grid base coordinate respectively, picks up the terrain piece from the target storage position, and places it on the target grid position.
3. **move_off_grid:** Takes in a target grid position and a target storage position, calculates the real coordinates of pick up and placement using the offset from the grid base coordinate and the storage base coordinate, picks up the terrain piece from the target grid position, and places it on the target storage position.
4. **move_grid_tile (not yet used in CPEE):** Takes in a starting grid position and an ending grid position, calculates the real coordinates of pick up and placement using the offset from the grid base coordinate, picks up the terrain piece from the target starting grid position, and places it to the target ending grid position.
5. **rotate_90:** Takes in a target storage position and a rotation, calculates the pick-up coordinates, the rotation movement waypoints, and the placement coordinates using the offset from the storage base coordinate, picks up the terrain piece from the target storage position, rotates it once 90-degrees clockwise, and places it at the same target storage position. Loops a 1-3 times depending on the degree of rotation.
6. **rotate_90_grid:** Takes in a target grid position and a rotation, calculates the pick-up coordinates, the rotation movement waypoints, and the placement coordinates using the offset from the grid base coordinate, picks up the terrain piece from the target grid position, rotates it once 90-degrees clockwise, and places it at the same target grid position.

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

🔗 [Watch on YouTube](https://youtu.be/OCqDxkyyfk4) - Robot Demo will be added in the following days...

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
