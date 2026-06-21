import type { Card, CardWithMetadata } from './card-types';
import { loadJWACards } from './jwa-card-loader';

const CARD_DATA_URL =
  'https://raw.githubusercontent.com/apitcg/union-arena-tcg-data/main/cards/en/general.json';

const CACHE_KEY = 'union-arena-cards-jwa';
const CACHE_TIMESTAMP_KEY = 'union-arena-cards-timestamp-jwa';
const CACHE_VERSION_KEY = 'union-arena-cards-version';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const CURRENT_VERSION = 'jwa-v2'; // Increment to invalidate old cache

/**
 * Extract series from card set
 * Examples:
 * - "BLEACH Thousand-Year Blood War" → "BLEACH"
 * - "HUNTER×HUNTER" → "HUNTER×HUNTER"
 * - "Code Geass" → "Code Geass"
 */
function extractSeries(set: string): string {
  if (!set || typeof set !== 'string') {
    return 'Unknown';
  }
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
  if (!needEnergy || typeof needEnergy !== 'string' || needEnergy.trim() === '') {
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
    const version = localStorage.getItem(CACHE_VERSION_KEY);

    // Check version - invalidate cache if version changed
    if (version !== CURRENT_VERSION) {
      console.log('Cache version mismatch, will reload data');
      return null;
    }

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
    localStorage.setItem(CACHE_VERSION_KEY, CURRENT_VERSION);
  } catch (error) {
    console.error('Failed to save cards to cache:', error);
  }
}

/**
 * Fetch and load all cards from the J-W-A-Ships repository
 */
export async function loadCards(): Promise<CardWithMetadata[]> {
  // Clear old cache keys from previous versions
  localStorage.removeItem('union-arena-cards'); // Old apitcg cache
  localStorage.removeItem('union-arena-cards-timestamp');

  // Try cache first
  const cached = loadFromCache();
  if (cached) {
    console.log(`Loaded ${cached.length} cards from cache (J-W-A-Ships)`);
    // Sanity check: if we got old apitcg data somehow, reject it
    if (cached.length < 1000) {
      console.warn('Cached data looks suspicious (too few cards), refetching...');
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      localStorage.removeItem(CACHE_VERSION_KEY);
      // Fall through to fetch
    } else {
      return cached;
    }
  }

  // Fetch from J-W-A-Ships repository
  console.log('Fetching cards from J-W-A-Ships repository...');
  try {
    const cards = await loadJWACards();

    if (cards.length === 0) {
      throw new Error('No cards loaded from J-W-A-Ships repository');
    }

    console.log(`✅ Successfully loaded ${cards.length} cards from J-W-A-Ships (multiple series)`);

    // Save to cache
    saveToCache(cards);

    return cards;
  } catch (error) {
    console.error('Failed to load cards from J-W-A-Ships:', error);
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
 * Normalize card ID by removing set prefix
 * Examples:
 * - "UA47BT-TKG-1-080" → "TKG-1-080"
 * - "UE15BT/EVA-1-001" → "EVA-1-001"
 * - "UAPR-TKG-P-001" → "TKG-P-001" (promo)
 * - "TKG-1-080" → "TKG-1-080" (already normalized)
 */
function normalizeCardId(id: string): string {
  // Remove common set prefixes with - or / delimiter
  // Patterns:
  // - UA47BT-, UE15BT/ (set number + type)
  // - UAPR-, UEPR- (promo without set number)
  return id.replace(/^U[AE](\d+)?[A-Z]+[-/]/, '');
}

/**
 * Build card lookup map by ID for fast access
 * Supports both full format (UA47BT-TKG-1-080) and short format (TKG-1-080)
 */
export function buildCardIndex(cards: CardWithMetadata[]): Map<string, CardWithMetadata> {
  const index = new Map<string, CardWithMetadata>();
  for (const card of cards) {
    // Index by original ID
    index.set(card.id, card);

    // Also index by normalized ID (without set prefix)
    const normalizedId = normalizeCardId(card.id);
    if (normalizedId !== card.id) {
      index.set(normalizedId, card);
    }

    // Also index full format versions for short IDs
    // If card has "TKG-1-080", also add "UA47BT-TKG-1-080", "UA47ST-TKG-1-080", etc.
    if (!card.id.startsWith('UA') && !card.id.startsWith('UE')) {
      // Common set prefixes: BT (booster), ST (starter), PR (promo)
      const setNumbers = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
                          '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
                          '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
                          '31', '32', '33', '34', '35', '36', '37', '38', '39', '40',
                          '41', '42', '43', '44', '45', '46', '47', '48', '49', '50'];
      const setTypes = ['BT', 'ST', 'PR'];

      for (const num of setNumbers) {
        for (const type of setTypes) {
          // Handle both - and / delimiters
          index.set(`UA${num}${type}-${card.id}`, card);
          index.set(`UE${num}${type}/${card.id}`, card); // UE prefix uses / delimiter
          index.set(`UE${num}${type}-${card.id}`, card); // Also handle - for UE
        }
      }

      // Also handle promo cards without set number (UAPR-, UEPR-)
      index.set(`UAPR-${card.id}`, card);
      index.set(`UEPR-${card.id}`, card);
    }
  }

  // Debug: Log a sample of indexed IDs
  console.log(`Built card index with ${index.size} total entries for ${cards.length} unique cards`);
  const sampleKeys = Array.from(index.keys()).filter(k => k.includes('TKG')).slice(0, 5);
  console.log('Sample TKG card IDs in index:', sampleKeys);

  return index;
}
