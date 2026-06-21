import type { CardWithMetadata, Deck } from '../data/card-types';

export interface CardRecommendation {
  remove: CardWithMetadata; // Card to remove
  add: CardWithMetadata; // Card to add instead
  reason: string; // Why this swap improves the deck
  impact: 'high' | 'medium' | 'low';
}

/**
 * Score a card's quality for deck inclusion
 */
function scoreCard(card: CardWithMetadata): number {
  let score = 0;
  const effect = card.effect.toLowerCase();
  const trigger = card.trigger.toLowerCase();
  const combined = `${effect} ${trigger}`;

  // High BP is valuable
  if (card.bp >= 4000) score += 15;
  else if (card.bp >= 3000) score += 10;
  else if (card.bp >= 2000) score += 5;

  // Card advantage is valuable
  if (combined.includes('draw')) score += 10;
  if (combined.includes('search')) score += 10;

  // Removal is valuable
  if (combined.includes('destroy')) score += 12;
  if (combined.includes('sideline')) score += 12;
  if (combined.includes('send to retreat')) score += 8;

  // Flexible/utility effects
  if (combined.includes('rest') && combined.includes('opponent')) score += 8;
  if (combined.includes('look at')) score += 5;

  // Triggers add value
  if (trigger.includes('draw')) score += 5;
  if (trigger.includes('get')) score += 5;

  // Complex effects = more powerful
  if (effect.length > 150) score += 8;
  else if (effect.length > 100) score += 5;

  // Low AP cost adds flexibility
  if (card.ap <= 1) score += 5;
  else if (card.ap <= 2) score += 3;

  return score;
}

/**
 * Find better alternatives for weak cards in the deck
 */
export function generateCardRecommendations(
  deck: Deck,
  cardIndex: Map<string, CardWithMetadata>,
  allCards: CardWithMetadata[]
): CardRecommendation[] {
  const recommendations: CardRecommendation[] = [];

  // Get deck's series (IP Lock)
  const deckSeries = new Set<string>();
  for (const deckCard of deck.cards) {
    const card = cardIndex.get(deckCard.id);
    if (card) {
      deckSeries.add(card.series);
    }
  }

  if (deckSeries.size === 0) return recommendations;

  // Get deck's primary color (mono-color rule)
  const primaryColor = deck.cards
    .map(dc => cardIndex.get(dc.id)?.primaryColor)
    .filter(Boolean)[0];

  if (!primaryColor) return recommendations;

  // Filter available cards: same series, same color
  const availableCards = allCards.filter(
    card =>
      deckSeries.has(card.series) &&
      card.primaryColor === primaryColor
  );

  // Score all cards in deck
  const deckCardScores = new Map<string, number>();
  for (const deckCard of deck.cards) {
    const card = cardIndex.get(deckCard.id);
    if (card) {
      deckCardScores.set(card.id, scoreCard(card));
    }
  }

  // Find weak cards (low scores, low counts)
  const weakCards = deck.cards
    .filter(dc => {
      const score = deckCardScores.get(dc.id) || 0;
      return score < 25 && dc.count <= 2; // Weak cards run as 1-2 ofs
    })
    .map(dc => ({ deckCard: dc, card: cardIndex.get(dc.id)!, score: deckCardScores.get(dc.id) || 0 }))
    .filter(item => item.card)
    .sort((a, b) => a.score - b.score); // Weakest first

  // Track cards already recommended to avoid duplicates
  const recommendedCards = new Set<string>();

  // Build set of card names already in deck (to exclude alternate arts)
  const deckCardNames = new Set<string>();
  for (const deckCard of deck.cards) {
    const card = cardIndex.get(deckCard.id);
    if (card) {
      deckCardNames.add(card.name.toLowerCase().trim());
    }
  }

  // For each weak card, find better alternatives
  for (const { deckCard, card, score } of weakCards.slice(0, 5)) { // Top 5 weakest
    // Find better cards at similar AP cost
    const alternatives = availableCards
      .filter(alt => {
        // Skip cards already in deck (by ID or code)
        if (deck.cards.some(dc => dc.id === alt.id || dc.id === alt.code)) return false;

        // Skip alternate arts (same name as cards in deck)
        if (deckCardNames.has(alt.name.toLowerCase().trim())) return false;

        // Skip cards already recommended
        if (recommendedCards.has(alt.id)) return false;

        // Similar AP cost (±1)
        if (Math.abs(alt.ap - card.ap) > 1) return false;

        // Must be better
        const altScore = scoreCard(alt);
        return altScore > score + 10; // Significantly better
      })
      .map(alt => ({ card: alt, score: scoreCard(alt) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // Top 3 alternatives

    for (const alt of alternatives) {
      const reason = buildRecommendationReason(card, alt.card, score, alt.score);
      const impact = alt.score - score > 20 ? 'high' : alt.score - score > 15 ? 'medium' : 'low';

      recommendations.push({
        remove: card,
        add: alt.card,
        reason,
        impact,
      });

      // Mark this card as recommended so it won't appear again
      recommendedCards.add(alt.card.id);

      // Only recommend one swap per weak card
      break;
    }
  }

  // Sort by impact
  recommendations.sort((a, b) => {
    const impactOrder = { high: 0, medium: 1, low: 2 };
    return impactOrder[a.impact] - impactOrder[b.impact];
  });

  return recommendations.slice(0, 5); // Top 5 recommendations
}

/**
 * Build human-readable reason for card swap
 */
function buildRecommendationReason(
  oldCard: CardWithMetadata,
  newCard: CardWithMetadata,
  oldScore: number,
  newScore: number
): string {
  const reasons: string[] = [];

  // BP comparison
  if (newCard.bp > oldCard.bp + 500) {
    reasons.push(`+${newCard.bp - oldCard.bp} BP`);
  }

  // Effect comparison
  const oldEffect = oldCard.effect.toLowerCase();
  const newEffect = newCard.effect.toLowerCase();

  if (newEffect.includes('draw') && !oldEffect.includes('draw')) {
    reasons.push('adds card draw');
  }

  if (newEffect.includes('search') && !oldEffect.includes('search')) {
    reasons.push('adds deck search');
  }

  if (
    (newEffect.includes('destroy') || newEffect.includes('sideline')) &&
    !(oldEffect.includes('destroy') || oldEffect.includes('sideline'))
  ) {
    reasons.push('adds removal');
  }

  if (newCard.trigger.includes('Draw') && !oldCard.trigger.includes('Draw')) {
    reasons.push('better trigger');
  }

  // Generic better effect
  if (newCard.effect.length > oldCard.effect.length + 50) {
    reasons.push('more versatile effect');
  }

  // Fallback
  if (reasons.length === 0) {
    reasons.push('stronger overall card');
  }

  return reasons.join(', ');
}
