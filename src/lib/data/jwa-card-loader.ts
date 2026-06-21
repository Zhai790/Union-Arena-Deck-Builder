import type { Card, CardWithMetadata } from './card-types';

const BASE_URL = 'https://raw.githubusercontent.com/J-W-A-Ships/Union_Arena/main/';

// Available series files in the J-W-A-Ships repo
const SERIES_FILES = [
  'Tokyo_Ghoul_Generated_DB.js',
  'BLEACH_Generated_DB.js',
  'Hunter_x_Hunter_Generated_DB.js',
  'Jujutsu_Kaisen_Generated_DB.js',
  'Code_Geass_Generated_DB.js',
  'Demon_Slayer_Generated_DB.js',
  'One_Punch_Man_Generated_DB.js',
  'Attack_on_Titan_Generated_DB.js',
  'Black_Clover_Generated_DB.js',
  'Evangelion_Generated_DB.js',
  'Fullmetal_Alchemist_Generated_DB.js',
  'Kagurabachi_Generated_DB.js',
  'Kaiju_No__8_Generated_DB.js',
  'NIKKE_Generated_DB.js',
  'Solo_Leveling_Generated_DB.js',
  'Rurouni_Kenshin_Generated_DB (4).js',
  'Arknights.js',
];

interface JWACard {
  code: string;
  tcgplayerId?: number;
  name: string;
  color: string;
  energy: number;
  type: string;
  trigger: string;
  img: string;
  genEnergy: number;
  apCost: number;
  bp: number;
  rarity: string;
  affinities: string;
  effect: string;
  hasReverseHolo?: boolean;
}

/**
 * Extract series name from filename
 * "Tokyo_Ghoul_Generated_DB.js" -> "Tokyo Ghoul"
 */
function extractSeriesFromFilename(filename: string): string {
  return filename
    .replace(/_Generated_DB.*\.js$/, '')
    .replace(/\.js$/, '')
    .replace(/_/g, ' ')
    .replace(/ \(\d+\)$/, ''); // Remove "(4)" suffix
}

/**
 * Parse JavaScript card data file
 * The format is: window.cardDB["Series Name"] = [{...cards}];
 */
function parseJavaScriptCardData(jsContent: string, seriesName: string): JWACard[] {
  try {
    // Extract the JSON array from the JavaScript
    // Format: window.cardDB["Tokyo Ghoul"] = [{...}];
    const match = jsContent.match(/window\.cardDB\[.*?\]\s*=\s*(\[[\s\S]*?\]);/);
    if (!match) {
      console.error(`Could not parse card data for ${seriesName}`);
      return [];
    }

    const jsonString = match[1];
    const cards = JSON.parse(jsonString) as JWACard[];
    return cards;
  } catch (error) {
    console.error(`Error parsing ${seriesName} card data:`, error);
    return [];
  }
}

/**
 * Convert J-W-A-Ships card format to our Card format
 */
function convertJWACard(jwaCard: JWACard, seriesName: string): CardWithMetadata {
  // Convert color to needEnergy format
  // "Yellow" -> "Yellow x {energy}"
  const needEnergy = jwaCard.energy > 0
    ? `${jwaCard.color} x ${jwaCard.energy}`
    : jwaCard.color;

  return {
    id: jwaCard.code,
    code: jwaCard.code,
    name: jwaCard.name,
    rarity: jwaCard.rarity,
    ap: jwaCard.apCost,
    type: jwaCard.type,
    bp: jwaCard.bp,
    affinity: jwaCard.affinities || '-',
    effect: jwaCard.effect || '-',
    trigger: jwaCard.trigger || '-',
    images: {
      small: jwaCard.img,
      large: jwaCard.img,
    },
    set: seriesName,
    needEnergy: needEnergy,
    // Computed fields
    series: seriesName,
    primaryColor: jwaCard.color,
  };
}

/**
 * Fetch cards from a single series file
 */
async function fetchSeriesCards(filename: string): Promise<CardWithMetadata[]> {
  const url = BASE_URL + filename;
  const seriesName = extractSeriesFromFilename(filename);

  try {
    console.log(`Fetching ${seriesName} cards...`);
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch ${seriesName}: ${response.statusText}`);
      return [];
    }

    const jsContent = await response.text();
    const jwaCards = parseJavaScriptCardData(jsContent, seriesName);
    const cards = jwaCards.map(card => convertJWACard(card, seriesName));

    console.log(`Loaded ${cards.length} cards from ${seriesName}`);
    return cards;
  } catch (error) {
    console.error(`Error loading ${seriesName}:`, error);
    return [];
  }
}

/**
 * Fetch cards from all series (or specific series)
 */
export async function loadJWACards(seriesFilter?: string[]): Promise<CardWithMetadata[]> {
  const filesToLoad = seriesFilter
    ? SERIES_FILES.filter(file => {
        const series = extractSeriesFromFilename(file);
        return seriesFilter.some(filter =>
          series.toLowerCase().includes(filter.toLowerCase())
        );
      })
    : SERIES_FILES;

  console.log(`Loading ${filesToLoad.length} series from J-W-A-Ships...`);

  // Fetch all series in parallel (but limit concurrency to avoid overwhelming the server)
  const batchSize = 5;
  const allCards: CardWithMetadata[] = [];

  for (let i = 0; i < filesToLoad.length; i += batchSize) {
    const batch = filesToLoad.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(file => fetchSeriesCards(file))
    );
    allCards.push(...batchResults.flat());
  }

  console.log(`Total cards loaded: ${allCards.length}`);
  return allCards;
}

/**
 * Get list of available series
 */
export function getAvailableSeries(): string[] {
  return SERIES_FILES.map(extractSeriesFromFilename);
}
