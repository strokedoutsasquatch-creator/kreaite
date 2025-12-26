/**
 * Vertex AI Imagen Service
 * Production-grade AI image generation using Google's Imagen 3 model
 * 
 * Uses Google Cloud Service Account for OAuth 2.0 authentication
 */

const VERTEX_AI_LOCATION = "us-central1";
const IMAGEN_MODEL = "imagen-3.0-generate-001";

interface ImagenResponse {
  predictions: Array<{
    bytesBase64Encoded: string;
    mimeType?: string;
  }>;
}

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

export async function generateImageWithImagen(
  prompt: string,
  aspectRatio?: string
): Promise<{
  success: boolean;
  imageBase64?: string;
  mimeType?: string;
  error?: string;
}> {
  let projectId = process.env.GOOGLE_CLOUD_PROJECT;
  
  if (!projectId) {
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountKey) {
      try {
        const credentials = JSON.parse(serviceAccountKey);
        projectId = credentials.project_id;
      } catch (e) {
        // Ignore
      }
    }
  }
  
  if (!projectId) {
    return {
      success: false,
      error: "GOOGLE_CLOUD_PROJECT environment variable not set and not found in service account"
    };
  }
  
  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get access token'
    };
  }
  
  const endpoint = `https://${VERTEX_AI_LOCATION}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${VERTEX_AI_LOCATION}/publishers/google/models/${IMAGEN_MODEL}:predict`;
  
  const validAspectRatios = ["1:1", "9:16", "16:9", "4:3", "3:4"];
  const finalAspectRatio = aspectRatio && validAspectRatios.includes(aspectRatio) ? aspectRatio : "1:1";
  
  const payload = {
    instances: [{
      prompt: prompt
    }],
    parameters: {
      sampleCount: 1,
      aspectRatio: finalAspectRatio,
      personGeneration: "allow_adult",
      safetyFilterLevel: "block_some"
    }
  };
  
  try {
    console.log('Calling Imagen API with OAuth token...');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Imagen API error:', errorText);
      return {
        success: false,
        error: `Imagen API error: ${response.status} - ${errorText}`
      };
    }
    
    const result = await response.json() as ImagenResponse;
    
    if (result.predictions && result.predictions.length > 0) {
      return {
        success: true,
        imageBase64: result.predictions[0].bytesBase64Encoded,
        mimeType: result.predictions[0].mimeType || 'image/png'
      };
    }
    
    return {
      success: false,
      error: "No image generated in response"
    };
  } catch (error) {
    console.error('Error calling Imagen API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export function isImagenConfigured(): boolean {
  return !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
}
