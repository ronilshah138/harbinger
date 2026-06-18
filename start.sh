#!/bin/bash

# Get the directory of the script and cd into it
cd "$(dirname "$0")"

# Exit on error for setup steps
set -e

echo "Starting Harbinger..."

# 1. Setup Backend
echo "======================================"
echo "Setting up Backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    /usr/bin/python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Install requirements
echo "Installing Python requirements..."
pip install -r requirements.txt

cd ..

# 2. Setup Frontend
echo "======================================"
echo "Setting up Frontend..."
cd frontend

# Install dependencies
echo "Installing npm requirements..."
npm install

cd ..

# 3. Launch Services
echo "======================================"
echo "Launching Services..."

set +e

cleanup() {
    echo ""
    echo "Shutting down Harbinger..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start Backend
cd backend
source .venv/bin/activate
echo "Starting FastAPI backend on http://localhost:8000..."
uvicorn app.main:app --reload &
BACKEND_PID=$!
cd ..

# Start Frontend
cd frontend
echo "Starting React frontend on http://localhost:5173..."
npm run dev &
FRONTEND_PID=$!
cd ..

echo "======================================"
echo "Harbinger is running!"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo "Press Ctrl+C to stop everything."
echo "======================================"

wait