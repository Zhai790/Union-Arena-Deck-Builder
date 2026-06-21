import type { Deck, ValidationError, CardWithMetadata } from '../data/card-types';

const DEFAULT_COPY_LIMIT = 4;

/**
 * Extract copy limit from card effect text
 * Some cards have special restrictions like "A deck can only contain up to three copies of this card"
 */
function getCardCopyLimit(card: CardWithMetadata): number {
  const effectLower = card.effect.toLowerCase();

  // Check for explicit copy limits in card text
  const threeMatch = effectLower.match(/(?:up to|only|maximum of)\s+(?:three|3)\s+cop(?:y|ies)/);
  if (threeMatch) {
    return 3;
  }

  const twoMatch = effectLower.match(/(?:up to|only|maximum of)\s+(?:two|2)\s+cop(?:y|ies)/);
  if (twoMatch) {
    return 2;
  }

  const oneMatch = effectLower.match(/(?:up to|only|maximum of)\s+(?:one|1)\s+cop(?:y|ies)/);
  if (oneMatch) {
    return 1;
  }

  return DEFAULT_COPY_LIMIT;
}

/**
 * Validate that no card exceeds its copy limit (default 4, or card-specific limit)
 */
export function validateCopyLimit(
  deck: Deck,
  cardIndex: Map<string, CardWithMetadata>
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const deckCard of deck.cards) {
    const card = cardIndex.get(deckCard.id);
    if (!card) {
      // Card not found in database - treat as warning (might be new/alternate version)
      errors.push({
        rule: 'copy-limit',
        message: `Card ID "${deckCard.id}" not found in database (might be new or alternate version)`,
        severity: 'warning',
        details: { cardId: deckCard.id },
      });

      // Still validate basic copy limit even without card data
      if (deckCard.count > DEFAULT_COPY_LIMIT) {
        errors.push({
          rule: 'copy-limit',
          message: `Card "${deckCard.id}" exceeds default copy limit: has ${deckCard.count}, max ${DEFAULT_COPY_LIMIT}`,
          severity: 'error',
          details: { cardId: deckCard.id, count: deckCard.count, limit: DEFAULT_COPY_LIMIT },
        });
      }
      continue;
    }

    const limit = getCardCopyLimit(card);
    if (deckCard.count > limit) {
      errors.push({
        rule: 'copy-limit',
        message: `"${card.name}" exceeds copy limit: has ${deckCard.count}, max ${limit}`,
        severity: 'error',
        details: {
          cardId: card.id,
          cardName: card.name,
          count: deckCard.count,
          limit,
        },
      });
    }

    if (deckCard.count < 1) {
      errors.push({
        rule: 'copy-limit',
        message: `"${card.name}" has invalid count: ${deckCard.count}`,
        severity: 'error',
        details: {
          cardId: card.id,
          cardName: card.name,
          count: deckCard.count,
        },
      });
    }
  }

  return errors;
}
