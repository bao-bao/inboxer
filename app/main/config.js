const ElectronStore = require('electron-store');

module.exports = new ElectronStore({
  defaults: {
    windowState: {
      width: 1440,
      height: 840,
    },
    alwaysOnTop: false,
    showUnreadBadge: true,
    bounceDockIcon: false,
    flashWindowOnMessage: false,
    autoHideMenuBar: true,
  },
});
