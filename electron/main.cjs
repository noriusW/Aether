const { app, BrowserWindow, ipcMain, shell, net, screen, Tray, Menu, globalShortcut } = require('electron');
const path = require('path');
const { DiscordRPCClient } = require('@ryuziii/discord-rpc');

let mainWindow;
let tray;
let rpc;
let lastTrack = null;
let isConnecting = false;
let rpcReady = false;
let rpcDisabledByError = false;
let rpcErrorCount = 0;
let rpcReconnectTimer = null;
let presenceTimer = null;
let pendingPresence = null;
let presenceHeartbeat = null;
let rpcShutdownTimer = null;
let rpcStopping = false;
const clientId = '1460554881508184074'; 


const MIN_WINDOW_WIDTH = 960;
const MIN_WINDOW_HEIGHT = 420;
const RPC_RETRY_LIMIT = 3;
const RPC_RETRY_DELAY_MS = 10000;
const RPC_PRESENCE_DEBOUNCE_MS = 500;
const RPC_PRESENCE_HEARTBEAT_MS = 60000;
let appSettings = {
  closeToTray: true,
  showTrayIcon: true,
  autoStart: false,
  discordRPC: true 
};

const sendRpcStatus = (payload) => {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('rpc-status', payload);
  }
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
  queuePresence(track);
});

ipcMain.handle('get-soundcloud-key', async () => await fetchSoundCloudKey());
ipcMain.handle('open-external', async (e, url) => shell.openExternal(url));

ipcMain.on('update-app-settings', (e, s) => {
  const wasDiscordRPCEnabled = appSettings.discordRPC;
  appSettings = { ...appSettings, ...s };
  createTray();
  
  if (appSettings.discordRPC) {
    if (!wasDiscordRPCEnabled) rpcDisabledByError = false;
    if (!rpc && !isConnecting && !rpcDisabledByError) initRPC();
  } else {
    stopRPC();
  }

  if (app.isPackaged) {
    app.setLoginItemSettings({
      openAtLogin: appSettings.autoStart,
      path: app.getPath('exe')
    });
  }
});

async function initRPC() {
  if (!appSettings.discordRPC || isConnecting || rpcDisabledByError) return;
  rpcStopping = false;
  isConnecting = true;
  rpcReady = false;
  
  if (rpc) {
    try {
      if (typeof rpc.removeAllListeners === 'function') rpc.removeAllListeners();
      rpc.destroy();
    } catch(e) {}
    rpc = null;
  }

  rpc = new DiscordRPCClient({ clientId, transport: 'ipc' });
  const rpcClient = rpc;
  const isStale = () => rpc !== rpcClient;
  if (typeof rpc.setAutoReconnect === 'function') {
    rpc.setAutoReconnect(false);
  }
  
  rpc.on('ready', () => {
    if (isStale()) return;
    console.log('Discord RPC Ready');
    sendRpcStatus({ code: 'ready' });
    isConnecting = false;
    rpcReady = true;
    rpcErrorCount = 0;
    startPresenceHeartbeat();
    queuePresence(lastTrack || null);
  });

  rpc.on('disconnected', () => {
    if (isStale()) return;
    rpc = null;
    isConnecting = false;
    rpcReady = false;
    if (!rpcStopping) sendRpcStatus({ code: 'reconnecting' });
    if (!rpcStopping) handleRpcError();
    rpcStopping = false;
  });

  rpc.on('error', (err) => {
    if (isStale()) return;
    console.error('Discord RPC Error', err);
    rpc = null;
    isConnecting = false;
    rpcReady = false;
    if (!rpcStopping) sendRpcStatus({ code: 'error', message: err?.message });
    if (!rpcStopping) handleRpcError();
    rpcStopping = false;
  });

  try {
    await rpc.connect();
  } catch (e) {
    if (isStale()) return;
    console.error('Discord RPC Connection Error');
    rpc = null;
    isConnecting = false;
    rpcReady = false;
    if (!rpcStopping) sendRpcStatus({ code: 'error', message: 'Connection failed' });
    if (!rpcStopping) handleRpcError();
    rpcStopping = false;
  }
}

function handleRpcError() {
  if (rpcStopping) return;
  rpcErrorCount += 1;
  if (presenceTimer) {
    clearTimeout(presenceTimer);
    presenceTimer = null;
  }
  if (presenceHeartbeat) {
    clearInterval(presenceHeartbeat);
    presenceHeartbeat = null;
  }
  if (rpcErrorCount >= RPC_RETRY_LIMIT) {
    rpcDisabledByError = true;
    console.warn('Discord RPC disabled after repeated errors.');
    sendRpcStatus({ code: 'disabled', message: 'Disabled after repeated errors.' });
    return;
  }
  if (!appSettings.discordRPC || rpcDisabledByError) return;
  if (rpcReconnectTimer) clearTimeout(rpcReconnectTimer);
  rpcReconnectTimer = setTimeout(() => initRPC(), RPC_RETRY_DELAY_MS);
}

function stopRPC() {
  rpcStopping = true;
  sendRpcStatus({ code: 'stopped' });
  if (rpcReconnectTimer) {
    clearTimeout(rpcReconnectTimer);
    rpcReconnectTimer = null;
  }
  if (presenceTimer) {
    clearTimeout(presenceTimer);
    presenceTimer = null;
  }
  if (presenceHeartbeat) {
    clearInterval(presenceHeartbeat);
    presenceHeartbeat = null;
  }
  if (rpcShutdownTimer) {
    clearTimeout(rpcShutdownTimer);
    rpcShutdownTimer = null;
  }
  pendingPresence = null;
  const rpcToClose = rpc;
  const wasReady = rpcReady;
  rpc = null;
  if (rpcToClose) {
    try {
      if (typeof rpcToClose.removeAllListeners === 'function') rpcToClose.removeAllListeners();
      if (typeof rpcToClose.setAutoReconnect === 'function') rpcToClose.setAutoReconnect(false);
      if (wasReady && typeof rpcToClose.clearActivity === 'function') rpcToClose.clearActivity();
    } catch (err) {}
    rpcShutdownTimer = setTimeout(() => {
      try {
        if (rpcToClose && typeof rpcToClose.disconnect === 'function') rpcToClose.disconnect();
        if (rpcToClose && typeof rpcToClose.destroy === 'function') rpcToClose.destroy();
      } catch (err) {}
      rpcShutdownTimer = null;
      rpcStopping = false;
    }, 400);
  } else {
    rpcStopping = false;
  }
  isConnecting = false;
  rpcReady = false;
  rpcDisabledByError = false;
  rpcErrorCount = 0;
}

function startPresenceHeartbeat() {
  if (presenceHeartbeat) clearInterval(presenceHeartbeat);
  presenceHeartbeat = setInterval(() => {
    if (!rpcReady || rpcDisabledByError) return;
    updatePresence(pendingPresence || lastTrack || null);
  }, RPC_PRESENCE_HEARTBEAT_MS);
}

function queuePresence(track) {
  pendingPresence = track;
  if (!rpcReady || rpcDisabledByError) return;
  if (presenceTimer) clearTimeout(presenceTimer);
  presenceTimer = setTimeout(() => {
    presenceTimer = null;
    updatePresence(pendingPresence);
  }, RPC_PRESENCE_DEBOUNCE_MS);
}

async function updatePresence(track) {
  if (!appSettings.discordRPC || !rpc || !rpcReady || rpcDisabledByError) return;
  try {
    const title = track?.title ? String(track.title).slice(0, 120) : 'Exploring Frequencies';
    const artist = track?.artist ? String(track.artist).slice(0, 120) : 'Idle';
    const activity = {
      details: track ? `Listening to ${title}` : title,
      state: track ? `by ${artist}` : artist,
      largeImageKey: 'aether_logo',
      largeImageText: 'Aether Audio',
      instance: false
    };

    if (track) {
      activity.startTimestamp = Math.floor(Date.now() / 1000);
      if (typeof track.permalink === 'string' && track.permalink.startsWith('http')) {
        activity.buttons = [{ label: 'Listen on SoundCloud', url: track.permalink }];
      }
    }

    await rpc.setActivity(activity);
  } catch (e) {
    // If setting activity fails, don't crash, just log
    console.error('RPC Presence Update Failed');
    sendRpcStatus({ code: 'error', message: 'Presence update failed.' });
    handleRpcError();
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
