import type { KitchenApi } from '../shared/ipc'

declare global {
  interface Window {
    api: KitchenApi
  }
}

export {}
