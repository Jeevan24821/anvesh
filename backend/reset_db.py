from seed import seed_database

if __name__ == "__main__":
    print("[SENTRIX] Performing explicit database reset and fresh seed...")
    seed_database(force_reset=True)
