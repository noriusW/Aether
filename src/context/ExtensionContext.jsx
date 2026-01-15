import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { get, set } from 'idb-keyval';
import { fetchExtensionStore, getDefaultStoreConfig, isValidHttpUrl, loadExtensionModule, normalizeStoreConfig } from '../services/extensions';

const STORE_CONFIG_KEY = 'extensionStoreConfig';
const STORE_CACHE_KEY = 'extensionStoreCache';
const INSTALLED_KEY = 'installedExtensions';
const MAX_CONNECTION_ATTEMPTS = 5;

const ExtensionContext = createContext({
  storeConfig: getDefaultStoreConfig(),
  availableExtensions: [],
  installedExtensions: [],
  extensionThemes: [],
  extensionViews: [],
  extensionCss: [],
  appShell: null,
  extensionErrors: [],
  extensionApis: {},
  loadingStore: false,
  storeError: null,
  connectionAttempts: {},
  blockedExtensions: [],
  refreshStore: () => {},
  updateStoreConfig: () => {},
  installExtension: () => {},
  removeExtension: () => {},
  toggleExtension: () => {},
  manualRetry: () => {}
});

export const useExtensions = () => useContext(ExtensionContext);

const normalizeContribution = (input = {}) => ({
  themes: Array.isArray(input.themes) ? input.themes : [],
  views: Array.isArray(input.views) ? input.views : [],
  css: Array.isArray(input.css) ? input.css : input.css ? [input.css] : [],
  appShell: input.appShell || null,
  api: input.api || null
});

const activateExtension = async (module, extension, collector) => {
  const entry = module?.default || module;
  if (!entry) return;

  const api = {
    registerTheme: (theme) => collector.themes.push(theme),
    registerView: (view) => collector.views.push(view),
    registerCss: (css) => {
      if (Array.isArray(css)) collector.css.push(...css);
      else if (css) collector.css.push(css);
    },
    registerAppShell: (shell) => { collector.appShell = shell; },
    registerApi: (apiImpl) => { collector.api = apiImpl; },
    extension
  };

  if (typeof entry.activate === 'function') {
    const result = await entry.activate(api);
    const contribution = normalizeContribution(result);
    collector.themes.push(...contribution.themes);
    collector.views.push(...contribution.views);
    collector.css.push(...contribution.css);
    if (contribution.appShell) collector.appShell = contribution.appShell;
    if (contribution.api) collector.api = contribution.api;
    return;
  }

  if (typeof entry === 'function') {
    const result = await entry(api);
    const contribution = normalizeContribution(result);
    collector.themes.push(...contribution.themes);
    collector.views.push(...contribution.views);
    collector.css.push(...contribution.css);
    if (contribution.appShell) collector.appShell = contribution.appShell;
    if (contribution.api) collector.api = contribution.api;
    return;
  }

  if (typeof entry === 'object') {
    const contribution = normalizeContribution(entry);
    collector.themes.push(...contribution.themes);
    collector.views.push(...contribution.views);
    collector.css.push(...contribution.css);
    if (contribution.appShell) collector.appShell = contribution.appShell;
    if (contribution.api) collector.api = contribution.api;
  }
};

export const ExtensionProvider = ({ children }) => {
  const [storeConfig, setStoreConfig] = useState(getDefaultStoreConfig());
  const [availableExtensions, setAvailableExtensions] = useState([]);
  const [installedExtensions, setInstalledExtensions] = useState([]);
  const [extensionThemes, setExtensionThemes] = useState([]);
  const [extensionViews, setExtensionViews] = useState([]);
  const [extensionCss, setExtensionCss] = useState([]);
  const [appShell, setAppShell] = useState(null);
  const [extensionErrors, setExtensionErrors] = useState([]);
  const [extensionApis, setExtensionApis] = useState({});
  const [loadingStore, setLoadingStore] = useState(false);
  const [storeError, setStoreError] = useState(null);
  
  const [connectionAttempts, setConnectionAttempts] = useState({});
  const [blockedExtensions, setBlockedExtensions] = useState([]);

  useEffect(() => {
    const init = async () => {
      const [storedConfig, storedInstalled, cachedStore] = await Promise.all([
        get(STORE_CONFIG_KEY),
        get(INSTALLED_KEY),
        get(STORE_CACHE_KEY)
      ]);
      if (storedConfig) setStoreConfig(normalizeStoreConfig(storedConfig));
      if (Array.isArray(storedInstalled)) {
        setInstalledExtensions(storedInstalled.map((item) => ({
          enabled: item?.enabled !== false,
          ...item
        })));
      }
      if (cachedStore?.items) setAvailableExtensions(cachedStore.items);
    };
    init();
  }, []);

  const refreshStore = useCallback(async () => {
    setLoadingStore(true);
    setStoreError(null);
    try {
      const items = await fetchExtensionStore(storeConfig);
      setAvailableExtensions(items);
      await set(STORE_CACHE_KEY, { ts: Date.now(), items, config: storeConfig });
    } catch (e) {
      const cached = await get(STORE_CACHE_KEY);
      if (cached?.items) setAvailableExtensions(cached.items);
      setStoreError(e?.message || 'Failed to load store');
    } finally {
      setLoadingStore(false);
    }
  }, [storeConfig]);

  const updateStoreConfig = useCallback((patch) => {
    const next = normalizeStoreConfig({ ...storeConfig, ...patch });
    setStoreConfig(next);
    set(STORE_CONFIG_KEY, next);
  }, [storeConfig]);

  const installExtension = useCallback((extension) => {
    setInstalledExtensions((prev) => {
      const existing = prev.find((item) => item.id === extension.id);
      const next = existing
        ? prev.map((item) => item.id === extension.id ? { ...item, ...extension } : item)
        : [{ ...extension, enabled: true, installedAt: Date.now() }, ...prev];
      set(INSTALLED_KEY, next);
      return next;
    });
    setBlockedExtensions(prev => prev.filter(id => id !== extension.id));
    setConnectionAttempts(prev => ({ ...prev, [extension.id]: 0 }));
  }, []);

  const removeExtension = useCallback((id) => {
    setInstalledExtensions((prev) => {
      const next = prev.filter((item) => item.id !== id);
      set(INSTALLED_KEY, next);
      return next;
    });
    setBlockedExtensions(prev => prev.filter(blockedId => blockedId !== id));
    setConnectionAttempts(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const toggleExtension = useCallback((id) => {
    setInstalledExtensions((prev) => {
      const next = prev.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item);
      set(INSTALLED_KEY, next);
      return next;
    });
    setBlockedExtensions(prev => prev.filter(blockedId => blockedId !== id));
    setConnectionAttempts(prev => ({ ...prev, [id]: 0 }));
  }, []);

  const manualRetry = useCallback((id) => {
    setBlockedExtensions(prev => prev.filter(blockedId => blockedId !== id));
    setConnectionAttempts(prev => ({ ...prev, [id]: 0 }));
  }, []);

  const loadExtensions = useCallback(async () => {
    const enabled = installedExtensions.filter((item) => item.enabled !== false);
    
    const themes = [];
    const views = [];
    const css = [];
    const errors = [];
    let shell = null;
    const apis = {};

    for (const extension of enabled) {
      if (blockedExtensions.includes(extension.id)) {
        errors.push({ id: extension.id, message: `Connection blocked. Manual retry required.` });
        continue;
      }

      if (!isValidHttpUrl(extension.entry)) {
        errors.push({ id: extension.id, message: 'Invalid entry URL' });
        continue;
      }
      
      const collector = { themes: [], views: [], css: [], appShell: null, api: null };
      try {
        const mod = await loadExtensionModule(extension.entry);
        await activateExtension(mod, extension, collector);
        
        collector.themes.forEach((theme) => themes.push({ ...theme, source: extension.id }));
        collector.views.forEach((view) => views.push({ ...view, source: extension.id }));
        collector.css.forEach((style) => css.push({ id: extension.id, css: style }));
        if (collector.appShell) shell = collector.appShell;
        if (collector.api) apis[extension.id] = collector.api;
        
        setConnectionAttempts(prev => ({ ...prev, [extension.id]: 0 }));
      } catch (e) {
        const currentAttempts = (connectionAttempts[extension.id] || 0) + 1;
        setConnectionAttempts(prev => ({ ...prev, [extension.id]: currentAttempts }));
        
        if (currentAttempts >= MAX_CONNECTION_ATTEMPTS) {
           setBlockedExtensions(prev => [...prev, extension.id]);
           errors.push({ id: extension.id, message: `Connection blocked after ${MAX_CONNECTION_ATTEMPTS} failures.` });
        } else {
           errors.push({ id: extension.id, message: e?.message || 'Extension failed to load' });
        }
      }
    }

    setExtensionThemes(themes);
    setExtensionViews(views);
    setExtensionCss(css);
    setAppShell(shell);
    setExtensionErrors(errors);
    setExtensionApis(apis);
  }, [installedExtensions, blockedExtensions, connectionAttempts]);

  useEffect(() => {
    loadExtensions();
  }, [installedExtensions]);

  const value = useMemo(() => ({
    storeConfig,
    availableExtensions,
    installedExtensions,
    extensionThemes,
    extensionViews,
    extensionCss,
    appShell,
    extensionErrors,
    extensionApis,
    loadingStore,
    storeError,
    connectionAttempts,
    blockedExtensions,
    refreshStore,
    updateStoreConfig,
    installExtension,
    removeExtension,
    toggleExtension,
    manualRetry
  }), [
    storeConfig,
    availableExtensions,
    installedExtensions,
    extensionThemes,
    extensionViews,
    extensionCss,
    appShell,
    extensionErrors,
    extensionApis,
    loadingStore,
    storeError,
    connectionAttempts,
    blockedExtensions,
    refreshStore,
    updateStoreConfig,
    installExtension,
    removeExtension,
    toggleExtension,
    manualRetry
  ]);

  return <ExtensionContext.Provider value={value}>{children}</ExtensionContext.Provider>;
};
