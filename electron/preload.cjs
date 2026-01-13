const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  send: (channel, data) => {
    const validChannels = ['minimize-window', 'maximize-window', 'close-window', 'resize-window', 'login-success', 'open-external', 'update-presence'];
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
    const validChannels = ['window-maximized', 'window-unmaximized', 'toggle-play-tray', 'next-track-tray', 'prev-track-tray', 'window-focus-change'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  off: (channel) => {
    const validChannels = ['toggle-play-tray', 'next-track-tray', 'prev-track-tray'];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  }
});
