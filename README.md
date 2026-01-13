# Aether // Modern SoundCloud Player

![Aether Icon](icon.png)

A desktop music player for SoundCloud focused on fast discovery, clean UI, and reliable playback.

## Features

- Glassmorphism UI with adjustable blur and opacity.
- Smart mixes built from your likes with solid fallbacks.
- Custom Discord Rich Presence integration.
- Intent-aware search for mood, genre, era, and artist hints.
- Local collections and playlists.
- Smart offline cache for metadata and results.
- Dynamic audio engine with visualizer and 10-band EQ.

## How the algorithms work

- Smart Search: extracts mood, genre, era, and artist hints, removes filler words, then builds a compact SoundCloud query.
- Recommendations: uses recent likes as seeds, pulls related tracks, removes duplicates/likes, and fills gaps with genre-based search.
- Mood Mix: selects keyword sets from the vibe slider, scores tracks by keyword hits, and backfills if the pool is small.
- Daily Mixes: builds themed mixes from related tracks plus a genre-based fallback, deduped and filtered.
- Offline Cache: stores search/related/artist/playlist metadata with TTL and LRU pruning, and serves cached data when offline.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/noriusW/Aether.git
   cd Aether
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in development mode:
   ```bash
   npm run electron
   ```

## Tech Stack

- Frontend: React 19, Vite, Tailwind CSS 4, Framer Motion
- Desktop: Electron 39
- State & Data: Context API, IDB-Keyval (IndexedDB)
- API: SoundCloud v2 Integration

## Deployment

To build a production-ready installer:

```bash
npm run build:electron
```

The output will be available in the `dist_electron` directory.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
Created by [norius](https://norius.ru)
