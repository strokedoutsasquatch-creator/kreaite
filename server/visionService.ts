/**
 * Google Vision AI Service
 * Image analysis using Google Cloud Vision API
 * 
 * Uses Google Cloud Service Account for OAuth 2.0 authentication
 * Provides labels, colors, objects, text, face detection, and safe search
 */

interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function createSignedJWT(credentials: ServiceAccountCredentials): Promise<string> {
  const crypto = await import('crypto');
  
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    sub: credentials.client_email,
    aud: credentials.token_uri,
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/cloud-platform'
  };
  
  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signatureInput = `${base64Header}.${base64Payload}`;
  
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  const signature = sign.sign(credentials.private_key, 'base64url');
  
  return `${signatureInput}.${signature}`;
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }
  
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set");
  }
  
  let credentials: ServiceAccountCredentials;
  try {
    credentials = JSON.parse(serviceAccountKey);
  } catch (e) {
    throw new Error("Invalid GOOGLE_SERVICE_ACCOUNT_KEY format - must be valid JSON");
  }
  
  const jwt = await createSignedJWT(credentials);
  
  const response = await fetch(credentials.token_uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('OAuth token error:', errorText);
    throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
  }
  
  const tokenData = await response.json() as { access_token: string; expires_in: number };
  
  cachedToken = {
    token: tokenData.access_token,
    expiresAt: Date.now() + (tokenData.expires_in * 1000)
  };
  
  return tokenData.access_token;
}

const VISION_API_ENDPOINT = "https://vision.googleapis.com/v1/images:annotate";

export interface LabelAnnotation {
  description: string;
  score: number;
  topicality: number;
}

export interface ColorInfo {
  color: { red: number; green: number; blue: number };
  score: number;
  pixelFraction: number;
}

export interface ObjectAnnotation {
  name: string;
  score: number;
  boundingPoly?: {
    normalizedVertices: Array<{ x: number; y: number }>;
  };
}

export interface TextAnnotation {
  description: string;
  locale?: string;
  boundingPoly?: {
    vertices: Array<{ x: number; y: number }>;
  };
}

export interface FaceAnnotation {
  boundingPoly?: {
    vertices: Array<{ x: number; y: number }>;
  };
  landmarks?: Array<{
    type: string;
    position: { x: number; y: number; z: number };
  }>;
  rollAngle?: number;
  panAngle?: number;
  tiltAngle?: number;
  detectionConfidence?: number;
  landmarkingConfidence?: number;
  joyLikelihood?: string;
  sorrowLikelihood?: string;
  angerLikelihood?: string;
  surpriseLikelihood?: string;
  underExposedLikelihood?: string;
  blurredLikelihood?: string;
  headwearLikelihood?: string;
}

export interface SafeSearchAnnotation {
  adult: string;
  spoof: string;
  medical: string;
  violence: string;
  racy: string;
}

export interface ImageAnalysisResult {
  labels: LabelAnnotation[];
  colors: ColorInfo[];
  objects: ObjectAnnotation[];
  text: TextAnnotation[];
  fullTextAnnotation?: {
    text: string;
  };
}

export interface FaceDetectionResult {
  faces: FaceAnnotation[];
}

export interface SafeSearchResult {
  safeSearch: SafeSearchAnnotation;
}

export function isVisionConfigured(): boolean {
  return !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
}

async function callVisionAPI(imageBase64: string, features: Array<{ type: string; maxResults?: number }>): Promise<any> {
  const accessToken = await getAccessToken();
  
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  
  const requestBody = {
    requests: [{
      image: {
        content: cleanBase64
      },
      features: features
    }]
  };
  
  const response = await fetch(VISION_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Vision API error:', errorText);
    throw new Error(`Vision API error: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  
  if (result.responses && result.responses[0] && result.responses[0].error) {
    throw new Error(`Vision API error: ${result.responses[0].error.message}`);
  }
  
  return result.responses?.[0] || {};
}

export async function analyzeImage(imageBase64: string): Promise<{
  success: boolean;
  data?: ImageAnalysisResult;
  error?: string;
}> {
  if (!isVisionConfigured()) {
    return {
      success: false,
      error: "Google Cloud Vision API not configured"
    };
  }
  
  try {
    const response = await callVisionAPI(imageBase64, [
      { type: 'LABEL_DETECTION', maxResults: 20 },
      { type: 'IMAGE_PROPERTIES' },
      { type: 'OBJECT_LOCALIZATION', maxResults: 20 },
      { type: 'TEXT_DETECTION' },
      { type: 'DOCUMENT_TEXT_DETECTION' }
    ]);
    
    const labels: LabelAnnotation[] = (response.labelAnnotations || []).map((l: any) => ({
      description: l.description,
      score: l.score,
      topicality: l.topicality
    }));
    
    const colors: ColorInfo[] = (response.imagePropertiesAnnotation?.dominantColors?.colors || []).map((c: any) => ({
      color: {
        red: Math.round(c.color?.red || 0),
        green: Math.round(c.color?.green || 0),
        blue: Math.round(c.color?.blue || 0)
      },
      score: c.score,
      pixelFraction: c.pixelFraction
    }));
    
    const objects: ObjectAnnotation[] = (response.localizedObjectAnnotations || []).map((o: any) => ({
      name: o.name,
      score: o.score,
      boundingPoly: o.boundingPoly
    }));
    
    const text: TextAnnotation[] = (response.textAnnotations || []).map((t: any) => ({
      description: t.description,
      locale: t.locale,
      boundingPoly: t.boundingPoly
    }));
    
    return {
      success: true,
      data: {
        labels,
        colors,
        objects,
        text,
        fullTextAnnotation: response.fullTextAnnotation
      }
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function detectFaces(imageBase64: string): Promise<{
  success: boolean;
  data?: FaceDetectionResult;
  error?: string;
}> {
  if (!isVisionConfigured()) {
    return {
      success: false,
      error: "Google Cloud Vision API not configured"
    };
  }
  
  try {
    const response = await callVisionAPI(imageBase64, [
      { type: 'FACE_DETECTION', maxResults: 50 }
    ]);
    
    const faces: FaceAnnotation[] = (response.faceAnnotations || []).map((f: any) => ({
      boundingPoly: f.boundingPoly,
      landmarks: f.landmarks,
      rollAngle: f.rollAngle,
      panAngle: f.panAngle,
      tiltAngle: f.tiltAngle,
      detectionConfidence: f.detectionConfidence,
      landmarkingConfidence: f.landmarkingConfidence,
      joyLikelihood: f.joyLikelihood,
      sorrowLikelihood: f.sorrowLikelihood,
      angerLikelihood: f.angerLikelihood,
      surpriseLikelihood: f.surpriseLikelihood,
      underExposedLikelihood: f.underExposedLikelihood,
      blurredLikelihood: f.blurredLikelihood,
      headwearLikelihood: f.headwearLikelihood
    }));
    
    return {
      success: true,
      data: { faces }
    };
  } catch (error) {
    console.error('Error detecting faces:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function safeSearchCheck(imageBase64: string): Promise<{
  success: boolean;
  data?: SafeSearchResult;
  error?: string;
}> {
  if (!isVisionConfigured()) {
    return {
      success: false,
      error: "Google Cloud Vision API not configured"
    };
  }
  
  try {
    const response = await callVisionAPI(imageBase64, [
      { type: 'SAFE_SEARCH_DETECTION' }
    ]);
    
    const safeSearch = response.safeSearchAnnotation || {
      adult: 'UNKNOWN',
      spoof: 'UNKNOWN',
      medical: 'UNKNOWN',
      violence: 'UNKNOWN',
      racy: 'UNKNOWN'
    };
    
    return {
      success: true,
      data: { safeSearch }
    };
  } catch (error) {
    console.error('Error checking safe search:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
