import json
import pandas as pd
import re
from unidecode import unidecode
# Define the clean_name function
def clean_name(name):
    """Clean the name by normalizing special characters and removing suffixes."""
    if not name:
        return None
    # Removing accents and diacritics (simplified normalization)
    name = unidecode( name)  # Remove special characters
    # Remove common suffixes like III, II, Jr., Sr., etc. (case insensitive)
    name = re.sub(r"(III|II|Jr\.?|Sr\.?)$", "", name, flags=re.IGNORECASE).strip()
    return name

# Load the JSON data
with open('./adjusted_players.json', 'r') as f:
    json_data = json.load(f)

# Initialize a list to store cleaned data
cleaned_data = []

# Process and clean the JSON data
for key, details in json_data.items():
    cleaned_key = clean_name(key)  # Clean the key
    
    # Prepare a dictionary for each entry with the required fields
    entry = {
        "Name": cleaned_key,
        "player_id": details.get("player_id"),
        "sport": details.get("sport"),
        "number": details.get("number"),
        "active": details.get("active"),
        "depth_chart_position": details.get("depth_chart_position"),
        "age": details.get("age"),
        "birth_day": details.get("birth_date"),
        "status": details.get("status"),
        "years_exp": details.get("years_exp"),
        "depth_chart_order": details.get("depth_chart_order"),
        "height": details.get("height"),
        "weight": details.get("weight"),
        "college": details.get("college"),
        "team": details.get("team"),
        "position": details.get("position")
    }
    cleaned_data.append(entry)

# Convert the cleaned data to a DataFrame
columns = [
    "Name", "player_id", "sport", "number", "active", "depth_chart_position", 
    "age", "birth_day", "status", "birth_city", "years_exp", 
    "depth_chart_order", "height", "weight", "college", "team", "position"
]
df = pd.DataFrame(cleaned_data, columns=columns)

# Save the DataFrame to a CSV file
output_path = './cleaned_adjusted_players.csv'
df.to_csv(output_path, index=False)

print(f"Cleaned data saved to {output_path}")
