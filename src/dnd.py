#!/usr/bin/env python3
import bottle
from bottle import request, response
import json
import os
import threading

# -----------------------------------------------------------------

# Global movement storage
movement_data = None
movement_event = threading.Event()

# -----------------------------------------------------------------

@bottle.route('/welcome', method='POST')
def welcome_message():
    message = "Welcome to the Dungeon of Doom.\nPlayers, please wait while the >

    with open(os.path.expanduser("~/public_html/welcome.json"), "w") as f:
        json.dump({"message": message}, f)

    return bottle.HTTPResponse(
        status=200,
        body=json.dumps({"message": "Welcome received."}),
        headers={'Content-Type': 'application/json'}
    )

# -----------------------------------------------------------------

@bottle.route('/playerSetup', method='POST')
def setup_game():
    try:
        game_state_raw = request.forms.get("game_state")
        characters_raw = request.forms.get("character_template")
        callback_url = request.headers.get("CPEE-Callback")

        if not game_state_raw or not characters_raw:
            return bottle.HTTPResponse(status=400, body="Missing required data")

        game_state = json.loads(game_state_raw)
        characters = json.loads(characters_raw)

        with open(os.path.expanduser("~/public_html/character_setup.json"), "w") as f:
          json.dump({
            "grid": game_state,
            "characters": characters,
            "callback": callback_url
          }, f)

        return bottle.HTTPResponse(
            status=200,
            body=json.dumps({"status": "Waiting for player setup."}),
            headers={
                "Content-Type": "application/json",
                "CPEE-CALLBACK": "true"
            }
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return bottle.HTTPResponse(status=500, body=str(e))

@bottle.route('/finishSetup', method='POST')
def finish_setup():
    try:
        data = request.json
        players = data.get("players")
        game_state = data.get("game_state")
        callback_url = data.get("callback_url")

        if not players or not game_state or not callback_url:
            return bottle.HTTPResponse(status=400, body="Missing players, game_state, or callback_url")

        import requests
        headers = {
            "Content-Type": "application/json",
        }

        payload = {
            "players": players,
            "game_state": game_state
        }

        response = requests.put(callback_url, json=payload, headers=headers)

        if response.status_code == 200:
            files_to_delete = [
                "~/public_html/character_setup.json",
                "~/public_html/welcome.json",
            ]
            for f in files_to_delete:
                path = os.path.expanduser(f)
                if os.path.exists(path):
                    os.remove(path)
            return {"status": "Setup sent to CPEE"}
        else:
            return bottle.HTTPResponse(status=500, body=f"CPEE Error: {response.text}")

    except Exception as e:
        return bottle.HTTPResponse(status=500, body=str(e))

# -----------------------------------------------------------------

@bottle.route('/rotateTerrain', method='POST')
def rotate_tile():
    raw = request.forms.get("current_terrain")
    terrain_data = json.loads(raw) if raw else None

    if not terrain_data:
        return bottle.HTTPResponse(status=400, body="Missing or invalid current_terrain")

    tid = terrain_data.get("id")
    rot = terrain_data.get("rotation")
    home = terrain_data.get("home")

    print(f'Please rotate tile "{tid}" in location "{home}" on the terrain grid {rot} degrees clockwise.')

    return bottle.HTTPResponse(
        status=200,
        body=json.dumps({"message": "Rotation instruction received"}),
        headers={'Content-Type': 'application/json'}
    )

@bottle.route('/placePiece', method='POST')
def place_tile():
    raw = request.forms.get("current_terrain")
    terrain_data = json.loads(raw) if raw else None

    if not terrain_data:
        return bottle.HTTPResponse(status=400, body="Missing or invalid current_terrain")

    tid = terrain_data.get("id")
    home = terrain_data.get("home")
    placement = terrain_data.get("placement")

    print(f'Please place terrain "{tid}" in location "{home}" on the terrain grid to location "{placement}" on the game grid.')

    return bottle.HTTPResponse(
        status=200,
        body=json.dumps({"message": "Placement instruction received"}),
        headers={'Content-Type': 'application/json'}
    )

# -----------------------------------------------------------------

@bottle.route('/move', method='POST')
def receive_movement():
    global movement_data
    data = request.json
    print("Received movement:", data)
    movement_data = data
    movement_event.set()
    response.content_type = 'application/json'
    return {
        "status": "ok",
        "message": "Movement received",
        "data": data
    }

@bottle.route('/wait_for_move')
def wait_for_move():
    global movement_data
    movement_event.wait(timeout=10)

    if movement_data:
        result = movement_data
        movement_data = None
        movement_event.clear()
        response.content_type = 'application/json'
        return result
    else:
        response.content_type = 'application/json'
        return {"status": "timeout"}

# -----------------------------------------------------------------

@bottle.route('/visualizeGame', method='POST')
def update_grid():
    raw_grid = request.forms.get("game_state")
    raw_terrain = request.forms.get("terrain_pieces")
    raw_players = request.forms.get("player_data")

    if not raw_grid or not raw_terrain or not raw_players:
        return bottle.HTTPResponse(status=400, body="Missing game_state or terrain_pieces")

    try:
        grid = json.loads(raw_grid)
        terrains = json.loads(raw_terrain)
        players = json.loads(raw_players)
    except json.JSONDecodeError:
        return bottle.HTTPResponse(status=400, body="Invalid JSON")

    with open(os.path.expanduser("~/public_html/grid.json"), "w") as f:
        json.dump(grid, f)

    with open(os.path.expanduser("~/public_html/terrain_pieces.json"), "w") as f:
        json.dump(terrains, f)

    with open(os.path.expanduser("~/public_html/player_data.json"), "w") as f:
        json.dump(players, f)

    print("Grid, terrain, and player data updated.")
    return bottle.HTTPResponse(
        status=200,
        body=json.dumps({"status": "success"}),
        headers={'Content-Type': 'application/json'}
    )


# -----------------------------------------------------------------

@bottle.route('/startPlayerTurn', method='POST')
def start_player_turn():
    try:
        current_player = request.forms.get("current_player")
        current_event = request.forms.get("current_event")
        callback_url = request.headers.get("CPEE-Callback")

        if not current_player or current_event is None:
            return bottle.HTTPResponse(
                status=400,
                body="Missing current_player, or current_event"
            )

        with open(os.path.expanduser("~/public_html/turn_data.json"), "w") as f:
            json.dump({
                "current_player": json.loads(current_player),
                "current_event": json.loads(current_event)
            }, f)

        with open(os.path.expanduser("~/public_html/callback.json"), "w") as f:
          json.dump({"url": callback_url}, f)

        print("Turn data received and saved.")

        return bottle.HTTPResponse(
            status=200,
            body=json.dumps({"status": "waiting for player input"}),
            headers={
                'Content-Type': 'application/json',
                'CPEE-CALLBACK': 'true'
            }
        )

    except Exception as e:
        return bottle.HTTPResponse(status=500, body=str(e))

@bottle.route('/finishPlayerTurn', method='POST')
def finish_turn():
    try:
        data = request.json
        current_player = data.get("current_player")
        callback_url = data.get("callback_url")

        if not current_player or not callback_url:
            return bottle.HTTPResponse(status=400, body="Missing current_player or callback_url")

        # Send data to CPEE
        import requests
        headers = {
            "Content-Type": "application/json",
        }

        payload = {
            "current_player": current_player,
        }

        response = requests.put(callback_url, json=payload, headers=headers)

        if response.status_code == 200:
            files_to_delete = [
                "~/public_html/callback.json",
                "~/public_html/turn_data.json",
                "~/public_html/grid.json",
                "~/public_html/player_data.json",
                "~/public_html/terrain_pieces.json",
            ]
            for f in files_to_delete:
                path = os.path.expanduser(f)
                if os.path.exists(path):
                    os.remove(path)

            return {"status": "Turn sent to CPEE"}
        else:
            return bottle.HTTPResponse(status=500, body=f"CPEE Error: {response.text}")

    except Exception as e:
        return bottle.HTTPResponse(status=500, body=str(e))

# -----------------------------------------------------------------

@bottle.route('/end', method='POST')
def ending_message():
    raw_players = request.forms.get("player_data")
    player_data = json.loads(raw_players)

    if not player_data:
        message = "You all fell victim to the Dungeon of Doom! Better luck next time..."
    else:
        names = [player["id"].capitalize() for player in player_data]
        message = f"{', '.join(names)} — Congratulations. You have escaped the Dungeon of Doom!"

    print(message)
  
    return bottle.HTTPResponse(
        status=200,
        body=json.dumps({"message": message}),
        headers={'Content-Type': 'application/json'}
    )

# -----------------------------------------------------------------

if __name__ == '__main__':
        bottle.run(host='::', port=5103)

