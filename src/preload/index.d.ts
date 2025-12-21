import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      authGoogle: (url: string) => Promise<{ access_token: string; refresh_token: string }>
    }
  }
}
