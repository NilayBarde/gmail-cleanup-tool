from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import auth

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Gmail Cleanup Tool API"}

@app.get("/api/auth/login")
def login():
    try:
        creds = auth.get_credentials()
        return {"authenticated": True, "email": "User authenticated"} # In a real app we might decode the token to get email
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/logout")
def logout():
    success = auth.logout()
    return {"success": success}

@app.get("/api/auth/status")
def auth_status():
    if auth.os.path.exists(auth.TOKEN_FILE):
         return {"authenticated": True}
    return {"authenticated": False}

import gmail_service
import analyzer
from pydantic import BaseModel
from typing import List

@app.get("/api/emails/analyze")
def analyze_emails(limit: int = 200):
    try:
        emails = gmail_service.fetch_recent_emails(limit=limit)
        stats = analyzer.analyze_senders(emails)
        return {"total_emails": len(emails), "senders": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/emails/ids")
def get_email_ids(limit: int = 500):
    try:
        ids = gmail_service.fetch_message_ids(limit=limit)
        return {"ids": ids, "count": len(ids)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class BatchDetailsRequest(BaseModel):
    ids: List[str]

@app.post("/api/emails/batch")
def get_email_details(request: BatchDetailsRequest):
    try:
        emails = gmail_service.fetch_email_details_by_ids(request.ids)
        return emails
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class DeleteRequest(BaseModel):
    ids: List[str]

@app.post("/api/emails/delete")
def delete_emails(request: DeleteRequest):
    try:
        success = gmail_service.batch_delete_emails(request.ids)
        if not success:
             raise HTTPException(status_code=500, detail="Failed to delete emails")
        return {"success": True, "count": len(request.ids)}
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

import unsubscribe_helper

class UnsubscribeRequest(BaseModel):
    unsubscribe_link: str

@app.post("/api/emails/unsubscribe")
def unsubscribe_email(request: UnsubscribeRequest):
    # The frontend will send the raw List-Unsubscribe header value
    links = unsubscribe_helper.parse_list_unsubscribe(request.unsubscribe_link)
    if not links:
        raise HTTPException(status_code=400, detail="No unsubscribe headers found")
        
    service = gmail_service.get_gmail_service()
    result = unsubscribe_helper.unsubscribe_from_sender(service, links)
    
    return result



