/**
 * AI Video Generation Service
 * Creates movie scenes, music videos, and AI films
 * 
 * Uses: Google Veo, Grok Imagine, xAI
 * Vertex AI Veo for high-quality video generation
 */

const XAI_BASE_URL = 'https://api.x.ai/v1';
const VERTEX_AI_LOCATION = "us-central1";
const VEO_MODEL = "veo-001-preview";

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

interface VeoGenerateResponse {
  name: string; // Operation name for polling
}

interface VeoOperationResponse {
  name: string;
  done: boolean;
  error?: {
    code: number;
    message: string;
  };
  response?: {
    generatedSamples: Array<{
      video: {
        uri?: string;
        bytesBase64Encoded?: string;
      };
    }>;
  };
}

interface VideoGenerationResult {
  success: boolean;
  operationName?: string;
  videoBase64?: string;
  videoUri?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
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

function getProjectId(): string | null {
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
  
  return projectId || null;
}

/**
 * Generate video using Vertex AI Veo
 * Video generation is async - returns operation name for polling
 */
export async function generateVideo(
  prompt: string,
  duration: number = 5
): Promise<VideoGenerationResult> {
  const projectId = getProjectId();
  
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
  
  const endpoint = `https://${VERTEX_AI_LOCATION}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${VERTEX_AI_LOCATION}/publishers/google/models/${VEO_MODEL}:predictLongRunning`;
  
  const validDurations = [5, 6, 8];
  const finalDuration = validDurations.includes(duration) ? duration : 5;
  
  const payload = {
    instances: [{
      prompt: prompt
    }],
    parameters: {
      aspectRatio: "16:9",
      sampleCount: 1,
      durationSeconds: finalDuration,
      personGeneration: "allow_adult",
      enhancePrompt: true
    }
  };
  
  try {
    console.log('Starting Veo video generation...');
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
      console.error('Veo API error:', errorText);
      return {
        success: false,
        error: `Veo API error: ${response.status} - ${errorText}`
      };
    }
    
    const result = await response.json() as VeoGenerateResponse;
    
    return {
      success: true,
      operationName: result.name,
      status: 'processing'
    };
  } catch (error) {
    console.error('Error calling Veo API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check status of video generation operation
 */
export async function checkVideoGenerationStatus(
  operationName: string
): Promise<VideoGenerationResult> {
  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get access token'
    };
  }
  
  const endpoint = `https://${VERTEX_AI_LOCATION}-aiplatform.googleapis.com/v1/${operationName}`;
  
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Veo status check error:', errorText);
      return {
        success: false,
        error: `Veo status check error: ${response.status} - ${errorText}`
      };
    }
    
    const result = await response.json() as VeoOperationResponse;
    
    if (result.error) {
      return {
        success: false,
        status: 'failed',
        error: result.error.message
      };
    }
    
    if (!result.done) {
      return {
        success: true,
        operationName: result.name,
        status: 'processing'
      };
    }
    
    if (result.response?.generatedSamples?.[0]?.video) {
      const video = result.response.generatedSamples[0].video;
      return {
        success: true,
        status: 'completed',
        videoBase64: video.bytesBase64Encoded,
        videoUri: video.uri
      };
    }
    
    return {
      success: false,
      status: 'failed',
      error: 'No video generated in response'
    };
  } catch (error) {
    console.error('Error checking Veo status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate video and poll for completion
 * Returns immediately with operation ID for client-side polling
 * Or waits for completion if waitForCompletion is true
 */
export async function generateVideoWithPolling(
  prompt: string,
  duration: number = 5,
  waitForCompletion: boolean = false,
  maxWaitMs: number = 300000 // 5 minutes default
): Promise<VideoGenerationResult> {
  const startResult = await generateVideo(prompt, duration);
  
  if (!startResult.success || !startResult.operationName) {
    return startResult;
  }
  
  if (!waitForCompletion) {
    return startResult;
  }
  
  const startTime = Date.now();
  const pollInterval = 5000; // 5 seconds
  
  while (Date.now() - startTime < maxWaitMs) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    
    const statusResult = await checkVideoGenerationStatus(startResult.operationName);
    
    if (statusResult.status === 'completed' || statusResult.status === 'failed') {
      return statusResult;
    }
    
    if (!statusResult.success) {
      return statusResult;
    }
  }
  
  return {
    success: false,
    operationName: startResult.operationName,
    status: 'processing',
    error: 'Video generation timed out - operation still processing'
  };
}

/**
 * Check if Veo video generation is configured
 */
export function isVeoConfigured(): boolean {
  return !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
}

interface SceneRequest {
  prompt: string;
  style?: 'cinematic' | 'anime' | 'realistic' | 'noir' | 'scifi' | 'fantasy';
  aspectRatio?: '16:9' | '9:16' | '1:1';
  duration?: number;
}

interface MovieScene {
  id: string;
  description: string;
  dialogue: string[];
  characters: string[];
  setting: string;
  mood: string;
  cameraAngles: string[];
}

interface MovieScript {
  title: string;
  genre: string;
  synopsis: string;
  scenes: MovieScene[];
}

// Style presets for different movie genres
export const movieStyles = {
  action: {
    lighting: "high contrast, dramatic shadows",
    camera: "dynamic angles, quick cuts",
    color: "desaturated with orange and teal"
  },
  comedy: {
    lighting: "bright, even lighting",
    camera: "medium shots, reaction shots",
    color: "warm, saturated colors"
  },
  horror: {
    lighting: "low key, deep shadows",
    camera: "dutch angles, slow zooms",
    color: "cold blues and greens, desaturated"
  },
  romance: {
    lighting: "soft, golden hour",
    camera: "close-ups, slow motion",
    color: "warm pastels, soft focus"
  },
  scifi: {
    lighting: "neon, high tech",
    camera: "wide establishing, smooth tracking",
    color: "cyan, purple, high contrast"
  },
  thriller: {
    lighting: "chiaroscuro, noir",
    camera: "tight framing, handheld",
    color: "muted, grain texture"
  }
};

/**
 * Generate image using xAI Grok Imagine
 */
export async function generateImage(prompt: string): Promise<{
  success: boolean;
  imageUrl?: string;
  error?: string;
}> {
  const apiKey = process.env.XAI_API_KEY;
  
  if (!apiKey) {
    return { success: false, error: "xAI API key not configured" };
  }

  try {
    const response = await fetch(`${XAI_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-2-image',
        prompt,
        n: 1,
        response_format: 'url'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Image generation failed: ${error}` };
    }

    const result = await response.json() as { data: Array<{ url: string }> };
    return { success: true, imageUrl: result.data[0]?.url };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Generate movie script using Gemini
 */
export async function generateMovieScript(
  premise: string,
  genre: keyof typeof movieStyles,
  sceneCount: number = 5
): Promise<{
  success: boolean;
  script?: MovieScript;
  error?: string;
}> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
  
  if (!apiKey) {
    return { success: false, error: "Gemini API key not configured" };
  }

  const prompt = `You are a professional Hollywood screenwriter. Create a complete movie script with exactly ${sceneCount} scenes.

PREMISE: ${premise}
GENRE: ${genre}

Return a JSON object with this exact structure:
{
  "title": "Movie Title",
  "genre": "${genre}",
  "synopsis": "One paragraph synopsis",
  "scenes": [
    {
      "id": "scene_1",
      "description": "Detailed visual description of what happens",
      "dialogue": ["CHARACTER: Line of dialogue", "CHARACTER2: Response"],
      "characters": ["Character names in this scene"],
      "setting": "Location description",
      "mood": "Emotional tone",
      "cameraAngles": ["Wide shot", "Close-up on character", etc]
    }
  ]
}

Make it dramatic, cinematic, and production-ready. Each scene should be 30-60 seconds when filmed.`;

  try {
    const response = await fetch(`${baseUrl}/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 4096
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Script generation failed: ${error}` };
    }

    const result = await response.json() as any;
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: "Failed to parse script" };
    }

    const script = JSON.parse(jsonMatch[0]) as MovieScript;
    return { success: true, script };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Generate scene visual prompt for video generation
 */
export function buildScenePrompt(scene: MovieScene, style: keyof typeof movieStyles): string {
  const styleConfig = movieStyles[style];
  
  return `Cinematic movie scene: ${scene.description}
Setting: ${scene.setting}
Mood: ${scene.mood}
Lighting: ${styleConfig.lighting}
Camera: ${styleConfig.camera}
Color grading: ${styleConfig.color}
Film quality, 4K, professional cinematography, movie still frame`;
}

/**
 * Generate storyboard images for a scene
 */
export async function generateStoryboard(
  scene: MovieScene,
  style: keyof typeof movieStyles,
  frameCount: number = 3
): Promise<{
  success: boolean;
  frames?: string[];
  error?: string;
}> {
  const frames: string[] = [];
  
  for (let i = 0; i < frameCount; i++) {
    const anglePrompt = scene.cameraAngles[i] || scene.cameraAngles[0] || 'medium shot';
    const prompt = `${buildScenePrompt(scene, style)}, ${anglePrompt}`;
    
    const result = await generateImage(prompt);
    if (result.success && result.imageUrl) {
      frames.push(result.imageUrl);
    }
  }
  
  if (frames.length === 0) {
    return { success: false, error: "Failed to generate any frames" };
  }
  
  return { success: true, frames };
}

/**
 * Check if video service is configured
 */
export function isVideoServiceConfigured(): boolean {
  return !!(process.env.XAI_API_KEY || process.env.GEMINI_API_KEY);
}

/**
 * Get available movie styles
 */
export function getMovieStyles() {
  return Object.entries(movieStyles).map(([key, value]) => ({
    id: key,
    name: key.charAt(0).toUpperCase() + key.slice(1),
    ...value
  }));
}
