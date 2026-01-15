import { BUILT_IN_THEMES, DEFAULT_THEME_ID } from '../themes/themes';

const hexToRgb = (hex) => {
  if (!hex) return null;
  const cleaned = hex.toString().trim().replace('#', '');
  if (![3, 6].includes(cleaned.length)) return null;
  const full = cleaned.length === 3
    ? cleaned.split('').map((c) => c + c).join('')
    : cleaned;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
};

const rgbToString = (rgb) => (rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : null);

const pickTheme = (themeId, customThemes = [], extensionThemes = []) => {
  const all = [...(customThemes || []), ...(extensionThemes || []), ...BUILT_IN_THEMES];
  return all.find((t) => t.id === themeId) || all.find((t) => t.id === DEFAULT_THEME_ID) || BUILT_IN_THEMES[0];
};

const normalizePalette = (palette = []) => {
  const cleaned = palette.filter(Boolean);
  if (cleaned.length >= 5) return cleaned.slice(0, 5);
  const fallback = BUILT_IN_THEMES[0]?.palette || [];
  return [...cleaned, ...fallback].slice(0, 5);
};

const setCssVar = (root, key, value) => {
  if (!key) return;
  if (value === undefined || value === null || value === '') {
    root.style.removeProperty(key);
    return;
  }
  root.style.setProperty(key, value);
};

export const resolveTheme = ({ themeId, customThemes = [], extensionThemes = [] }) => (
  pickTheme(themeId, customThemes, extensionThemes)
);

export const resolveBackground = (theme, overrides = {}, paletteOverride = []) => {
  const base = theme?.background || {};
  const mode = overrides?.mode || 'theme';
  if (mode === 'theme') return base;
  const palette = normalizePalette(paletteOverride || theme?.palette || []);
  const colors = overrides?.colors?.length ? overrides.colors : palette;
  return {
    ...base,
    ...overrides,
    colors
  };
};

export const applyTheme = (theme, options = {}) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const vars = theme?.variables || {};

  Object.entries(vars).forEach(([key, value]) => setCssVar(root, key, value));

  const accent = options.accentColor || vars['--accent'];
  const accentRgb = hexToRgb(accent);
  if (accent) {
    setCssVar(root, '--accent', accent);
    setCssVar(root, '--accent-rgb', rgbToString(accentRgb));
    const accentStrong = options.accentColor || vars['--accent-strong'] || accent;
    setCssVar(root, '--accent-strong', accentStrong);
    setCssVar(root, '--accent-strong-rgb', rgbToString(hexToRgb(accentStrong)));
    setCssVar(root, '--accent-muted', vars['--accent-muted'] || `rgba(${rgbToString(accentRgb)}, 0.7)`);
    setCssVar(root, '--accent-soft', vars['--accent-soft'] || `rgba(${rgbToString(accentRgb)}, 0.2)`);
    setCssVar(root, '--accent-glow', vars['--accent-glow'] || `rgba(${rgbToString(accentRgb)}, 0.35)`);
  }

  const surface = vars['--surface'];
  const surface2 = vars['--surface-2'];
  const surface3 = vars['--surface-3'];
  setCssVar(root, '--surface-rgb', rgbToString(hexToRgb(surface)));
  setCssVar(root, '--surface-2-rgb', rgbToString(hexToRgb(surface2 || surface)));
  setCssVar(root, '--surface-3-rgb', rgbToString(hexToRgb(surface3 || surface2 || surface)));

  const palette = normalizePalette(options.palette || theme?.palette || []);
  palette.forEach((color, idx) => {
    const key = `--palette-${idx + 1}`;
    setCssVar(root, key, color);
    setCssVar(root, `${key}-rgb`, rgbToString(hexToRgb(color)));
  });

  const fontFamily = options.fontFamily || theme?.fonts?.body;
  const displayFamily = theme?.fonts?.display || fontFamily;
  if (fontFamily) setCssVar(root, '--font-body', fontFamily);
  if (displayFamily) setCssVar(root, '--font-display', displayFamily);

  if (theme?.id) root.setAttribute('data-theme', theme.id);
};
