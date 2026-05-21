import os
import json
import firebase_admin
from firebase_admin import credentials
from dotenv import load_dotenv

load_dotenv() 

firebase_creds_raw = os.getenv("FIREBASE_SERVICE_ACCOUNT")
cred = None

if firebase_creds_raw:
    try:
        firebase_creds = json.loads(firebase_creds_raw)
        cred = firebase_admin.credentials.Certificate(firebase_creds)
    except Exception as e:
        print(f"Error parsing FIREBASE_SERVICE_ACCOUNT env var: {e}")
        # Only raise if we are running in an environment that strictly requires it
        # Otherwise, print a warning to avoid crashing the whole startup flow
        if os.environ.get("REQUIRE_FIREBASE"):
            raise e
else:
    # Try fallback to local key file ONLY if running locally (not on Vercel)
    if not os.environ.get("VERCEL"):
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        key_path = os.path.join(BASE_DIR, "firebase_service_key.json")
        if os.path.exists(key_path):
            try:
                cred = firebase_admin.credentials.Certificate(key_path)
            except Exception as e:
                print(f"Error loading local firebase_service_key.json: {e}")
        else:
            print("WARNING: firebase_service_key.json not found locally.")
    else:
        print("WARNING: Running on Vercel without FIREBASE_SERVICE_ACCOUNT env var defined.")

if cred:
    try:
        # Check if already initialized to avoid ValueError: The default Firebase app already exists.
        if not firebase_admin._apps:
            firebase_app = firebase_admin.initialize_app(cred)
        else:
            firebase_app = firebase_admin.get_app()
    except Exception as e:
        print(f"Error initializing Firebase App: {e}")
        firebase_app = None
else:
    print("WARNING: Firebase Admin could not be initialized due to missing credentials.")
    firebase_app = None






