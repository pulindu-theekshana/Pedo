const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const fs = require('fs');
const path = require('path');

let win = null;

function pdfsFromArgs(args) {
  return args.slice(1).filter(a => a.toLowerCase().endsWith('.pdf') && fs.existsSync(a));
}

function readFiles(paths) {
  return paths.map(p => ({ name: path.basename(p), data: fs.readFileSync(p) }));
}

let initialFiles = pdfsFromArgs(process.argv);

function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 800,
    backgroundColor: '#2B1D16',
    icon: path.join(__dirname, 'build', 'icon.ico'),
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#2B1D16', symbolColor: '#E8D9C5', height: 36 },
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });
  win.loadFile('index.html');
}

ipcMain.handle('open-files', async () => {
  const r = await dialog.showOpenDialog({
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
    properties: ['openFile', 'multiSelections']
  });
  if (r.canceled) return [];
  return readFiles(r.filePaths);
});

ipcMain.handle('get-initial-files', () => {
  const files = readFiles(initialFiles);
  initialFiles = [];
  return files;
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', (event, argv) => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
    const files = readFiles(pdfsFromArgs(argv));
    if (files.length) win.webContents.send('open-files', files);
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    createWindow();
  });
  app.on('window-all-closed', () => app.quit());
}