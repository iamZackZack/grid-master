# Grid Master v1.0

*A Robotic Game Master on a 12x12 Grid TTRPG*

## Abstract

Grid Master is a hybrid physical-digital game system where a UR5 robotic arm acts as a dynamic Game Master for a Tabletop Role-Playing Game. Upto 4 Players can explore a 12x12 modular terrain grid, interact via physical button presses tracked by a custom Orange Pi matrix, and engage in a TTRPG-inspired narrative managed through real-time game logic executed via CPEE. The system blends robotics, embedded computing, and BPMN-style process automation to create an immersive dungeon crawler experience.

## System Overview

The project integrates multiple components:

* **UR5 Robotic Arm** — Acts as the Game Master, physically placing and rotating terrain pieces and expanding the player grid based on player movement.
* **12x12 Grid** — Physical surface embedded with 144 mechanical keyboard switches for position detection.
* **Orange Pi Zero 2W** — Handles real-time key press detection via GPIO and sends movement data to the backend.
* **CPEE** — Cloud Process Execution Engine serves as the central game logic controller, managing game setup, player turns, assigning events, detecting end game conditions, and calling robot actions.
* **Lehre Server** — Hosts the Bottle server (server.py) and forwards updated player and grid state to CPEE.
* **Frontend Visualizer** — A web interface displays the dungeon grid, handles player setup, and event interaction.
