const path = require('path');
const {
  app, BrowserWindow, shell,
} = require('electron');
const log = require('electron-log');
const isDev = require('electron-is-dev');
const { autoUpdater } = require('electron-updater');
const minimatch = require('minimatch-all');
const { isDarwin, isLinux } = require('./utils');
const config = require('./config');
const appTray = require('./tray');
const analytics = require('./analytics');

app.setAppUserModelId('com.regrx.ordertrack');

require('electron-dl')();
require('electron-context-menu')();

const mainURL = 'http://120.79.152.56:8081';
const loadingURL = path.join(__dirname, '..', 'static/loading.html');

let mainWindow;
let loadingScreen;
let isQuitting = false;

const isRunning = app.makeSingleInstance(() => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
});

if (isRunning) {
  app.quit();
}

function allowedUrl(url) {
  const urls = [];

  return minimatch(url, urls);
}

function createMainWindow() {
  const windowState = config.get('windowState');

  const win = new BrowserWindow({
    show: false, // Hide application until your page has loaded
    title: app.getName(),
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    minWidth: 1200,
    minHeight: 800,
    alwaysOnTop: config.get('alwaysOnTop'),
    autoHideMenuBar: config.get('autoHideMenuBar'),
    backgroundColor: '#f2f2f2',
    icon: path.join(__dirname, '..', 'static/Icon.png'),
    titleBarStyle: 'hidden-inset',
    webPreferences: {
      preload: path.join(__dirname, '..', 'renderer', 'browser.js'),
      nodeIntegration: false,
    },
  });

  if (isDarwin) {
    win.setSheetOffset(40);
  }

  win.loadURL(mainURL);

  // Show window after loading the DOM
  // Docs: https://electronjs.org/docs/api/browser-window#showing-window-gracefully
  win.once('ready-to-show', () => {
    loadingScreen.close();
    win.show();
  });

  win.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();

      if (isDarwin) {
        app.hide();
      } else {
        win.hide();
      }
    }
  });

  return win;
}

function createLoadingScreen() {
  loadingScreen = new BrowserWindow({
    height: 280,
    useContentSize: true,
    width: 500,
    resizable: false,
    frame: false,
    icon: path.join(__dirname, '..', 'static/Icon.png'),
    show: false,
    parent: mainWindow,
  });

  loadingScreen.loadURL(loadingURL);
  loadingScreen.on('closed', () => {
    loadingScreen = null;
  });
  loadingScreen.webContents.on('did-finish-load', () => {
    loadingScreen.show();
  });
}

app.on('ready', () => {
  createLoadingScreen();
  mainWindow = createMainWindow();
  appTray.create(mainWindow);

  analytics.init();

  if (!isDev && !isLinux) {
    autoUpdater.logger = log;
    autoUpdater.logger.transports.file.level = 'info';
    autoUpdater.checkForUpdatesAndNotify();
  }

  const { webContents } = mainWindow;

  webContents.on('will-navigate', (e, url) => {
    analytics.track('will-navigate');
    if (!allowedUrl(url)) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });

  webContents.on('new-window', (e, url) => {
    analytics.track('new-window');
    e.preventDefault();
    if (allowedUrl(url)) {
      webContents.loadURL(url);
      return;
    }
    shell.openExternal(url);
  });
});

app.on('activate', () => {
  mainWindow.show();
});

app.on('before-quit', () => {
  analytics.track('quit');
  isQuitting = true;

  if (!mainWindow.isFullScreen()) {
    config.set('windowState', mainWindow.getBounds());
  }
});
