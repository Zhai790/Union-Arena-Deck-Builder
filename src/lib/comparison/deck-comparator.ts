import type { DeckAnalysis } from '../analysis/deck-scorer';
import type { Deck } from '../data/card-types';

export interface DeckComparison {
  deckA: {
    name: string;
    analysis: DeckAnalysis;
  };
  deckB: {
    name: string;
    analysis: DeckAnalysis;
  };
  winner: 'A' | 'B' | 'tie';
  scoreDifference: number;
  categoryComparison: {
    consistency: number; // Positive = A wins, negative = B wins
    synergy: number;
    curve: number;
    powerLevel: number;
  };
  keyDifferences: string[];
  recommendation: string;
}

/**
 * Compare two decks side-by-side
 */
export function compareDecks(
  deckA: Deck,
  analysisA: DeckAnalysis,
  deckB: Deck,
  analysisB: DeckAnalysis
): DeckComparison {
  // Determine winner
  const scoreDiff = analysisA.overallScore - analysisB.overallScore;
  let winner: 'A' | 'B' | 'tie';
  if (Math.abs(scoreDiff) < 5) {
    winner = 'tie';
  } else {
    winner = scoreDiff > 0 ? 'A' : 'B';
  }

  // Category differences
  const categoryComparison = {
    consistency: analysisA.categoryScores.consistency - analysisB.categoryScores.consistency,
    synergy: analysisA.categoryScores.synergy - analysisB.categoryScores.synergy,
    curve: analysisA.categoryScores.curve - analysisB.categoryScores.curve,
    powerLevel: analysisA.categoryScores.powerLevel - analysisB.categoryScores.powerLevel,
  };

  // Key differences
  const keyDifferences: string[] = [];

  // Synergy comparison
  if (Math.abs(categoryComparison.synergy) > 15) {
    const better = categoryComparison.synergy > 0 ? deckA.name : deckB.name;
    keyDifferences.push(`${better} has significantly better synergies (+${Math.abs(categoryComparison.synergy)} points)`);
  }

  // Power level comparison
  if (Math.abs(categoryComparison.powerLevel) > 15) {
    const better = categoryComparison.powerLevel > 0 ? deckA.name : deckB.name;
    keyDifferences.push(`${better} has higher card quality (+${Math.abs(categoryComparison.powerLevel)} points)`);
  }

  // Consistency comparison
  if (Math.abs(categoryComparison.consistency) > 15) {
    const better = categoryComparison.consistency > 0 ? deckA.name : deckB.name;
    keyDifferences.push(`${better} is more consistent (+${Math.abs(categoryComparison.consistency)} points)`);
  }

  // Curve comparison
  if (Math.abs(categoryComparison.curve) > 15) {
    const better = categoryComparison.curve > 0 ? deckA.name : deckB.name;
    keyDifferences.push(`${better} has a smoother curve (+${Math.abs(categoryComparison.curve)} points)`);
  }

  // Average AP comparison
  const apDiff = analysisA.curveAnalysis.averageAP - analysisB.curveAnalysis.averageAP;
  if (Math.abs(apDiff) > 0.5) {
    const faster = apDiff < 0 ? deckA.name : deckB.name;
    const slower = apDiff < 0 ? deckB.name : deckA.name;
    keyDifferences.push(`${faster} is faster (${Math.abs(apDiff).toFixed(1)} AP lower) than ${slower}`);
  }

  // Synergy count comparison
  const synergyCountA = analysisA.synergyAnalysis.synergies.length;
  const synergyCountB = analysisB.synergyAnalysis.synergies.length;
  if (Math.abs(synergyCountA - synergyCountB) >= 2) {
    const better = synergyCountA > synergyCountB ? deckA.name : deckB.name;
    keyDifferences.push(`${better} has more synergies (${Math.max(synergyCountA, synergyCountB)} vs ${Math.min(synergyCountA, synergyCountB)})`);
  }

  // Generate recommendation
  let recommendation = '';
  if (winner === 'tie') {
    recommendation = `Both decks are roughly equal in overall strength (${analysisA.overallScore} vs ${analysisB.overallScore}). `;
    // Provide tiebreaker insights
    const strongestCategory = Object.entries(categoryComparison)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];

    if (Math.abs(strongestCategory[1]) > 10) {
      const better = strongestCategory[1] > 0 ? deckA.name : deckB.name;
      recommendation += `Choose ${better} if you value ${strongestCategory[0]}.`;
    } else {
      recommendation += 'Choose based on personal playstyle preference.';
    }
  } else {
    const winnerDeck = winner === 'A' ? deckA.name : deckB.name;
    const winnerScore = winner === 'A' ? analysisA.overallScore : analysisB.overallScore;
    const loserScore = winner === 'A' ? analysisB.overallScore : analysisA.overallScore;

    recommendation = `${winnerDeck} is stronger overall (${winnerScore} vs ${loserScore}). `;

    // Why it wins
    const winnerStrengths: string[] = [];
    for (const [category, diff] of Object.entries(categoryComparison)) {
      if ((winner === 'A' && diff > 10) || (winner === 'B' && diff < -10)) {
        winnerStrengths.push(category);
      }
    }

    if (winnerStrengths.length > 0) {
      recommendation += `It excels in: ${winnerStrengths.join(', ')}.`;
    }
  }

  return {
    deckA: { name: deckA.name, analysis: analysisA },
    deckB: { name: deckB.name, analysis: analysisB },
    winner,
    scoreDifference: Math.abs(scoreDiff),
    categoryComparison,
    keyDifferences,
    recommendation,
  };
}
