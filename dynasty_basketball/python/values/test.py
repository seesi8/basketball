import json
from unidecode import unidecode

# Load the JSON file
input_file = "swapped.json"  # Replace with your file name
output_file = "output.json"  # Output file with converted characters

with open(input_file, "r", encoding="utf-8") as file:
    data = json.load(file)

# Convert all keys and values in the dictionary
converted_data = {unidecode(key): unidecode(value) for key, value in data.items()}

# Save the converted data back to a new file
with open(output_file, "w", encoding="utf-8") as file:
    json.dump(converted_data, file, ensure_ascii=False, indent=4)

print(f"Converted data saved to {output_file}")
