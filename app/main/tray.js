const path = require('path');
const { app, Tray, Menu } = require('electron');
const { isDarwin, sendAction } = require('./utils');

const iconTrayFile = 'IconTray.png';

let tray = null;

const contextMenu = focusedWindow => [
  {
    label: '打开/关闭窗口',
    click() {
      return focusedWindow.isVisible() ? focusedWindow.hide() : focusedWindow.show();
    },
  },
  { type: 'separator' },
  {
    label: '退出登录',
    click() {
      sendAction(focusedWindow, 'sign-out');
    },
  },
  { type: 'separator' },
  {
    label: '退出系统',
    role: 'quit',
  },
];

function create(win) {
  if (isDarwin || tray) return;

  const iconPath = path.join(__dirname, '..', `static/${iconTrayFile}`);

  tray = new Tray(iconPath);
  tray.setToolTip(app.getName());
  tray.setContextMenu(Menu.buildFromTemplate(contextMenu(win)));

  tray.on('click', () => (win.isVisible() ? win.hide() : win.show()));
}

module.exports = {
  create,
};
