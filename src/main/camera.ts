import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { createServer, type Server } from 'node:http'
import { createReadStream, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join, normalize } from 'node:path'
import { app } from 'electron'
import ffmpegStatic from 'ffmpeg-static'
import type { CameraStatus } from '../shared/types'

// When packaged, the binary lives inside app.asar which can't be executed;
// electron-builder unpacks it to app.asar.unpacked (configured in milestone 7).
const FFMPEG_PATH = (ffmpegStatic ?? 'ffmpeg').replace('app.asar', 'app.asar.unpacked')

const PLAYLIST = 'stream.m3u8'
const MAX_BACKOFF_MS = 15_000
const LIVE_POLL_MS = 500
const START_GRACE_MS = 20_000 // if no segments appear within this window, treat as offline

const CONTENT_TYPES: Record<string, string> = {
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t'
}

type StatusListener = (status: CameraStatus) => void

/**
 * Owns the RTSP -> HLS pipeline:
 *  - a loopback-only HTTP server that serves the HLS playlist + segments,
 *  - an ffmpeg child process remuxing RTSP into HLS,
 *  - supervision: detects "live", restarts ffmpeg with backoff if it dies,
 *    and reports state changes so the UI can show "reconnecting…".
 */
class CameraService {
  private status: CameraStatus = { state: 'idle', url: null, retries: 0 }
  private listener: StatusListener | null = null

  private ffmpeg: ChildProcessWithoutNullStreams | null = null
  private server: Server | null = null
  private port = 0
  private readonly hlsDir = join(app.getPath('temp'), 'kitchen-display-hls')

  private currentUrl: string | null = null
  private stopping = false
  private wentLive = false
  private retryTimer: NodeJS.Timeout | null = null
  private liveTimer: NodeJS.Timeout | null = null
  private graceTimer: NodeJS.Timeout | null = null
  private lastError = ''

  setStatusListener(listener: StatusListener): void {
    this.listener = listener
  }

  getStatus(): CameraStatus {
    return this.status
  }

  private setStatus(patch: Partial<CameraStatus>): void {
    this.status = { ...this.status, ...patch }
    this.listener?.(this.status)
  }

  private playlistUrl(): string {
    return `http://127.0.0.1:${this.port}/${PLAYLIST}`
  }

  // ---- loopback HLS server (created once, reused across ffmpeg restarts) ----

  private async ensureServer(): Promise<void> {
    if (this.server) return
    mkdirSync(this.hlsDir, { recursive: true })

    this.server = createServer((req, res) => {
      const reqPath = normalize(decodeURIComponent((req.url ?? '/').split('?')[0])).replace(
        /^(\.\.[/\\])+/,
        ''
      )
      const file = join(this.hlsDir, reqPath)
      // Confine to the HLS dir; never serve outside it.
      if (!file.startsWith(this.hlsDir) || !existsSync(file)) {
        res.writeHead(404)
        res.end()
        return
      }
      const ext = file.slice(file.lastIndexOf('.'))
      res.writeHead(200, {
        'Content-Type': CONTENT_TYPES[ext] ?? 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      })
      createReadStream(file).pipe(res)
    })

    await new Promise<void>((resolve) => {
      this.server!.listen(0, '127.0.0.1', () => {
        const addr = this.server!.address()
        this.port = typeof addr === 'object' && addr ? addr.port : 0
        resolve()
      })
    })
  }

  // ---- public control ----

  async start(rtspUrl: string): Promise<CameraStatus> {
    const url = rtspUrl.trim()
    this.stopping = false
    this.clearTimers()

    if (!url) {
      this.killFfmpeg()
      this.setStatus({ state: 'idle', url: null, message: 'No camera URL configured', retries: 0 })
      return this.status
    }

    // Restarting for a new URL resets the retry counter.
    if (url !== this.currentUrl) this.setStatus({ retries: 0 })
    this.currentUrl = url

    await this.ensureServer()
    this.spawnFfmpeg()
    return this.status
  }

  async stop(): Promise<CameraStatus> {
    this.stopping = true
    this.clearTimers()
    this.killFfmpeg()
    this.currentUrl = null
    this.setStatus({ state: 'idle', url: null, message: undefined })
    return this.status
  }

  /** Full shutdown on app quit. */
  dispose(): void {
    this.stopping = true
    this.clearTimers()
    this.killFfmpeg()
    this.server?.close()
    this.server = null
    try {
      rmSync(this.hlsDir, { recursive: true, force: true })
    } catch {
      /* best effort */
    }
  }

  // ---- ffmpeg supervision ----

  private spawnFfmpeg(): void {
    if (!this.currentUrl) return
    this.killFfmpeg()
    this.wentLive = false
    this.cleanHlsDir()
    this.setStatus({ state: 'starting', url: null, message: undefined })

    const args = [
      '-rtsp_transport',
      'tcp',
      '-timeout',
      '5000000', // 5s socket I/O timeout (microseconds)
      '-i',
      this.currentUrl,
      '-an', // drop audio; not needed for a wall display and avoids codec issues
      '-c:v',
      'copy', // camera confirmed H.264 -> remux, near-zero CPU
      '-f',
      'hls',
      '-hls_time',
      '1',
      '-hls_list_size',
      '4',
      '-hls_flags',
      'delete_segments+append_list+omit_endlist',
      '-hls_segment_type',
      'mpegts',
      '-hls_segment_filename',
      join(this.hlsDir, 'seg_%05d.ts'),
      join(this.hlsDir, PLAYLIST)
    ]

    const child = spawn(FFMPEG_PATH, args, { windowsHide: true })
    this.ffmpeg = child

    child.stderr.on('data', (chunk: Buffer) => {
      // ffmpeg logs progress + errors to stderr; keep only the last line for diagnostics.
      const text = chunk.toString().trim()
      if (text) this.lastError = text.split('\n').pop() ?? text
    })

    child.on('error', (err) => {
      this.lastError = err.message
      this.handleExit()
    })
    child.on('close', () => this.handleExit())

    // Poll for the first segment to declare "live".
    this.liveTimer = setInterval(() => this.checkLive(), LIVE_POLL_MS)
    // If nothing shows up in time, force a restart cycle.
    this.graceTimer = setTimeout(() => {
      if (!this.wentLive) this.killFfmpeg() // triggers handleExit -> backoff retry
    }, START_GRACE_MS)
  }

  private checkLive(): void {
    if (this.wentLive) return
    const playlist = join(this.hlsDir, PLAYLIST)
    const hasSegment = existsSync(this.hlsDir) && readdirSync(this.hlsDir).some((f) => f.endsWith('.ts'))
    if (existsSync(playlist) && hasSegment) {
      this.wentLive = true
      if (this.graceTimer) clearTimeout(this.graceTimer)
      this.setStatus({ state: 'live', url: this.playlistUrl(), message: undefined, retries: 0 })
    }
  }

  private handleExit(): void {
    if (this.liveTimer) clearInterval(this.liveTimer)
    if (this.graceTimer) clearTimeout(this.graceTimer)
    this.ffmpeg = null
    if (this.stopping || !this.currentUrl) return

    // ffmpeg died (or never went live). Schedule a backoff restart.
    const retries = this.status.retries + 1
    const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** Math.min(retries - 1, 4))
    this.setStatus({
      state: 'offline',
      url: null,
      message: this.lastError || 'Camera unreachable',
      retries
    })
    this.retryTimer = setTimeout(() => this.spawnFfmpeg(), delay)
  }

  private killFfmpeg(): void {
    if (this.ffmpeg) {
      this.ffmpeg.removeAllListeners()
      this.ffmpeg.kill('SIGKILL')
      this.ffmpeg = null
    }
    if (this.liveTimer) clearInterval(this.liveTimer)
    if (this.graceTimer) clearTimeout(this.graceTimer)
  }

  private clearTimers(): void {
    if (this.retryTimer) clearTimeout(this.retryTimer)
    if (this.liveTimer) clearInterval(this.liveTimer)
    if (this.graceTimer) clearTimeout(this.graceTimer)
    this.retryTimer = this.liveTimer = this.graceTimer = null
  }

  private cleanHlsDir(): void {
    try {
      mkdirSync(this.hlsDir, { recursive: true })
      for (const f of readdirSync(this.hlsDir)) rmSync(join(this.hlsDir, f), { force: true })
    } catch {
      /* best effort */
    }
  }
}

export const cameraService = new CameraService()
