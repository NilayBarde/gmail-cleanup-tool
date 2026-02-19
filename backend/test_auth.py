import auth
import sys

def test_auth():
    print("Attempting to get credentials...")
    try:
        creds = auth.get_credentials()
        print("Successfully retrieved credentials.")
        if creds and creds.valid:
            print("Credentials are valid.")
        else:
            print("Credentials are invalid or expired.")
            sys.exit(1)
            
        from googleapiclient.discovery import build
        service = build('gmail', 'v1', credentials=creds)
        results = service.users().labels().list(userId='me').execute()
        labels = results.get('labels', [])
        print(f"Authentication successful! Found {len(labels)} labels.")
        
    except Exception as e:
        print(f"Authentication failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_auth()
