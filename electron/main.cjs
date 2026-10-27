const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');

let mainWindow = null;
let backgroundProcess = null;
let isQuitting = false;

// Identificador único para la barra de tareas de Windows
app.setAppUserModelId('co.cun.hemored');

// Evitar múltiples instancias de la aplicación
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function checkUrl(url, timeoutMs = 800) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = http.get(
        {
          hostname: u.hostname === 'localhost' ? '127.0.0.1' : u.hostname,
          port: u.port,
          path: u.pathname,
          timeout: timeoutMs,
        },
        (res) => {
          resolve(res.statusCode >= 200 && res.statusCode < 400);
        }
      );
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    } catch {
      resolve(false);
    }
  });
}

async function waitForServer(url, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    const isUp = await checkUrl(url);
    if (isUp) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

function startServices() {
  const rootDir = path.resolve(__dirname, '..');
  const wingetNode = path.join(
    process.env.LOCALAPPDATA || '',
    'Microsoft',
    'WinGet',
    'Packages',
    'OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe',
    'node-v24.20.0-win-x64'
  );

  const env = { ...process.env };
  if (wingetNode) {
    env.PATH = `${wingetNode};${env.PATH || ''}`;
  }

  let pnpmCmd = 'pnpm';
  const wingetPnpm = path.join(wingetNode, 'pnpm.cmd');
  if (require('node:fs').existsSync(wingetPnpm)) {
    pnpmCmd = wingetPnpm;
  }

  try {
    backgroundProcess = spawn('cmd.exe', ['/c', `"${pnpmCmd}" dev`], {
      cwd: rootDir,
      env,
      stdio: 'ignore',
      windowsHide: true,
      detached: false,
    });
  } catch (err) {
    console.error('Error al iniciar servicios:', err);
  }
}

function killServices() {
  if (isQuitting) return;
  isQuitting = true;
  if (backgroundProcess && backgroundProcess.pid) {
    try {
      spawn('taskkill', ['/PID', backgroundProcess.pid.toString(), '/T', '/F'], {
        windowsHide: true,
        stdio: 'ignore',
      });
    } catch {}
  }
}

async function createWindow() {
  const rootDir = path.resolve(__dirname, '..');
  const iconPath = path.join(rootDir, 'hemored.ico');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 650,
    title: 'HemoRed - Red Vital Hospitalaria & Banco de Sangre',
    icon: iconPath,
    backgroundColor: '#0f172a',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Abrir enlaces externos en el navegador del sistema, no dentro de la app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    killServices();
    app.quit();
  });

  // Comprobar si los servicios ya están en ejecución
  const targetUrl = 'http://localhost:5173';
  const isAlreadyRunning = await checkUrl(targetUrl);

  if (!isAlreadyRunning) {
    startServices();
  }

  // Esperar a que el frontend y el backend estén disponibles
  const ready = await waitForServer(targetUrl);
  if (ready && mainWindow) {
    await mainWindow.loadURL(targetUrl);
  } else if (mainWindow) {
    // Si no cargó el dev server, intentar cargar dist/index.html o mostrar pantalla de reintento
    const distIndex = path.join(rootDir, 'web', 'dist', 'index.html');
    mainWindow.loadFile(distIndex).catch(() => {
      mainWindow.loadURL(targetUrl);
    });
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  killServices();
  app.quit();
});

app.on('before-quit', () => {
  killServices();
});

process.on('SIGINT', () => {
  killServices();
  app.quit();
});

process.on('SIGTERM', () => {
  killServices();
  app.quit();
});
