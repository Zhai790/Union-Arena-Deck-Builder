import type { Deck } from '../data/card-types';

const DECKS_KEY = 'union-arena-decks';
const ACTIVE_DECK_KEY = 'union-arena-active-deck';

/**
 * Load all saved decks from localStorage
 */
export function loadDecks(): Deck[] {
  try {
    const stored = localStorage.getItem(DECKS_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load decks:', error);
    return [];
  }
}

/**
 * Save all decks to localStorage
 */
export function saveDecks(decks: Deck[]): void {
  try {
    localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  } catch (error) {
    console.error('Failed to save decks:', error);
    throw error;
  }
}

/**
 * Add or update a deck
 */
export function saveDeck(deck: Deck): void {
  const decks = loadDecks();
  const existingIndex = decks.findIndex((d) => d.name === deck.name);

  const timestamp = new Date().toISOString();
  const updatedDeck = {
    ...deck,
    updatedAt: timestamp,
    createdAt: deck.createdAt || timestamp,
  };

  if (existingIndex >= 0) {
    decks[existingIndex] = updatedDeck;
  } else {
    decks.push(updatedDeck);
  }

  saveDecks(decks);
}

/**
 * Delete a deck by name
 */
export function deleteDeck(name: string): void {
  const decks = loadDecks();
  const filtered = decks.filter((d) => d.name !== name);
  saveDecks(filtered);
}

/**
 * Get the currently active deck (the one being edited)
 */
export function getActiveDeck(): Deck | null {
  try {
    const stored = localStorage.getItem(ACTIVE_DECK_KEY);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load active deck:', error);
    return null;
  }
}

/**
 * Set the currently active deck
 */
export function setActiveDeck(deck: Deck | null): void {
  try {
    if (deck === null) {
      localStorage.removeItem(ACTIVE_DECK_KEY);
    } else {
      localStorage.setItem(ACTIVE_DECK_KEY, JSON.stringify(deck));
    }
  } catch (error) {
    console.error('Failed to save active deck:', error);
    throw error;
  }
}

/**
 * Export deck as JSON string
 */
export function exportDeckJSON(deck: Deck): string {
  return JSON.stringify(deck, null, 2);
}

/**
 * Import deck from JSON string
 */
export function importDeckJSON(jsonString: string): Deck {
  try {
    const deck = JSON.parse(jsonString);

    // Validate basic structure
    if (!deck.name || !Array.isArray(deck.cards)) {
      throw new Error('Invalid deck format: must have name and cards array');
    }

    // Validate each card entry
    for (const card of deck.cards) {
      if (!card.id || typeof card.count !== 'number') {
        throw new Error('Invalid card format: must have id and count');
      }
    }

    return deck;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
    }
    throw error;
  }
}
