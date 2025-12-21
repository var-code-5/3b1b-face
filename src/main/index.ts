import { app, shell, BrowserWindow, ipcMain, session, systemPreferences } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // Disable web security to allow CORS
    }
  })

  // Handle media permissions (microphone, camera)
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowedPermissions = ['media', 'microphone', 'audioCapture']
    if (allowedPermissions.includes(permission)) {
      callback(true) // Approve the permissions request
    } else {
      callback(false)
    }
  })

  // Handle permission checks
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    const allowedPermissions = ['media', 'microphone', 'audioCapture']
    return allowedPermissions.includes(permission)
  })

  // Bypass CSP for fetch requests
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " +
          "script-src * 'unsafe-inline' 'unsafe-eval'; " +
          "connect-src * 'unsafe-inline' data: blob: https://9lw52178ayis33-8000.proxy.runpod.net; " +
          "img-src * data: blob: 'unsafe-inline'; " +
          "frame-src *; " +
          "style-src * 'unsafe-inline';"
        ]
      }
    })
  })

  // Open DevTools in development
  if (is.dev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Explicitly ask for microphone access on macOS
  if (process.platform === 'darwin') {
    const status = systemPreferences.getMediaAccessStatus('microphone')
    if (status === 'not-determined') {
      systemPreferences.askForMediaAccess('microphone').then((granted) => {
        console.log('Microphone access granted:', granted)
      })
    }
  }

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

  // Handle Google OAuth flow
  ipcMain.handle('auth:google', async (_event, authUrl: string) => {
    return new Promise((resolve, reject) => {
      const authWindow = new BrowserWindow({
        width: 600,
        height: 700,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      })

      authWindow.loadURL(authUrl)

      const handleRedirect = (url: string) => {
        // Check if the URL matches the redirect URL (http://localhost:8000/docs)
        // The token is in the hash: #access_token=...&refresh_token=...
        if (url.startsWith('http://localhost:8000/docs')) {
          try {
            const hash = url.split('#')[1]
            if (hash) {
              const params = new URLSearchParams(hash)
              const accessToken = params.get('access_token')
              const refreshToken = params.get('refresh_token')
              
              if (accessToken) {
                authWindow.close()
                resolve({ access_token: accessToken, refresh_token: refreshToken })
              }
            }
          } catch (error) {
            reject(error)
          }
        }
      }

      authWindow.webContents.on('will-redirect', (event, url) => {
        handleRedirect(url)
      })

      authWindow.webContents.on('will-navigate', (event, url) => {
        handleRedirect(url)
      })

      authWindow.on('closed', () => {
        reject(new Error('Auth window closed by user'))
      })
    })
  })

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
