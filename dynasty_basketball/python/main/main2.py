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
    name = unidecode(name)  # Remove special characters
    # Remove common suffixes like III, II, Jr., Sr., etc. (case insensitive)
    name = re.sub(r"(III|II|Jr\.?|Sr\.?)$", "", name, flags=re.IGNORECASE).strip()
    return name

# Define exceptions dictionary for name replacements
name_exceptions = {
    "Nicolas Claxton": "Nic Claxton",
    "Alexandre Sarr": "Alex Sarr",
    "Nikola Djurisic": "Nikola Durisic",
    "Aleksandar Vezenkov": "Sasha Vezenkov",
    "Lonnie Walker IV": "Lonnie Walker",
    "Ricky Council IV": "Ricky Council",
    "Ishmail Wainright": "Ish Wainright",
    "R.J. Hampton": "RJ Hampton",
    "EJ Liddell": "E.J. Liddell"
}

# Load the CSV files
cleaned_adjusted_players_df = pd.read_csv('players.csv')
value_df = pd.read_csv('ids.csv')

# Apply name exceptions to value_df
value_df['Name'] = value_df['Name'].replace(name_exceptions)

# Add 'cleaned_name' columns to both DataFrames
cleaned_adjusted_players_df['cleaned_name'] = cleaned_adjusted_players_df['Name'].apply(clean_name)
value_df['cleaned_name'] = value_df['Name'].apply(clean_name)

# Save intermediate DataFrame for debugging if necessary
cleaned_adjusted_players_df.to_csv("bannana2.csv", index=False)

# Merge the DataFrames using 'cleaned_name' and prioritize value.csv for conflicting columns
merged_df = pd.merge(
    cleaned_adjusted_players_df,
    value_df,
    on='cleaned_name',
    how='left',
)

# # Identify rows present in both DataFrames
# merged_df["both"] = merged_df["Name_y"].notna() & (merged_df["Name_y"] != "")

# # Drop unnecessary columns and rename as needed
merged_df.drop(["Unnamed: 0", "Name_y"], axis=1, inplace=True)
# merged_df.rename(columns={'Name_x': 'Name'}, inplace=True, errors='raise')

# Save the merged DataFrame to a new file
merged_df.to_csv('merged_output55.csv', index=False)
