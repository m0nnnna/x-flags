import json
import sys

JSON_FILE = "flags.json"  # Make sure this is in the same folder

def load_db():
    try:
        with open(JSON_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        print(f"Loaded {len(data)} accounts from {JSON_FILE}\n")
        return {k.strip().lower(): v.strip().upper() for k, v in data.items()}
    except FileNotFoundError:
        print(f"Error: {JSON_FILE} not found! Place it in the same folder.")
        sys.exit(1)
    except json.JSONDecodeError:
        print("Error: Invalid JSON in flags.json")
        sys.exit(1)

def main():
    db = load_db()

    if not db:
        print("No data loaded. Exiting.")
        return

    # Show available codes
    codes = sorted(set(db.values()))
    print("Available country/region codes:")
    print(" | ".join(codes))
    print()

    code = input("Enter country/region code to block (e.g. NG, IN, NA): ").strip().upper()

    if code not in codes:
        print(f"Code '{code}' not found. Try one from the list above.")
        return

    matches = [username for username, c in db.items() if c == code]
    count = len(matches)

    if count == 0:
        print(f"No accounts found with code {code}")
        return

    print(f"\nFound {count} accounts from {code}:\n")
    blocklist = "\n".join(sorted(matches))

    # Show preview
    preview = "\n".join(sorted(matches)[:20])
    if count > 20:
        preview += "\n... and " + str(count - 20) + " more"

    print(preview)
    print()

    # Save option
    save = input(f"Save blocklist to {code}_blocklist.txt? [Y/n]: ").strip().lower()
    if save != 'n':
        filename = f"{code}_blocklist.txt"
        with open(filename, "w", encoding="utf-8") as f:
            f.write(blocklist)
        print(f"Saved! → {filename}")
        print(f"Ready for RedBlock / BlockParty / LittleSnitch / etc.")
    else:
        print("Blocklist (copy-paste ready):")
        print("-" * 40)
        print(blocklist)
        print("-" * 40)

if __name__ == "__main__":
    main()