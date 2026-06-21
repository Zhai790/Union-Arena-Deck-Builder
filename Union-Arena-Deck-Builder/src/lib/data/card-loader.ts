import type { Card, CardWithMetadata } from './card-types';

const CARD_DATA_URL =
  'https://raw.githubusercontent.com/apitcg/union-arena-tcg-data/main/cards/en/general.json';

const CACHE_KEY = 'union-arena-cards';
const CACHE_TIMESTAMP_KEY = 'union-arena-cards-timestamp';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Extract series from card set
 * Examples:
 * - "BLEACH Thousand-Year Blood War" → "BLEACH"
 * - "HUNTER×HUNTER" → "HUNTER×HUNTER"
 * - "Code Geass" → "Code Geass"
 */
function extractSeries(set: string): string {
  // Common patterns: take the main franchise name before any subtitle
  const parts = set.split(/\s+-\s+|:\s+/);
  return parts[0].trim();
}

/**
 * Extract primary energy color from needEnergy field
 * Examples:
 * - "Yellow x 2, Any x 1" → "Yellow"
 * - "Purple x 3" → "Purple"
 * - "Green x 1, Any x 2" → "Green"
 * - "Any x 3" → "Any" (colorless)
 */
function extractPrimaryColor(needEnergy: string): string {
  if (!needEnergy || needEnergy.trim() === '') {
    return 'Any';
  }

  // Parse energy requirements and find the color with highest count
  const energyPattern = /(\w+)\s+x\s+(\d+)/gi;
  const matches = Array.from(needEnergy.matchAll(energyPattern));

  if (matches.length === 0) {
    return 'Any';
  }

  let maxColor = 'Any';
  let maxCount = 0;

  for (const match of matches) {
    const color = match[1];
    const count = parseInt(match[2], 10);

    // Skip "Any" when determining primary color unless it's the only one
    if (color !== 'Any' && count > maxCount) {
      maxCount = count;
      maxColor = color;
    }
  }

  return maxColor;
}

/**
 * Normalize card data with metadata
 */
function normalizeCard(card: Card): CardWithMetadata {
  return {
    ...card,
    series: extractSeries(card.set),
    primaryColor: extractPrimaryColor(card.needEnergy),
  };
}

/**
 * Load cards from cache if available and not expired
 */
function loadFromCache(): CardWithMetadata[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

    if (!cached || !timestamp) {
      return null;
    }

    const age = Date.now() - parseInt(timestamp, 10);
    if (age > CACHE_DURATION) {
      return null;
    }

    return JSON.parse(cached);
  } catch (error) {
    console.error('Failed to load cards from cache:', error);
    return null;
  }
}

/**
 * Save cards to cache
 */
function saveToCache(cards: CardWithMetadata[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cards));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Failed to save cards to cache:', error);
  }
}

/**
 * Fetch and load all cards from the apitcg repository
 */
export async function loadCards(): Promise<CardWithMetadata[]> {
  // Try cache first
  const cached = loadFromCache();
  if (cached) {
    console.log(`Loaded ${cached.length} cards from cache`);
    return cached;
  }

  // Fetch from remote
  console.log('Fetching cards from apitcg repository...');
  try {
    const response = await fetch(CARD_DATA_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch cards: ${response.statusText}`);
    }

    const rawCards: Card[] = await response.json();
    const normalizedCards = rawCards.map(normalizeCard);

    // Save to cache
    saveToCache(normalizedCards);

    console.log(`Loaded ${normalizedCards.length} cards from remote`);
    return normalizedCards;
  } catch (error) {
    console.error('Failed to load cards:', error);
    throw error;
  }
}

/**
 * Clear card cache (useful for debugging)
 */
export function clearCardCache(): void {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_TIMESTAMP_KEY);
}

/**
 * Build card lookup map by ID for fast access
 */
export function buildCardIndex(cards: CardWithMetadata[]): Map<string, CardWithMetadata> {
  const index = new Map<string, CardWithMetadata>();
  for (const card of cards) {
    index.set(card.id, card);
  }
  return index;
}
