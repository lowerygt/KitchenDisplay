import { app, shell, BrowserWindow, powerSaveBlocker } from 'electron'
import { join } from 'node:path'
import log from 'electron-log/main'
import { IPC } from '../shared/ipc'
import { registerIpc } from './ipcHandlers'
import { cameraService } from './camera'
import { registerPhotoProtocol, registerPhotoScheme } from './photos'

const isDev = !app.isPackaged

// Persistent file logging (userData/logs/main.log) — a wall-mounted kiosk has
// no visible console, so console.* and crashes must land somewhere inspectable.
log.initialize({ spyRendererConsole: true }) // renderer console output is captured too
log.transports.file.maxSize = 5 * 1024 * 1024 // rotate to main.old.log at 5 MB
log.errorHandler.startCatching() // uncaught exceptions + unhandled rejections
Object.assign(console, log.functions) // route existing console.* calls in main through the file
log.info(`kitchen-display ${app.getVersion()} starting (dev=${isDev})`)

// Must run before app `ready`: marks kdphoto:// as a secure, standard scheme.
registerPhotoScheme()

let mainWindow: BrowserWindow | null = null
let powerSaveBlockerId: number | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    show: false,
    frame: false,
    fullscreen: !isDev, // windowed in dev for convenience, kiosk full-screen when packaged
    width: 1280,
    height: 800,
    backgroundColor: '#0a0a0a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false, // preload needs Node require for the bridge; renderer stays isolated
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.once('ready-to-show', () => mainWindow?.show())

  // Open external links in the system browser, never inside the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  // Kiosk / dev hotkeys scoped to this window (not global system shortcuts).
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return
    // Ctrl+,  -> open in-app Settings
    if (input.control && input.key === ',') {
      mainWindow?.webContents.send(IPC.openSettings)
      event.preventDefault()
      return
    }
    // Esc -> quit the dashboard
    if (input.key === 'Escape') {
      app.quit()
      event.preventDefault()
      return
    }
    // Ctrl+Shift+I -> devtools (dev only)
    if (isDev && input.control && input.shift && input.key.toLowerCase() === 'i') {
      mainWindow?.webContents.toggleDevTools()
      event.preventDefault()
    }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  registerIpc(isDev)
  registerPhotoProtocol()

  // Keep the wall display awake 24/7.
  powerSaveBlockerId = powerSaveBlocker.start('prevent-display-sleep')

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (powerSaveBlockerId !== null && powerSaveBlocker.isStarted(powerSaveBlockerId)) {
    powerSaveBlocker.stop(powerSaveBlockerId)
  }
  app.quit()
})

app.on('before-quit', () => {
  // Make sure the ffmpeg child + loopback server are torn down.
  cameraService.dispose()
})
