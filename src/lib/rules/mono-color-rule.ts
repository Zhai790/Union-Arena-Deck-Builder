import type { Deck, ValidationError, CardWithMetadata } from '../data/card-types';

/**
 * Validate that all cards share the same primary energy color (mono-color requirement)
 * Exception: "Any" colored cards are allowed in any deck
 */
export function validateMonoColor(
  deck: Deck,
  cardIndex: Map<string, CardWithMetadata>
): ValidationError | null {
  if (deck.cards.length === 0) {
    return null;
  }

  const colorSet = new Set<string>();
  const cardsByColor = new Map<string, string[]>();

  for (const deckCard of deck.cards) {
    const card = cardIndex.get(deckCard.id);
    if (!card) {
      continue; // Skip unknown cards (handled by copy-limit validation)
    }

    const color = card.primaryColor;

    // "Any" colored cards don't count toward mono-color restriction
    if (color === 'Any') {
      continue;
    }

    colorSet.add(color);

    if (!cardsByColor.has(color)) {
      cardsByColor.set(color, []);
    }
    cardsByColor.get(color)!.push(card.name);
  }

  if (colorSet.size > 1) {
    const colorList = Array.from(colorSet);
    const breakdown = colorList.map((color) => {
      const cards = cardsByColor.get(color)!;
      return `${color}: ${cards.length} cards`;
    });

    return {
      rule: 'mono-color',
      message: `Deck mixes multiple colors: ${colorList.join(', ')}. All cards must share the same primary energy color.`,
      severity: 'error',
      details: {
        colors: colorList,
        breakdown,
      },
    };
  }

  return null;
}
