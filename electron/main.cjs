const { app, BrowserWindow, ipcMain, shell, net, screen, Tray, Menu, globalShortcut } = require('electron');
const path = require('path');
const { DiscordRPCClient } = require('@ryuziii/discord-rpc');

let mainWindow;
let tray;
let rpc;
let lastTrack = null;
let isConnecting = false;
const clientId = '1460554881508184074'; 


const MIN_WINDOW_WIDTH = 960;
const MIN_WINDOW_HEIGHT = 420;
let appSettings = {
  closeToTray: true,
  showTrayIcon: true,
  autoStart: false,
  discordRPC: true 
};

ipcMain.on('minimize-window', () => mainWindow.minimize());
ipcMain.on('close-window', () => mainWindow.close());
ipcMain.on('maximize-window', () => { if (mainWindow.isMaximized()) mainWindow.restore(); else mainWindow.maximize(); });
ipcMain.on('resize-window', (e, { width, height, center }) => {
  if (width === 'max') {
    const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
    if (mainWindow) mainWindow.setSize(Math.floor(sw * 0.9), Math.floor(sh * 0.9));
  } else if (mainWindow) mainWindow.setSize(width, height);
  if (center && mainWindow) mainWindow.center();
});

ipcMain.on('resize-window-delta', (e, { dx = 0, dy = 0, direction = '' }) => {
  if (!mainWindow || mainWindow.isMaximized()) return;
  const bounds = mainWindow.getBounds();
  let { x, y, width, height } = bounds;

  if (direction.includes('e')) {
    width = Math.max(MIN_WINDOW_WIDTH, width + dx);
  }
  if (direction.includes('s')) {
    height = Math.max(MIN_WINDOW_HEIGHT, height + dy);
  }
  if (direction.includes('w')) {
    const newWidth = Math.max(MIN_WINDOW_WIDTH, width - dx);
    const appliedDx = width - newWidth;
    x += appliedDx;
    width = newWidth;
  }
  if (direction.includes('n')) {
    const newHeight = Math.max(MIN_WINDOW_HEIGHT, height - dy);
    const appliedDy = height - newHeight;
    y += appliedDy;
    height = newHeight;
  }

  if (width !== bounds.width || height !== bounds.height || x !== bounds.x || y !== bounds.y) {
    mainWindow.setBounds({ x, y, width, height });
  }
});

ipcMain.on('update-presence', (e, track) => {
  lastTrack = track;
  if (rpc) updatePresence(track);
});

ipcMain.handle('get-soundcloud-key', async () => await fetchSoundCloudKey());
ipcMain.handle('open-external', async (e, url) => shell.openExternal(url));

ipcMain.on('update-app-settings', (e, s) => {
  const needsReconnect = s.discordRPC === true && (!rpc);
  appSettings = { ...appSettings, ...s };
  createTray();
  
  if (appSettings.discordRPC) {
    if (needsReconnect) {
      initRPC();
    }
  } else {
    if (rpc) {
      try {
        rpc.destroy();
      } catch (err) {}
      rpc = null;
    }
    isConnecting = false;
  }

  if (app.isPackaged) {
    app.setLoginItemSettings({
      openAtLogin: appSettings.autoStart,
      path: app.getPath('exe')
    });
  }
});

async function initRPC(retries = 5) {
  if (!appSettings.discordRPC) return;
  
  if (rpc) {
    try { rpc.destroy(); } catch(e) {}
    rpc = null;
  }

  rpc = new DiscordRPCClient({ clientId, transport: 'ipc' });
  
  rpc.on('ready', () => {
    console.log('Discord RPC Ready');
    if (lastTrack) updatePresence(lastTrack);
    else updatePresence(null);
  });

  rpc.on('disconnected', () => {
    rpc = null;
  });

  try {
    await rpc.connect();
  } catch (e) {
    console.error('Discord RPC Connection Error');
    rpc = null;
    if (retries > 0 && appSettings.discordRPC) {
      setTimeout(() => initRPC(retries - 1), 10000);
    }
  }
}

async function updatePresence(track) {
  if (!appSettings.discordRPC || !rpc) return;
  try {
    const activity = {
      details: track ? `Listening to ${track.title.slice(0, 120)}` : 'Exploring Frequencies',
      state: track ? `by ${track.artist.slice(0, 120)}` : 'Idle',
      largeImageKey: 'aether_logo',
      largeImageText: 'Aether Audio',
      instance: false
    };

    if (track) {
      activity.startTimestamp = new Date();
      if (track.permalink && track.permalink.startsWith('http')) {
        activity.buttons = [{ label: 'Listen on SoundCloud', url: track.permalink }];
      }
    }

    await rpc.setActivity(activity);
  } catch (e) {
    // If setting activity fails, don't crash, just log
    console.error('RPC Presence Update Failed');
  }
}

async function fetchSoundCloudKey() {
  try {
    const mainPage = await simpleFetch('https://soundcloud.com/discover');
    const scriptRegex = /<script crossorigin src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+\.js)"><\/script>/g;
    let match, scriptUrl;
    while ((match = scriptRegex.exec(mainPage)) !== null) { if (match[1]) scriptUrl = match[1]; }
    if (!scriptUrl) return 'a281614d7f34dc30b665dfcaa3ed7505';
    const scriptContent = await simpleFetch(scriptUrl);
    const idMatch = scriptContent.match(/client_id:"([a-zA-Z0-9]{32})"/);
    return idMatch ? idMatch[1] : 'a281614d7f34dc30b665dfcaa3ed7505';
  } catch (error) { return 'a281614d7f34dc30b665dfcaa3ed7505'; }
}

function simpleFetch(url) {
  return new Promise((resolve, reject) => {
    const request = net.request(url);
    let body = '';
    request.on('response', (response) => {
      response.on('data', (chunk) => body += chunk.toString());
      response.on('end', () => resolve(body));
    });
    request.on('error', reject);
    request.end();
  });
}

function createTray() {
  if (!appSettings.showTrayIcon) { if (tray) { tray.destroy(); tray = null; } return; }
  if (tray) return;
  const iconPath = path.join(__dirname, '../icon.png');
  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Aether', click: () => mainWindow.show() },
    { type: 'separator' },
    { label: 'Play/Pause', click: () => mainWindow.webContents.send('toggle-play-tray') },
    { label: 'Next Track', click: () => mainWindow.webContents.send('next-track-tray') },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } }
  ]);
  tray.setToolTip('Aether');
  tray.setContextMenu(contextMenu);
}

function registerShortcuts() {
  globalShortcut.unregisterAll();
  globalShortcut.register('MediaPlayPause', () => mainWindow.webContents.send('toggle-play-tray'));
  globalShortcut.register('MediaNextTrack', () => mainWindow.webContents.send('next-track-tray'));
  globalShortcut.register('MediaPreviousTrack', () => mainWindow.webContents.send('prev-track-tray'));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: MIN_WINDOW_WIDTH, height: MIN_WINDOW_HEIGHT, minWidth: MIN_WINDOW_WIDTH, minHeight: MIN_WINDOW_HEIGHT,
    frame: false, transparent: true, title: 'Aether',
    backgroundColor: '#00000000', resizable: true, 
    icon: path.join(__dirname, '../icon.png'),
    webPreferences: { 
      nodeIntegration: false, 
      contextIsolation: true, 
      preload: path.join(__dirname, 'preload.cjs'), 
      webSecurity: true 
    },
  });

  mainWindow.on('close', (e) => { if (appSettings.closeToTray && !app.isQuitting) { e.preventDefault(); mainWindow.hide(); } });

  mainWindow.webContents.session.webRequest.onHeadersReceived({ urls: ['https://*.sndcdn.com/*', 'https://*.soundcloud.com/*'] }, (d, cb) => {
    const rh = Object.assign({}, d.responseHeaders);
    rh['Access-Control-Allow-Origin'] = ['*'];
    cb({ responseHeaders: rh });
  });

  if (process.env.NODE_ENV === 'development') mainWindow.loadURL('http://localhost:5173');
  else mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

  mainWindow.on('maximize', () => mainWindow.webContents.send('window-maximized'));
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window-unmaximized'));
}

ipcMain.handle('authenticate-soundcloud', async () => {
  return new Promise((resolve) => {
    const authWindow = new BrowserWindow({ width: 600, height: 800, alwaysOnTop: true, autoHideMenuBar: true, webPreferences: { partition: 'persist:soundcloud_auth' } });
    const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    authWindow.webContents.setUserAgent(userAgent);
    let found = false;
    authWindow.webContents.session.webRequest.onBeforeSendHeaders({ urls: ['https://api-v2.soundcloud.com/*'] }, (d, cb) => {
      const auth = d.requestHeaders['Authorization'];
      const cid = new URL(d.url).searchParams.get('client_id');
      if (auth && cid && !found) { found = true; authWindow.close(); resolve({ token: auth, clientId: cid }); }
      cb({ requestHeaders: d.requestHeaders });
    });
    authWindow.loadURL('https://soundcloud.com/signin', { userAgent });
    authWindow.on('closed', () => { if (!found) resolve(null); });
  });
});

app.whenReady().then(() => { createWindow(); createTray(); registerShortcuts(); initRPC(); });
app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
