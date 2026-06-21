import type { CardWithMetadata, Deck } from '../data/card-types';

export interface CurveData {
  apCost: number;
  count: number;
  cards: string[]; // Card IDs at this AP cost
}

export interface CurveAnalysis {
  curveData: CurveData[];
  averageAP: number;
  curveScore: number; // 0-100
  insights: string[];
  problems: string[];
}

/**
 * Analyze deck's AP cost distribution (curve)
 */
export function analyzeCurve(
  deck: Deck,
  cardIndex: Map<string, CardWithMetadata>
): CurveAnalysis {
  const curveMap = new Map<number, string[]>();

  // Build curve data
  for (const deckCard of deck.cards) {
    const card = cardIndex.get(deckCard.id);
    if (!card) continue;

    const ap = card.ap;
    if (!curveMap.has(ap)) {
      curveMap.set(ap, []);
    }

    // Add card multiple times based on count
    for (let i = 0; i < deckCard.count; i++) {
      curveMap.get(ap)!.push(card.id);
    }
  }

  // Convert to sorted array
  const curveData: CurveData[] = [];
  for (let ap = 0; ap <= 10; ap++) {
    const cards = curveMap.get(ap) || [];
    if (cards.length > 0) {
      curveData.push({
        apCost: ap,
        count: cards.length,
        cards: [...new Set(cards)], // Unique card IDs
      });
    }
  }

  // Calculate average AP
  let totalAP = 0;
  let totalCards = 0;
  for (const point of curveData) {
    totalAP += point.apCost * point.count;
    totalCards += point.count;
  }
  const averageAP = totalCards > 0 ? totalAP / totalCards : 0;

  // Analyze curve quality
  const insights: string[] = [];
  const problems: string[] = [];
  let curveScore = 100;

  // Get counts by AP range
  const ap0to1 = curveMap.get(0)?.length || 0 + curveMap.get(1)?.length || 0;
  const ap2to3 = curveMap.get(2)?.length || 0 + curveMap.get(3)?.length || 0;
  const ap4to5 = curveMap.get(4)?.length || 0 + curveMap.get(5)?.length || 0;
  const ap6plus = Array.from(curveMap.keys())
    .filter(ap => ap >= 6)
    .reduce((sum, ap) => sum + (curveMap.get(ap)?.length || 0), 0);

  // Early game (AP 0-1): Should have 15-25 cards
  if (ap0to1 < 10) {
    problems.push(`Too few early game cards (${ap0to1}). Deck may struggle in opening turns.`);
    curveScore -= 20;
  } else if (ap0to1 > 30) {
    problems.push(`Too many early game cards (${ap0to1}). May lack late-game power.`);
    curveScore -= 15;
  } else {
    insights.push(`✅ Solid early game: ${ap0to1} cards at AP 0-1`);
  }

  // Mid game (AP 2-3): Should have 15-25 cards
  if (ap2to3 < 10) {
    problems.push(`Weak mid-game (${ap2to3} cards at AP 2-3). May have awkward turns.`);
    curveScore -= 15;
  } else if (ap2to3 > 30) {
    problems.push(`Mid-game heavy (${ap2to3} cards). Curve may be clunky.`);
    curveScore -= 10;
  } else {
    insights.push(`✅ Good mid-game: ${ap2to3} cards at AP 2-3`);
  }

  // Late game (AP 4-5): Should have 8-15 cards
  if (ap4to5 < 5) {
    problems.push(`Very few finishers (${ap4to5} cards at AP 4-5). May struggle to close games.`);
    curveScore -= 20;
  } else if (ap4to5 > 20) {
    problems.push(`Too top-heavy (${ap4to5} cards at AP 4-5). May have dead hands early.`);
    curveScore -= 15;
  } else {
    insights.push(`✅ Balanced finishers: ${ap4to5} cards at AP 4-5`);
  }

  // Very late game (AP 6+): Should be 0-5 cards
  if (ap6plus > 8) {
    problems.push(`Too many expensive cards (${ap6plus} at AP 6+). Curve is too slow.`);
    curveScore -= 20;
  } else if (ap6plus > 0) {
    insights.push(`High-impact cards: ${ap6plus} at AP 6+`);
  }

  // Average AP assessment
  if (averageAP < 1.5) {
    insights.push('⚡ Aggressive curve - fast, proactive strategy');
  } else if (averageAP < 2.5) {
    insights.push('📈 Balanced curve - flexible game plan');
  } else if (averageAP < 3.5) {
    insights.push('🐢 Mid-range curve - value-oriented');
  } else {
    problems.push('⚠️ Very high average AP - may be too slow');
    curveScore -= 10;
  }

  // Check for gaps in curve
  const apCosts = Array.from(curveMap.keys()).sort((a, b) => a - b);
  for (let i = 0; i < apCosts.length - 1; i++) {
    if (apCosts[i + 1] - apCosts[i] > 2) {
      problems.push(`Curve gap: No cards between AP ${apCosts[i]} and ${apCosts[i + 1]}`);
      curveScore -= 10;
    }
  }

  curveScore = Math.max(0, Math.min(100, curveScore));

  return {
    curveData,
    averageAP: Math.round(averageAP * 10) / 10,
    curveScore,
    insights,
    problems,
  };
}
