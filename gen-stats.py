import json
from collections import Counter

# Input and output files
JSON_FILE = "flags.json"
OUTPUT_MD = "country_ranking.md"

# Load the JSON
with open(JSON_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

# Count occurrences of each country code
country_counts = Counter(data.values())

# Total number of users
total_users = sum(country_counts.values())

# Sort countries by count (descending), then by country code if tie
sorted_countries = sorted(
    country_counts.items(),
    key=lambda x: (-x[1], x[0])  # highest count first, then alphabetical
)

# Generate Markdown
with open(OUTPUT_MD, "w", encoding="utf-8") as f:
    f.write("# Twitter Users by Country\n\n")
    f.write(f"**Total users analyzed:** {total_users}\n\n")
    f.write("| Rank | Country Code | Users | Percentage |\n")
    f.write("|------|--------------|-------|------------|\n")

    for rank, (country, count) in enumerate(sorted_countries, start=1):
        percentage = (count / total_users) * 100
        f.write(f"| {rank:<4} | {country:<12} | {count:<5} | {percentage:6.2f}% |\n")

print(f"Markdown file generated: {OUTPUT_MD}")