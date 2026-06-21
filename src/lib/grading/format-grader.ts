import type { DeckAnalysis } from '../analysis/deck-scorer';

export type DeckFormat = 'rare-battles' | 'meta-tierlist';

export interface FormatWeights {
  consistency: number;
  synergy: number;
  curve: number;
  powerLevel: number;
}

export interface FormatGrading {
  format: DeckFormat;
  overallScore: number;
  categoryScores: {
    consistency: number;
    synergy: number;
    curve: number;
    powerLevel: number;
  };
  formatInsights: string[];
}

/**
 * Rare Battles Format:
 * - Same-IP only (enforced by IP Lock rule)
 * - Emphasizes synergy and tribal strategies
 * - Card interactions within the IP matter more
 * - Strategy: Build around IP-specific mechanics
 */
const RARE_BATTLES_WEIGHTS: FormatWeights = {
  consistency: 0.25,  // 25%
  synergy: 0.35,      // 35% (UP from 25%) - synergy is key
  curve: 0.25,        // 25%
  powerLevel: 0.15,   // 15% (DOWN from 20%) - raw power matters less
};

/**
 * Meta Tierlist Format:
 * - Cross-IP evaluation
 * - Emphasizes raw card quality and power level
 * - Universal effects valued over IP-specific synergies
 * - Strategy: Play the strongest individual cards
 */
const META_TIERLIST_WEIGHTS: FormatWeights = {
  consistency: 0.30,  // 30% (UP from 25%)
  synergy: 0.20,      // 20% (DOWN from 25%) - less important
  curve: 0.20,        // 20% (DOWN from 25%)
  powerLevel: 0.30,   // 30% (UP from 20%) - raw power is key
};

/**
 * Apply format-specific weights to deck analysis
 */
export function gradeForFormat(
  baseAnalysis: DeckAnalysis,
  format: DeckFormat
): FormatGrading {
  const weights = format === 'rare-battles' ? RARE_BATTLES_WEIGHTS : META_TIERLIST_WEIGHTS;

  // Recalculate overall score with format-specific weights
  const overallScore = Math.round(
    baseAnalysis.categoryScores.consistency * weights.consistency +
    baseAnalysis.categoryScores.synergy * weights.synergy +
    baseAnalysis.categoryScores.curve * weights.curve +
    baseAnalysis.categoryScores.powerLevel * weights.powerLevel
  );

  // Generate format-specific insights
  const formatInsights: string[] = [];

  if (format === 'rare-battles') {
    // Rare Battles emphasizes synergy
    if (baseAnalysis.categoryScores.synergy >= 70) {
      formatInsights.push('🔥 Excellent for Rare Battles! Strong IP-specific synergies.');
    } else if (baseAnalysis.categoryScores.synergy >= 50) {
      formatInsights.push('✅ Good for Rare Battles. Synergies are solid.');
    } else {
      formatInsights.push('⚠️ Weak for Rare Battles. Needs more tribal/mechanic synergies.');
    }

    // Check if deck has tribal focus
    const tribalSynergies = baseAnalysis.synergyAnalysis.synergies.filter(s => s.type === 'affinity');
    if (tribalSynergies.length >= 2) {
      formatInsights.push(`✅ Strong tribal focus with ${tribalSynergies.length} affinity synergies.`);
    } else if (tribalSynergies.length === 0) {
      formatInsights.push('⚠️ No tribal synergies. Consider focusing on a single affinity.');
    }

    // Rare Battles rewards cohesive strategies
    if (baseAnalysis.categoryScores.synergy > baseAnalysis.categoryScores.powerLevel + 20) {
      formatInsights.push('💡 Synergy-focused build - ideal for Rare Battles format!');
    }

  } else {
    // Meta Tierlist emphasizes power and consistency
    if (baseAnalysis.categoryScores.powerLevel >= 70) {
      formatInsights.push('🔥 Excellent for Meta! High card quality.');
    } else if (baseAnalysis.categoryScores.powerLevel >= 50) {
      formatInsights.push('✅ Good for Meta. Card quality is solid.');
    } else {
      formatInsights.push('⚠️ Weak for Meta. Needs higher-impact cards.');
    }

    // Check consistency
    if (baseAnalysis.categoryScores.consistency >= 70) {
      formatInsights.push('✅ Highly consistent - important in competitive meta.');
    } else if (baseAnalysis.categoryScores.consistency < 50) {
      formatInsights.push('⚠️ Inconsistent draws can lose games in Meta format.');
    }

    // Meta rewards powerful individual cards
    if (baseAnalysis.categoryScores.powerLevel > baseAnalysis.categoryScores.synergy + 20) {
      formatInsights.push('💡 Power-focused build - strong in Meta Tierlist!');
    }
  }

  // Suggest alternate format if deck doesn't fit current format
  // Based on synergy vs power balance
  if (format === 'rare-battles' && baseAnalysis.categoryScores.powerLevel > baseAnalysis.categoryScores.synergy + 20) {
    formatInsights.push('💡 This deck may perform better in Meta Tierlist format (power-focused).');
  } else if (format === 'meta-tierlist' && baseAnalysis.categoryScores.synergy > baseAnalysis.categoryScores.powerLevel + 20) {
    formatInsights.push('💡 This deck may perform better in Rare Battles format (synergy-focused).');
  }

  return {
    format,
    overallScore,
    categoryScores: baseAnalysis.categoryScores,
    formatInsights,
  };
}

/**
 * Get format display name
 */
export function getFormatName(format: DeckFormat): string {
  return format === 'rare-battles' ? 'Rare Battles (Same-IP)' : 'Meta Tierlist (Cross-IP)';
}

/**
 * Get format description
 */
export function getFormatDescription(format: DeckFormat): string {
  if (format === 'rare-battles') {
    return 'Same-IP format. Emphasizes tribal synergies and IP-specific mechanics. Build around your franchise\'s unique interactions.';
  } else {
    return 'Cross-IP evaluation. Emphasizes raw card quality and universal power. Play the strongest individual cards regardless of synergy.';
  }
}
