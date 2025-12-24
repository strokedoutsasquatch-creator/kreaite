/**
 * Lulu Print-on-Demand API Service
 * 
 * Integrates with Lulu's Print API for:
 * - Product creation (book specs)
 * - Print job submission
 * - Order tracking
 * - Cost calculation
 * - Shipping quotes
 * 
 * API Docs: https://api.lulu.com/docs
 */

const LULU_API_BASE = process.env.LULU_API_URL || 'https://api.lulu.com';
const LULU_CLIENT_KEY = process.env.LULU_CLIENT_KEY;
const LULU_CLIENT_SECRET = process.env.LULU_CLIENT_SECRET;

interface LuluAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expiresAt: number;
}

let cachedToken: LuluAuthToken | null = null;

export const trimSizes = {
  'us_trade': { width: 6, height: 9, display: '6" x 9"' },
  'us_letter': { width: 8.5, height: 11, display: '8.5" x 11"' },
  'pocket': { width: 4.25, height: 6.87, display: '4.25" x 6.87"' },
  'digest': { width: 5.5, height: 8.5, display: '5.5" x 8.5"' },
  'us_trade_small': { width: 5, height: 8, display: '5" x 8"' },
  'a5': { width: 5.83, height: 8.27, display: 'A5 (5.83" x 8.27")' },
  'royal': { width: 6.14, height: 9.21, display: 'Royal (6.14" x 9.21")' },
  'square_small': { width: 7.5, height: 7.5, display: '7.5" x 7.5" Square' },
  'square_large': { width: 8.5, height: 8.5, display: '8.5" x 8.5" Square' },
} as const;

export const bindingTypes = {
  'perfect': { code: 'PERFECT_BOUND', display: 'Paperback', costMultiplier: 1.0 },
  'coil': { code: 'COIL_BOUND', display: 'Coil Bound', costMultiplier: 1.3 },
  'saddle': { code: 'SADDLE_STITCH', display: 'Saddle Stitch', costMultiplier: 0.8 },
  'case': { code: 'CASE_BOUND', display: 'Hardcover (Case)', costMultiplier: 2.2 },
  'dust_jacket': { code: 'DUST_JACKET', display: 'Hardcover (Dust Jacket)', costMultiplier: 2.5 },
} as const;

export const paperTypes = {
  'standard_white': { code: '60#_WHITE', display: '60# White', costPerPage: 0.012 },
  'premium_white': { code: '70#_WHITE', display: '70# Premium White', costPerPage: 0.015 },
  'cream': { code: '60#_CREAM', display: '60# Cream', costPerPage: 0.013 },
  'premium_cream': { code: '70#_CREAM', display: '70# Premium Cream', costPerPage: 0.016 },
  'color': { code: '80#_COATED', display: '80# Coated Color', costPerPage: 0.08 },
} as const;

interface PrintSpecs {
  pageCount: number;
  trimSize: keyof typeof trimSizes;
  bindingType: keyof typeof bindingTypes;
  paperType: keyof typeof paperTypes;
  colorInterior: boolean;
}

interface ShippingAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  stateCode: string;
  postcode: string;
  countryCode: string;
  phone?: string;
}

interface PrintJobRequest {
  externalId?: string;
  lineItems: {
    externalId?: string;
    printableId: string;
    quantity: number;
  }[];
  shippingAddress: ShippingAddress;
  shippingLevel: 'MAIL' | 'GROUND' | 'EXPEDITED' | 'EXPRESS';
  contactEmail: string;
}

interface PrintableRequest {
  externalId?: string;
  title: string;
  interiorSourceUrl: string;
  coverSourceUrl: string;
  podPackageId: string;
}

async function getAuthToken(): Promise<string> {
  if (!LULU_CLIENT_KEY || !LULU_CLIENT_SECRET) {
    throw new Error('Lulu API credentials not configured');
  }

  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.access_token;
  }

  const response = await fetch(`${LULU_API_BASE}/auth/realms/glasstree/protocol/openid-connect/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: LULU_CLIENT_KEY,
      client_secret: LULU_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    throw new Error(`Lulu auth failed: ${response.status}`);
  }

  const data = await response.json();
  cachedToken = {
    ...data,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };

  return cachedToken!.access_token;
}

async function luluRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = await getAuthToken();
  
  const response = await fetch(`${LULU_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Lulu API error (${response.status}): ${error}`);
  }

  return response.json();
}

export function isLuluConfigured(): boolean {
  return !!(LULU_CLIENT_KEY && LULU_CLIENT_SECRET);
}

export function calculatePrintCost(specs: PrintSpecs): number {
  const binding = bindingTypes[specs.bindingType];
  const paper = paperTypes[specs.paperType];
  
  const baseCost = 0.90;
  const pageCost = specs.pageCount * (specs.colorInterior ? 0.08 : paper.costPerPage);
  const bindingCost = baseCost * binding.costMultiplier;
  
  const totalCost = bindingCost + pageCost;
  return Math.round(totalCost * 100);
}

export function estimateShippingCost(
  countryCode: string, 
  quantity: number, 
  shippingLevel: 'MAIL' | 'GROUND' | 'EXPEDITED' | 'EXPRESS'
): number {
  const baseRates: Record<string, number> = {
    'US': 399, 'CA': 599, 'GB': 699, 'AU': 899, 'default': 999
  };
  
  const levelMultipliers = {
    'MAIL': 1.0,
    'GROUND': 1.2,
    'EXPEDITED': 2.0,
    'EXPRESS': 3.5,
  };
  
  const baseRate = baseRates[countryCode] || baseRates['default'];
  const perBookRate = Math.max(100, Math.round(baseRate * 0.4));
  
  const cost = baseRate + (perBookRate * (quantity - 1));
  return Math.round(cost * levelMultipliers[shippingLevel]);
}

export function generatePodPackageId(specs: PrintSpecs): string {
  const size = trimSizes[specs.trimSize];
  const binding = bindingTypes[specs.bindingType];
  const paper = paperTypes[specs.paperType];
  
  const sizeCode = `${size.width}X${size.height}`.replace('.', '');
  const bindCode = binding.code;
  const paperCode = specs.colorInterior ? 'COLOR' : 'BW';
  
  return `${sizeCode}_${bindCode}_${paperCode}`;
}

export async function getPrintableCostEstimate(
  specs: PrintSpecs,
  quantity: number = 1
): Promise<{ printCost: number; totalCost: number; perBookCost: number }> {
  const printCost = calculatePrintCost(specs);
  const totalCost = printCost * quantity;
  
  return {
    printCost,
    totalCost,
    perBookCost: printCost,
  };
}

export async function createPrintable(request: PrintableRequest): Promise<{ 
  success: boolean; 
  printableId?: string; 
  error?: string 
}> {
  if (!isLuluConfigured()) {
    return { 
      success: false, 
      error: 'Lulu API not configured. Add LULU_CLIENT_KEY and LULU_CLIENT_SECRET.' 
    };
  }

  try {
    const result = await luluRequest('/printable/', {
      method: 'POST',
      body: JSON.stringify({
        external_id: request.externalId,
        title: request.title,
        interior_source_url: request.interiorSourceUrl,
        cover_source_url: request.coverSourceUrl,
        pod_package_id: request.podPackageId,
      }),
    });

    return {
      success: true,
      printableId: result.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getPrintableStatus(printableId: string): Promise<{
  success: boolean;
  status?: string;
  fileStatus?: { interior: string; cover: string };
  error?: string;
}> {
  if (!isLuluConfigured()) {
    return { success: false, error: 'Lulu API not configured' };
  }

  try {
    const result = await luluRequest(`/printable/${printableId}`);
    
    return {
      success: true,
      status: result.status,
      fileStatus: {
        interior: result.interior_status,
        cover: result.cover_status,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function createPrintJob(request: PrintJobRequest): Promise<{
  success: boolean;
  orderId?: string;
  estimatedShipDate?: string;
  costs?: { printing: number; shipping: number; total: number };
  error?: string;
}> {
  if (!isLuluConfigured()) {
    return { success: false, error: 'Lulu API not configured' };
  }

  try {
    const result = await luluRequest('/print-jobs/', {
      method: 'POST',
      body: JSON.stringify({
        external_id: request.externalId,
        contact_email: request.contactEmail,
        shipping_level: request.shippingLevel,
        shipping_address: {
          name: request.shippingAddress.name,
          street1: request.shippingAddress.street1,
          street2: request.shippingAddress.street2,
          city: request.shippingAddress.city,
          state_code: request.shippingAddress.stateCode,
          postal_code: request.shippingAddress.postcode,
          country_code: request.shippingAddress.countryCode,
          phone_number: request.shippingAddress.phone,
        },
        line_items: request.lineItems.map(item => ({
          external_id: item.externalId,
          printable_id: item.printableId,
          quantity: item.quantity,
        })),
      }),
    });

    return {
      success: true,
      orderId: result.id,
      estimatedShipDate: result.estimated_shipping_dates?.arrival,
      costs: {
        printing: Math.round((result.costs?.printing || 0) * 100),
        shipping: Math.round((result.costs?.shipping || 0) * 100),
        total: Math.round((result.costs?.total || 0) * 100),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getPrintJobStatus(orderId: string): Promise<{
  success: boolean;
  status?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  lineItems?: Array<{ id: string; status: string }>;
  error?: string;
}> {
  if (!isLuluConfigured()) {
    return { success: false, error: 'Lulu API not configured' };
  }

  try {
    const result = await luluRequest(`/print-jobs/${orderId}`);
    
    return {
      success: true,
      status: result.status?.name,
      trackingNumber: result.shipments?.[0]?.tracking_id,
      trackingUrl: result.shipments?.[0]?.tracking_url,
      carrier: result.shipments?.[0]?.carrier,
      lineItems: result.line_items?.map((item: any) => ({
        id: item.id,
        status: item.status?.name,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function cancelPrintJob(orderId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!isLuluConfigured()) {
    return { success: false, error: 'Lulu API not configured' };
  }

  try {
    await luluRequest(`/print-jobs/${orderId}`, {
      method: 'DELETE',
    });
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getShippingOptions(
  countryCode: string,
  pageCount: number,
  quantity: number = 1
): Promise<{
  options: Array<{
    level: string;
    displayName: string;
    estimatedDays: string;
    cost: number;
  }>;
}> {
  const options = [
    { level: 'MAIL', displayName: 'Standard Mail', estimatedDays: '7-14 business days', multiplier: 1.0 },
    { level: 'GROUND', displayName: 'Ground Shipping', estimatedDays: '5-7 business days', multiplier: 1.2 },
    { level: 'EXPEDITED', displayName: 'Expedited', estimatedDays: '3-5 business days', multiplier: 2.0 },
    { level: 'EXPRESS', displayName: 'Express', estimatedDays: '1-3 business days', multiplier: 3.5 },
  ];

  const baseRate = countryCode === 'US' ? 399 : countryCode === 'CA' ? 599 : 899;
  
  return {
    options: options.map(opt => ({
      level: opt.level,
      displayName: opt.displayName,
      estimatedDays: opt.estimatedDays,
      cost: Math.round(baseRate * opt.multiplier * (1 + (quantity - 1) * 0.3)),
    })),
  };
}

export function suggestRetailPrice(printCost: number): {
  suggested: number;
  minimum: number;
  margin: number;
  marginPercent: number;
} {
  const platformFee = 0.15;
  const suggestedMargin = 0.40;
  
  const minimumPrice = Math.ceil((printCost / (1 - platformFee)) / 100) * 100 + 100;
  const suggestedPrice = Math.ceil((printCost / (1 - suggestedMargin - platformFee)) / 100) * 100;
  
  const revenue = suggestedPrice * (1 - platformFee);
  const margin = revenue - printCost;
  const marginPercent = (margin / suggestedPrice) * 100;
  
  return {
    suggested: suggestedPrice,
    minimum: minimumPrice,
    margin: Math.round(margin),
    marginPercent: Math.round(marginPercent),
  };
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SRA-${timestamp}-${random}`;
}
