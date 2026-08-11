import { ProxyAgent } from 'undici';
import { prisma } from '../lib/prisma.js';
import { mapOffProductToFoodDto } from './foodMapper.js';
import { HttpError } from '../middleware/errorHandler.js';

const OFF_BASE_URL = 'https://world.openfoodfacts.org';
const USER_AGENT = 'SuiviAlimentation/1.0 (orianne738@gmail.com)';
const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

// Sur un réseau d'entreprise, les sorties HTTP passent souvent par un proxy configuré
// via HTTPS_PROXY/HTTP_PROXY ; le fetch natif de Node ne le lit pas automatiquement.
const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;

function isFresh(cacheEntry) {
  return Date.now() - new Date(cacheEntry.fetchedAt).getTime() < CACHE_MAX_AGE_MS;
}

// Open Food Facts renvoie de temps en temps une erreur transitoire (limitation de débit,
// coupure réseau via le proxy...). Un seul réessai suffit à absorber la plupart des cas
// sans faire attendre l'utilisateur trop longtemps. Un 404 n'est pas une panne : c'est un
// produit inconnu, il ne faut ni le réessayer ni le transformer en 503.
async function fetchOffJson(url) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, dispatcher });
      if (!response.ok) {
        await response.body?.cancel();
        if (response.status === 404) return null;
        lastError = new Error(`Open Food Facts a répondu ${response.status} pour ${url}`);
        const retryable = response.status >= 500 || response.status === 429;
        if (!retryable) break;
        await new Promise((resolve) => setTimeout(resolve, 300));
        continue;
      }
      return await response.json();
    } catch (err) {
      lastError = err;
    }
  }
  console.error('[openFoodFacts]', lastError);
  throw new HttpError(503, 'Impossible de contacter Open Food Facts, réessayez.');
}

export async function lookupBarcode(barcode) {
  const cached = await prisma.foodCache.findUnique({ where: { barcode } });
  if (cached && isFresh(cached)) {
    return cached;
  }

  let data;
  try {
    data = await fetchOffJson(`${OFF_BASE_URL}/api/v2/product/${encodeURIComponent(barcode)}.json`);
  } catch {
    if (cached) return cached; // OFF indisponible : on retombe sur le cache même périmé
    throw new HttpError(503, 'Impossible de contacter Open Food Facts, réessayez.');
  }

  if (!data || data.status !== 1 || !data.product) {
    if (cached) return cached;
    return null;
  }

  const dto = mapOffProductToFoodDto(data.product);

  return prisma.foodCache.upsert({
    where: { barcode },
    create: { barcode, ...dto },
    update: { ...dto, fetchedAt: new Date() },
  });
}

export async function searchByName(query) {
  const url = new URL(`${OFF_BASE_URL}/cgi/search.pl`);
  // L'index de recherche d'Open Food Facts est sensible à la casse : "TOMATE" ne
  // renvoie rien alors que "tomate" fonctionne. On normalise donc systématiquement.
  url.searchParams.set('search_terms', query.toLowerCase());
  url.searchParams.set('search_simple', '1');
  url.searchParams.set('action', 'process');
  url.searchParams.set('json', '1');
  url.searchParams.set('page_size', '15');
  url.searchParams.set('fields', 'code,product_name,product_name_fr,brands,nutriments,image_front_url');

  const data = await fetchOffJson(url);
  const products = data?.products || [];
  return products
    .map((product) => ({ barcode: product.code, ...mapOffProductToFoodDto(product) }))
    .filter((p) => p.caloriesPer100g != null);
}
