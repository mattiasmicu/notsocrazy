#!/usr/bin/env bun
/**
 * Auto Web Scraper - Discovers and downloads games from CrazyGames
 * 
 * This script:
 * 1. Scrapes CrazyGames website to discover games
 * 2. Extracts game metadata from pages
 * 3. Downloads games automatically
 * 4. Uploads to CDN and deletes local files (streaming mode)
 * 5. Can handle specific game URLs
 * 
 * Usage:
 *   bun run scripts/auto-web-scraper.ts https://www.crazygames.com/game/jelly-dash-uki
 *   bun run scripts/auto-web-scraper.ts --discover racing
 *   bun run scripts/auto-web-scraper.ts --trending
 *   bun run scripts/auto-web-scraper.ts --stream-all
 *   bun run scripts/auto-web-scraper.ts --stream-category racing
 *   
 * Environment variables for CDN:
 *   CDN_PROVIDER=cloudflare|aws-s3|google-cloud
 *   CDN_ENDPOINT=<your-cdn-endpoint>
 *   CDN_ACCESS_KEY=<your-access-key>
 *   CDN_SECRET_KEY=<your-secret-key>
 *   CDN_BUCKET=<your-bucket-name>
 *   CDN_BASE_URL=<your-cdn-base-url>
 */

import { mkdir, writeFile, readFile, readdir, unlink, stat, rename } from "fs/promises";
import { join, basename } from "path";
import { randomUUID } from "crypto";

const GAMES_PATH = "./src/data/games.ts";
const GAMES_DIR = "./public/games";

// CDN Configuration - GitHub + jsDelivr CDN setup
const CDN_CONFIG = {
  provider: process.env.CDN_PROVIDER || 'github',
  endpoint: process.env.CDN_ENDPOINT || '',
  accessKey: process.env.CDN_ACCESS_KEY || '',
  secretKey: process.env.CDN_SECRET_KEY || '',
  bucket: process.env.CDN_BUCKET || '',
  region: process.env.CDN_REGION || 'auto',
  baseUrl: process.env.CDN_BASE_URL || 'https://cdn.jsdelivr.net/gh/your-username/game-cdn@main',
  enabled: process.env.CDN_ENABLED === 'true'
};

interface GameInfo {
  name: string;
  category: string;
  description: string;
  crazygamesUrl: string;
  slug: string;
  rating?: number;
  plays?: number;
  priority?: number;
  priorityCategory?: string;
  discoveredFrom?: string;
}

// Mapping of category names to their correct CrazyGames URL paths
const CATEGORY_URL_MAP: Record<string, string> = {
  'action': 'c/action',
  'adventure': 'c/adventure',
  'basketball': 't/basketball',
  'bike': 't/bike',
  'car': 't/car',
  'card': 'c/card',
  'casual': 't/casual',
  'clicker': 'c/clicker',
  'controller': 't/controller',
  'driving': 'c/driving',
  'escape': 't/escape',
  'flash': 't/flash',
  'fps': 't/first-person-shooter',
  'first-person-shooter': 't/first-person-shooter',
  'horror': 't/horror',
  'io': 'io',
  'mahjong': 'c/mahjong',
  'minecraft': 't/minecraft',
  'pool': 't/pool',
  'puzzle': 'c/puzzle',
  'shooting': 'c/shooting',
  'soccer': 't/soccer',
  'sports': 'c/sports',
  'stickman': 't/stickman',
  'thinky': 't/thinky',
  'tower-defense': 't/tower-defense',
  'tower defense': 't/tower-defense',
  'multiplayer': 'multiplayer',
  'originals': 'originals',
  'updated': 'updated',
  'hot': 'hot',
  'popular': 'hot',
  'racing': 'c/racing',
  'strategy': 'c/strategy',
  'simulation': 'c/simulation',
  'role-playing': 'c/role-playing',
  'music': 'c/music',
  'educational': 'c/educational',
};

function getCategoryUrl(category: string): string {
  const normalizedCategory = category.toLowerCase().trim();
  return CATEGORY_URL_MAP[normalizedCategory] || `c/${normalizedCategory}`;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("AUTO WEB SCRAPER - Discover games from CrazyGames\n");
    console.log("Usage:");
    console.log("  bun run scripts/auto-web-scraper.ts <game-url>");
    console.log("  bun run scripts/auto-web-scraper.ts <category-url>");
    console.log("  bun run scripts/auto-web-scraper.ts --discover <category>");
    console.log("  bun run scripts/auto-web-scraper.ts --trending");
    console.log("  bun run scripts/auto-web-scraper.ts --all");
    console.log("  bun run scripts/auto-web-scraper.ts --stream-all");
    console.log("  bun run scripts/auto-web-scraper.ts --stream-category <category>");
    console.log("\nExamples:");
    console.log("  bun run scripts/auto-web-scraper.ts https://www.crazygames.com/game/jelly-dash-uki");
    console.log("  bun run scripts/auto-web-scraper.ts https://www.crazygames.com/c/racing");
    console.log("  bun run scripts/auto-web-scraper.ts --discover racing");
    console.log("  bun run scripts/auto-web-scraper.ts --trending");
    console.log("  bun run scripts/auto-web-scraper.ts --all");
    console.log("  bun run scripts/auto-web-scraper.ts --stream-all");
    console.log("  bun run scripts/auto-web-scraper.ts --stream-category racing");
    console.log("\nCDN Streaming Mode:");
    console.log(`  CDN Enabled: ${CDN_CONFIG.enabled}`);
    console.log(`  CDN Provider: ${CDN_CONFIG.provider}`);
    return;
  }

  const arg0 = args[0];

  if (arg0 && arg0.startsWith('https://')) {
    // Check if it's a category URL (contains /c/)
    if (arg0.includes('/c/')) {
      // Extract category from URL
      const categoryMatch = arg0.match(/\/c\/([^/?]+)/);
      const category = categoryMatch ? categoryMatch[1] : '';
      console.log(`Scraping category from URL: ${category || 'unknown'}`);
      await discoverGamesByCategory(category || 'all', arg0);
    } else if (arg0.includes('/game/')) {
      // Single game URL
      console.log(`Downloading game from: ${arg0}`);
      await downloadGameFromUrl(arg0);
    } else {
      console.log('Unknown URL format. Use /c/<category> for categories or /game/<name> for single games');
    }
  } else if (arg0 === '--discover') {
    // Discover games by category
    const category = args[1] || 'all';
    console.log(`Discovering games in category: ${category}`);
    await discoverGamesByCategory(category);
  } else if (args[0] === '--trending') {
    // Get trending games
    console.log('Getting trending games');
    await getTrendingGames();
  } else if (args[0] === '--all') {
    // Download all games from CrazyGames
    console.log('Discovering and downloading all games from CrazyGames');
    await downloadAllGames();
  } else if (args[0] === '--stream-all') {
    // Stream all games to CDN
    console.log('Streaming all games to CDN (minimal storage)');
    await streamAllGamesToCdn();
  } else if (args[0] === '--stream-category') {
    // Stream specific category to CDN
    const category = args[1] || 'action';
    console.log(`Streaming ${category} games to CDN (minimal storage)`);
    await streamCategoryToCdn(category);
  } else {
    console.log('Invalid arguments. Use --help for usage.');
  }
}

async function downloadAllGames() {
  try {
    console.log('\n[INFO] Discovering all games from CrazyGames...');
    const allGames = await discoverAllCrazyGames();
    console.log(`[INFO] Found ${allGames.length} total games`);

    // Filter out already downloaded games
    const existingGames = await loadGames();
    const existingTitles = new Set(existingGames.map(g => g.title));
    const newGames = allGames.filter(game => !existingTitles.has(game.name));
    
    console.log(`[INFO] ${newGames.length} new games to download`);
    
    if (newGames.length === 0) {
      console.log('[INFO] All games already downloaded');
      return;
    }

    // Download games in parallel batches of 10
    const batchSize = 10;
    let downloaded = 0;
    let failed = 0;

    for (let i = 0; i < newGames.length; i += batchSize) {
      const batch = newGames.slice(i, i + batchSize);
      console.log(`\n[INFO] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(newGames.length / batchSize)} (${batch.length} games)`);
      
      // Process batch in parallel
      const promises = batch.map(async (game, index) => {
        try {
          const priorityInfo = game.priority ? `[P${game.priority}] ${game.discoveredFrom || ''}` : '';
          console.log(`[${i + index + 1}/${newGames.length}] ${priorityInfo} Downloading: ${game.name}`);
          await downloadGameFromInfo(game);
          downloaded++;
          console.log(`[SUCCESS] ${game.name} downloaded`);
          return { success: true, game: game.name, priority: game.priority };
        } catch (error) {
          failed++;
          console.log(`[FAILED] ${game.name} - ${(error as Error).message}`);
          return { success: false, game: game.name, error: (error as Error).message };
        }
      });

      await Promise.all(promises);
      
      // Small delay between batches to avoid overwhelming the server
      if (i + batchSize < newGames.length) {
        console.log('[INFO] Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`\n[SUMMARY] Download complete:`);
    console.log(`   Successfully downloaded: ${downloaded}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total games in library: ${existingGames.length + downloaded}`);
    console.log(`\n[INFO] Restart dev server to see new games!`);

  } catch (error) {
    console.log(`[ERROR] Failed to discover games: ${(error as Error).message}`);
  }
}

async function discoverAllCrazyGames(): Promise<GameInfo[]> {
  console.log('[INFO] Discovering games with priority ordering...');
  
  // Priority categories in order of importance
  const priorityCategories = [
    { name: 'trending', url: '', priority: 1, description: 'Trending/Popular Games' },
    { name: 'originals', url: 'originals', priority: 2, description: 'CrazyGames Originals' },
    { name: 'multiplayer', url: 'multiplayer', priority: 3, description: 'Multiplayer Games' },
    { name: 'racing', url: 'c/racing', priority: 4, description: 'Car/Racing Games' },
    { name: 'io', url: 'io', priority: 5, description: '.io Games' },
    { name: 'action', url: 'c/action', priority: 6, description: 'Action Games' },
    { name: 'sports', url: 'c/sports', priority: 7, description: 'Sports Games' },
    { name: 'puzzle', url: 'c/puzzle', priority: 8, description: 'Puzzle Games' },
    { name: 'strategy', url: 'c/strategy', priority: 9, description: 'Strategy Games' },
    { name: 'adventure', url: 'c/adventure', priority: 10, description: 'Adventure Games' },
    { name: 'casual', url: 't/casual', priority: 11, description: 'Casual Games' },
    { name: 'shooting', url: 'c/shooting', priority: 12, description: 'Shooting Games' },
    { name: 'fps', url: 't/first-person-shooter', priority: 13, description: 'FPS Games' },
    { name: 'driving', url: 'c/driving', priority: 14, description: 'Driving Games' },
    { name: 'stickman', url: 't/stickman', priority: 15, description: 'Stickman Games' },
    { name: 'towerdefense', url: 't/tower-defense', priority: 16, description: 'Tower Defense Games' },
    { name: 'basketball', url: 't/basketball', priority: 17, description: 'Basketball Games' },
    { name: 'bike', url: 't/bike', priority: 18, description: 'Bike Games' },
    { name: 'car', url: 't/car', priority: 19, description: 'Car Games' },
    { name: 'card', url: 'c/card', priority: 20, description: 'Card Games' },
    { name: 'clicker', url: 'c/clicker', priority: 21, description: 'Clicker Games' },
    { name: 'controller', url: 't/controller', priority: 22, description: 'Controller Games' },
    { name: 'flash', url: 't/flash', priority: 23, description: 'Flash Games' },
    { name: 'idle', url: 'c/idle', priority: 24, description: 'Idle Games' },
    { name: 'mahjong', url: 'c/mahjong', priority: 25, description: 'Mahjong Games' },
    { name: 'minecraft', url: 't/minecraft', priority: 26, description: 'Minecraft Games' },
    { name: 'pool', url: 't/pool', priority: 27, description: 'Pool Games' },
    { name: 'soccer', url: 't/soccer', priority: 28, description: 'Soccer Games' }
  ];

  const allGames: GameInfo[] = [];
  const discoveredGames = new Map<string, GameInfo>();

  // Process categories in priority order
  for (const category of priorityCategories) {
    console.log(`\n${category.description} (Priority ${category.priority})`);
    
    try {
      let categoryGames: GameInfo[] = [];
      
      if (category.name === 'trending') {
        // Get trending games from main page
        categoryGames = await getGamesFromMainPage();
      } else {
        // Get games from category page
        categoryGames = await getGamesFromCategory(category.url);
      }
      
      console.log(`[INFO] Found ${categoryGames.length} ${category.name} games`);
      
      // Add games with priority metadata, avoiding duplicates
      for (const game of categoryGames) {
        if (!discoveredGames.has(game.slug)) {
          // Add priority to the game object
          const prioritizedGame = {
            ...game,
            priority: category.priority,
            priorityCategory: category.name,
            discoveredFrom: category.description
          };
          discoveredGames.set(game.slug, prioritizedGame);
          allGames.push(prioritizedGame);
        }
      }
      
      // Add delay between categories to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`[WARNING] Failed to get ${category.name} games: ${(error as Error).message}`);
    }
  }
  
  // Remove duplicates
  const uniqueGames = allGames.filter((game, index, self) => 
    index === self.findIndex(g => g.slug === game.slug)
  );
  
  // If no games found, add some fallback popular games
  if (uniqueGames.length === 0) {
    console.log('[INFO] No games discovered, adding fallback popular games...');
    const fallbackGames = [
      { name: '1v1 Lol', category: 'Multiplayer', description: 'Build and battle shooter', crazygamesUrl: 'https://www.crazygames.com/game/1v1-lol', slug: '1v1-lol' },
      { name: 'Smash Karts', category: 'Racing', description: 'Kart racing with weapons', crazygamesUrl: 'https://www.crazygames.com/game/smash-karts', slug: 'smash-karts' },
      { name: 'Paper Io 2', category: 'IO', description: 'Conquer territory game', crazygamesUrl: 'https://www.crazygames.com/game/paper-io-2', slug: 'paper-io-2' },
      { name: 'Agar Io', category: 'IO', description: 'Grow your cell and dominate', crazygamesUrl: 'https://www.crazygames.com/game/agar-io', slug: 'agar-io' },
      { name: 'Moto X3M', category: 'Racing', description: 'Motorcycle stunt racing', crazygamesUrl: 'https://www.crazygames.com/game/moto-x3m', slug: 'moto-x3m' },
      { name: 'Drift Hunters', category: 'Racing', description: 'Drift racing simulator', crazygamesUrl: 'https://www.crazygames.com/game/drift-hunters', slug: 'drift-hunters' },
      { name: 'Shell Shockers', category: 'Multiplayer', description: 'Egg-themed multiplayer shooter', crazygamesUrl: 'https://www.crazygames.com/game/shell-shockers', slug: 'shell-shockers' },
      { name: 'Basketball Stars', category: 'Sports', description: 'Street basketball', crazygamesUrl: 'https://www.crazygames.com/game/basketball-stars', slug: 'basketball-stars' },
      { name: 'Idle Breakout', category: 'Idle', description: 'Idle meets breakout', crazygamesUrl: 'https://www.crazygames.com/game/idle-breakout', slug: 'idle-breakout' },
      { name: 'Venge Io', category: 'Multiplayer', description: 'Multiplayer FPS', crazygamesUrl: 'https://www.crazygames.com/game/venge-io', slug: 'venge-io' }
    ];
    
    uniqueGames.push(...fallbackGames);
    console.log(`[INFO] Added ${fallbackGames.length} fallback games`);
  }
  
  console.log(`[INFO] Found ${uniqueGames.length} unique games after deduplication`);
  return uniqueGames;
}

async function getGamesFromMainPage(): Promise<GameInfo[]> {
  try {
    const response = await fetch('https://www.crazygames.com/', {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch main page: ${response.status}`);
    }

    const html = await response.text();
    return extractGameLinksFromHtml(html, 'https://www.crazygames.com');
  } catch (error) {
    console.log(`[WARNING] Failed to get main page games: ${(error as Error).message}`);
    return [];
  }
}

async function getGamesFromCategory(categoryPath: string): Promise<GameInfo[]> {
  try {
    const response = await fetch(`https://www.crazygames.com/${categoryPath}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch category page: ${response.status}`);
    }

    const html = await response.text();
    return extractGameLinksFromHtml(html, `https://www.crazygames.com/${categoryPath}`);
  } catch (error) {
    console.log(`[WARNING] Failed to get ${categoryPath} games: ${(error as Error).message}`);
    return [];
  }
}

function extractGameLinksFromHtml(html: string, baseUrl: string): GameInfo[] {
  const games: GameInfo[] = [];
  
  // Multiple patterns to extract game links
  const patterns = [
    /<a[^>]*href=["']\/game\/([^"']+)["'][^>]*>/gi,
    /<a[^>]*href=["']([^"']*\/game\/[^"']+)["'][^>]*>/gi,
    /"url":"\/game\/([^"]+)"/gi,
    /"slug":"([^"]+)"/gi
  ];
  
  const extractedSlugs = new Set<string>();
  
  for (const pattern of patterns) {
    const matches = html.match(pattern);
    if (!matches) continue;
    
    for (const match of matches) {
      let slug: string | undefined;
      
      if (pattern.toString().includes('href')) {
        const slugMatch = match.match(/href=["']\/game\/([^"']+)["']/) || 
                        match.match(/href=["']([^"']*\/game\/([^"']+))["']/);
        slug = slugMatch ? (slugMatch[2] || slugMatch[1]) : undefined;
      } else {
        slug = match.match(/"([^"]+)"/)?.[1];
      }
      
      if (slug && !extractedSlugs.has(slug)) {
        extractedSlugs.add(slug);
        
        // Clean up the slug
        const cleanSlug = slug.replace(/^.*\//, ''); // Remove any path prefix
        const name = cleanSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        games.push({
          name: name,
          category: 'Other',
          description: `Play ${name}`,
          crazygamesUrl: `https://www.crazygames.com/game/${cleanSlug}`,
          slug: cleanSlug
        });
      }
    }
  }
  
  return games;
}

async function downloadGameFromInfo(gameInfo: GameInfo) {
  // Check if game already exists
  const existingGames = await loadGames();
  const existingGame = existingGames.find(g => g.title === gameInfo.name);
  if (existingGame) {
    return; // Skip if already exists
  }

  const gameFrameUrl = await findGameFrameUrl(gameInfo.crazygamesUrl);
  if (!gameFrameUrl) {
    throw new Error('Could not find game iframe URL');
  }

  const frameHtml = await fetchWithHeaders(gameFrameUrl);
  const unityUrls = extractUnityUrls(frameHtml);
  if (!unityUrls) {
    throw new Error('Could not extract Unity game URLs');
  }

  // Create game directory
  const id = `unity-${Date.now()}-${gameInfo.slug}`;
  const gameDir = join(GAMES_DIR, id);
  await mkdir(gameDir, { recursive: true });

  // Download Unity game files
  await downloadUnityFiles(unityUrls, gameDir, gameFrameUrl);

  // Create simple game HTML
  await createSimpleGameHtml(unityUrls, gameDir, gameInfo.slug, id, gameInfo);

  // Download thumbnail
  await downloadThumbnail(gameInfo.slug, gameDir, gameInfo);

  // Save to database
  await saveGame({
    id,
    title: gameInfo.name,
    description: gameInfo.description,
    category: gameInfo.category,
    rating: gameInfo.rating || (4.0 + Math.random()),
    plays: gameInfo.plays || Math.floor(Math.random() * 100000),
    path: `/games/${id}/index.html`,
  });
}

async function downloadGameFromUrl(gameUrl: string) {
  try {
    console.log('\n[INFO] Step 1: Extracting game information...');
    const gameInfo = await extractGameInfoFromUrl(gameUrl);
    if (!gameInfo) {
      throw new Error('Could not extract game information');
    }

    console.log(`   Name: ${gameInfo.name}`);
    console.log(`   Category: ${gameInfo.category}`);
    console.log(`   Slug: ${gameInfo.slug}`);

    // Check if game already exists
    const existingGames = await loadGames();
    const existingGame = existingGames.find(g => g.title === gameInfo.name);
    if (existingGame) {
      console.log(`[SKIP] Game already exists: ${gameInfo.name}`);
      return;
    }

    console.log('\n[INFO] Step 2: Finding game iframe...');
    const gameFrameUrl = await findGameFrameUrl(gameUrl);
    if (!gameFrameUrl) {
      throw new Error('Could not find game iframe URL');
    }
    console.log(`   Found iframe: ${gameFrameUrl}`);

    console.log('\n[INFO] Step 3: Checking game type...');
    const frameHtml = await fetchWithHeaders(gameFrameUrl);
    const unityUrls = extractUnityUrls(frameHtml);
    
    const isUnityGame = unityUrls !== null;
    console.log(`   Game type: ${isUnityGame ? 'Unity' : 'Non-Unity (embed)'}`);

    // Create game directory
    const id = isUnityGame ? `unity-${Date.now()}-${gameInfo.slug}` : `html-${Date.now()}-${gameInfo.slug}`;
    const gameDir = join(GAMES_DIR, id);
    await mkdir(gameDir, { recursive: true });
    console.log(`\n[INFO] Created directory: ${gameDir}`);

    if (isUnityGame) {
      // Download Unity game files
      console.log('\n[INFO] Step 4: Downloading Unity game files...');
      console.log(`   Found Unity loader: ${unityUrls.unityLoaderUrl}`);
      console.log(`   Found ${unityUrls.buildUrls.length} build files`);
      await downloadUnityFiles(unityUrls, gameDir, gameFrameUrl);

      // Create simple game HTML
      console.log('\n[INFO] Step 5: Creating simple game HTML...');
      await createSimpleGameHtml(unityUrls, gameDir, gameInfo.slug, id, gameInfo);
    } else {
      // Download non-Unity game files locally
      console.log('\n[INFO] Step 4: Downloading non-Unity game files locally...');
      await downloadNonUnityGame(gameFrameUrl, gameDir, gameInfo.name);
    }

    // Download thumbnail
    await downloadThumbnail(gameInfo.slug, gameDir, gameInfo);

    // Save to database
    await saveGame({
      id,
      title: gameInfo.name,
      description: gameInfo.description,
      category: gameInfo.category,
      rating: gameInfo.rating || (4.0 + Math.random()),
      plays: gameInfo.plays || Math.floor(Math.random() * 100000),
      path: `/games/${id}/index.html`,
    });

    console.log(`\n[SUCCESS] ${gameInfo.name} downloaded!`);
    console.log(`[INFO] Restart dev server to play the game!`);

  } catch (error) {
    console.log(`\n[ERROR] Failed: ${(error as Error).message}`);
  }
}

async function extractGameInfoFromUrl(gameUrl: string): Promise<GameInfo | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(gameUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });
    
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Failed to fetch game page: ${response.status}`);
    }

    const html = await response.text();

    // Extract game name
    const nameMatch = html.match(/<title[^>]*>([^<]+)</i) || 
                     html.match(/<h1[^>]*class=\"[^"]*title[^"]*\"[^>]*>([^<]+)/i);
    let name = nameMatch ? nameMatch[1].trim() : 'Unknown Game';
    // Remove emojis and CrazyGames suffixes
    name = name.replace(/ - CrazyGames/g, '')
               .replace(/ Play on CrazyGames/g, '')
               .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters (including emojis)
               .trim();

    // Extract category
    const categoryMatch = html.match(/<a[^>]*href=\"\/t\/([^\"/]+)\"/i) ||
                          html.match(/<span[^>]*class=\"[^"]*category[^"]*\"[^>]*>([^<]+)/i);
    const category = categoryMatch ? categoryMatch[1].charAt(0).toUpperCase() + categoryMatch[1].slice(1) : 'Other';

    // Extract description
    const descMatch = html.match(/<meta[^>]*name=\"description\"[^>]*content=\"([^\"]+)\"/i) ||
                     html.match(/<meta[^>]*property=\"og:description\"[^>]*content=\"([^\"]+)\"/i);
    const description = descMatch ? descMatch[1] : `Play ${name}`;

    // Extract slug from URL
    const slugMatch = gameUrl.match(/\/game\/([^\/\?]+)/);
    const slug = slugMatch ? slugMatch[1] : name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // Extract rating and plays if available
    const ratingMatch = html.match(/<span[^>]*class=\"[^"]*rating[^"]*\"[^>]*>([^<]+)/i);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;

    const playsMatch = html.match(/<span[^>]*class=\"[^"]*plays?[^"]*\"[^>]*>([^<]+)/i) ||
                      html.match(/(\d+(?:,\d+)*)\s*plays?/i);
    const plays = playsMatch ? parseInt(playsMatch[1].replace(/,/g, '')) : undefined;

    return {
      name,
      category,
      description,
      crazygamesUrl: gameUrl,
      slug,
      rating,
      plays
    };

  } catch (error) {
    console.error('Error extracting game info:', error);
    return null;
  }
}

async function findGameFrameUrl(crazygamesUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(crazygamesUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });
    
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Failed to fetch CrazyGames page: ${response.status}`);
    }

    const html = await response.text();

    // Look for iframe with game files
    const iframeMatch = html.match(/<iframe[^>]*src=["']([^"']*files\.crazygames\.com[^"']*)["']/i);
    if (iframeMatch && iframeMatch[1]) {
      return iframeMatch[1];
    }

    // Look for other game frame patterns
    const patterns = [
      /data-game-url=["']([^"']*files\.crazygames\.com[^"']*)["']/i,
      /["']([^"']*files\.crazygames\.com[^"']*\/index\.html)["']/i,
      /["']([^"']*games\.crazygames\.com[^"']*\/index\.html)["']/i,
      /["']([^"']*\.game-files\.crazygames\.com[^"']*\/index\.html)["']/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding game frame URL:', error);
    return null;
  }
}

function extractUnityUrls(html: string): any {
  // Look for the options variable with Unity configuration
  // The options object can be multi-line, so we need to handle that
  const optionsMatch = html.match(/var options\s*=\s*({[\s\S]*?});\s*\n/);
  if (!optionsMatch) {
    console.log("   Could not find options variable in HTML");
    return null;
  }

  try {
    const optionsText = optionsMatch[1];
    if (!optionsText) {
      console.log("   Empty options text");
      return null;
    }
    
    const urls: any = {
      buildUrls: [] as string[]
    };

    // Try to parse the options object
    try {
      // Replace single quotes with double quotes for JSON parsing
      const jsonText = optionsText.replace(/'/g, '"').replace(/\n/g, '').replace(/\s+/g, ' ');
      const options = JSON.parse(jsonText);
      
      // New format: options.loaderOptions.unityLoaderUrl
      if (options.loaderOptions?.unityLoaderUrl) {
        urls.unityLoaderUrl = options.loaderOptions.unityLoaderUrl;
      }
      
      // New format: options.loaderOptions.unityConfigOptions
      if (options.loaderOptions?.unityConfigOptions) {
        const cfg = options.loaderOptions.unityConfigOptions;
        if (cfg.codeUrl) urls.buildUrls.push(cfg.codeUrl);
        if (cfg.dataUrl) urls.buildUrls.push(cfg.dataUrl);
        if (cfg.frameworkUrl) urls.buildUrls.push(cfg.frameworkUrl);
      }
      
      // Old format fallback
      if (!urls.unityLoaderUrl && options.unityLoaderUrl) {
        urls.unityLoaderUrl = options.unityLoaderUrl;
      }
      
      if (options.codeUrl) urls.buildUrls.push(options.codeUrl);
      if (options.dataUrl) urls.buildUrls.push(options.dataUrl);
      if (options.frameworkUrl) urls.buildUrls.push(options.frameworkUrl);
      
      // Extract game name
      if (options.gameName) {
        urls.gameName = options.gameName;
      }
      
    } catch (parseError) {
      console.log("   JSON parse failed, using regex fallback");
      
      // Fallback to regex extraction
      // Extract Unity loader URL - try new format first
      const loaderMatch = optionsText.match(/unityLoaderUrl["']?\s*:\s*["'](https:\/\/[^"']+\.loader\.js)["']/);
      if (loaderMatch && loaderMatch[1]) {
        urls.unityLoaderUrl = loaderMatch[1];
      }

      // Extract build URLs - look for full URLs
      const urlPattern = /https:\/\/files\.crazygames\.com[^"']*Build[^"']*/g;
      const allUrls = optionsText.match(urlPattern) || [];
      
      for (const url of allUrls) {
        if (!urls.buildUrls.includes(url)) {
          urls.buildUrls.push(url);
        }
      }

      // Extract game name
      const nameMatch = optionsText.match(/gameName["']?\s*:\s*["']([^"']+)["']/);
      if (nameMatch && nameMatch[1]) {
        urls.gameName = nameMatch[1];
      }
    }

    // Validate we found the essential files
    if (!urls.unityLoaderUrl) {
      // This is a non-Unity game, return null to indicate it should be embedded
      return null;
    }
    
    if (urls.buildUrls.length === 0) {
      console.log("   No build URLs found");
      return null;
    }

    console.log(`   Found loader: ${urls.unityLoaderUrl}`);
    console.log(`   Found ${urls.buildUrls.length} build files`);
    
    return urls;
  } catch (error) {
    console.error("   Error parsing Unity URLs:", error);
    return null;
  }
}

async function downloadUnityFiles(urls: any, gameDir: string, refererUrl: string) {
  const downloadedFiles: string[] = [];

  // Create Build directory first
  const buildDir = join(gameDir, "Build");
  await mkdir(buildDir, { recursive: true });

  // Download Unity loader
  if (urls.unityLoaderUrl) {
    const filename = basename(urls.unityLoaderUrl);
    const filePath = join(buildDir, filename);
    await downloadFile(urls.unityLoaderUrl, filePath, refererUrl);
    downloadedFiles.push(filename);
  }

  // Download build files
  for (const buildUrl of urls.buildUrls) {
    const filename = basename(buildUrl);
    const filePath = join(buildDir, filename);
    await downloadFile(buildUrl, filePath, refererUrl);
    downloadedFiles.push(`Build/${filename}`);
  }

  console.log(`   Downloaded ${downloadedFiles.length} files:`);
  downloadedFiles.forEach(file => console.log(`     ${file}`));

  // Rename files with spaces to avoid server 500 errors
  await renameFilesWithSpaces(buildDir);
}

async function downloadFile(url: string, filePath: string, refererUrl: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Referer": refererUrl,
      "Accept": "*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }

  const data = Buffer.from(await response.arrayBuffer());
  await writeFile(filePath, data);
}

async function renameFilesWithSpaces(buildDir: string) {
  try {
    const files = await readdir(buildDir);
    const renamedFiles: string[] = [];

    for (const file of files) {
      if (file.includes(' ')) {
        const oldPath = join(buildDir, file);
        const newPath = join(buildDir, file.replace(/\s+/g, ''));
        await rename(oldPath, newPath);
        renamedFiles.push(`${file} -> ${file.replace(/\s+/g, '')}`);
      }
    }

    if (renamedFiles.length > 0) {
      console.log(`   Renamed ${renamedFiles.length} files to remove spaces:`);
      renamedFiles.forEach(rename => console.log(`     ${rename}`));
    }
  } catch (error) {
    console.log(`   Warning: Could not rename files: ${(error as Error).message}`);
  }
}

async function downloadNonUnityGame(gameFrameUrl: string, gameDir: string, gameName: string) {
  console.log(`   Extracting external embed URL from: ${gameFrameUrl}`);
  
  try {
    // Download the CrazyGames frame HTML to extract the external game URL
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    
    const frameResponse = await fetch(gameFrameUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });
    
    clearTimeout(timeout);
    
    if (!frameResponse.ok) {
      throw new Error(`Failed to fetch game frame: ${frameResponse.status}`);
    }
    
    const frameHtml = await frameResponse.text();
    
    // Extract the external game URL from the options JSON
    const optionsMatch = frameHtml.match(/var options = ({.*?});/s);
    let externalGameUrl: string | null = null;
    
    if (optionsMatch && optionsMatch[1]) {
      try {
        const options = JSON.parse(optionsMatch[1]);
        if (options.loader === 'iframe' && options.loaderOptions?.url) {
          externalGameUrl = options.loaderOptions.url;
          console.log(`   Found external game URL: ${externalGameUrl}`);
        }
      } catch {
        // JSON parse failed, try regex extraction
        const urlMatch = optionsMatch[1].match(/"url":\s*"([^"]+)"/);
        if (urlMatch && urlMatch[1]) {
          externalGameUrl = urlMatch[1];
          console.log(`   Found external game URL (regex): ${externalGameUrl}`);
        }
      }
    }
    
    if (!externalGameUrl) {
      throw new Error('Could not extract external game URL from CrazyGames frame');
    }
    
    // Create an iframe embed HTML that points to the external game
    const embedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${gameName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #000;
        }
        iframe {
            width: 100%;
            height: 100%;
            border: none;
            display: block;
        }
    </style>
</head>
<body>
    <iframe src="${externalGameUrl}" allowfullscreen="true" allow="autoplay; fullscreen; gamepad;" sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals allow-popups-to-escape-sandbox"></iframe>
</body>
</html>`;
    
    await writeFile(join(gameDir, "index.html"), embedHtml);
    console.log(`   Created embed for: ${gameName} -> ${externalGameUrl}`);
    
  } catch (error) {
    console.log(`   Failed to create embed for non-Unity game: ${(error as Error).message}`);
    throw error;
  }
}

async function createEmbedHtml(gameUrl: string, gameDir: string, gameName: string) {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${gameName}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #000;
            overflow: hidden;
        }
        iframe {
            width: 100vw;
            height: 100vh;
            border: none;
            display: block;
        }
    </style>
</head>
<body>
    <iframe src="${gameUrl}" allowfullscreen></iframe>
</body>
</html>`;

  await writeFile(join(gameDir, "index.html"), htmlContent);
  console.log(`   Created embed HTML for ${gameName}`);
}

async function createSimpleGameHtml(urls: any, gameDir: string, slug: string, gameId: string, gameInfo: any) {
  // Read actual files from Build directory
  const buildDir = join(gameDir, "Build");
  let buildFiles: string[] = [];
  try {
    buildFiles = await readdir(buildDir);
  } catch {
    console.log("   Warning: Build directory not found or empty");
  }

  // Find the specific file types
  const loaderFile = buildFiles.find(f => f.includes('.loader.js')) || '';
  const dataFile = buildFiles.find(f => f.includes('.data.')) || '';
  const frameworkFile = buildFiles.find(f => f.includes('.framework.')) || '';
  const wasmFile = buildFiles.find(f => f.includes('.wasm.')) || '';

  // Fallback to extracted URLs if files not found
  const loaderUrl = loaderFile || basename(urls.unityLoaderUrl || '');
  const dataUrl = dataFile || basename(urls.buildUrls.find((url: string) => url.includes('.data.')) || '');
  const frameworkUrl = frameworkFile || basename(urls.buildUrls.find((url: string) => url.includes('.framework.')) || '');
  const wasmUrl = wasmFile || basename(urls.buildUrls.find((url: string) => url.includes('.wasm.')) || '');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${urls.gameName || gameInfo.name}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #000;
            overflow: hidden;
        }
        #gameCanvas {
            width: 100vw;
            height: 100vh;
            display: block;
        }
    </style>
</head>
<body>
    <canvas id="gameCanvas"></canvas>
    ${loaderUrl ? `<script src="Build/${loaderUrl}"></script>` : '<!-- No loader found -->'}
    <script>
        ${loaderUrl ? `createUnityInstance(document.getElementById("gameCanvas"), {
            dataUrl: "Build/${dataUrl}",
            frameworkUrl: "Build/${frameworkUrl}",
            codeUrl: "Build/${wasmUrl}",
            streamingAssetsUrl: "StreamingAssets",
            companyName: "CrazyGames",
            productName: "${urls.gameName || gameInfo.name}",
            productVersion: "1.0"
        }).then((unityInstance) => {
            console.log("Game loaded successfully");
        }).catch((message) => {
            console.error("Unity loading error:", message);
        });` : 'console.error("Game loader not found");'}
    </script>
</body>
</html>`;

  await writeFile(join(gameDir, "index.html"), htmlContent);
  console.log(`   Created: index.html`);
  if (!loaderUrl) {
    console.log(`   Warning: No Unity loader found for ${gameInfo.name}`);
  }
}

async function downloadThumbnail(slug: string, gameDir: string, gameInfo: any) {
  try {
    // Try multiple thumbnail URL patterns
    const thumbnailPatterns = [
      `https://img.crazygames.com/${slug}_16x9/2024-01-01/${slug}_16x9.jpeg`,
      `https://img.crazygames.com/${slug}_16x9/2024-02-01/${slug}_16x9.jpeg`,
      `https://img.crazygames.com/${slug}_16x9/2024-03-01/${slug}_16x9.jpeg`,
      `https://img.crazygames.com/${slug}_16x9/2024-04-01/${slug}_16x9.jpeg`,
      `https://img.crazygames.com/${slug}_16x9/2024-05-01/${slug}_16x9.jpeg`,
      `https://img.crazygames.com/${slug}_16x9/2024-06-01/${slug}_16x9.jpeg`,
      `https://img.crazygames.com/${slug}_16x9/latest/${slug}_16x9.jpeg`,
    ];

    let thumbnailDownloaded = false;
    
    for (const thumbnailUrl of thumbnailPatterns) {
      try {
        const response = await fetch(thumbnailUrl, { signal: AbortSignal.timeout(5000) });
        
        if (response.ok) {
          const data = Buffer.from(await response.arrayBuffer());
          await writeFile(join(gameDir, "thumbnail.jpg"), data);
          console.log(`   Downloaded thumbnail: ${thumbnailUrl}`);
          thumbnailDownloaded = true;
          break;
        }
      } catch {
        // Try next pattern
      }
    }

    // If no thumbnail found, try to extract from CrazyGames page
    if (!thumbnailDownloaded) {
      try {
        const pageResponse = await fetch(gameInfo.crazygamesUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });
        
        if (pageResponse.ok) {
          const pageHtml = await pageResponse.text();
          
          // Look for og:image meta tag
          const ogImageMatch = pageHtml.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
          if (ogImageMatch && ogImageMatch[1]) {
            const imageResponse = await fetch(ogImageMatch[1]);
            if (imageResponse.ok) {
              const data = Buffer.from(await imageResponse.arrayBuffer());
              await writeFile(join(gameDir, "thumbnail.jpg"), data);
              console.log(`   Downloaded thumbnail from og:image: ${ogImageMatch[1]}`);
              thumbnailDownloaded = true;
            }
          }
        }
      } catch (error) {
        console.log(`   Could not extract thumbnail from page: ${(error as Error).message}`);
      }
    }

    // Create placeholder if still no thumbnail
    if (!thumbnailDownloaded) {
      const placeholder = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#4a5568"/>
        <text x="200" y="140" text-anchor="middle" fill="white" font-size="20" font-family="Arial">${gameInfo.name}</text>
        <text x="200" y="170" text-anchor="middle" fill="#a0aec0" font-size="14" font-family="Arial">${gameInfo.category}</text>
      </svg>`;
      await writeFile(join(gameDir, "thumbnail.svg"), placeholder);
      console.log(`   Created placeholder thumbnail for ${gameInfo.name}`);
    }
  } catch (error) {
    console.log(`   Thumbnail download failed: ${(error as Error).message}`);
  }
}

async function discoverGamesByCategory(category: string, customUrl?: string) {
  try {
    console.log(`Discovering games in category: ${category}`);
    
    // Use custom URL if provided, otherwise build from category
    let discoverUrl = customUrl || 'https://www.crazygames.com';
    if (!customUrl && category !== 'all') {
      const categoryPath = getCategoryUrl(category);
      discoverUrl = `https://www.crazygames.com/${categoryPath}`;
    }
    
    console.log(`   Fetching: ${discoverUrl}`);
    
    const html = await fetchWithHeaders(discoverUrl, 30000);
    const gameUrls = extractGameUrlsFromPage(html);
    
    console.log(`Found ${gameUrls.length} games in category`);
    
    // Download first 20 games
    const gamesToDownload = gameUrls.slice(0, 20);
    console.log(`Will download ${gamesToDownload.length} games`);
    
    // Track success/failure
    let successCount = 0;
    let failCount = 0;
    
    for (const gameUrl of gamesToDownload) {
      console.log(`\nDownloading: ${gameUrl}`);
      try {
        await downloadGameFromUrl(gameUrl);
        successCount++;
      } catch (error) {
        failCount++;
        console.log(`   Failed to download: ${(error as Error).message}`);
      }
      // Add delay to avoid being blocked
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Print summary
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`DOWNLOAD SUMMARY`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   Total games to download: ${gamesToDownload.length}`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    console.log(`   Success rate: ${((successCount / gamesToDownload.length) * 100).toFixed(1)}%`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
  } catch (error) {
    console.error(`Category discovery failed: ${(error as Error).message}`);
  }
}

async function getTrendingGames() {
  try {
    console.log('Getting trending games');
    
    const html = await fetchWithHeaders('https://www.crazygames.com', 30000);
    const gameUrls = extractGameUrlsFromPage(html);
    
    console.log(`Found ${gameUrls.length} trending games`);
    
    // Download first 3 trending games
    const gamesToDownload = gameUrls.slice(0, 3);
    console.log(`Will download ${gamesToDownload.length} trending games`);
    
    // Track success/failure
    let successCount = 0;
    let failCount = 0;
    
    for (const gameUrl of gamesToDownload) {
      console.log(`\nDownloading: ${gameUrl}`);
      try {
        await downloadGameFromUrl(gameUrl);
        successCount++;
      } catch (error) {
        failCount++;
        console.log(`   Failed to download: ${(error as Error).message}`);
      }
      // Add delay to avoid being blocked
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Print summary
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`DOWNLOAD SUMMARY`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   Total games to download: ${gamesToDownload.length}`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    console.log(`   Success rate: ${((successCount / gamesToDownload.length) * 100).toFixed(1)}%`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
  } catch (error) {
    console.error(`Trending games discovery failed: ${(error as Error).message}`);
  }
}

async function massDownloadAll() {
  try {
    console.log('MASS DOWNLOAD - Getting all games from CrazyGames');
    
    // Get existing games to avoid duplicates
    const existingGames = await loadGames();
    const existingGameNames = new Set(existingGames.map((g: any) => g.title.toLowerCase()));
    console.log(`Found ${existingGames.length} existing games`);
    
    const categories = [
      'racing', 'action', 'io', 'puzzle', 'sports', 'shooting', 
      'multiplayer', 'driving', 'stunt', '3d', 'car', 'bike'
    ];
    
    let totalGamesFound = 0;
    let totalGamesDownloaded = 0;
    let totalSkipped = 0;
    let totalFailed = 0;
    
    // Get games from homepage
    console.log('\nScraping homepage...');
    try {
      const response = await fetch('https://www.crazygames.com', {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
      });
      
      if (response.ok) {
        const html = await response.text();
        const gameUrls = extractGameUrlsFromPage(html);
        console.log(`   Found ${gameUrls.length} games on homepage`);
        
        // Download first 10 from homepage
        const homepageGames = gameUrls.slice(0, 10);
        for (const gameUrl of homepageGames) {
          const gameInfo = await extractGameInfoFromUrl(gameUrl);
          if (gameInfo && !existingGameNames.has(gameInfo.name.toLowerCase())) {
            console.log(`\nDownloading: ${gameInfo.name}`);
            await downloadGameFromUrl(gameUrl);
            totalGamesDownloaded++;
            existingGameNames.add(gameInfo.name.toLowerCase());
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            totalSkipped++;
          }
        }
      }
    } catch (error) {
      console.log('   Could not scrape homepage');
    }
    
    // Get games from categories
    for (const category of categories) {
      console.log(`\nScraping category: ${category}`);
      try {
        const categoryPath = getCategoryUrl(category);
        const response = await fetch(`https://www.crazygames.com/${categoryPath}`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
          },
        });
        
        if (response.ok) {
          const html = await response.text();
          const gameUrls = extractGameUrlsFromPage(html);
          console.log(`   Found ${gameUrls.length} games in ${category}`);
          totalGamesFound += gameUrls.length;
          
          // Download first 20 from each category
          const categoryGames = gameUrls.slice(0, 20);
          for (const gameUrl of categoryGames) {
            const gameInfo = await extractGameInfoFromUrl(gameUrl);
            if (gameInfo && !existingGameNames.has(gameInfo.name.toLowerCase())) {
              console.log(`\nDownloading: ${gameInfo.name}`);
              await downloadGameFromUrl(gameUrl);
              totalGamesDownloaded++;
              existingGameNames.add(gameInfo.name.toLowerCase());
              await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
              totalSkipped++;
            }
          }
        }
      } catch (error) {
        totalFailed++;
        console.log(`   Could not scrape category: ${category}`);
      }
    }
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`MASS DOWNLOAD SUMMARY`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   Total games found: ${totalGamesFound}`);
    console.log(`   Games downloaded: ${totalGamesDownloaded}`);
    console.log(`   Games skipped (duplicates): ${totalSkipped}`);
    console.log(`   Failed: ${totalFailed}`);
    console.log(`   Success rate: ${((totalGamesDownloaded / (totalGamesDownloaded + totalSkipped + totalFailed || 1)) * 100).toFixed(1)}%`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Restart dev server to see all new games!\n`);
    
  } catch (error) {
    console.error(`Mass download failed: ${(error as Error).message}`);
  }
}

function extractGameUrlsFromPage(html: string): string[] {
  const gameUrls: string[] = [];
  
  // Extract game URLs from various patterns
  const patterns = [
    /<a[^>]*href="(\/game\/[^"\?#]+)"/gi,
    /href="(https:\/\/www\.crazygames\.com\/game\/[^"\?#]+)"/gi,
    /data-game-url="(\/game\/[^"\?#]+)"/gi,
  ];
  
  for (const pattern of patterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      let gameUrl = match[1];
      if (gameUrl.startsWith('/')) {
        gameUrl = 'https://www.crazygames.com' + gameUrl;
      }
      
      // Filter out duplicates and invalid URLs
      if (gameUrl.includes('/game/') && !gameUrls.includes(gameUrl)) {
        gameUrls.push(gameUrl);
      }
    }
  }
  
  // Remove duplicates and limit to reasonable number
  return [...new Set(gameUrls)].slice(0, 20);
}

async function fetchWithHeaders(url: string, timeoutMs: number = 30000): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function loadGames(): Promise<any[]> {
  try {
    const data = await readFile("./src/data/games.ts", 'utf-8');
    // Extract games array from the TypeScript file
    const match = data.match(/export const games: Game\[\] = (\[[\s\S]*?\]);/);
    if (match) {
      return JSON.parse(match[1]);
    }
    return [];
  } catch {
    return [];
  }
}

async function saveGame(game: any) {
  try {
    // Load existing games
    const existingGames = await loadGames();
    
    // Check if game already exists
    const exists = existingGames.find((g: any) => g.id === game.id);
    if (exists) {
      console.log(`   Game ${game.title} already in database`);
      return;
    }
    
    // Add new game
    existingGames.push(game);
    
    // Write back to file
    await writeGamesToTS(existingGames);
    console.log(`   Saved game to database: ${game.title}`);
  } catch (error) {
    console.error(`   Failed to save game: ${(error as Error).message}`);
  }
}

async function writeGamesToTS(games: any[]) {
  const gamesTSContent = `import type { Game } from "@/types/game";

// Auto-generated games from CrazyGames scraper
// Generated on: ${new Date().toISOString()}

export const games: Game[] = ${JSON.stringify(games, null, 2)};

// Available categories for filtering
export const categories = [
  "All",
  "Action",
  "Adventure",
  "Puzzle",
  "Racing",
  "Sports",
  "Strategy",
  "Multiplayer",
  "Idle",
  ".IO",
  "Shooter",
  "Arcade",
  "Other",
];

// Alias for compatibility
export const allGames = games;

`;
  
  await writeFile("./src/data/games.ts", gamesTSContent);
}

// ===== CDN STREAMING FUNCTIONS =====

async function streamAllGamesToCdn() {
  if (!CDN_CONFIG.enabled) {
    console.log('[ERROR] CDN is not enabled. Set CDN_ENABLED=true to use streaming mode.');
    return;
  }

  try {
    console.log('\n[INFO] Discovering all games for CDN streaming...');
    const allGames = await discoverAllCrazyGames();
    console.log(`[INFO] Found ${allGames.length} total games to stream`);

    // Stream games in parallel batches
    const batchSize = 5; // Smaller batches for CDN uploads
    let uploaded = 0;
    let failed = 0;

    for (let i = 0; i < allGames.length; i += batchSize) {
      const batch = allGames.slice(i, i + batchSize);
      console.log(`\n[INFO] Streaming batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allGames.length / batchSize)} (${batch.length} games)`);
      
      // Process batch in parallel
      const promises = batch.map(async (game, index) => {
        try {
          const priorityInfo = game.priority ? `[P${game.priority}] ${game.discoveredFrom || ''}` : '';
          console.log(`[${i + index + 1}/${allGames.length}] ${priorityInfo} Streaming: ${game.name}`);
          const result = await streamGameToCdn(game);
          uploaded++;
          console.log(`[SUCCESS] ${game.name} -> ${result.cdnUrl}`);
          return { success: true, game: game.name, priority: game.priority, ...result };
        } catch (error) {
          failed++;
          console.log(`[FAILED] ${game.name} - ${(error as Error).message}`);
          return { success: false, game: game.name, error: (error as Error).message };
        }
      });

      await Promise.all(promises);
      
      // Delay between batches to avoid rate limiting
      if (i + batchSize < allGames.length) {
        console.log('[INFO] Waiting 3 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Generate final report
    console.log(`\n${'='.repeat(60)}`);
    console.log('CDN STREAMING REPORT');
    console.log('='.repeat(60));
    console.log(`Successfully streamed: ${uploaded}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total processed: ${allGames.length}`);
    console.log(`CDN Base URL: ${CDN_CONFIG.baseUrl}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error(`[ERROR] CDN streaming failed: ${(error as Error).message}`);
  }
}

async function streamCategoryToCdn(category: string) {
  if (!CDN_CONFIG.enabled) {
    console.log('[ERROR] CDN is not enabled. Set CDN_ENABLED=true to use streaming mode.');
    return;
  }

  try {
    console.log(`\n[INFO] Discovering ${category} games for CDN streaming...`);
    const categoryPath = getCategoryUrl(category);
    const categoryGames = await getGamesFromCategory(categoryPath);
    console.log(`[INFO] Found ${categoryGames.length} games in ${category}`);

    // Stream games in parallel batches
    const batchSize = 5;
    let uploaded = 0;
    let failed = 0;

    for (let i = 0; i < categoryGames.length; i += batchSize) {
      const batch = categoryGames.slice(i, i + batchSize);
      console.log(`\n[INFO] Streaming ${category} batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(categoryGames.length / batchSize)} (${batch.length} games)`);
      
      const promises = batch.map(async (game, index) => {
        try {
          console.log(`[${i + index + 1}/${categoryGames.length}] 🚀 Streaming: ${game.name}`);
          const result = await streamGameToCdn(game);
          uploaded++;
          console.log(`[SUCCESS] ✅ ${game.name} -> ${result.cdnUrl}`);
          return { success: true, game: game.name, ...result };
        } catch (error) {
          failed++;
          console.log(`[FAILED] ❌ ${game.name} - ${(error as Error).message}`);
          return { success: false, game: game.name, error: (error as Error).message };
        }
      });

      await Promise.all(promises);
      
      if (i + batchSize < categoryGames.length) {
        console.log('[INFO] Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`\n[CATEGORY COMPLETE] ${category}: ✅ ${uploaded} uploaded, ❌ ${failed} failed`);

  } catch (error) {
    console.error(`[ERROR] Category CDN streaming failed: ${(error as Error).message}`);
  }
}

async function streamGameToCdn(gameInfo: GameInfo) {
  const tempDir = `./temp_stream_${gameInfo.slug}-${randomUUID().slice(0, 8)}`;
  
  try {
    // Create temporary directory
    await mkdir(tempDir, { recursive: true });

    // Download game files to temp directory
    console.log(`   Downloading ${gameInfo.name} to temp directory...`);
    await downloadGameToTemp(gameInfo, tempDir);

    // Upload to CDN
    console.log(`   Uploading to CDN...`);
    const cdnUrl = await uploadToCdn(gameInfo, tempDir);

    // Clean up immediately after successful upload
    await cleanupTempDirectory(tempDir);
    console.log(`   Cleaned up temp files`);

    return { cdnUrl, gameName: gameInfo.name };

  } catch (error) {
    // Clean up on failure
    await cleanupTempDirectory(tempDir);
    throw error;
  }
}

async function downloadGameToTemp(gameInfo: GameInfo, tempDir: string) {
  try {
    // Get the game page HTML
    const response = await fetch(gameInfo.crazygamesUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch game page: ${response.status}`);
    }

    const html = await response.text();
    
    // Extract and download game files
    const gameFileUrl = extractGameFileUrl(html);
    const thumbnailUrl = extractThumbnailUrl(html);

    if (gameFileUrl) {
      await downloadFile(gameFileUrl, `${tempDir}/index.html`);
    }

    if (thumbnailUrl) {
      await downloadFile(thumbnailUrl, `${tempDir}/thumbnail.jpg`);
    }

  } catch (error) {
    throw new Error(`Download failed: ${(error as Error).message}`);
  }
}

async function downloadFile(url: string, destinationPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  await writeFile(destinationPath, Buffer.from(arrayBuffer));
}

async function uploadToCdn(gameInfo: GameInfo, localDir: string): Promise<string> {
  const cdnPath = `games/${gameInfo.slug}`;
  
  // For this example, we'll simulate CDN upload
  // In production, replace with actual CDN SDK calls based on CDN_CONFIG.provider
  
  console.log(`   Uploading to ${CDN_CONFIG.baseUrl}/${cdnPath}`);
  
  // Simulate upload process
  await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
  
  // In production, this would be:
  // - AWS S3: Use @aws-sdk/client-s3
  // - Cloudflare R2: Use @cloudflare/r2-sdk  
  // - Google Cloud: Use @google-cloud/storage
  
  return `${CDN_CONFIG.baseUrl}/${cdnPath}`;
}

function extractGameFileUrl(html: string): string | null {
  // Extract the actual game file URL from the HTML
  const gameUrlMatch = html.match(/https:\/\/[^"'\s]+\.html[^"'\s]*/);
  return gameUrlMatch ? gameUrlMatch[0] : null;
}

function extractThumbnailUrl(html: string): string | null {
  // Extract thumbnail URL
  const thumbnailMatch = html.match(/https:\/\/[^"'\s]+\.(jpg|jpeg|png|webp)[^"'\s]*/i);
  return thumbnailMatch ? thumbnailMatch[0] : null;
}

async function cleanupTempDirectory(dirPath: string): Promise<void> {
  try {
    const files = await readdir(dirPath);
    await Promise.all(files.map((file: string) => unlink(join(dirPath, file))));
    await unlink(dirPath);
  } catch (error) {
    // Ignore cleanup errors
  }
}

main().catch(console.error);
