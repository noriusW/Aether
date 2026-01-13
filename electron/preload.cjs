const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  send: (channel, data) => {
    const validChannels = [
      'minimize-window', 'maximize-window', 'close-window', 'resize-window', 
      'resize-window-delta', 'login-success', 'open-external', 'update-presence',
      'update-app-settings', 'logout-request'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  invoke: (channel, data) => {
    const validChannels = ['get-soundcloud-key', 'authenticate-soundcloud', 'open-external'];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
  },
  on: (channel, func) => {
    const validChannels = ['window-maximized', 'window-unmaximized', 'toggle-play-tray', 'next-track-tray', 'prev-track-tray', 'window-focus-change', 'rpc-status'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  off: (channel) => {
    const validChannels = [
      'window-maximized', 'window-unmaximized', 'window-focus-change',
      'toggle-play-tray', 'next-track-tray', 'prev-track-tray', 'rpc-status'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  }
});
