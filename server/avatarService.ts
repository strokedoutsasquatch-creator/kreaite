/**
 * D-ID Avatar Service
 * Creates talking head videos from photos using D-ID API
 * 
 * Features:
 * - Generate talking avatars from photos and audio
 * - Generate avatars from text descriptions  
 * - Voice selection and text-to-speech
 * - Status polling for async generation
 */

const DID_API_BASE = 'https://api.d-id.com';

interface GenerateTalkingAvatarRequest {
  imageUrl?: string;
  imageBase64?: string;
  script?: string;
  audioUrl?: string;
  voiceId?: string;
  provider?: 'amazon' | 'microsoft' | 'elevenlabs';
}

interface AvatarGenerationResult {
  success: boolean;
  id?: string;
  status?: 'created' | 'started' | 'done' | 'error';
  resultUrl?: string;
  error?: string;
}

interface AvatarStatusResult {
  success: boolean;
  id?: string;
  status?: 'created' | 'started' | 'done' | 'error';
  resultUrl?: string;
  error?: string;
  duration?: number;
}

interface AvatarPreset {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  category: 'professional' | 'casual' | 'creative' | 'character';
}

const avatarPresets: AvatarPreset[] = [
  {
    id: 'presenter-1',
    name: 'Professional Presenter',
    imageUrl: 'https://create-images-results.d-id.com/DefaultPresenters/Noelle_f/image.jpeg',
    description: 'Polished professional for business presentations',
    category: 'professional'
  },
  {
    id: 'presenter-2', 
    name: 'Friendly Host',
    imageUrl: 'https://create-images-results.d-id.com/DefaultPresenters/Amy_j/image.jpeg',
    description: 'Warm and approachable for casual content',
    category: 'casual'
  },
  {
    id: 'presenter-3',
    name: 'Tech Expert',
    imageUrl: 'https://create-images-results.d-id.com/DefaultPresenters/Will_m/image.jpeg',
    description: 'Modern and tech-savvy appearance',
    category: 'professional'
  },
  {
    id: 'presenter-4',
    name: 'Creative Director',
    imageUrl: 'https://create-images-results.d-id.com/DefaultPresenters/Emma_f/image.jpeg',
    description: 'Artistic and creative personality',
    category: 'creative'
  },
  {
    id: 'presenter-5',
    name: 'Storyteller',
    imageUrl: 'https://create-images-results.d-id.com/DefaultPresenters/Josh_m/image.jpeg',
    description: 'Engaging narrator for stories and tutorials',
    category: 'casual'
  },
  {
    id: 'presenter-6',
    name: 'Corporate Leader',
    imageUrl: 'https://create-images-results.d-id.com/DefaultPresenters/Anna_f/image.jpeg',
    description: 'Authority figure for corporate communications',
    category: 'professional'
  }
];

const voiceOptions = [
  { id: 'en-US-JennyNeural', name: 'Jenny (American Female)', provider: 'microsoft', lang: 'en-US' },
  { id: 'en-US-GuyNeural', name: 'Guy (American Male)', provider: 'microsoft', lang: 'en-US' },
  { id: 'en-GB-SoniaNeural', name: 'Sonia (British Female)', provider: 'microsoft', lang: 'en-GB' },
  { id: 'en-GB-RyanNeural', name: 'Ryan (British Male)', provider: 'microsoft', lang: 'en-GB' },
  { id: 'en-AU-NatashaNeural', name: 'Natasha (Australian Female)', provider: 'microsoft', lang: 'en-AU' },
  { id: 'en-IN-NeerjaNeural', name: 'Neerja (Indian Female)', provider: 'microsoft', lang: 'en-IN' },
  { id: 'es-ES-ElviraNeural', name: 'Elvira (Spanish Female)', provider: 'microsoft', lang: 'es-ES' },
  { id: 'fr-FR-DeniseNeural', name: 'Denise (French Female)', provider: 'microsoft', lang: 'fr-FR' },
  { id: 'de-DE-KatjaNeural', name: 'Katja (German Female)', provider: 'microsoft', lang: 'de-DE' },
  { id: 'pt-BR-FranciscaNeural', name: 'Francisca (Brazilian Portuguese Female)', provider: 'microsoft', lang: 'pt-BR' },
  { id: 'ja-JP-NanamiNeural', name: 'Nanami (Japanese Female)', provider: 'microsoft', lang: 'ja-JP' },
  { id: 'zh-CN-XiaoxiaoNeural', name: 'Xiaoxiao (Chinese Female)', provider: 'microsoft', lang: 'zh-CN' },
];

function getApiKey(): string | null {
  return process.env.DID_API_KEY || null;
}

export function isAvatarServiceConfigured(): boolean {
  return !!getApiKey();
}

/**
 * Generate a talking avatar video from an image and script/audio
 */
export async function generateTalkingAvatar(
  request: GenerateTalkingAvatarRequest
): Promise<AvatarGenerationResult> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return { success: false, error: 'D-ID API key not configured' };
  }

  try {
    const headers = {
      'Authorization': `Basic ${apiKey}`,
      'Content-Type': 'application/json',
    };

    let source: any;
    if (request.imageBase64) {
      source = {
        type: 'base64',
        base64: request.imageBase64.replace(/^data:image\/\w+;base64,/, ''),
      };
    } else if (request.imageUrl) {
      source = {
        type: 'url',
        url: request.imageUrl,
      };
    } else {
      return { success: false, error: 'Image URL or base64 data is required' };
    }

    let scriptConfig: any;
    if (request.audioUrl) {
      scriptConfig = {
        type: 'audio',
        audio_url: request.audioUrl,
      };
    } else if (request.script) {
      scriptConfig = {
        type: 'text',
        input: request.script,
        provider: {
          type: request.provider || 'microsoft',
          voice_id: request.voiceId || 'en-US-JennyNeural',
        },
      };
    } else {
      return { success: false, error: 'Script text or audio URL is required' };
    }

    const payload = {
      source_url: request.imageUrl,
      script: scriptConfig,
      config: {
        stitch: true,
        fluent: true,
      },
    };

    if (request.imageBase64) {
      (payload as any).source = source;
      delete (payload as any).source_url;
    }

    const response = await fetch(`${DID_API_BASE}/talks`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('D-ID API Error:', errorText);
      return { 
        success: false, 
        error: `D-ID API error: ${response.status} - ${errorText}` 
      };
    }

    const result = await response.json() as { id: string; status: string };
    
    return {
      success: true,
      id: result.id,
      status: result.status as any,
    };
  } catch (error) {
    console.error('Avatar generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Check the status of an avatar generation job
 */
export async function getAvatarStatus(id: string): Promise<AvatarStatusResult> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return { success: false, error: 'D-ID API key not configured' };
  }

  try {
    const response = await fetch(`${DID_API_BASE}/talks/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { 
        success: false, 
        error: `Failed to get status: ${response.status} - ${errorText}` 
      };
    }

    const result = await response.json() as {
      id: string;
      status: string;
      result_url?: string;
      duration?: number;
      error?: { description: string };
    };

    if (result.status === 'error') {
      return {
        success: false,
        id: result.id,
        status: 'error',
        error: result.error?.description || 'Generation failed',
      };
    }

    return {
      success: true,
      id: result.id,
      status: result.status as any,
      resultUrl: result.result_url,
      duration: result.duration,
    };
  } catch (error) {
    console.error('Status check error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Generate an avatar image from a text description using D-ID's AI
 */
export async function generateAvatarFromDescription(
  description: string
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return { success: false, error: 'D-ID API key not configured' };
  }

  try {
    const response = await fetch(`${DID_API_BASE}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: description,
        num_images: 1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { 
        success: false, 
        error: `Image generation failed: ${response.status} - ${errorText}` 
      };
    }

    const result = await response.json() as { images: Array<{ url: string }> };
    
    return {
      success: true,
      imageUrl: result.images?.[0]?.url,
    };
  } catch (error) {
    console.error('Avatar image generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Upload an image to D-ID for later use
 */
export async function uploadImage(
  imageBase64: string,
  filename: string = 'avatar.jpg'
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return { success: false, error: 'D-ID API key not configured' };
  }

  try {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    const formData = new FormData();
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    formData.append('image', blob, filename);

    const response = await fetch(`${DID_API_BASE}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { 
        success: false, 
        error: `Upload failed: ${response.status} - ${errorText}` 
      };
    }

    const result = await response.json() as { url: string };
    
    return {
      success: true,
      imageUrl: result.url,
    };
  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get available avatar presets
 */
export function getAvatarPresets(): AvatarPreset[] {
  return avatarPresets;
}

/**
 * Get available voice options
 */
export function getVoiceOptions() {
  return voiceOptions;
}

/**
 * Delete a generated talk video
 */
export async function deleteTalk(id: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return { success: false, error: 'D-ID API key not configured' };
  }

  try {
    const response = await fetch(`${DID_API_BASE}/talks/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { 
        success: false, 
        error: `Delete failed: ${response.status} - ${errorText}` 
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete talk error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get user's credit balance from D-ID
 */
export async function getCreditsBalance(): Promise<{ 
  success: boolean; 
  credits?: number; 
  error?: string 
}> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return { success: false, error: 'D-ID API key not configured' };
  }

  try {
    const response = await fetch(`${DID_API_BASE}/credits`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { 
        success: false, 
        error: `Failed to get credits: ${response.status} - ${errorText}` 
      };
    }

    const result = await response.json() as { remaining: number };
    
    return {
      success: true,
      credits: result.remaining,
    };
  } catch (error) {
    console.error('Credits check error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
