// Core card data types from apitcg/union-arena-tcg-data

export interface Card {
  id: string;          // Unique identifier
  code: string;        // Card code (e.g., "UA01BT-001")
  name: string;        // Card name
  rarity: string;      // C, U, R, SR, etc.
  ap: number;          // Action Point cost
  type: string;        // Card type
  bp: number;          // Battle Power
  affinity: string;    // Tribal affinity (e.g., "Stern Ritters")
  effect: string;      // Card effect text
  trigger: string;     // Trigger effect
  images: {
    thumb?: string;
    small?: string;
    medium?: string;
    large?: string;
  };
  set: string;         // Set identifier (used for IP detection)
  needEnergy: string;  // Energy requirement (e.g., "Yellow x 2, Any x 1")
}

export interface DeckCard {
  id: string;          // Card ID reference
  count: number;       // Number of copies (1-4)
}

export interface Deck {
  name: string;
  cards: DeckCard[];
  format?: 'rare-battles' | 'meta-tierlist'; // Competitive format
  createdAt?: string;
  updatedAt?: string;
}

export interface ValidationError {
  rule: string;        // Which rule failed
  message: string;     // Human-readable error
  severity: 'error' | 'warning';
  details?: any;       // Additional context
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// Normalized card data with computed fields
export interface CardWithMetadata extends Card {
  series: string;      // Extracted series (e.g., "BLEACH", "HUNTER×HUNTER")
  primaryColor: string; // Extracted primary energy color
}
