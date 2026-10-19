const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let mainWindow = null;

// Evitar múltiples instancias simultáneas
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

  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 1366,
      height: 850,
      minWidth: 980,
      minHeight: 650,
      title: 'Legión - AgroControl Pro',
      icon: path.join(__dirname, 'icon.png'),
      backgroundColor: '#f8fafc',
      autoHideMenuBar: true,
      show: false, // Esperar a ready-to-show para evitar parpadeos blancos
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
    });

    const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

    if (isDev) {
      mainWindow.loadURL('http://localhost:3000');
    } else {
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // --- IPC Handlers (Integración Nativa de Escritorio) ---

  // 1. Ejecutar git pull directamente en el directorio del proyecto
  ipcMain.handle('execute-git-pull', async () => {
    return new Promise((resolve) => {
      const repoDir = path.resolve(__dirname, '..');
      exec('git pull origin main', { cwd: repoDir }, (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            message: stderr ? stderr.toString() : error.message,
            output: stdout ? stdout.toString() : '',
          });
        } else {
          resolve({
            success: true,
            message: 'Código actualizado correctamente desde GitHub.',
            output: stdout ? stdout.toString() : '',
          });
        }
      });
    });
  });

  // 2. Reiniciar la aplicación de escritorio
  ipcMain.handle('restart-app', () => {
    app.relaunch();
    app.exit(0);
  });

  // 3. Obtener versión de la aplicación
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  // 4. Abrir enlaces en el navegador predeterminado del sistema operativo
  ipcMain.handle('open-external', (event, url) => {
    if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
      shell.openExternal(url);
    }
  });

  // 5. Selector nativo de carpetas para guardar documentos adjuntos
  ipcMain.handle('select-folder', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Seleccionar Carpeta para Documentos Adjuntos',
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });
}
