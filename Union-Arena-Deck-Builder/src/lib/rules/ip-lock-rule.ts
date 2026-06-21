import type { Deck, ValidationError, CardWithMetadata } from '../data/card-types';

/**
 * Validate that all cards are from the same series (IP Lock)
 * Union Arena rules prohibit mixing series (e.g., BLEACH with Hunter x Hunter)
 */
export function validateIPLock(
  deck: Deck,
  cardIndex: Map<string, CardWithMetadata>
): ValidationError | null {
  if (deck.cards.length === 0) {
    return null;
  }

  const seriesSet = new Set<string>();
  const cardsBySeries = new Map<string, string[]>();

  for (const deckCard of deck.cards) {
    const card = cardIndex.get(deckCard.id);
    if (!card) {
      continue; // Skip unknown cards (handled by copy-limit validation)
    }

    seriesSet.add(card.series);

    if (!cardsBySeries.has(card.series)) {
      cardsBySeries.set(card.series, []);
    }
    cardsBySeries.get(card.series)!.push(card.name);
  }

  if (seriesSet.size > 1) {
    const seriesList = Array.from(seriesSet);
    const breakdown = seriesList.map((series) => {
      const cards = cardsBySeries.get(series)!;
      return `${series}: ${cards.length} cards`;
    });

    return {
      rule: 'ip-lock',
      message: `Deck mixes multiple series: ${seriesList.join(', ')}. All cards must be from the same series.`,
      severity: 'error',
      details: {
        series: seriesList,
        breakdown,
      },
    };
  }

  return null;
}
