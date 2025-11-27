import crypto from 'crypto';

const AMAZON_ACCESS_KEY = process.env.AMAZON_ACCESS_KEY_ID;
const AMAZON_SECRET_KEY = process.env.AMAZON_SECRET_ACCESS_KEY;
const AMAZON_AFFILIATE_TAG = process.env.AMAZON_AFFILIATE_TAG;
const AMAZON_HOST = 'webservices.amazon.com';
const AMAZON_REGION = 'us-east-1';

interface AmazonProduct {
  asin: string;
  title: string;
  brand?: string;
  description?: string;
  features?: string[];
  imageUrl?: string;
  amazonUrl: string;
  priceDisplay?: string;
  rating?: string;
  reviewCount?: number;
}

interface SearchResult {
  products: AmazonProduct[];
  totalResults: number;
}

function createSignature(stringToSign: string, secretKey: string): string {
  return crypto.createHmac('sha256', secretKey).update(stringToSign).digest('base64');
}

function getSignedHeaders(
  method: string,
  path: string,
  payload: string,
  timestamp: string
): Record<string, string> {
  if (!AMAZON_ACCESS_KEY || !AMAZON_SECRET_KEY) {
    throw new Error('Amazon API credentials not configured');
  }

  const amzDate = timestamp.replace(/[:-]/g, '').replace(/\.\d+/, '');
  const dateStamp = amzDate.substring(0, 8);
  
  const canonicalHeaders = [
    `content-encoding:amz-1.0`,
    `content-type:application/json; charset=utf-8`,
    `host:${AMAZON_HOST}`,
    `x-amz-date:${amzDate}`,
    `x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems`,
  ].join('\n') + '\n';

  const signedHeaders = 'content-encoding;content-type;host;x-amz-date;x-amz-target';
  
  const payloadHash = crypto.createHash('sha256').update(payload).digest('hex');
  
  const canonicalRequest = [
    method,
    path,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${AMAZON_REGION}/ProductAdvertisingAPI/aws4_request`;
  const canonicalRequestHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
  
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    canonicalRequestHash,
  ].join('\n');

  const kDate = crypto.createHmac('sha256', `AWS4${AMAZON_SECRET_KEY}`).update(dateStamp).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(AMAZON_REGION).digest();
  const kService = crypto.createHmac('sha256', kRegion).update('ProductAdvertisingAPI').digest();
  const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  const authorizationHeader = `${algorithm} Credential=${AMAZON_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    'content-encoding': 'amz-1.0',
    'content-type': 'application/json; charset=utf-8',
    'host': AMAZON_HOST,
    'x-amz-date': amzDate,
    'x-amz-target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
    'Authorization': authorizationHeader,
  };
}

export async function searchAmazonProducts(
  keywords: string,
  category?: string,
  itemCount: number = 10
): Promise<SearchResult> {
  if (!AMAZON_ACCESS_KEY || !AMAZON_SECRET_KEY || !AMAZON_AFFILIATE_TAG) {
    console.log('Amazon API not configured, returning empty results');
    return { products: [], totalResults: 0 };
  }

  const payload = JSON.stringify({
    Keywords: keywords,
    Resources: [
      'Images.Primary.Large',
      'ItemInfo.Title',
      'ItemInfo.ByLineInfo',
      'ItemInfo.Features',
      'ItemInfo.ProductInfo',
      'Offers.Listings.Price',
      'CustomerReviews.Count',
      'CustomerReviews.StarRating',
    ],
    SearchIndex: category || 'All',
    ItemCount: Math.min(itemCount, 10),
    PartnerTag: AMAZON_AFFILIATE_TAG,
    PartnerType: 'Associates',
    Marketplace: 'www.amazon.com',
  });

  const path = '/paapi5/searchitems';
  const timestamp = new Date().toISOString();
  
  try {
    const headers = getSignedHeaders('POST', path, payload, timestamp);
    
    const response = await fetch(`https://${AMAZON_HOST}${path}`, {
      method: 'POST',
      headers,
      body: payload,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Amazon API error:', response.status, errorText);
      return { products: [], totalResults: 0 };
    }

    const data = await response.json();
    
    if (!data.SearchResult?.Items) {
      return { products: [], totalResults: 0 };
    }

    const products: AmazonProduct[] = data.SearchResult.Items.map((item: any) => ({
      asin: item.ASIN,
      title: item.ItemInfo?.Title?.DisplayValue || 'Unknown Product',
      brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue,
      description: item.ItemInfo?.ProductInfo?.ProductGroup?.DisplayValue,
      features: item.ItemInfo?.Features?.DisplayValues?.slice(0, 5),
      imageUrl: item.Images?.Primary?.Large?.URL,
      amazonUrl: `https://www.amazon.com/dp/${item.ASIN}?tag=${AMAZON_AFFILIATE_TAG}`,
      priceDisplay: item.Offers?.Listings?.[0]?.Price?.DisplayAmount,
      rating: item.CustomerReviews?.StarRating?.DisplayValue,
      reviewCount: item.CustomerReviews?.Count,
    }));

    return {
      products,
      totalResults: data.SearchResult.TotalResultCount || products.length,
    };
  } catch (error) {
    console.error('Error searching Amazon products:', error);
    return { products: [], totalResults: 0 };
  }
}

export async function getAmazonProduct(asin: string): Promise<AmazonProduct | null> {
  if (!AMAZON_ACCESS_KEY || !AMAZON_SECRET_KEY || !AMAZON_AFFILIATE_TAG) {
    return null;
  }

  const payload = JSON.stringify({
    ItemIds: [asin],
    Resources: [
      'Images.Primary.Large',
      'ItemInfo.Title',
      'ItemInfo.ByLineInfo',
      'ItemInfo.Features',
      'ItemInfo.ProductInfo',
      'Offers.Listings.Price',
      'CustomerReviews.Count',
      'CustomerReviews.StarRating',
    ],
    PartnerTag: AMAZON_AFFILIATE_TAG,
    PartnerType: 'Associates',
    Marketplace: 'www.amazon.com',
  });

  const path = '/paapi5/getitems';
  const timestamp = new Date().toISOString();
  
  try {
    const headers = getSignedHeaders('POST', path, payload, timestamp);
    headers['x-amz-target'] = 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems';
    
    const response = await fetch(`https://${AMAZON_HOST}${path}`, {
      method: 'POST',
      headers,
      body: payload,
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const item = data.ItemsResult?.Items?.[0];
    
    if (!item) {
      return null;
    }

    return {
      asin: item.ASIN,
      title: item.ItemInfo?.Title?.DisplayValue || 'Unknown Product',
      brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue,
      description: item.ItemInfo?.ProductInfo?.ProductGroup?.DisplayValue,
      features: item.ItemInfo?.Features?.DisplayValues?.slice(0, 5),
      imageUrl: item.Images?.Primary?.Large?.URL,
      amazonUrl: `https://www.amazon.com/dp/${item.ASIN}?tag=${AMAZON_AFFILIATE_TAG}`,
      priceDisplay: item.Offers?.Listings?.[0]?.Price?.DisplayAmount,
      rating: item.CustomerReviews?.StarRating?.DisplayValue,
      reviewCount: item.CustomerReviews?.Count,
    };
  } catch (error) {
    console.error('Error fetching Amazon product:', error);
    return null;
  }
}

export function buildAffiliateUrl(amazonUrl: string): string {
  if (!AMAZON_AFFILIATE_TAG) {
    return amazonUrl;
  }
  
  const url = new URL(amazonUrl);
  url.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
  return url.toString();
}

export function isConfigured(): boolean {
  return !!(AMAZON_ACCESS_KEY && AMAZON_SECRET_KEY && AMAZON_AFFILIATE_TAG);
}
