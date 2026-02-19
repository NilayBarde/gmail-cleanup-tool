import gmail_service
import sys

try:
    print("Attempting to fetch 20 emails...")
    emails = gmail_service.fetch_recent_emails(limit=20)
    print(f"Successfully fetched {len(emails)} emails.")
    for email in emails[:3]:
        print(f" - {email['subject']} ({email['sender']})")
    sys.exit(0)
except Exception as e:
    print(f"Verification failed: {e}")
    sys.exit(1)
