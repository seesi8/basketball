from io import StringIO
import requests
from bs4 import BeautifulSoup
import pandas as pd
import os
import json
from unidecode import unidecode
import re
import math

def clean_name(name):
    """Clean the name by normalizing special characters and removing suffixes."""
    if not name or type(name) != str:
        return None

    # Removing accents and diacritics (simplified normalization)
    name = unidecode(name)  # Remove special characters
    # Remove common suffixes like III, II, Jr., Sr., etc. (case insensitive)
    name = re.sub(r"(III|II|Jr\.?|Sr\.?)$", "", name, flags=re.IGNORECASE).strip()

    special = {
        "Alex Sarr": "Alexandre Sarr",
        "Nic Claxton": "Nicolas Claxton",
        "Tristan da Silva": "Tristan Da Silva",
        "Ricky Council": "Ricky Council IV",
        "Nikola Durisic": "Nikola Djurisic",
        "E.J. Liddell": "EJ Liddell",
        "Ronald Holland": "Ron Holland"
    }

    if name in special:
        return special[name]

    return name


def fetch_keeper():
    # Fetch the webpage content
    url = "https://hashtagbasketball.com/keeper"
    file = "./keeper.html"

    if os.path.exists(file):
        with open(file, "r") as oFile:
            html = oFile.read()
    else:
        response = requests.get(url)
        html = response.text
        with open(file, "w") as oFile:
            oFile.write(html)

    # Parse the HTML content
    soup = BeautifulSoup(html, "html.parser")

    # Find all tables in the HTML
    tables = soup.find_all("table")

    # Extract data from the first table as an example
    if tables:
        # Convert the first table into a DataFrame
        df = pd.read_html(StringIO(str(tables[0])))[0]

        # Display the DataFrame to the user
    else:
        "No tables found on the webpage."

    return df


def fetch_sleeper():
    # Fetch the webpage content
    url = "https://api.sleeper.app/v1/players/nba"
    file = "./sleeper.json"

    if os.path.exists(file):
        with open(file, "r") as oFile:
            json_data = oFile.read()
    else:
        response = requests.get(url)
        json_data = json.dumps(response.json(), indent=4)
        with open(file, "w") as oFile:
            oFile.write(json_data)

    # Convert the first table into a DataFrame
    json_data = json.loads(json_data)
    df = pd.DataFrame.from_dict(json_data, orient="index").reset_index()
    df.rename(columns={"index": "original_key"}, inplace=True)

    # Display the DataFrame to the user
    return df

import requests
import pandas as pd

def get_exp(item):
    if type(item) == str:
        item = json.loads(item)
    if type(item) == dict:
        item = item.get("years")
    if type(item) == float:
        return item
    
    if item:
        return item
    else:
        return 0

def fetch_espn():
    # Fetch the webpage content
    url = 'https://sports.core.api.espn.com/v3/sports/basketball/nba/athletes?limit=18000'
    file = "./espn.json"

    if os.path.exists(file):
        with open(file, "r") as oFile:
            json_data = oFile.read()
    else:
        response = requests.get(url)
        json_data = json.dumps(response.json()['items'], indent=4)
        with open(file, "w") as oFile:
            oFile.write(json_data)

    # Convert the first table into a DataFrame
    json_data = json.loads(json_data)
    df = pd.DataFrame(json_data).dropna(subset='firstName')
    df = df[['id', 'fullName', "experience"]].dropna(subset=['id', 'fullName'])
    df['experience'] = df["experience"].apply(get_exp).fillna(0)

    # Display the DataFrame to the user
    return df

def rank_to_value(rank):
    x = rank
    c = 13568.4033
    d = 2158.01294
    m = -1.92
    b = 10000
    k = 5.25001
    if x > k:
        y = c - d * math.log(x)
    else:
        y = m * x +b
        
    if y < 0:
        y= 0
    return y

df_keeper = fetch_keeper()
df_sleeper = fetch_sleeper()
df_espn = fetch_espn()

df_keeper["Name"] = df_keeper["PLAYER"].apply(clean_name)
df_sleeper["Name"] = df_sleeper["full_name"].apply(clean_name)
df_espn["Name"] = df_espn["fullName"].apply(clean_name)
df_merged = pd.merge(df_keeper, df_sleeper, how="left", on=["Name"])
df_merged.rename(
    columns={"TEAM": "Team", "AGE": "Age", "VALUE": "Value", "POS": "Positions"},
    inplace=True,
)
df_merged = pd.merge(df_merged, df_espn, how="left", on=["Name"])
df_merged["Value"] = df_merged["#"].apply(rank_to_value)


df_rookies = df_merged[df_merged["experience"] < 1][["Value", "experience"]]
df_firsts = df_rookies[0:10]
df_seconds = df_rookies[10:20]
first_value = df_firsts["Value"].mean()
second_value = df_seconds["Value"].mean()

for i in range(2023,2029):
    first_round_pick = {
        "#": 1,
        "PLAYER": f'{i} Round 1',
        "Team": "NBA",
        "Positions": "P",  # Placeholder for 'Pick'
        "Age": 0,  # Default value for age
        "Value": first_value,  # High value for the top pick
        "Name": f'{i} Round 1',
        "original_key": f'{i}rd1',
        "rotowire_id": None,
        "injury_notes": "",
        "swish_id": None,
        "stats_id": None,
        "news_updated": 0,
        "birth_state": "",
        "gsis_id": None,
        "active": False,  # Not active yet
        "age": 0,
        "opta_id": None,
        "search_first_name": "round",
        "sport": "nba",
        "number": 1.0,  # First pick
        "metadata": {},
        "competitions": [],
        "team_abbr": "NBA",
        "practice_participation": "",
        "high_school": "",
        "height": 0,
        "status": "DRAFT",
        "search_last_name": "pick1",
        "birth_country": "",
        "search_rank": 1.0,
        "college": "",
        "team_changed_at": "2025-01-01",
        "oddsjam_id": None,
        "yahoo_id": None,
        "pandascore_id": None,
        "depth_chart_order": 0,
        "injury_body_part": "",
        "first_name": "Round 1",
        "player_id": None,
        "rotoworld_id": None,
        "last_name": "Pick 1",
        "fantasy_positions": ["PICK"],
        "birth_city": "",
        "injury_status": "",
        "search_full_name": f'{i} Round 1',
        "injury_start_date": "",
        "years_exp": 0.0,
        "position": "P",
        "hashtag": "#Round1Pick1-NBA",
        "full_name": f'{i} Round 1',
        "fantasy_data_id": None,
        "birth_date": "2025-01-01",
        "espn_id": None,
        "weight": 0,
        "sportradar_id": None,
        "practice_description": "",
        "team": "NBA",
        "depth_chart_position": "P",
        "id": None,
        "fullName": f'{i} Round 1'
    }
    
    second_round_pick = {
        "#": 1,
        "PLAYER": f'{i} Round 2',
        "Team": "NBA",
        "Positions": "P",  # Placeholder for 'Pick'
        "Age": 0,  # Default value for age
        "Value": second_value,  # High value for the top pick
        "Name": f'{i} Round 2',
        "original_key": f'{i}rd2',
        "rotowire_id": None,
        "injury_notes": "",
        "swish_id": None,
        "stats_id": None,
        "news_updated": 0,
        "birth_state": "",
        "gsis_id": None,
        "active": False,  # Not active yet
        "age": 0,
        "opta_id": None,
        "search_first_name": "round",
        "sport": "nba",
        "number": 1.0,  # First pick
        "metadata": {},
        "competitions": [],
        "team_abbr": "NBA",
        "practice_participation": "",
        "high_school": "",
        "height": 0,
        "status": "DRAFT",
        "search_last_name": "pick1",
        "birth_country": "",
        "search_rank": 1.0,
        "college": "",
        "team_changed_at": "2025-01-01",
        "oddsjam_id": None,
        "yahoo_id": None,
        "pandascore_id": None,
        "depth_chart_order": 0,
        "injury_body_part": "",
        "first_name": "Round 2",
        "player_id": None,
        "rotoworld_id": None,
        "last_name": "Pick 1",
        "fantasy_positions": ["PICK"],
        "birth_city": "",
        "injury_status": "",
        "search_full_name": f'{i} Round 2',
        "injury_start_date": "",
        "years_exp": 0.0,
        "position": "P",
        "hashtag": "#Round2Pick1-NBA",
        "full_name": f'{i} Round 2',
        "fantasy_data_id": None,
        "birth_date": "2025-01-01",
        "espn_id": None,
        "weight": 0,
        "sportradar_id": None,
        "practice_description": "",
        "team": "NBA",
        "depth_chart_position": "P",
        "id": None,
        "fullName": f'{i} Round 2'
    }
    
    new_rows_df = pd.DataFrame([first_round_pick, second_round_pick])
    df_merged = pd.concat([df_merged, new_rows_df], ignore_index=True).reset_index(drop=True)

df_merged.sort_values(by=["Value"], inplace=True, ascending=False)
df_merged = df_merged.drop(columns=["#"]).reset_index(drop=True).reset_index()
df_merged.rename(columns={"index": "#"}, inplace=True)

df_merged.to_csv("./players.csv", index=False)
