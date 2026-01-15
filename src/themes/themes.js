export const DEFAULT_THEME_ID = 'aether-noir';

export const BUILT_IN_THEMES = [
  {
    id: 'aether-noir',
    name: 'Aether Noir',
    description: 'Default glass noir.',
    isDark: true,
    variables: {
      '--accent': '#6366f1',
      '--accent-strong': '#4f46e5',
      '--accent-muted': '#a5b4fc',
      '--accent-soft': 'rgba(99, 102, 241, 0.2)',
      '--accent-glow': 'rgba(99, 102, 241, 0.35)',
      '--surface': '#050505',
      '--surface-2': '#0a0a0a',
      '--surface-3': '#111111',
      '--text-primary': '#f5f5f5',
      '--text-secondary': 'rgba(255, 255, 255, 0.75)',
      '--text-muted': 'rgba(255, 255, 255, 0.45)',
      '--border-subtle': 'rgba(255, 255, 255, 0.08)',
      '--border-strong': 'rgba(255, 255, 255, 0.18)',
      '--shadow-soft': 'rgba(0, 0, 0, 0.7)'
    },
    palette: ['#6366f1', '#22d3ee', '#14b8a6', '#a855f7', '#f97316'],
    background: {
      type: 'gradient',
      colors: ['#050505', '#0b0b0b', '#111827'],
      overlay: 0.65,
      blur: 0
    },
    fonts: {
      body: "'Inter', system-ui, -apple-system, sans-serif",
      display: "'Inter', system-ui, -apple-system, sans-serif"
    }
  },
  {
    id: 'spotify-echo',
    name: 'Spotify Echo',
    description: 'Carbon black with Spotify green.',
    isDark: true,
    variables: {
      '--accent': '#1db954',
      '--accent-strong': '#1ed760',
      '--accent-muted': '#7ee787',
      '--accent-soft': 'rgba(29, 185, 84, 0.2)',
      '--accent-glow': 'rgba(29, 185, 84, 0.35)',
      '--surface': '#121212',
      '--surface-2': '#181818',
      '--surface-3': '#1f1f1f',
      '--text-primary': '#f5f5f5',
      '--text-secondary': 'rgba(245, 245, 245, 0.78)',
      '--text-muted': 'rgba(179, 179, 179, 0.7)',
      '--border-subtle': 'rgba(255, 255, 255, 0.08)',
      '--border-strong': 'rgba(255, 255, 255, 0.18)',
      '--shadow-soft': 'rgba(0, 0, 0, 0.8)'
    },
    palette: ['#1db954', '#14532d', '#0f172a', '#334155', '#94a3b8'],
    background: {
      type: 'gradient',
      colors: ['#0b0b0b', '#121212', '#1a1a1a'],
      overlay: 0.7,
      blur: 0
    },
    fonts: {
      body: "'Inter', system-ui, -apple-system, sans-serif",
      display: "'Inter', system-ui, -apple-system, sans-serif"
    }
  },
  {
    id: 'aether-ember',
    name: 'Aether Ember',
    description: 'Warm ember glow with copper accents.',
    isDark: true,
    variables: {
      '--accent': '#f97316',
      '--accent-strong': '#fb923c',
      '--accent-muted': '#fdba74',
      '--accent-soft': 'rgba(249, 115, 22, 0.2)',
      '--accent-glow': 'rgba(249, 115, 22, 0.35)',
      '--surface': '#120d08',
      '--surface-2': '#1a120b',
      '--surface-3': '#26160d',
      '--text-primary': '#fef3e8',
      '--text-secondary': 'rgba(254, 243, 232, 0.78)',
      '--text-muted': 'rgba(252, 211, 170, 0.55)',
      '--border-subtle': 'rgba(255, 255, 255, 0.1)',
      '--border-strong': 'rgba(255, 255, 255, 0.2)',
      '--shadow-soft': 'rgba(0, 0, 0, 0.75)'
    },
    palette: ['#f97316', '#f59e0b', '#fbbf24', '#f43f5e', '#fb7185'],
    background: {
      type: 'gradient',
      colors: ['#0d0a07', '#1f1308', '#2a1407'],
      overlay: 0.6,
      blur: 0
    },
    fonts: {
      body: "'Inter', system-ui, -apple-system, sans-serif",
      display: "'Inter', system-ui, -apple-system, sans-serif"
    }
  },
  {
    id: 'aether-ice',
    name: 'Aether Ice',
    description: 'Cold glass with cyan voltage.',
    isDark: true,
    variables: {
      '--accent': '#22d3ee',
      '--accent-strong': '#0ea5e9',
      '--accent-muted': '#7dd3fc',
      '--accent-soft': 'rgba(34, 211, 238, 0.2)',
      '--accent-glow': 'rgba(34, 211, 238, 0.35)',
      '--surface': '#05070b',
      '--surface-2': '#0b1017',
      '--surface-3': '#111827',
      '--text-primary': '#e2e8f0',
      '--text-secondary': 'rgba(226, 232, 240, 0.78)',
      '--text-muted': 'rgba(148, 163, 184, 0.6)',
      '--border-subtle': 'rgba(255, 255, 255, 0.08)',
      '--border-strong': 'rgba(255, 255, 255, 0.18)',
      '--shadow-soft': 'rgba(0, 0, 0, 0.75)'
    },
    palette: ['#22d3ee', '#0ea5e9', '#6366f1', '#38bdf8', '#c7d2fe'],
    background: {
      type: 'gradient',
      colors: ['#05070b', '#0b1120', '#111827'],
      overlay: 0.62,
      blur: 0
    },
    fonts: {
      body: "'Inter', system-ui, -apple-system, sans-serif",
      display: "'Inter', system-ui, -apple-system, sans-serif"
    }
  }
];
