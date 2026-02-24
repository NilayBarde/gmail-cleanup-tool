# Technical Writeup: Building the Gmail Cleanup Tool
## Overview
This document details the technical implementation, challenges, and design decisions made while building the Gmail Cleanup Tool. The goal was to create a local, privacy-first alternative to services like Unroll.me, capable of handling large inboxes without persistent server-side storage.

## Key Design Decisions

### 1. Local-First Architecture
To ensure privacy, the tool is designed to run entirely on the user's machine.
-   **Backend**: Python (FastAPI) acts as a proxy to the Gmail API, handling OAuth token storage (local `token.json`) and heavy API logic.
-   **Frontend**: React (Vite) runs in the browser, storing transient data in memory. No database is used; analysis happens in real-time or matches the session lifespan.

### 2. Client-Side Analysis
Initially, analysis was planned for the backend. However, to provide immediate feedback, we moved the aggregation logic to the frontend (`Dashboard.jsx`).
-   **Benefit**: The UI can render a "progress bar" and show partial results (e.g., "Top Senders so far") while the backend continues fetching.
-   **Trade-off**: Heavier browser memory usage for extremely large inboxes (50k+ emails), handled by batched state updates.

## Technical Challenges & Solutions

### 1. Gmail API Rate Limiting (403 Errors)
**Problem**: The `users.messages.get` endpoint consumes **5 quota units** per call. The generic user limit is **15,000 units per minute**.
-   Naive approach: 50 concurrent requests * 60 seconds = potentially 150,000+ units/min (10x limit).

**Solution**:
We implemented a **Token Bucket-style throttling** via Batching + Sleep:
-   **Batch Size**: 40 requests per batch (Cost: 40 * 5 = 200 units).
-   **Delay**: 1.0 second between batches.
-   **Math**: 
    -   Max Throughput: ~50-60 batches/minute.
    -   Max Usage: 60 * 200 = **12,000 units/minute**.
    -   **Result**: This uses ~80% of the available quota, leaving a safe buffer for other operations (like listing or deleting) while maximizing speed.

We also added **Exponential Backoff**:
-   If a 403 occurs despite our throttling, we catch the exception and retry with `(2^retry_attempt) + jitter` delay.

### 2. Request Size Limits (400 Errors)
**Problem**: The `batchDelete` endpoint accepts a list of IDs, but sending too many (e.g., 3,000) at once causes a `400 Bad Request` ("Too many message ids").

**Solution**:
We implemented **Chunking** in the deletion logic:
```python
chunk_size = 1000
for i in range(0, len(message_ids), chunk_size):
    chunk = message_ids[i:i + chunk_size]
    service.users().messages().batchDelete(body={'ids': chunk}).execute()
```
This ensures we stay well within API limits.

### 3. List-Unsubscribe Header Parsing
**Problem**: Unsubscribing isn't just one API call. Senders use different methods (mailto, HTTP links) in the `List-Unsubscribe` header.

**Solution**:
The backend parses this header (RFC 2369) to extract:
-   **HTTPS Links**: Returned to the frontend to be opened in a new tab (safest method).
-   **Mailto**: Not yet fully automated, but identifying them allows us to filter "unsubscribable" emails.

## Future Improvements

-   **Mailto Unsubscribe**: Automate sending the "unsubscribe" email for `mailto:` headers coverage.
-   **Filter by Date**: Allow analyzing only emails older than X months.
-   **Smart Labels**: Group by "Newsletter," "Notification," etc., using Gmail's existing label/category data.
