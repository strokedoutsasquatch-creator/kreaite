/**
 * Lyria Music Generation Service
 * Production-grade AI music generation using Google's Lyria model
 * 
 * Uses Google Cloud Service Account for OAuth 2.0 authentication
 * Generates 30-second high-fidelity instrumental tracks at 48kHz stereo
 * Cost: ~$0.06 per 30-second generation
 */

// Vertex AI configuration constants
const VERTEX_AI_LOCATION = "us-central1";
const LYRIA_MODEL = "lyria-002";

interface LyriaResponse {
  predictions: Array<{
    audioContent: string;
    mimeType?: string;
  }>;
}

interface LyriaRequest {
  prompt: string;
  negativePrompt?: string;
  seed?: number;
  sampleCount?: number;
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

// Cache for access token
let cachedToken: { token: string; expiresAt: number } | null = null;

// Genre-specific prompt templates for production quality
const genrePrompts: Record<string, { style: string; instruments: string; negative: string }> = {
  rap: {
    style: "hard-hitting hip-hop beat with punchy 808 bass, crisp snares, and trap hi-hats",
    instruments: "808 bass, punchy kick drums, crisp snares, trap hi-hats, dark synth pads",
    negative: "acoustic instruments, soft, gentle, classical"
  },
  pop: {
    style: "polished modern pop production with catchy hooks, driving rhythm, and synth layers",
    instruments: "synth bass, electronic drums, layered synths, bright leads, rhythmic pads",
    negative: "distortion, heavy metal, aggressive, dark"
  },
  country: {
    style: "authentic southern rock with twangy guitars, driving rhythm, and heartland feel",
    instruments: "electric guitar, acoustic guitar, bass guitar, drums, pedal steel, fiddle",
    negative: "electronic, synth, EDM, dubstep"
  },
  metal: {
    style: "brutal death metal with crushing guitars, blast beats, and intense aggression",
    instruments: "heavily distorted electric guitars, double bass drums, blast beats, growling bass",
    negative: "soft, gentle, acoustic, peaceful, ambient"
  },
  rock: {
    style: "modern alternative rock with powerful guitars, driving drums, and anthemic energy",
    instruments: "distorted electric guitars, powerful drums, bass guitar, rock organ",
    negative: "electronic, EDM, hip-hop, soft"
  },
  punk: {
    style: "raw punk rock with fast tempo, aggressive guitars, and rebellious energy",
    instruments: "distorted power chords, fast drums, punk bass, raw energy",
    negative: "polished, overproduced, soft, electronic"
  },
  edm: {
    style: "high-energy electronic dance music with pounding bass, soaring synths, and euphoric drops",
    instruments: "synthesizers, 808 bass, electronic drums, arpeggiated leads, sidechain compression",
    negative: "acoustic, organic, unplugged, classical"
  },
  ambient: {
    style: "peaceful therapeutic ambient soundscape for healing and meditation",
    instruments: "soft pads, gentle piano, atmospheric textures, nature sounds, warm drones",
    negative: "drums, aggressive, fast, heavy, distortion"
  }
};

/**
 * Create a signed JWT for Google OAuth 2.0
 */
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

/**
 * Get OAuth 2.0 access token from service account
 */
async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
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
  
  // Create signed JWT
  const jwt = await createSignedJWT(credentials);
  
  // Exchange JWT for access token
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
  
  // Cache the token
  cachedToken = {
    token: tokenData.access_token,
    expiresAt: Date.now() + (tokenData.expires_in * 1000)
  };
  
  return tokenData.access_token;
}

/**
 * Build a production-quality prompt for Lyria
 */
export function buildMusicPrompt(
  genre: string,
  bpm: number,
  key: string,
  scale: string,
  customDescription?: string
): { prompt: string; negativePrompt: string } {
  const genreConfig = genrePrompts[genre] || genrePrompts.rock;
  
  let prompt = `Professional ${genre} music production. ${genreConfig.style}. `;
  prompt += `Instrumentation: ${genreConfig.instruments}. `;
  prompt += `Musical key: ${key} ${scale}. Tempo: ${bpm} BPM. `;
  prompt += `High-fidelity studio recording quality, professionally mixed and mastered. `;
  
  if (customDescription) {
    prompt += customDescription;
  }
  
  // Add recovery/motivation theme for Stroke Recovery Academy
  if (genre === 'ambient') {
    prompt += `Healing and restorative atmosphere, perfect for stroke recovery meditation and relaxation.`;
  } else {
    prompt += `Powerful and triumphant energy, suitable for motivation and overcoming challenges.`;
  }
  
  return {
    prompt,
    negativePrompt: genreConfig.negative
  };
}

/**
 * Generate music using Vertex AI Lyria
 * Uses service account OAuth 2.0 authentication
 */
export async function generateMusic(request: LyriaRequest): Promise<{
  success: boolean;
  audioBase64?: string;
  mimeType?: string;
  error?: string;
}> {
  // Get project ID from service account or env
  let projectId = process.env.GOOGLE_CLOUD_PROJECT;
  
  if (!projectId) {
    // Try to get from service account key
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
  
  const endpoint = `https://${VERTEX_AI_LOCATION}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${VERTEX_AI_LOCATION}/publishers/google/models/${LYRIA_MODEL}:predict`;
  
  const payload = {
    instances: [{
      prompt: request.prompt,
      ...(request.negativePrompt && { negative_prompt: request.negativePrompt }),
      ...(request.seed && { seed: request.seed })
    }],
    parameters: {
      ...(request.sampleCount && { sample_count: request.sampleCount })
    }
  };
  
  try {
    console.log('Calling Lyria API with OAuth token...');
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
      console.error('Lyria API error:', errorText);
      return {
        success: false,
        error: `Lyria API error: ${response.status} - ${errorText}`
      };
    }
    
    const result = await response.json() as LyriaResponse;
    
    if (result.predictions && result.predictions.length > 0) {
      return {
        success: true,
        audioBase64: result.predictions[0].audioContent,
        mimeType: result.predictions[0].mimeType || 'audio/wav'
      };
    }
    
    return {
      success: false,
      error: "No audio generated in response"
    };
  } catch (error) {
    console.error('Error calling Lyria API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate a complete instrumental track for a specific genre
 */
export async function generateInstrumental(
  genre: string,
  bpm: number,
  key: string,
  scale: string,
  customDescription?: string,
  seed?: number
): Promise<{
  success: boolean;
  audioBase64?: string;
  mimeType?: string;
  prompt?: string;
  error?: string;
}> {
  const { prompt, negativePrompt } = buildMusicPrompt(genre, bpm, key, scale, customDescription);
  
  console.log('Generating instrumental with prompt:', prompt);
  
  const result = await generateMusic({
    prompt,
    negativePrompt,
    seed
  });
  
  return {
    ...result,
    prompt
  };
}

/**
 * Check if Lyria service is properly configured
 */
export function isLyriaConfigured(): boolean {
  return !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
}

/**
 * Get estimated cost for music generation
 * Lyria costs approximately $0.06 per 30-second clip
 */
export function estimateCost(clips: number): number {
  return clips * 0.06;
}
