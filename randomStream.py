import asyncio
import json
import math
import random
import websockets

CONTROL_SCHEMA_VERSION = 1

async def control_stream(websocket):
    print("[+] Client connected")
    try:
        while True:
            # Random / oscillating control value
            control_x = round(math.sin(asyncio.get_event_loop().time()) + random.uniform(-0.1, 0.1), 3)
            control_x = max(-1, min(1, control_x))  # Clamp to [-1, 1]

            frame = {
                "kind": "control",
                "schema_version": CONTROL_SCHEMA_VERSION,
                "control_x": control_x
            }

            await websocket.send(json.dumps(frame))
            print(f"→ Sent frame: {frame}")

            await asyncio.sleep(0.1)  # 10 frames per second
    except websockets.exceptions.ConnectionClosed:
        print("[!] Client disconnected")


async def main():
    print("🚀 Control stream server running at ws://localhost:8765/ws")
    async with websockets.serve(control_stream, "0.0.0.0", 8765, ping_interval=None):
        await asyncio.Future()  # Keep running


if __name__ == "__main__":
    asyncio.run(main())