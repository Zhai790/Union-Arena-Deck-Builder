import type { Deck } from '../data/card-types';

/**
 * Parse text deck format
 * Supports formats like:
 * - "4 x UA47BT-TKG-1-080"
 * - "4x UA47BT-TKG-1-080"
 * - "4 UA47BT-TKG-1-080"
 * - Ignores comment lines starting with "//" or "#"
 */
export function parseTextDeck(text: string, deckName?: string): Deck {
  const lines = text.split('\n');
  const cards: { id: string; count: number }[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) {
      continue;
    }

    // Match patterns like:
    // "4 x UA47BT-TKG-1-080"
    // "4x UA47BT-TKG-1-080"
    // "4 UA47BT-TKG-1-080"
    const match = trimmed.match(/^(\d+)\s*[x×]?\s+([A-Z0-9\-\/]+)/i);

    if (match) {
      const count = parseInt(match[1], 10);
      const cardId = match[2].trim();

      cards.push({ id: cardId, count });
    }
  }

  if (cards.length === 0) {
    throw new Error('No valid cards found in text');
  }

  return {
    name: deckName || `Imported Deck ${Date.now()}`,
    cards,
  };
}

/**
 * Export deck to text format
 */
export function exportTextDeck(deck: Deck): string {
  const lines = ['// Main Deck'];

  for (const card of deck.cards) {
    lines.push(`${card.count} x ${card.id}`);
  }

  return lines.join('\n');
}

/**
 * Detect if input is JSON or text format
 */
export function detectDeckFormat(input: string): 'json' | 'text' {
  const trimmed = input.trim();

  // Check if it starts with { (JSON)
  if (trimmed.startsWith('{')) {
    return 'json';
  }

  // Check if it contains card patterns like "4 x UA47BT-TKG-1-080"
  if (/\d+\s*[x×]?\s+[A-Z0-9\-\/]+/i.test(trimmed)) {
    return 'text';
  }

  // Default to JSON
  return 'json';
}
