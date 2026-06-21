import type { Deck, ValidationError } from '../data/card-types';

const REQUIRED_DECK_SIZE = 50;

/**
 * Validate that deck has exactly 50 cards
 */
export function validateDeckSize(deck: Deck): ValidationError | null {
  const totalCards = deck.cards.reduce((sum, card) => sum + card.count, 0);

  if (totalCards !== REQUIRED_DECK_SIZE) {
    return {
      rule: 'deck-size',
      message: `Deck must contain exactly ${REQUIRED_DECK_SIZE} cards, but has ${totalCards}`,
      severity: 'error',
      details: { required: REQUIRED_DECK_SIZE, actual: totalCards },
    };
  }

  return null;
}
