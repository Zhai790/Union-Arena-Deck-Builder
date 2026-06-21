import type { CardWithMetadata, Deck } from '../data/card-types';
import { analyzeSynergies, type SynergyAnalysis } from './synergy-detector';
import { analyzeCurve, type CurveAnalysis } from './curve-analyzer';
import { generateCardRecommendations, type CardRecommendation } from './card-recommender';

export interface DeckAnalysis {
  overallScore: number; // 0-100
  categoryScores: {
    consistency: number;
    synergy: number;
    curve: number;
    powerLevel: number;
  };
  synergyAnalysis: SynergyAnalysis;
  curveAnalysis: CurveAnalysis;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  cardRecommendations: CardRecommendation[];
}

/**
 * Calculate consistency score based on redundancy and search effects
 */
function calculateConsistencyScore(
  deck: Deck,
  cardIndex: Map<string, CardWithMetadata>
): { score: number; insights: string[] } {
  let score = 50; // Base score
  const insights: string[] = [];

  // Check for 4-of cards (redundancy)
  const fourOfs = deck.cards.filter(c => c.count === 4).length;
  if (fourOfs >= 10) {
    score += 20;
    insights.push(`✅ High redundancy: ${fourOfs} 4-of cards`);
  } else if (fourOfs >= 6) {
    score += 10;
    insights.push(`Good redundancy: ${fourOfs} 4-of cards`);
  } else {
    score -= 10;
    insights.push(`⚠️ Low redundancy: only ${fourOfs} 4-of cards`);
  }

  // Check for search/draw effects
  let searchCount = 0;
  let drawCount = 0;
  for (const deckCard of deck.cards) {
    const card = cardIndex.get(deckCard.id);
    if (!card) continue;

    const combined = `${card.effect} ${card.trigger}`.toLowerCase();
    if (/search|look at.*deck/i.test(combined)) {
      searchCount += deckCard.count;
    }
    if (/draw.*card/i.test(combined)) {
      drawCount += deckCard.count;
    }
  }

  if (searchCount + drawCount >= 12) {
    score += 20;
    insights.push(`✅ Excellent card selection: ${searchCount} search, ${drawCount} draw`);
  } else if (searchCount + drawCount >= 6) {
    score += 10;
    insights.push(`Good card selection: ${searchCount} search, ${drawCount} draw`);
  } else {
    score -= 10;
    insights.push(`⚠️ Limited card selection: ${searchCount} search, ${drawCount} draw`);
  }

  // Check for singleton/doubleton issues
  const lowCopyCounts = deck.cards.filter(c => c.count <= 2).length;
  if (lowCopyCounts > 10) {
    score -= 15;
    insights.push(`⚠️ Too many low-count cards (${lowCopyCounts}). Deck may be inconsistent.`);
  }

  return { score: Math.max(0, Math.min(100, score)), insights };
}

/**
 * Calculate power level based on card quality indicators
 * Note: Rarity does NOT indicate power - many commons are strong
 */
function calculatePowerScore(
  deck: Deck,
  cardIndex: Map<string, CardWithMetadata>
): { score: number; insights: string[] } {
  let score = 50; // Base score
  const insights: string[] = [];

  let averageBP = 0;
  let totalBP = 0;
  let cardCount = 0;
  let highImpactCards = 0;
  let removalCount = 0;
  let cardAdvantageCount = 0;

  for (const deckCard of deck.cards) {
    const card = cardIndex.get(deckCard.id);
    if (!card) continue;

    // BP analysis
    if (card.bp > 0) {
      totalBP += card.bp * deckCard.count;
      cardCount += deckCard.count;
    }

    const effect = card.effect.toLowerCase();
    const trigger = card.trigger.toLowerCase();
    const combined = `${effect} ${trigger}`;

    // Removal/disruption
    if (
      combined.includes('destroy') ||
      combined.includes('sideline') ||
      combined.includes('send to retreat') ||
      combined.includes('rest') && combined.includes('opponent')
    ) {
      removalCount += deckCard.count;
    }

    // Card advantage (draw, search)
    if (
      combined.includes('draw') ||
      combined.includes('search') ||
      combined.includes('look at')
    ) {
      cardAdvantageCount += deckCard.count;
    }

    // High-impact indicators: long effects = complex/powerful cards
    if (effect.length > 100 || combined.includes('damage')) {
      highImpactCards += deckCard.count;
    }
  }

  averageBP = cardCount > 0 ? totalBP / cardCount : 0;

  // BP assessment
  if (averageBP >= 3000) {
    score += 20;
    insights.push(`✅ High average BP: ${Math.round(averageBP)}`);
  } else if (averageBP >= 2000) {
    score += 10;
    insights.push(`Good average BP: ${Math.round(averageBP)}`);
  } else if (averageBP > 0) {
    score -= 5;
    insights.push(`⚠️ Low average BP: ${Math.round(averageBP)}`);
  }

  // Removal assessment
  if (removalCount >= 8) {
    score += 20;
    insights.push(`✅ ${removalCount} removal/disruption cards`);
  } else if (removalCount >= 4) {
    score += 10;
    insights.push(`${removalCount} removal cards`);
  } else {
    score -= 10;
    insights.push(`⚠️ Only ${removalCount} removal cards - may struggle vs threats`);
  }

  // Card advantage assessment
  if (cardAdvantageCount >= 12) {
    score += 15;
    insights.push(`✅ ${cardAdvantageCount} card advantage engines`);
  } else if (cardAdvantageCount >= 6) {
    score += 5;
    insights.push(`${cardAdvantageCount} card advantage cards`);
  } else {
    score -= 5;
    insights.push(`⚠️ Limited card advantage (${cardAdvantageCount} cards)`);
  }

  return { score: Math.max(0, Math.min(100, score)), insights };
}

/**
 * Analyze entire deck and generate comprehensive report
 */
export function analyzeDeck(
  deck: Deck,
  cardIndex: Map<string, CardWithMetadata>,
  allCards?: CardWithMetadata[]
): DeckAnalysis {
  // Run all analysis modules
  const synergyAnalysis = analyzeSynergies(deck, cardIndex);
  const curveAnalysis = analyzeCurve(deck, cardIndex);
  const consistencyResult = calculateConsistencyScore(deck, cardIndex);
  const powerResult = calculatePowerScore(deck, cardIndex);

  // Calculate weighted overall score
  // Weights: Consistency 30%, Synergy 25%, Curve 25%, Power 20%
  const overallScore = Math.round(
    consistencyResult.score * 0.3 +
    synergyAnalysis.overallScore * 0.25 +
    curveAnalysis.curveScore * 0.25 +
    powerResult.score * 0.2
  );

  // Compile strengths and weaknesses
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (consistencyResult.score >= 70) strengths.push('Consistent game plan');
  else if (consistencyResult.score < 50) weaknesses.push('Inconsistent draws');

  if (synergyAnalysis.overallScore >= 70) strengths.push('Strong synergies');
  else if (synergyAnalysis.overallScore < 50) weaknesses.push('Lacks focused strategy');

  if (curveAnalysis.curveScore >= 70) strengths.push('Smooth curve');
  else if (curveAnalysis.curveScore < 50) weaknesses.push('Awkward mana curve');

  if (powerResult.score >= 70) strengths.push('High card quality');
  else if (powerResult.score < 50) weaknesses.push('Low power level');

  // Generate recommendations
  const recommendations: string[] = [];

  if (consistencyResult.score < 60) {
    recommendations.push('Add more 4-of copies of your best cards for consistency');
  }

  if (synergyAnalysis.overallScore < 60) {
    recommendations.push('Focus on a single tribal/mechanic strategy for better synergy');
  }

  if (curveAnalysis.curveScore < 60) {
    if (curveAnalysis.averageAP > 3.0) {
      recommendations.push('Add more low-cost cards to smooth out your curve');
    }
    if (curveAnalysis.problems.length > 0) {
      recommendations.push(curveAnalysis.problems[0]);
    }
  }

  if (powerResult.score < 60) {
    recommendations.push('Consider upgrading to higher-rarity cards with stronger effects');
  }

  // Generate card-specific recommendations
  const cardRecommendations = allCards
    ? generateCardRecommendations(deck, cardIndex, allCards)
    : [];

  // If deck is already good, provide minor optimizations
  if (overallScore >= 70 && recommendations.length === 0) {
    recommendations.push('Deck is strong! See card recommendations below for potential upgrades.');
  }

  return {
    overallScore,
    categoryScores: {
      consistency: consistencyResult.score,
      synergy: synergyAnalysis.overallScore,
      curve: curveAnalysis.curveScore,
      powerLevel: powerResult.score,
    },
    synergyAnalysis,
    curveAnalysis,
    strengths,
    weaknesses,
    recommendations,
    cardRecommendations,
  };
}
