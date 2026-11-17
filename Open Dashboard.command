#!/bin/bash
set -u

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
DASHBOARD_URL="http://127.0.0.1:4200"
API_HEALTH_URL="http://127.0.0.1:5100/api/health"
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  if [ -n "$FRONTEND_PID" ]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  if [ -n "$BACKEND_PID" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Install Node.js and npm before opening the dashboard."
  exit 1
fi

if [ ! -d "$PROJECT_DIR/backend/node_modules" ]; then
  echo "Installing backend dependencies..."
  (cd "$PROJECT_DIR/backend" && npm install) || exit 1
fi

if [ ! -d "$PROJECT_DIR/frontend/node_modules" ]; then
  echo "Installing frontend dependencies..."
  (cd "$PROJECT_DIR/frontend" && npm install) || exit 1
fi

if [ ! -f "$PROJECT_DIR/backend/.env" ]; then
  cp "$PROJECT_DIR/backend/.env.example" "$PROJECT_DIR/backend/.env"
  echo "Created backend/.env from the example. Check its MongoDB connection settings."
fi

if ! curl -fsS "$API_HEALTH_URL" >/dev/null 2>&1; then
  if lsof -nP -iTCP:5100 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port 5100 is busy, but the Pocketwise API did not respond there."
    exit 1
  fi
  echo "Starting the finance API..."
  (cd "$PROJECT_DIR/backend" && exec node src/server.js) &
  BACKEND_PID=$!
  API_READY=0
  for attempt in {1..60}; do
    if curl -fsS "$API_HEALTH_URL" >/dev/null 2>&1; then
      API_READY=1
      break
    fi
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
      echo "The API stopped during startup. Check MongoDB and backend/.env."
      exit 1
    fi
    sleep 1
  done
  if [ "$API_READY" -ne 1 ]; then
    echo "The API did not start. Check MongoDB and backend/.env."
    exit 1
  fi
fi

if ! curl -fsS "$DASHBOARD_URL" 2>/dev/null | grep -q '<app-root'; then
  if lsof -nP -i4TCP:4200 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port 4200 is busy, but the dashboard did not respond there."
    exit 1
  fi
  echo "Starting the dashboard..."
  (cd "$PROJECT_DIR/frontend" && exec ./node_modules/.bin/ng serve --host 0.0.0.0) &
  FRONTEND_PID=$!
  DASHBOARD_READY=0
  for attempt in {1..90}; do
    if curl -fsS "$DASHBOARD_URL" 2>/dev/null | grep -q '<app-root'; then
      DASHBOARD_READY=1
      break
    fi
    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
      echo "The dashboard stopped during startup. Check the frontend terminal output."
      exit 1
    fi
    sleep 1
  done
  if [ "$DASHBOARD_READY" -ne 1 ]; then
    echo "The dashboard did not start on port 4200."
    exit 1
  fi
fi

echo "Opening Pocketwise in your default browser: $DASHBOARD_URL"
open "$DASHBOARD_URL"

if [ -n "$BACKEND_PID" ] || [ -n "$FRONTEND_PID" ]; then
  echo "Keep this Terminal window open while using Pocketwise. Press Control+C to stop the servers."
  while true; do
    if [ -n "$BACKEND_PID" ] && ! kill -0 "$BACKEND_PID" 2>/dev/null; then
      echo "The finance API stopped."
      exit 1
    fi
    if [ -n "$FRONTEND_PID" ] && ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
      echo "The dashboard server stopped."
      exit 1
    fi
    sleep 2
  done
fi
