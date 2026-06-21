import type { CardWithMetadata, Deck } from '../data/card-types';

export interface Synergy {
  type: 'affinity' | 'mechanic' | 'effect' | 'curve';
  cards: string[]; // Card IDs involved
  strength: number; // 0-10 score
  description: string;
}

export interface SynergyAnalysis {
  synergies: Synergy[];
  overallScore: number; // 0-100
  insights: string[];
}

/**
 * Detect affinity-based synergies (tribal strategies)
 * Groups cards by affinity field and scores based on cluster size
 */
function detectAffinitySynergies(
  deck: Deck,
  cardIndex: Map<string, CardWithMetadata>
): Synergy[] {
  const affinityGroups = new Map<string, string[]>();
  const synergies: Synergy[] = [];

  // Group cards by affinity
  for (const deckCard of deck.cards) {
    const card = cardIndex.get(deckCard.id);
    if (!card || !card.affinity || card.affinity === '-') continue;

    // Split multiple affinities (e.g., "CCG, Ghoul")
    const affinities = card.affinity.split(/[,/]/).map(a => a.trim());
    for (const affinity of affinities) {
      if (!affinityGroups.has(affinity)) {
        affinityGroups.set(affinity, []);
      }
      // Add card ID multiple times if player runs multiple copies
      for (let i = 0; i < deckCard.count; i++) {
        affinityGroups.get(affinity)!.push(card.id);
      }
    }
  }

  // Score each affinity group
  for (const [affinity, cardIds] of affinityGroups.entries()) {
    const uniqueCards = [...new Set(cardIds)];
    const totalCount = cardIds.length;

    // Tribal synergy only matters if 3+ unique cards share affinity
    if (uniqueCards.length >= 3) {
      const strength = Math.min(10, Math.floor(totalCount / 3)); // More copies = stronger
      synergies.push({
        type: 'affinity',
        cards: uniqueCards,
        strength,
        description: `${affinity} tribal: ${uniqueCards.length} unique cards, ${totalCount} total`,
      });
    }
  }

  return synergies;
}

/**
 * Detect mechanic-based synergies by parsing effect text
 * Examples: Raid enablers + Raid characters, BP buffs + low-BP units
 */
function detectMechanicSynergies(
  deck: Deck,
  cardIndex: Map<string, CardWithMetadata>
): Synergy[] {
  const synergies: Synergy[] = [];

  // Mechanic patterns to detect
  const mechanics = {
    raid: { keyword: /raid/i, enablers: /(?:rest|tap|sideline).*opponent/i },
    bpBuff: { keyword: /bp.*\+\d+/i, beneficiaries: /bp.*\d{1,3}00/i }, // Low BP cards
    draw: { keyword: /draw.*card/i, payoffs: /hand|discard/i },
    trigger: { keyword: /trigger/i, payoffs: /trigger/i },
    directDamage: { keyword: /damage|lose.*life/i, payoffs: /damage|lose.*life/i },
  };

  for (const [mechanicName, patterns] of Object.entries(mechanics)) {
    const enablers: string[] = [];
    const beneficiaries: string[] = [];

    for (const deckCard of deck.cards) {
      const card = cardIndex.get(deckCard.id);
      if (!card) continue;

      const effectLower = card.effect.toLowerCase();
      const triggerLower = card.trigger.toLowerCase();
      const combined = `${effectLower} ${triggerLower}`;

      // Check for enablers (cards that activate the mechanic)
      if ('enablers' in patterns && patterns.enablers.test(combined)) {
        enablers.push(card.id);
      }

      // Check for beneficiaries (cards that benefit from the mechanic)
      if (patterns.keyword.test(combined)) {
        beneficiaries.push(card.id);
      }

      // Special case for BP buffs: low BP cards are beneficiaries
      if (mechanicName === 'bpBuff' && card.bp > 0 && card.bp <= 2000) {
        beneficiaries.push(card.id);
      }
    }

    // Synergy exists if we have both enablers and beneficiaries
    if (enablers.length > 0 && beneficiaries.length > 0) {
      const strength = Math.min(10, enablers.length + beneficiaries.length);
      synergies.push({
        type: 'mechanic',
        cards: [...new Set([...enablers, ...beneficiaries])],
        strength,
        description: `${mechanicName} synergy: ${enablers.length} enablers, ${beneficiaries.length} payoffs`,
      });
    } else if (beneficiaries.length >= 4) {
      // Even without explicit enablers, many cards of same mechanic = synergy
      const strength = Math.min(10, Math.floor(beneficiaries.length / 2));
      synergies.push({
        type: 'mechanic',
        cards: [...new Set(beneficiaries)],
        strength,
        description: `${mechanicName} focused: ${beneficiaries.length} cards`,
      });
    }
  }

  return synergies;
}

/**
 * Detect effect text synergies (combos and interactions)
 */
function detectEffectSynergies(
  deck: Deck,
  cardIndex: Map<string, CardWithMetadata>
): Synergy[] {
  const synergies: Synergy[] = [];

  // Pattern: Cards that search + cards that benefit from being searched
  const searchers: string[] = [];
  const searchTargets: string[] = [];

  // Pattern: Cards that mill/discard + cards with graveyard effects
  const millers: string[] = [];
  const graveyardCards: string[] = [];

  for (const deckCard of deck.cards) {
    const card = cardIndex.get(deckCard.id);
    if (!card) continue;

    const effectLower = card.effect.toLowerCase();
    const triggerLower = card.trigger.toLowerCase();
    const combined = `${effectLower} ${triggerLower}`;

    // Search synergy
    if (/search|look at.*deck/i.test(combined)) {
      searchers.push(card.id);
    }
    if (card.rarity && /rare|super|secret/i.test(card.rarity)) {
      searchTargets.push(card.id); // High rarity = good search target
    }

    // Graveyard synergy
    if (/discard|mill|send.*to.*retreat/i.test(combined)) {
      millers.push(card.id);
    }
    if (/from.*retreat|graveyard/i.test(combined)) {
      graveyardCards.push(card.id);
    }
  }

  // Add search synergy if present
  if (searchers.length > 0 && searchTargets.length >= 5) {
    synergies.push({
      type: 'effect',
      cards: [...new Set([...searchers, ...searchTargets.slice(0, 3)])],
      strength: Math.min(10, searchers.length * 2),
      description: `Deck manipulation: ${searchers.length} searchers for ${searchTargets.length} targets`,
    });
  }

  // Add graveyard synergy if present
  if (millers.length > 0 && graveyardCards.length > 0) {
    synergies.push({
      type: 'effect',
      cards: [...new Set([...millers, ...graveyardCards])],
      strength: Math.min(10, millers.length + graveyardCards.length),
      description: `Graveyard strategy: ${millers.length} enablers, ${graveyardCards.length} payoffs`,
    });
  }

  return synergies;
}

/**
 * Analyze all synergies in a deck
 */
export function analyzeSynergies(
  deck: Deck,
  cardIndex: Map<string, CardWithMetadata>
): SynergyAnalysis {
  const affinitySynergies = detectAffinitySynergies(deck, cardIndex);
  const mechanicSynergies = detectMechanicSynergies(deck, cardIndex);
  const effectSynergies = detectEffectSynergies(deck, cardIndex);

  const allSynergies = [...affinitySynergies, ...mechanicSynergies, ...effectSynergies];

  // Calculate overall synergy score (0-100)
  // Weight: affinity 40%, mechanic 40%, effect 20%
  const affinityScore = affinitySynergies.reduce((sum, s) => sum + s.strength, 0);
  const mechanicScore = mechanicSynergies.reduce((sum, s) => sum + s.strength, 0);
  const effectScore = effectSynergies.reduce((sum, s) => sum + s.strength, 0);

  const maxAffinityScore = 20; // 2 strong tribal synergies
  const maxMechanicScore = 30; // 3 mechanic synergies
  const maxEffectScore = 20;   // 2 effect synergies

  const normalizedAffinity = Math.min(100, (affinityScore / maxAffinityScore) * 100) * 0.4;
  const normalizedMechanic = Math.min(100, (mechanicScore / maxMechanicScore) * 100) * 0.4;
  const normalizedEffect = Math.min(100, (effectScore / maxEffectScore) * 100) * 0.2;

  const overallScore = Math.round(normalizedAffinity + normalizedMechanic + normalizedEffect);

  // Generate insights
  const insights: string[] = [];

  if (affinitySynergies.length === 0) {
    insights.push('⚠️ No tribal synergies detected. Consider focusing on a single affinity.');
  } else if (affinitySynergies.length > 1) {
    insights.push(`✅ ${affinitySynergies.length} tribal synergies found - strong tribal focus!`);
  }

  if (mechanicSynergies.length === 0) {
    insights.push('⚠️ No clear mechanic synergies. Deck may lack focused strategy.');
  } else {
    insights.push(`✅ ${mechanicSynergies.length} mechanic synergies detected.`);
  }

  if (overallScore >= 70) {
    insights.push('🔥 Excellent synergy! Deck has strong internal coherence.');
  } else if (overallScore >= 50) {
    insights.push('👍 Good synergy. Some cards work together well.');
  } else if (overallScore >= 30) {
    insights.push('⚡ Moderate synergy. Could benefit from more focused strategy.');
  } else {
    insights.push('❌ Low synergy. Deck lacks cohesive strategy.');
  }

  return {
    synergies: allSynergies,
    overallScore,
    insights,
  };
}
