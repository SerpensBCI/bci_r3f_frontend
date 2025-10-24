# Ping Pong Game

A 3D ping pong game built with React Three Fiber, controlled via WebSocket.

## Tech Stack

- **Frontend**: Vite + React 18
- **3D Engine**: Three.js + React Three Fiber
- **Physics**: React Three Cannon + Rapier
- **State Management**: Zustand + Valtio
- **Backend**: Python WebSocket server
- **Build Tool**: Vite

## Setup

### 1. Install Python dependencies
```bash
python3 -m venv venv
source venv/bin/activate
pip install websockets
```

### 2. Install game dependencies
```bash
cd my-r3f-game
npm install
```

## Run

### 1. Start the control server
```bash
source venv/bin/activate
python randomStream.py
```

### 2. Start the game (in another terminal)
```bash
cd my-r3f-game
npm run dev
```

Open your browser and visit the URL shown in the terminal.

## How it works

- `randomStream.py` - WebSocket server that sends paddle control commands
- `my-r3f-game` - 3D ping pong game that receives control commands

The server sends control values between -1 and 1 to move the paddle left and right.

