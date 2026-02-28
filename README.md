# NoteAI

NoteAI is a local-first desktop productivity app for Windows.
It combines To-Do, Notes, TimeMap calendar, AI Chat, Focus mode, Firebase backup, and Discord RPC in one Electron app.

## Visual

![Visual 2](https://raw.githubusercontent.com/ZuziaDev/NoteAI/main/public/visual_2.png)
![Visual 3](https://raw.githubusercontent.com/ZuziaDev/NoteAI/main/public/visual_3.png)
![Visual 4](https://raw.githubusercontent.com/ZuziaDev/NoteAI/main/public/visual_4.png)
![Visual 5](https://raw.githubusercontent.com/ZuziaDev/NoteAI/main/public/visual_5.png)
![Visual 6](https://raw.githubusercontent.com/ZuziaDev/NoteAI/main/public/visual_6.png)
![Visual 1](https://raw.githubusercontent.com/ZuziaDev/NoteAI/main/public/visual_1.png)
## Tech Stack

- Electron + Vite + React + TypeScript
- TailwindCSS (glassmorphism style)
- Zustand state management
- Framer Motion animations
- Electron main process as backend layer
- Firebase Realtime Database + Firebase Admin (service account)
- electron-builder (NSIS)

## Main Features

- To-Do: list + agenda + kanban views, priority, tags, recurrence, linked note
- Smart reminder actions: snooze `+5m`, `+1h`, `tomorrow`
- Notes: multi-tab editing, markdown preview, external file open, AI file naming
- Note version history + line-by-line diff
- TimeMap: calendar view with todo/note density and calendar notes
- Drag-and-drop integration between tasks and calendar dates
- AI Chat: summarize, suggest actions, convert response to task/note
- Focus mode: Pomodoro countdown + stopwatch + alarm + session history
- Semantic search across core modules
- Cloud sync toggle with offline-first retry queue
- Sync conflict strategy: `merge` or `latest`
- Discord RPC presence

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure runtime secrets:

- Use `config.js` and/or `.env`
- Keep secrets out of git

3. Run dev mode:

```bash
npm run dev
```

4. Build app:

```bash
npm run build
```

5. Build Windows installer:

```bash
npm run dist
```

Output example:

- `version/<app-version>/noteai_<app-version>.exe`

## Release Notes

- Full changelog is maintained in [version/README.md](./version/README.md).

### Latest Patch (0.2.1)

- Focus countdown no longer auto-restarts after reaching zero
- Added stopwatch mode to Focus panel
- Added finish alarm sound with volume + enable/disable controls
- Refined Focus UI (countdown ring, tabs, cleaner controls, richer history)

## Project Structure

- `src/` renderer UI (React)
- `electron/main/` desktop backend (IPC, storage, AI, Firebase, RPC)
- `electron/preload/` secure bridge APIs
- `shared/` shared types and constants
- `version/` built installers and release artifacts

## Security Notes

- Do not commit private keys and production credentials
- Keep `.env`, `config.js`, and service account values private in production builds
