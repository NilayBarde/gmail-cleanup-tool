from collections import Counter

def analyze_senders(emails):
    """
    Aggregates emails by sender and returns sorted stats.
    """
    sender_counts = Counter()
    sender_details = {}

    for email in emails:
        sender_email = email['sender_email'].lower()
        sender_counts[sender_email] += 1
        
        if sender_email not in sender_details:
            sender_details[sender_email] = {
                'name': email['sender'],
                'email': sender_email,
                'count': 0,
                'example_subjects': [],
                'ids': [],
                'has_unsubscribe': bool(email['unsubscribe_link']),
                'unsubscribe_link': email['unsubscribe_link'] 
            }
        
        # If we encounter an unsubscribe link later effectively, we should add it if it was missing
        if not sender_details[sender_email]['unsubscribe_link'] and email['unsubscribe_link']:
            sender_details[sender_email]['unsubscribe_link'] = email['unsubscribe_link']
            sender_details[sender_email]['has_unsubscribe'] = True
        
        sender_details[sender_email]['count'] += 1
        sender_details[sender_email]['ids'].append(email['id'])
        if len(sender_details[sender_email]['example_subjects']) < 3:
             sender_details[sender_email]['example_subjects'].append(email['subject'])

    # Convert to list and sort
    sorted_senders = sorted(sender_details.values(), key=lambda x: x['count'], reverse=True)
    
    return sorted_senders
