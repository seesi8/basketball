import json
import pandas as pd
from unidecode import unidecode
import re

def clean_name(name):
    """Clean the name by normalizing special characters and removing suffixes."""
    name = unidecode(name)  # Normalize special characters
    # Remove common suffixes like III, II, Jr, Jr., Sr., etc. (case insensitive)
    name = re.sub(r"(III|II|Jr\.?|Sr\.?)$", "", name, flags=re.IGNORECASE).strip()
    return name

# Load the JSON data
with open("./cleaned_adjusted_players.json", "r") as json_file:
    swapped_data = json.load(json_file)

# Normalize keys in JSON for consistent matching
primary_data = {
    clean_name(key): {"original_key": key, "data": value} 
    for key, value in swapped_data.items()
}

# Convert the primary JSON dataset to a DataFrame
primary_df = pd.DataFrame([
    {"Cleaned Name": clean_name(name), **details}
    for name, details in primary_data.items()
])

# Load the CSV data
csv_data = pd.read_csv("./value.csv")

# Clean and normalize the names in the CSV
csv_data["Cleaned Name"] = csv_data["Name"].apply(clean_name)

# Merge JSON (primary) with CSV (secondary) data
merged_data = pd.merge(primary_df, csv_data, on="Cleaned Name", how="left")

# Identify unmatched rows from the JSON dataset
unmatched_in_json = primary_df[~primary_df["Cleaned Name"].isin(csv_data["Cleaned Name"])]

# Print unmatched entries
if unmatched_in_json.empty:
    print("All JSON entries have corresponding matches in the CSV.")
else:
    print("The following entries from the JSON data do not have matches in the CSV:")
    print(unmatched_in_json)

# Save the merged data to a new CSV
merged_data.to_csv("./merged_new.csv", index=False)
print("Merged data saved to merged_new.csv")
