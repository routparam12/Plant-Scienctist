import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppLanguage } from '../types';

const CACHE_KEY_PREFIX = '@plant_scientist_news_cache_v2_';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours TTL

export interface NewsArticle {
  id: string;
  title: string;
  snippet: string;
  content: string; // Full un-truncated article text
  link: string;
  publishedAt: string;
  source: string;
  matchedCrop?: boolean;
}

const FEEDS = {
  en: 'https://krishijagran.com/feeds/rss',
  hi: 'https://hindi.krishijagran.com/feeds/rss',
};

function cleanHtmlText(htmlStr?: string): string {
  if (!htmlStr) return '';
  return htmlStr
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n\s*\n\s*/g, '\n\n')
    .trim();
}

export async function fetchAgronomyNews(
  language: AppLanguage = 'en',
  userCropNames: string[] = []
): Promise<NewsArticle[]> {
  const langKey = language === 'hi' ? 'hi' : 'en';
  const cacheKey = `${CACHE_KEY_PREFIX}${langKey}`;

  let rawItems: NewsArticle[] = [];
  let isCacheValid = false;

  // 1. Check local cache first
  try {
    const cachedData = await AsyncStorage.getItem(cacheKey);
    if (cachedData) {
      const parsedCache = JSON.parse(cachedData);
      const isFresh = Date.now() - parsedCache.timestamp < CACHE_TTL_MS;
      if (Array.isArray(parsedCache.items) && parsedCache.items.length > 0) {
        rawItems = parsedCache.items;
        if (isFresh) {
          isCacheValid = true;
        }
      }
    }
  } catch (cacheErr) {
    console.warn('News cache read error:', cacheErr);
  }

  // 2. Fetch fresh feed if cache missing or expired
  if (!isCacheValid) {
    try {
      const targetRssCandidates = [
        FEEDS[langKey],
        FEEDS.en, // Secondary fallback if primary feed returns error
      ];

      for (const targetRss of targetRssCandidates) {
        if (!targetRss) continue;
        const gatewayUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(targetRss)}`;

        const response = await fetch(gatewayUrl);
        if (response.ok) {
          const data = await response.json();

          if (data && data.status === 'ok' && Array.isArray(data.items) && data.items.length > 0) {
            rawItems = data.items.map((item: any, idx: number) => {
              const cleanedTitle = cleanHtmlText(item.title) || 'Agronomy Update';
              const fullBody = cleanHtmlText(item.content || item.description || '');
              const shortSnippet = fullBody.length > 120 ? fullBody.slice(0, 120) + '...' : fullBody;

              return {
                id: item.guid || `${idx}-${Date.now()}`,
                title: cleanedTitle,
                snippet: shortSnippet,
                content: fullBody || shortSnippet,
                link: item.link || targetRss,
                publishedAt: item.pubDate ? item.pubDate.split(' ')[0] : 'Today',
                source: langKey === 'hi' ? 'कृषि जागरण' : 'Krishi Jagran',
              };
            });

            // Save to 12h cache
            await AsyncStorage.setItem(
              cacheKey,
              JSON.stringify({ timestamp: Date.now(), items: rawItems })
            ).catch(() => {});

            break; // Successfully loaded live items
          }
        }
      }
    } catch (fetchErr) {
      console.warn('Live RSS fetch failed, falling back to cache:', fetchErr);
    }
  }

  if (rawItems.length === 0) {
    return [];
  }

  // 3. Keyword Match against User's Active Crops
  const lowerCrops = userCropNames.map((c) => c.toLowerCase());

  const taggedItems: NewsArticle[] = rawItems.map((item) => {
    const text = `${item.title} ${item.content || item.snippet}`.toLowerCase();
    const hasMatch = lowerCrops.some((crop) => text.includes(crop));
    return { ...item, matchedCrop: hasMatch };
  });

  // 4. Sort matched crops to top
  const relevant = taggedItems.filter((i) => i.matchedCrop).sort(() => 0.5 - Math.random());
  const general = taggedItems.filter((i) => !i.matchedCrop).sort(() => 0.5 - Math.random());

  return [...relevant, ...general].slice(0, 15);
}
