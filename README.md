# Union Arena Deck Builder

A web-based deck building and optimization tool for the Union Arena TCG by Bushiroad.

## Current Status: Phase 1 Complete ✅

**Barebones foundation** with core validation and persistence functionality.

### Features Implemented

- ✅ **Card Data Ingestion**: Fetches card data from [apitcg/union-arena-tcg-data](https://github.com/apitcg/union-arena-tcg-data)
- ✅ **Real-time Rule Validation**:
  - 50 cards exactly
  - 4-copy limit per card (parses card-specific restrictions)
  - IP Lock (all cards must be from same series)
  - Mono-color (all cards must share same primary energy color)
- ✅ **Deck Persistence**: Save/load decks to localStorage
- ✅ **Deck Export**: Export decks as JSON files
- ✅ **Minimal UI**: Functional text-based interface

### What's Next

- **Phase 2** (Days 4-10): Deck optimization algorithm with synergy detection, curve analysis, and card upgrade recommendations
- **Phase 3** (Days 11-15): Context-aware grading (Rare Battles vs Meta Tierlist), deck comparison, meta tracking

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Zhai790/Union-Arena-Deck-Builder.git
cd Union-Arena-Deck-Builder

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Usage

1. **Import a Deck**: Paste deck in text or JSON format
2. **Validation**: See real-time validation results
3. **Save**: Save deck to localStorage for later use
4. **Export**: Download deck as text or JSON file

### Supported Deck Formats

**Text Format** (Recommended):
```
// Main Deck
4 x UA47BT-TKG-1-080
4 x UA47BT-TKG-1-081
3 x UA47BT-TKG-1-084
```

**JSON Format**:
```json
{
  "name": "My Deck Name",
  "cards": [
    { "id": "UA01BT-001", "count": 4 },
    { "id": "UA01BT-002", "count": 3 }
  ]
}
```

**Note**: Deck must have exactly 50 cards total (sum of all counts).

### Union Arena Rules

The validator enforces these rules:

1. **Deck Size**: Exactly 50 cards
2. **Copy Limit**: Maximum 4 copies per card (some cards have 3 or lower limits specified in their effect text)
3. **IP Lock**: All cards must be from the same series/franchise (e.g., all BLEACH or all Hunter x Hunter, no mixing)
4. **Mono-Color**: All cards must share the same primary energy color (Yellow, Purple, Green, etc.)

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **State Management**: Zustand
- **Data Source**: [apitcg/union-arena-tcg-data](https://github.com/apitcg/union-arena-tcg-data)
- **Storage**: localStorage (browser-based)

## Development Roadmap

### ✅ Phase 1: Barebones Foundation (Days 1-3)
- Card data loading with caching
- Rule validation engine
- Simple JSON import/export interface
- localStorage persistence

### 🚧 Phase 2: Optimization Algorithm (Days 4-10)
- Synergy detection system (tribal, mechanic, effect text parsing)
- Curve analysis and grading
- Deck scoring (consistency, synergy, curve, power level)
- Card upgrade recommendations

### 📅 Phase 3: Context-Aware Grading (Days 11-15)
- Format-specific grading (Rare Battles vs Meta Tierlist)
- Deck comparison feature
- Meta tracking preparation
- UI polish

## Project Structure

```
src/
├── lib/
│   ├── data/
│   │   ├── card-types.ts       # TypeScript interfaces
│   │   └── card-loader.ts      # Card data fetching
│   ├── rules/
│   │   ├── deck-validator.ts   # Main validator
│   │   ├── size-rule.ts        # 50-card rule
│   │   ├── copy-limit-rule.ts  # 4-copy rule
│   │   ├── ip-lock-rule.ts     # Series restriction
│   │   └── mono-color-rule.ts  # Color restriction
│   └── storage/
│       └── deck-storage.ts     # localStorage persistence
├── stores/
│   └── deck-store.ts           # Zustand state management
├── components/
│   ├── DeckInput.tsx           # JSON import interface
│   ├── ValidationResults.tsx   # Validation display
│   └── DeckExport.tsx          # Save/export controls
└── App.tsx                     # Main app
```

## Contributing

This project is in active development. Contributions welcome once Phase 2 is complete!

## Data Source

Card data is provided by the [J-W-A-Ships/Union_Arena](https://github.com/J-W-A-Ships/Union_Arena) repository. Data is fetched on app load and cached for 24 hours.

**Available IPs**: Tokyo Ghoul, BLEACH, Hunter x Hunter, Jujutsu Kaisen, Code Geass, Demon Slayer, One Punch Man, Attack on Titan, Black Clover, Evangelion, Fullmetal Alchemist, Kagurabachi, Kaiju No. 8, NIKKE, Solo Leveling, Rurouni Kenshin, Arknights, and more!

## License

MIT

## Acknowledgments

- Card data: [apitcg/union-arena-tcg-data](https://github.com/apitcg/union-arena-tcg-data)
- Game: Union Arena TCG by Bushiroad
