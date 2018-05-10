const { ipcRenderer: ipc } = require('electron');
const { $ } = require('./utils');

// primary folder shortcuts
ipc.on('sign-out', () => $('#out').click());

document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add(`platform-${process.platform}`);
});
