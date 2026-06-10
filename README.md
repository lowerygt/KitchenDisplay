# Kitchen Display

A local, always-on **Windows kitchen display / smart dashboard** built with Electron, React, TypeScript and Tailwind. It runs full-screen and unattended — clock, weather, calendar agenda, to-dos, an IP-camera feed, a photo slideshow, and news headlines — all on a grid layout you can rearrange yourself.

Everything runs **locally on the machine**. No cloud account is required; the weather and news data come from public, no-API-key sources, and your settings stay on the device.

---

## Features

- **Tiles**
  - **Clock** — large local time + date.
  - **Weather** — current conditions plus a 4-day forecast (today + next 3), from [Open-Meteo](https://open-meteo.com/) geocoded by US ZIP (default `28210`). No API key.
  - **Agenda** — unified upcoming events from one or more calendar feeds (iCal/`.ics`).
  - **To-do** — quick add / check off / reorder, persisted locally.
  - **Camera** — live IP-camera feed via RTSP → HLS (transcoded with bundled ffmpeg), with auto-reconnect.
  - **Photos** — slideshow from a local folder you choose, with adjustable interval and shuffle.
  - **Headlines** — merged RSS/Atom news from any feeds you add (ships with BBC World). No API key.
- **Customizable layouts** — three saveable layout slots (**Layout 1/2/3**). A full-screen editor lets you **drag tiles to move** and **drag a corner to resize** on a 12×8 grid, then **save to any slot**.
- **Night mode** — dim the screen on a schedule (configurable start/end and dim level).
- **Full-screen** toggle and **launch on login** (auto-start) options.
- **Resilient** — each tile is isolated in an error boundary, so one failing widget never blanks the board.

---

## Tech stack

- **Electron 31** + **electron-vite 2** (Vite 5) — main / preload / renderer, built as CommonJS.
- **React 18** + **TypeScript 5.5** + **Tailwind CSS 3.4**.
- **electron-store** for settings/to-dos, **ffmpeg-static** for camera transcoding, **rss-parser** for news, **ical-expander** for calendars.
- IPC via a typed contract (`src/shared/ipc.ts`) exposed to the sandboxed renderer through a `contextBridge` preload (`window.api`). `contextIsolation` on, `nodeIntegration` off.

---

## Requirements

- **Windows 10/11** (x64).
- **Node.js 20+** and npm (for development / building only — end users just run the installer).

---

## Getting started (development)

```bash
npm install
npm run dev          # launch the app with hot reload
npm run typecheck    # type-check main + renderer
```

The dev window opens framed for convenience. Press **Ctrl+,** to open the settings (gear) panel and **Esc** to quit.

---

## Configuration

All configuration is in-app via the **gear menu** (top-right, or **Ctrl+,**):

- **Layout** — switch between Layout 1/2/3; **Customize layout…** opens the drag/resize editor.
- **Widgets** — toggle individual tiles on/off (only enabled tiles appear in a layout).
- **Calendars** — add iCal `.ics` URLs (e.g. Google Calendar → *Settings → Secret address in iCal format*). Toggle/remove feeds; each gets a color in the agenda.
- **Weather** — US ZIP code + °F/°C.
- **Photos** — choose a folder, set seconds-per-photo, toggle shuffle. Images are served to the sandboxed renderer through a private `kdphoto://` scheme confined to the selected folder.
- **Headlines** — add any RSS/Atom feed URL (optional label); remove feeds you don't want.
- **Camera RTSP URL** — e.g. `rtsp://user:pass@192.168.1.50:554/stream1`.
- **Night mode** — enable + start/end time + dim level.
- **Startup** — launch on login.

### Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+,` | Open settings / edit panel |
| `Esc` | Quit the app |

### Where settings are stored

Settings and to-dos live in `%APPDATA%\kitchen-display\kitchen-display.json` (electron-store). Uninstalling **keeps** this file by default so your layout survives a reinstall.

---

## Customizing the layout

1. Open the gear menu → **Customize layout…**
2. Use the **Editing** tabs to pick which slot to work on.
3. **Drag** a tile to move it; **drag the bottom-right corner** to resize. Tiles snap to the 12×8 grid.
4. **Save to → Layout 1 / 2 / 3** writes your arrangement into that slot and makes it active. **Cancel** / **Esc** discards.

You can load one slot, tweak it, and save it to a *different* slot to duplicate a layout.

---

## Building the Windows installer

```bash
npm run build:win
```

This runs `electron-vite build` then `electron-builder --win`. Output lands in **`dist/`** as `Kitchen Display-<version>-Setup.exe` (NSIS installer; lets the user choose the install directory and creates desktop + Start-menu shortcuts).

Notes:
- `ffmpeg.exe` (from `ffmpeg-static`) is automatically **unpacked** to `app.asar.unpacked` so it can be executed at runtime (see `electron-builder.yml` → `asarUnpack`).
- **App icon (optional):** drop a 256×256+ `icon.ico` into a `build/` folder at the repo root. Without it, electron-builder uses the default Electron icon.
- `npm run build` builds the installer for the current platform; `npm run start` previews the production bundle without packaging.
- To produce just the runnable app folder (no installer) for a quick check: `npx electron-builder --dir` → output in `dist/win-unpacked/`.

### Troubleshooting: "Cannot create symbolic link … A required privilege is not held by the client"

On the first `npm run build:win`, electron-builder downloads its `winCodeSign` toolchain, whose archive contains macOS symlinks. Windows refuses to extract symlinks unless the build process has the symlink privilege, so the **installer (NSIS) step** fails with this error. (The unpacked app — `electron-builder --dir` — still builds fine; only the `.exe` installer is affected.)

Fix it one of these ways:
- **Pre-populate the cache without the mac symlinks** (no admin needed) — extract the downloaded archive while skipping the `darwin/` folder (the symlinks are macOS-only and unused on Windows), into the directory name electron-builder expects:
  ```bash
  # paths use this project's bundled 7-Zip; adjust the .7z name to the one
  # electron-builder downloaded into the cache folder
  CACHE="$LOCALAPPDATA/electron-builder/Cache/winCodeSign"
  "node_modules/7zip-bin/win/x64/7za.exe" x "$CACHE/<downloaded>.7z" \
      "-o$CACHE/winCodeSign-2.6.0" -xr!darwin -y
  ```
  Then re-run `npm run build:win` — it finds the cache present and skips the failing extraction.
- **or enable Windows Developer Mode** (Settings → System → For developers → Developer Mode) — grants symlink creation to your normal user.
- **or** run the build from an **elevated** (Administrator) terminal.

Setting `CSC_IDENTITY_AUTO_DISCOVERY=false` skips code-signing (we ship unsigned), which avoids unnecessary signing attempts during the build.

This is a Windows-environment requirement of electron-builder, not a project setting.

---

## Calendar feeds & accounts

The app currently syncs calendars via **iCal `.ics` URLs**, which works for Google, Microsoft 365/Outlook, iCloud, and most providers (paste the feed's secret iCal address in the Calendars section). No sign-in required.

Direct **OAuth account sign-in (Google / Microsoft)** is planned but not yet enabled. `.env.example` documents the client-ID environment variables it will use. To prepare credentials ahead of time:

**Google (Google Cloud Console)**
1. Create/select a project → **APIs & Services → Enable APIs** → enable **Google Calendar API**.
2. **OAuth consent screen**: External, add your Google account as a *Test user*.
3. **Credentials → Create credentials → OAuth client ID → Desktop app**.
4. Copy the **Client ID** (and client secret if issued) into `.env` as `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

**Microsoft 365 (Azure Portal)**
1. **App registrations → New registration**; supported account types: *accounts in any org directory + personal Microsoft accounts*.
2. Add a **Mobile & desktop** redirect (loopback) and the `Calendars.Read` delegated permission.
3. Copy the **Application (client) ID** into `.env` as `MS_CLIENT_ID` (authority `https://login.microsoftonline.com/common`).

Copy `.env.example` to `.env` (git-ignored) and fill in the values. The full OAuth flow (PKCE, loopback redirect, encrypted token storage via Windows DPAPI) is documented in the deferred-implementation notes and will read these variables when added.

---

## Project structure

```
src/
  main/        Electron main process (windowing, IPC, store, weather, news,
               photos, camera/ffmpeg, calendar)
  preload/     contextBridge — exposes window.api to the renderer
  renderer/    React UI (widgets, hooks, layout editor, settings panel)
  shared/      Types + IPC contract shared by main and renderer
electron-builder.yml   Packaging / NSIS installer config
electron.vite.config.ts
```

---

## License

MIT © Tyler
