from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import auth
import base64
import re
import time

def get_gmail_service():
    """Returns an authorized Gmail API service instance."""
    creds = auth.get_credentials()
    return build('gmail', 'v1', credentials=creds)

def fetch_message_ids(limit=500, q=None):
    """Fetches just the IDs of recent emails, handling pagination for >500."""
    service = get_gmail_service()
    try:
        messages = []
        next_page_token = None
        
        while limit == 0 or len(messages) < limit:
            # Calculate how many to fetch in this page (max 500)
            if limit > 0:
                remaining = limit - len(messages)
                fetch_size = min(remaining, 500)
            else:
                fetch_size = 500
            
            kwargs = {
                'userId': 'me', 
                'maxResults': fetch_size
            }
            if q:
                kwargs['q'] = q
            
            if next_page_token:
                kwargs['pageToken'] = next_page_token
            
            results = service.users().messages().list(**kwargs).execute()
            
            new_messages = results.get('messages', [])
            messages.extend(new_messages)
            
            next_page_token = results.get('nextPageToken')
            if not next_page_token or len(new_messages) == 0:
                break
                
        return [msg['id'] for msg in messages[:limit]]
    except HttpError as error:
        print(f'An error occurred fetching IDs: {error}')
        return []

def fetch_email_details_by_ids(message_ids):
    """Fetches details for a specific list of message IDs using batch requests and backoff."""
    service = get_gmail_service()
    if not message_ids:
        return []

    email_data = []
    chunk_size = 40
    fetched_messages = {}
    
    import random

    def execute_batch(ids_to_fetch, retry_attempt=0):
        if not ids_to_fetch or retry_attempt > 3:
            return

        batch_results = {}
        def callback(request_id, response, exception):
            if exception is None:
                batch_results[request_id] = {'success': True, 'data': response}
            else:
                batch_results[request_id] = {'success': False, 'error': exception}
        
        batch = service.new_batch_http_request()
        for mid in ids_to_fetch:
            batch.add(
                service.users().messages().get(userId='me', id=mid, format='metadata', metadataHeaders=['From', 'Subject', 'Date', 'List-Unsubscribe']),
                callback=callback,
                request_id=mid
            )
        
        try:
            batch.execute()
        except Exception as e:
            print(f"Batch execution failed: {e}")
            # If the entire batch fails (e.g. connection error), we might want to retry all
            time.sleep((2 ** retry_attempt) + random.random())
            execute_batch(ids_to_fetch, retry_attempt + 1)
            return

        # Process results from this batch
        failed_ids_rate_limit = []
        
        for mid in ids_to_fetch:
            if mid not in batch_results:
                 continue
            res = batch_results[mid]
            
            if res['success']:
                fetched_messages[mid] = res['data']
            else:
                error = res['error']
                # Check for rate limit error
                if isinstance(error, HttpError) and error.resp.status == 403:
                    print(f"Rate limit hit for {mid}. Queuing for retry.")
                    failed_ids_rate_limit.append(mid)
                else:
                    print(f"Permanent error fetching message {mid}: {error}")
        
        # Retry rate-limited items
        if failed_ids_rate_limit:
            wait_time = (2 ** (retry_attempt + 1)) + random.random()
            print(f"Retrying {len(failed_ids_rate_limit)} items after {wait_time:.2f}s...")
            time.sleep(wait_time)
            execute_batch(failed_ids_rate_limit, retry_attempt + 1)

    # Process main list in chunks
    for i in range(0, len(message_ids), chunk_size):
        chunk = message_ids[i:i + chunk_size]
        execute_batch(chunk)
        
        # Small courtesy sleep between main chunks to be nice to the API
        # Rate Limit Math: 
        # - Batch size: 40
        # - Cost per batch: 40 * 5 units = 200 units
        # - Sleep: 1.0s -> ~1 batch/sec (inc. network time) -> ~50-60 batches/min
        # - Total Cost: ~10,000-12,000 units/min (vs Limit of 15,000)
        if len(message_ids) > chunk_size:
             time.sleep(1.0)

    # Process into clean objects (same as before)
    for msg_id in message_ids:
        if msg_id in fetched_messages:
            data = fetched_messages[msg_id]
            payload = data.get('payload', {})
            headers = payload.get('headers', [])
            sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), '(No Subject)')
            date = next((h['value'] for h in headers if h['name'] == 'Date'), '')
            list_unsubscribe = next((h['value'] for h in headers if h['name'] == 'List-Unsubscribe'), None)

            # Simple email extraction
            try:
                if '<' in sender and '>' in sender:
                    sender_email = sender.split('<')[-1].strip('>')
                else:
                    # Fallback if no brackets
                    sender_email = sender.strip()
            except:
                sender_email = sender

            email_data.append({
                'id': msg_id,
                'sender': sender,
                'sender_email': sender_email,
                'subject': subject,
                'date': date,
                'unsubscribe_link': list_unsubscribe
            })
    
    return email_data

def fetch_recent_emails(limit=500):
    """Legacy wrapper for backward compatibility."""
    ids = fetch_message_ids(limit)
    return fetch_email_details_by_ids(ids)

def batch_delete_emails(message_ids):
    """Permanently deletes or trashes emails by ID, chunking to avoid limits."""
    service = get_gmail_service()
    chunk_size = 1000
    
    for i in range(0, len(message_ids), chunk_size):
        chunk = message_ids[i:i + chunk_size]
        try:
            service.users().messages().batchDelete(userId='me', body={'ids': chunk}).execute()
        except Exception as e:
            print(f"Error deleting chunk {i}: {e}")
            # Continue trying other chunks even if one fails
            continue
    
    return True
