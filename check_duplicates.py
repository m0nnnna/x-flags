import json
from collections import defaultdict
import sys

# Change this if your file is named differently
JSON_FILE = "flags.json"

def load_json():
    try:
        with open(JSON_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        print(f"Loaded {len(data)} entries from {JSON_FILE}")
        return data
    except FileNotFoundError:
        print(f"Error: {JSON_FILE} not found!")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON → {e}")
        sys.exit(1)

def find_duplicates(data):
    seen = defaultdict(list)
    for username, code in data.items():
        username_clean = username.strip().lower()
        code_clean = code.strip().upper()
        seen[username_clean].append((code_clean, username))  # keep original username for display
    duplicates = {user: codes for user, codes in seen.items() if len(codes) > 1}
    return duplicates

def main():
    data = load_json()
    duplicates = find_duplicates(data)

    if not duplicates:
        print("No duplicates found! Your flags.json is clean.")
        return

    print(f"\nFOUND {len(duplicates)} duplicate usernames!\n")
    for user, entries in duplicates.items():
        print(f"Conflict → @{user}")
        for i, (code, orig_name) in enumerate(entries, 1):
            print(f"  {i}. {code}  (from: \"{orig_name}\")")
        print()

    choice = input("Remove duplicates automatically? (keeps first entry) [y/N]: ")
    if choice.lower() == 'y':
        clean_data = {}
        for username, code in data.items():
            username_clean = username.strip().lower()
            if username_clean not in clean_data:
                clean_data[username_clean] = {"code": code.strip().upper(), "original": username}

        final_data = {info["original"]: info["code"] for info in clean_data.values()}

        with open(JSON_FILE, "w", encoding="utf-8") as f:
            json.dump(final_data, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print(f"Fixed! Removed {len(duplicates)} conflicts → {len(final_data)} unique entries saved.")

if __name__ == "__main__":
    main()