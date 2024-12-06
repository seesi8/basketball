import requests
import pandas as pd

url = 'https://sports.core.api.espn.com/v3/sports/basketball/nba/athletes?limit=18000'
jsonData = requests.get(url).json()

players = pd.DataFrame(jsonData['items']).dropna(subset='firstName')
players = players[['id', 'fullName']].dropna()

print(players.to_csv("./ids.csv"))