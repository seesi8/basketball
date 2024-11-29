from bs4 import BeautifulSoup
import math
import json
import pandas as pd

def parse(html_content):
    # Parse the HTML content
    soup = BeautifulSoup(html_content, "html.parser")

    # Extract rank
    rank = float(soup.find("span").text.strip()[1:])

    # Extract name
    name = soup.find("td", class_="dynasty d-none d-md-table-cell col-md-2").text.strip().split('\n')[0]

    # Extract age
    def contains_tag(text):
        if text:
            try:
                text = text.text
                return True
            except Exception as e:
                return False
    
    age = soup.find_all("td", class_="dynasty d-none d-md-table-cell col", string=contains_tag)[0].text.strip()    

    # Extract team
    team = soup.find_all("td", class_="dynasty d-none d-md-table-cell col", string=contains_tag)[1].text.strip()    

    # Extract positions
    positions = soup.find_all("td", class_="dynasty d-none d-md-table-cell col", string=contains_tag)[2].text.strip()    

    # Extract performance metrics
    metrics = [kbd.text.strip() for kbd in soup.find_all("kbd")]

    # Organize extracted data into a dictionary
    player_data = {
        "Rank": rank,
        "Name": name,
        "Age": age,
        "Team": team,
        "Positions": positions,
    }
    
    return player_data

with open("./html.html") as file:
    data  = file.read()
    
data = data.split('<table class="table table-sm table-bordered table-striped table--statistics">')[1].split("</table>")[0]
data = data.split("<tr>")

players = []

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
    

for i, player in enumerate(data):
    try:
        players.append(parse(player))
    except Exception as e:
        pass
    
for i, player in enumerate(players):
    value = rank_to_value(player["Rank"])
    players[i]["Value"] = value
    
df = pd.json_normalize(players)
df.to_csv("./value.csv")