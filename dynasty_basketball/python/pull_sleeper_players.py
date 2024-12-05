import requests
import pandas as pd
import json

res = requests.get("https://api.sleeper.app/v1/players/nba")

data = res.json()

with open("./players.json", "w") as file:
    file.write(json.dumps(data, indent = 4))