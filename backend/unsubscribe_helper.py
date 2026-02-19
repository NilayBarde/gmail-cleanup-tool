import re
import base64
from email.mime.text import MIMEText
import base64

def parse_list_unsubscribe(header_value):
    """
    Parses the List-Unsubscribe header.
    Returns a dict with 'mailto' and 'url' if found.
    Header format example: <mailto:unsubscribe@example.com?subject=unsub>, <http://example.com/unsub>
    """
    if not header_value:
        return None
        
    links = {}
    
    # improved regex to capture distinct <> groups
    matches = re.findall(r'<([^>]+)>', header_value)
    
    for match in matches:
        if match.startswith('mailto:'):
            links['mailto'] = match
        elif match.startswith('http'):
            links['url'] = match
            
    return links

def unsubscribe_from_sender(service, unsubscribe_links):
    """
    Attempts to unsubscribe using the available links.
    Prioritizes mailto since it can be done API-side without user navigation.
    """
    if 'mailto' in unsubscribe_links:
        mailto_link = unsubscribe_links['mailto']
        # Parse mailto:addr?subject=subj
        # minimal parsing
        email_part = mailto_link.replace('mailto:', '').split('?')[0]
        
        # Prepare message
        message = MIMEText('')
        message['to'] = email_part
        message['subject'] = "Unsubscribe" # Fallback
        
        # Check for subject in params
        if 'subject=' in mailto_link:
            # Extract subject
            import urllib.parse
            parsed = urllib.parse.urlparse(mailto_link)
            query = urllib.parse.parse_qs(parsed.query)
            if 'subject' in query:
                message['subject'] = query['subject'][0]
        
        create_message = {'raw': base64.urlsafe_b64encode(message.as_bytes()).decode()}
        
        try:
            service.users().messages().send(userId='me', body=create_message).execute()
            return {"success": True, "method": "mailto", "detail": f"Sent email to {email_part}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
            
    elif 'url' in unsubscribe_links:
        # We can't click the link for them easily without a browser, 
        # but we can return it for the frontend to open.
        return {"success": True, "method": "url", "link": unsubscribe_links['url'], "detail": "User must visit link"}
        
    return {"success": False, "error": "No valid unsubscribe links found"}
