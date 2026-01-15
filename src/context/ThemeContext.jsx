import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { useUserData } from './UserDataContext';
import { useExtensions } from './ExtensionContext';
import { BUILT_IN_THEMES } from '../themes/themes';
import { applyTheme, resolveTheme } from '../utils/theme';

const ThemeContext = createContext({
  theme: BUILT_IN_THEMES[0],
  themes: BUILT_IN_THEMES,
  themeCss: ''
});

export const useTheme = () => useContext(ThemeContext);

const mergeThemes = (customThemes = [], extensionThemes = []) => {
  const byId = new Map();
  [...(customThemes || []), ...(extensionThemes || []), ...BUILT_IN_THEMES].forEach((theme) => {
    if (!theme?.id) return;
    byId.set(theme.id, theme);
  });
  return Array.from(byId.values());
};

export const ThemeProvider = ({ children }) => {
  const { visualSettings } = useUserData();
  const { extensionThemes, extensionCss } = useExtensions();
  const customThemes = visualSettings?.customThemes || [];
  const themes = useMemo(() => mergeThemes(customThemes, extensionThemes), [customThemes, extensionThemes]);
  const theme = useMemo(() => resolveTheme({
    themeId: visualSettings?.themeId,
    customThemes,
    extensionThemes
  }), [visualSettings?.themeId, customThemes, extensionThemes]);

  useEffect(() => {
    applyTheme(theme, {
      accentColor: visualSettings?.accentColor,
      palette: visualSettings?.palette,
      fontFamily: visualSettings?.fontFamily
    });
  }, [theme, visualSettings?.accentColor, visualSettings?.palette, visualSettings?.fontFamily]);

  const themeCss = useMemo(() => {
    const layers = [];
    if (theme?.css) layers.push(theme.css);
    if (visualSettings?.customCss) layers.push(visualSettings.customCss);
    if (extensionCss?.length) layers.push(...extensionCss.map((entry) => entry.css));
    return layers.filter(Boolean).join('\n');
  }, [theme, visualSettings?.customCss, extensionCss]);

  const value = useMemo(() => ({
    theme,
    themes,
    themeCss
  }), [theme, themes, themeCss]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const ThemeStyle = () => {
  const { themeCss } = useTheme();
  if (!themeCss) return null;
  return <style>{themeCss}</style>;
};
