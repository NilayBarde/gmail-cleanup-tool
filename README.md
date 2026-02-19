# Gmail Cleanup Tool

A powerful, local-first web application to visualize your inbox, identify top senders, and bulk-unsubscribe/delete emails. Built with React (Vite), FastAPI, and the Gmail API.

## Features

-   **Dashboard Visualization**: See a graph of your top email senders to identify clutter sources at a glance.
-   **Bulk Action**: Delete all emails from a specific sender with one click.
-   **Unsubscribe**: Automatically find and trigger unsubscribe links (RFC 2369).
-   **Incremental Loading**: Fetches emails in batches to show results immediately, capable of handling 10k+ emails.
-   **Rate Limit Handling**: Robust backend logic deals with Gmail API rate limits (403/429) using exponential backoff.
-   **Privacy Focused**: Runs entirely locally on your machine. Your data is not sent to any third-party servers.

## Tech Stack

-   **Frontend**: React, Vite, Tailwind CSS v4, Recharts
-   **Backend**: Python, FastAPI, Google Auth Library, Gmail API
-   **Authentication**: OAuth 2.0 (Google)

## Prerequisites

-   **Node.js** (v18+)
-   **Python** (v3.9+)
-   **Google Cloud Project**: You need to create a project and enable the Gmail API.

## Setup Guide

### 1. Google Cloud Configuration
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project (e.g., "Gmail Cleanup").
3.  Enable the **Gmail API**.
4.  Configure **OAuth Consent Screen** (User Type: External). Add your email as a "Test User".
5.  Create **OAuth Client ID** credentials (Application Type: Desktop App).
6.  Download the `credentials.json` file.

### 2. Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/YOUR_USERNAME/gmail-cleanup-tool.git
    cd gmail-cleanup-tool
    ```

2.  **Backend Setup**:
    -   Navigate to `backend/`:
        ```bash
        cd backend
        ```
    -   Create and activate a virtual environment:
        ```bash
        python3 -m venv venv
        source venv/bin/activate  # Windows: venv\Scripts\activate
        ```
    -   Install dependencies:
        ```bash
        pip install -r requirements.txt
        ```
    -   **Important**: Place your `credentials.json` file inside the `backend/` folder.

3.  **Frontend Setup**:
    -   Navigate to `frontend/`:
        ```bash
        cd ../frontend
        ```
    -   Install dependencies:
        ```bash
        npm install
        ```

## Usage

1.  **Start the Application**:
    -   From the root directory, you can use the helper script:
        ```bash
        ./run.sh
        ```
    -   Or run backend and frontend separately:
        -   Backend: `uvicorn main:app --reload` (port 8000)
        -   Frontend: `npm run dev` (port 5173)

2.  **Connect**:
    -   Open `http://localhost:5173`.
    -   Click "Connect with Gmail" to authenticate.

3.  **Analyze & Clean**:
    -   Set a fetch limit (e.g., 1000 or "Fetch All") and click "Start Analysis".
    -   Click on a bar in the chart to see details for that sender.
    -   Use the "Unsubscribe" or "Clean Up" buttons to manage your inbox.

## Project Structure

```
.
├── backend/
│   ├── gmail_service.py   # Gmail API interaction logic
│   ├── analyzer.py        # Data aggregation
│   ├── auth.py            # OAuth flow
│   └── main.py            # FastAPI endpoints
├── frontend/
│   ├── src/
│   │   ├── components/    # React components (Dashboard, SenderDetails)
│   │   └── api.js         # API wrapper
│   └── ...
└── run.sh                 # Startup script
```

## Troubleshooting

-   **"Backend not connected"**: Ensure `uvicorn` is running and you have `credentials.json` in the `backend/` folder.
-   **Authentication Loop**: If the window doesn't close after login, check your browser pop-up blocker or console logs.
-   **Rate Limits**: If fetching is slow, it's intentional to avoid hitting Gmail's 403 quote limits. The tool backs off automatically.
