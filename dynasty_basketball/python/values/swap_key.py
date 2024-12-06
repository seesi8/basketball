import json

# Load the JSON file
with open('./players.json', 'r') as file:
    players_data = json.load(file)

# Transform the data
transformed_data = {
    player_info["full_name"]: {
        "original_key": player_id,
        **player_info
    }
    for player_id, player_info in players_data.items()
    if "full_name" in player_info  # Ensure the full_name key exists
}


with open("adjusted_players.json", "w") as file:
    # Output the result
    file.write(json.dumps(transformed_data, indent=4))
