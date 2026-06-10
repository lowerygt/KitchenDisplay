import { autoUpdater } from 'electron-updater'
import log from 'electron-log/main'

// Kiosk-friendly auto-update: check GitHub releases periodically, download in
// the background, and install during quiet hours so an update never restarts
// the display mid-use (e.g. while a kitchen timer is running).

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000 // every 4 hours
const INSTALL_HOUR = 3 // local time; display is idle at 3 AM

let updateDownloaded = false

export function startAutoUpdates(): void {
  autoUpdater.logger = log
  autoUpdater.autoDownload = true
  // Fallback: if the app quits or restarts for any other reason, apply the
  // pending update then rather than waiting for the 3 AM window.
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    log.info(`Update available: ${info.version} (current ${autoUpdater.currentVersion})`)
  })
  autoUpdater.on('update-downloaded', (info) => {
    log.info(`Update ${info.version} downloaded; installing at ${INSTALL_HOUR}:00`)
    updateDownloaded = true
  })
  autoUpdater.on('error', (err) => {
    // Offline, GitHub hiccup, etc. — not fatal, the next interval retries.
    log.warn(`Auto-update check failed: ${err.message}`)
  })

  const check = (): void => {
    void autoUpdater.checkForUpdates().catch(() => {
      /* logged by the error handler above */
    })
  }
  // First check shortly after launch (let the window come up first).
  setTimeout(check, 60_000)
  setInterval(check, CHECK_INTERVAL_MS)

  // Install window: once a download is ready, restart into it at INSTALL_HOUR.
  setInterval(() => {
    if (updateDownloaded && new Date().getHours() === INSTALL_HOUR) {
      log.info('Quiet-hours window reached; restarting to apply update')
      autoUpdater.quitAndInstall(true, true)
    }
  }, 60_000)
}
