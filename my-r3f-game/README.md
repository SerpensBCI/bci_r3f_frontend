# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


---

## Calibration & Sensory‑Guided Training (Game)

### What is the Calibration stage?
The game includes a BCI‑inspired calibration phase. During the first **10 trials** (configurable), the app **learns your preferred keys** for each on‑screen cue:
- Directions: **↑ ↓ ← →**
- **Rest**: either press **no key** (recommended), or pick a key to assign as Rest

After calibration, the training phase uses the learned mapping. Incorrect/unknown inputs trigger **screen‑shake feedback** to guide you.

### How to use it
1. Start the dev server (`npm run dev`) and open the app.
2. Go to the **Calibration** page and click **Start**.
3. For the **first 10 trials**:
   - When you see **↑**, press the key you want to use for “up” (e.g., `W`).
   - When you see **↓**, press你的“down”键（例如 `S`）。
   - When you see **←**, press你的“left”键（例如 `A`）。
   - When you see **→**, press你的“right”键（例如 `D`）。
   - When you see **Rest**, you can **press nothing** (mapped to Rest) or press one consistent key you want to assign to Rest.
4. When calibration ends, the app shows a summary like:
   
   `Learned keys: ↑→"W"  ↓→"S"  ←→"A"  →→"D"  Rest→(no key)`
   
   The same details are printed in the browser console.
5. The **Training** phase starts automatically and uses the learned keys.

### Feedback (sensory guidance)
- **Correct input** → “Good! Copy previous pattern.”
- **Incorrect or unknown input** → **Page shakes** briefly + “Try Again – Adjust Focus”.

### Tips & Troubleshooting
- **Many INCORRECT results**: you might be pressing keys that weren’t learned during calibration. Check the mapping summary (UI/console) and click **Start** again to recalibrate.
- **Unknown keys**: any key not seen in calibration is treated as **Unknown** in training. Re‑run calibration to change keys.
- **Arrow/Space scrolling the page**: the app prevents default scrolling for these keys, but make sure the game tab has focus.

### Developer notes
- **Files**: `src/pages/CalibrationPage.jsx`, `src/pages/CalibrationPage.css`
- **Config knobs**:
  - `totalTrials` (default **10**) – how many calibration trials.
  - Trial pacing: delay before next cue (default **500 ms**) → set to **1000 ms** for more realistic timing.
  - Shake duration: **300 ms** inside `triggerShake()`.
- **Mapping algorithm**:
  - For each cue, the app picks the **most frequent key** you pressed during calibration.
  - It then inverts to `key -> direction`; if one key was used for multiple cues, the **higher count wins**.
  - `NO_KEY_TOKEN = "__NO_KEY__"` represents **no key** (used for Rest when you don’t press anything).
- **Data captured in calibration**: each trial stores `{ requiredDirection, keyPressed }`. Training maps `keyPressed` using the learned mapping to judge correctness.
