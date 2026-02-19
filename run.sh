#!/bin/bash

# Kill any existing processes on ports 8000 and 5173
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Start Backend
echo "Starting Backend..."
cd backend
# Check if venv exists, if not just run python directly (assuming dependencies installed globally or in user site)
# But ideally we should have used a venv. accepted.
python3 -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Wait a bit
sleep 2

# Start Frontend
echo "Starting Frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "App running!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "Press CTRL+C to stop both."

trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT

wait
