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
with open("./output.json", "r") as json_file:
    swapped_data = json.load(json_file)

# Normalize keys in JSON for matching
swapped_data_normalized = {clean_name(key): value for key, value in swapped_data.items()}

# Load the CSV data
csv_data = pd.read_csv("./value.csv")

# Normalize names in the CSV and map them to the normalized swapped data
csv_data["original_key"] = csv_data["Name"].apply(clean_name).map(swapped_data_normalized)

# Identify unmatched names
unmatched_names = csv_data[csv_data["original_key"].isna()]["Name"]

# Print unmatched names
if unmatched_names.empty:
    print("All names in the CSV have a match in the JSON data.")
else:
    print("The following names do not have a match in the JSON data:")
    print(unmatched_names.to_list())

# Save the merged data to a new CSV
csv_data.to_csv("./merged.csv", index=False)
print("Merged data saved to merged.csv")
