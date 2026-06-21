import { create } from 'zustand';
import type { Deck, CardWithMetadata, ValidationResult } from '../lib/data/card-types';
import { loadCards, buildCardIndex } from '../lib/data/card-loader';
import { validateDeck } from '../lib/rules/deck-validator';
import {
  loadDecks,
  saveDeck,
  deleteDeck,
  getActiveDeck,
  setActiveDeck,
} from '../lib/storage/deck-storage';

interface DeckStore {
  // Card database
  cards: CardWithMetadata[];
  cardIndex: Map<string, CardWithMetadata>;
  cardsLoading: boolean;
  cardsError: string | null;

  // Current deck being edited
  currentDeck: Deck | null;
  validationResult: ValidationResult | null;

  // Saved decks
  savedDecks: Deck[];

  // Actions
  initializeCards: () => Promise<void>;
  setCurrentDeck: (deck: Deck | null) => void;
  validateCurrentDeck: () => void;
  saveCurrentDeck: () => void;
  loadSavedDecks: () => void;
  deleteSavedDeck: (name: string) => void;
  loadDeck: (name: string) => void;
  newDeck: () => void;
}

export const useDeckStore = create<DeckStore>((set, get) => ({
  // Initial state
  cards: [],
  cardIndex: new Map(),
  cardsLoading: false,
  cardsError: null,
  currentDeck: null,
  validationResult: null,
  savedDecks: [],

  // Initialize card database
  initializeCards: async () => {
    set({ cardsLoading: true, cardsError: null });
    try {
      const cards = await loadCards();
      const cardIndex = buildCardIndex(cards);
      set({ cards, cardIndex, cardsLoading: false });

      // Load active deck if exists
      const activeDeck = getActiveDeck();
      if (activeDeck) {
        set({ currentDeck: activeDeck });
        get().validateCurrentDeck();
      }
    } catch (error) {
      set({
        cardsLoading: false,
        cardsError: error instanceof Error ? error.message : 'Failed to load cards',
      });
    }
  },

  // Set current deck
  setCurrentDeck: (deck) => {
    set({ currentDeck: deck });
    setActiveDeck(deck);
    if (deck) {
      get().validateCurrentDeck();
    } else {
      set({ validationResult: null });
    }
  },

  // Validate current deck
  validateCurrentDeck: () => {
    const { currentDeck, cardIndex } = get();
    if (!currentDeck) {
      set({ validationResult: null });
      return;
    }

    const validationResult = validateDeck(currentDeck, cardIndex);
    set({ validationResult });
  },

  // Save current deck
  saveCurrentDeck: () => {
    const { currentDeck } = get();
    if (!currentDeck) {
      return;
    }

    saveDeck(currentDeck);
    get().loadSavedDecks();
  },

  // Load saved decks
  loadSavedDecks: () => {
    const savedDecks = loadDecks();
    set({ savedDecks });
  },

  // Delete saved deck
  deleteSavedDeck: (name) => {
    deleteDeck(name);
    get().loadSavedDecks();

    // If deleted deck was active, clear it
    const { currentDeck } = get();
    if (currentDeck?.name === name) {
      get().setCurrentDeck(null);
    }
  },

  // Load deck by name
  loadDeck: (name) => {
    const { savedDecks } = get();
    const deck = savedDecks.find((d) => d.name === name);
    if (deck) {
      get().setCurrentDeck(deck);
    }
  },

  // Create new deck
  newDeck: () => {
    const newDeck: Deck = {
      name: `New Deck ${Date.now()}`,
      cards: [],
    };
    get().setCurrentDeck(newDeck);
  },
}));
