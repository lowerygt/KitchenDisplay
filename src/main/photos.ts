import { readdir } from 'node:fs/promises'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { net, protocol } from 'electron'
import { getSettings } from './store'

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.avif'])

/** Custom scheme used to hand local image files to the sandboxed renderer. */
export const PHOTO_SCHEME = 'kdphoto'

/** Build the renderer-facing URL for an absolute image path. */
export function photoUrl(absPath: string): string {
  return `${PHOTO_SCHEME}://local/${encodeURIComponent(absPath)}`
}

/** Must be called before app `ready` so the scheme is treated as secure/standard. */
export function registerPhotoScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: PHOTO_SCHEME,
      privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
    }
  ])
}

function isInsideFolder(filePath: string, folder: string): boolean {
  if (!folder) return false
  const base = normalize(resolve(folder)).toLowerCase()
  const target = normalize(resolve(filePath)).toLowerCase()
  return target === base || target.startsWith(base.endsWith(sep) ? base : base + sep)
}

/** Wire up kdphoto:// to stream files, confined to the configured photo folder. */
export function registerPhotoProtocol(): void {
  protocol.handle(PHOTO_SCHEME, async (request) => {
    try {
      const url = new URL(request.url)
      const filePath = decodeURIComponent(url.pathname.replace(/^\//, ''))
      const folder = getSettings().photos.folder
      // Confine reads to the user-selected folder — never serve arbitrary disk paths.
      if (!isInsideFolder(filePath, folder) || !IMAGE_EXT.has(extname(filePath).toLowerCase())) {
        return new Response('Forbidden', { status: 403 })
      }
      return net.fetch(pathToFileURL(filePath).toString())
    } catch {
      return new Response('Bad request', { status: 400 })
    }
  })
}

/** Absolute paths of image files directly inside the configured folder. */
export async function listPhotos(folder = getSettings().photos.folder): Promise<string[]> {
  if (!folder) return []
  try {
    const entries = await readdir(folder, { withFileTypes: true })
    return entries
      .filter((e) => e.isFile() && IMAGE_EXT.has(extname(e.name).toLowerCase()))
      .map((e) => join(folder, e.name))
      .sort()
  } catch {
    return []
  }
}
