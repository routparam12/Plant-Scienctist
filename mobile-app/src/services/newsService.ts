import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppLanguage } from '../types';

const CACHE_KEY_PREFIX = '@plant_scientist_news_cache_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface NewsArticle {
  id: string;
  title: string;
  snippet: string;
  link: string;
  publishedAt: string;
  source: string;
  matchedCrop?: boolean;
}

const FEEDS = {
  en: 'https://krishijagran.com/feeds/rss',
  hi: 'https://hindi.krishijagran.com/feeds/rss',
};

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
      const targetRss = FEEDS[langKey] || FEEDS.en;
      const gatewayUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(targetRss)}`;

      const response = await fetch(gatewayUrl);
      if (response.ok) {
        const data = await response.json();

        if (data && data.status === 'ok' && Array.isArray(data.items) && data.items.length > 0) {
          const freshItems: NewsArticle[] = data.items.map((item: any, idx: number) => ({
            id: item.guid || `${idx}-${Date.now()}`,
            title:
              item.title
                ?.replace(/<[^>]+>/g, '')
                .replace(/&quot;/g, '"')
                .replace(/&#039;/g, "'")
                .trim() || 'Agronomy Update',
            snippet:
              item.description
                ?.replace(/<[^>]+>/g, '')
                .replace(/&quot;/g, '"')
                .replace(/&#039;/g, "'")
                .trim()
                .slice(0, 110) + '...' || '',
            link: item.link || targetRss,
            publishedAt: item.pubDate ? item.pubDate.split(' ')[0] : 'Today',
            source: langKey === 'hi' ? 'कृषि जागरण' : 'Krishi Jagran',
          }));

          rawItems = freshItems;

          // Save to 24h cache
          await AsyncStorage.setItem(
            cacheKey,
            JSON.stringify({ timestamp: Date.now(), items: rawItems })
          ).catch(() => {});
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
    const text = `${item.title} ${item.snippet}`.toLowerCase();
    const hasMatch = lowerCrops.some((crop) => text.includes(crop));
    return { ...item, matchedCrop: hasMatch };
  });

  // 4. Sort matched crops to top, then apply light shuffle within tiers
  const relevant = taggedItems.filter((i) => i.matchedCrop).sort(() => 0.5 - Math.random());
  const general = taggedItems.filter((i) => !i.matchedCrop).sort(() => 0.5 - Math.random());

  return [...relevant, ...general].slice(0, 8);
}
