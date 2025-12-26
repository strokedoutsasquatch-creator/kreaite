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
const LULU_CLIENT_KEY = process.env.LULU_API_KEY || process.env.LULU_CLIENT_KEY;
const LULU_CLIENT_SECRET = process.env.LULU_API_SECRET || process.env.LULU_CLIENT_SECRET;

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
  return `KRE-${timestamp}-${random}`;
}

export const paperThickness = {
  'standard_white': 0.0025, // inches per sheet
  'premium_white': 0.0028,
  'cream': 0.0027,
  'premium_cream': 0.003,
  'color': 0.0035,
} as const;

export function calculateSpineWidth(pageCount: number, paperType: keyof typeof paperTypes): {
  inches: number;
  mm: number;
  display: string;
} {
  const thickness = paperThickness[paperType] || 0.0025;
  const sheets = Math.ceil(pageCount / 2);
  const spineInches = sheets * thickness;
  const spineMm = spineInches * 25.4;
  
  return {
    inches: Math.round(spineInches * 1000) / 1000,
    mm: Math.round(spineMm * 10) / 10,
    display: `${spineMm.toFixed(1)}mm (${spineInches.toFixed(3)}")`,
  };
}

export function calculateCoverDimensions(
  pageCount: number,
  trimSize: keyof typeof trimSizes,
  paperType: keyof typeof paperTypes,
  hasBleed: boolean = true
): {
  width: number;
  height: number;
  spineWidth: number;
  bleed: number;
  wrapWidth: number;
  totalWidth: number;
  totalHeight: number;
  displaySize: string;
} {
  const size = trimSizes[trimSize];
  const spine = calculateSpineWidth(pageCount, paperType);
  const bleed = hasBleed ? 0.125 : 0;
  const wrapWidth = 0.75; // For hardcover wrap
  
  const totalWidth = (size.width * 2) + spine.inches + (bleed * 2);
  const totalHeight = size.height + (bleed * 2);
  
  return {
    width: size.width,
    height: size.height,
    spineWidth: spine.inches,
    bleed,
    wrapWidth,
    totalWidth,
    totalHeight,
    displaySize: `${totalWidth.toFixed(3)}" × ${totalHeight.toFixed(3)}"`,
  };
}

export const kdpMarginPresets = {
  'standard': {
    inside: 0.75,
    outside: 0.5,
    top: 0.5,
    bottom: 0.625,
    gutter: 0.125,
    display: 'Standard (KDP Recommended)',
  },
  'comfortable': {
    inside: 0.875,
    outside: 0.625,
    top: 0.625,
    bottom: 0.75,
    gutter: 0.15,
    display: 'Comfortable (More White Space)',
  },
  'compact': {
    inside: 0.625,
    outside: 0.375,
    top: 0.375,
    bottom: 0.5,
    gutter: 0.1,
    display: 'Compact (More Content)',
  },
  'academic': {
    inside: 1.0,
    outside: 0.75,
    top: 0.75,
    bottom: 0.875,
    gutter: 0.2,
    display: 'Academic (Wide Margins)',
  },
} as const;

export interface ProfessionalBookSpecs {
  title: string;
  subtitle?: string;
  author: string;
  isbn?: string;
  pageCount: number;
  trimSize: keyof typeof trimSizes;
  bindingType: keyof typeof bindingTypes;
  paperType: keyof typeof paperTypes;
  colorInterior: boolean;
  marginPreset: keyof typeof kdpMarginPresets;
  hasBleed: boolean;
  includeBarcode: boolean;
}

export function generateISBN13(): string {
  const prefix = '979'; // Modern ISBN prefix
  const group = '8'; // Self-publishing group
  const publisher = Math.floor(Math.random() * 900000 + 100000).toString();
  const title = Math.floor(Math.random() * 90 + 10).toString();
  
  const base = prefix + group + publisher + title;
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return base + checkDigit;
}

export function validateISBN13(isbn: string): boolean {
  const clean = isbn.replace(/[-\s]/g, '');
  if (clean.length !== 13 || !/^\d+$/.test(clean)) return false;
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(clean[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return parseInt(clean[12]) === checkDigit;
}

export function formatISBN(isbn: string): string {
  const clean = isbn.replace(/[-\s]/g, '');
  if (clean.length !== 13) return isbn;
  return `${clean.slice(0, 3)}-${clean.slice(3, 4)}-${clean.slice(4, 10)}-${clean.slice(10, 12)}-${clean.slice(12)}`;
}

export async function getLuluPrintCostQuote(
  specs: ProfessionalBookSpecs,
  quantity: number = 1,
  shippingCountry: string = 'US'
): Promise<{
  productionCost: number;
  shippingCost: number;
  totalCost: number;
  perUnitCost: number;
  suggestedRetailPrice: number;
  creatorEarnings: number;
  platformFee: number;
  coverDimensions: ReturnType<typeof calculateCoverDimensions>;
  spineWidth: ReturnType<typeof calculateSpineWidth>;
}> {
  const printCost = calculatePrintCost({
    pageCount: specs.pageCount,
    trimSize: specs.trimSize,
    bindingType: specs.bindingType,
    paperType: specs.paperType,
    colorInterior: specs.colorInterior,
  });
  
  const shippingCost = estimateShippingCost(shippingCountry, quantity, 'GROUND');
  const totalCost = (printCost * quantity) + shippingCost;
  const perUnitCost = Math.round(totalCost / quantity);
  
  const pricing = suggestRetailPrice(printCost);
  const platformFee = Math.round(pricing.suggested * 0.15);
  const creatorEarnings = Math.round(pricing.suggested * 0.85) - printCost;
  
  return {
    productionCost: printCost * quantity,
    shippingCost,
    totalCost,
    perUnitCost,
    suggestedRetailPrice: pricing.suggested,
    creatorEarnings,
    platformFee,
    coverDimensions: calculateCoverDimensions(specs.pageCount, specs.trimSize, specs.paperType, specs.hasBleed),
    spineWidth: calculateSpineWidth(specs.pageCount, specs.paperType),
  };
}

export async function submitProofOrder(
  specs: ProfessionalBookSpecs,
  interiorPdfUrl: string,
  coverPdfUrl: string,
  shippingAddress: ShippingAddress,
  contactEmail: string
): Promise<{
  success: boolean;
  orderId?: string;
  proofCost?: number;
  estimatedDelivery?: string;
  error?: string;
}> {
  const podPackageId = generatePodPackageId({
    pageCount: specs.pageCount,
    trimSize: specs.trimSize,
    bindingType: specs.bindingType,
    paperType: specs.paperType,
    colorInterior: specs.colorInterior,
  });
  
  const printableResult = await createPrintable({
    externalId: `PROOF-${Date.now()}`,
    title: `[PROOF] ${specs.title}`,
    interiorSourceUrl: interiorPdfUrl,
    coverSourceUrl: coverPdfUrl,
    podPackageId,
  });
  
  if (!printableResult.success || !printableResult.printableId) {
    return { success: false, error: printableResult.error || 'Failed to create printable' };
  }
  
  const jobResult = await createPrintJob({
    externalId: `PROOF-${generateOrderNumber()}`,
    lineItems: [{
      printableId: printableResult.printableId,
      quantity: 1,
    }],
    shippingAddress,
    shippingLevel: 'GROUND',
    contactEmail,
  });
  
  if (!jobResult.success) {
    return { success: false, error: jobResult.error };
  }
  
  return {
    success: true,
    orderId: jobResult.orderId,
    proofCost: jobResult.costs?.total,
    estimatedDelivery: jobResult.estimatedShipDate,
  };
}

export async function submitProductionOrder(
  specs: ProfessionalBookSpecs,
  interiorPdfUrl: string,
  coverPdfUrl: string,
  quantity: number,
  shippingAddress: ShippingAddress,
  shippingLevel: 'MAIL' | 'GROUND' | 'EXPEDITED' | 'EXPRESS',
  contactEmail: string
): Promise<{
  success: boolean;
  orderId?: string;
  totalCost?: number;
  estimatedDelivery?: string;
  trackingAvailable?: boolean;
  error?: string;
}> {
  const podPackageId = generatePodPackageId({
    pageCount: specs.pageCount,
    trimSize: specs.trimSize,
    bindingType: specs.bindingType,
    paperType: specs.paperType,
    colorInterior: specs.colorInterior,
  });
  
  const printableResult = await createPrintable({
    externalId: `PROD-${Date.now()}`,
    title: specs.title,
    interiorSourceUrl: interiorPdfUrl,
    coverSourceUrl: coverPdfUrl,
    podPackageId,
  });
  
  if (!printableResult.success || !printableResult.printableId) {
    return { success: false, error: printableResult.error || 'Failed to create printable' };
  }
  
  const jobResult = await createPrintJob({
    externalId: generateOrderNumber(),
    lineItems: [{
      printableId: printableResult.printableId,
      quantity,
    }],
    shippingAddress,
    shippingLevel,
    contactEmail,
  });
  
  if (!jobResult.success) {
    return { success: false, error: jobResult.error };
  }
  
  return {
    success: true,
    orderId: jobResult.orderId,
    totalCost: jobResult.costs?.total,
    estimatedDelivery: jobResult.estimatedShipDate,
    trackingAvailable: shippingLevel !== 'MAIL',
  };
}

export function getBookProductionStatus(status: string): {
  stage: 'pending' | 'processing' | 'printing' | 'shipping' | 'delivered' | 'cancelled';
  progress: number;
  displayStatus: string;
  description: string;
} {
  const statusMap: Record<string, { stage: any; progress: number; displayStatus: string; description: string }> = {
    'CREATED': { stage: 'pending', progress: 10, displayStatus: 'Order Received', description: 'Your order has been received and is being prepared.' },
    'UNPAID': { stage: 'pending', progress: 5, displayStatus: 'Awaiting Payment', description: 'Payment is required to proceed.' },
    'PAYMENT_IN_PROGRESS': { stage: 'pending', progress: 15, displayStatus: 'Processing Payment', description: 'Payment is being processed.' },
    'PRODUCTION_READY': { stage: 'processing', progress: 25, displayStatus: 'Ready for Production', description: 'Files verified. Ready for printing.' },
    'PRODUCTION_DELAYED': { stage: 'processing', progress: 30, displayStatus: 'Production Delayed', description: 'There is a delay in production.' },
    'IN_PRODUCTION': { stage: 'printing', progress: 50, displayStatus: 'Printing', description: 'Your book is being printed.' },
    'SHIPPED': { stage: 'shipping', progress: 80, displayStatus: 'Shipped', description: 'Your book is on its way!' },
    'DELIVERED': { stage: 'delivered', progress: 100, displayStatus: 'Delivered', description: 'Your book has been delivered.' },
    'CANCELLED': { stage: 'cancelled', progress: 0, displayStatus: 'Cancelled', description: 'Order was cancelled.' },
    'ERROR': { stage: 'cancelled', progress: 0, displayStatus: 'Error', description: 'There was an error with your order.' },
  };
  
  return statusMap[status] || { stage: 'pending', progress: 0, displayStatus: status, description: 'Status unknown.' };
}
