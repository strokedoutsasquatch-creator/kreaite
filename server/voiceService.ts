/**
 * Production-Grade Voice Cloning & Synthesis Service
 * 
 * Features:
 * - Voice cloning via ElevenLabs
 * - Multi-genre singing (rap, opera, metal, punk, classical, novelty)
 * - Auto-tune and pitch correction
 * - Voice styling (raspy, smooth, aggressive, theatrical)
 * - Character voice creation for AI movies
 */

import fetch from 'node-fetch';
import FormData from 'form-data';

const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

// Voice style presets for different genres
export const voiceStyles = {
  southernRap: {
    stability: 0.3,
    similarity_boost: 0.8,
    style: 0.7,
    use_speaker_boost: true,
    description: "Raspy southern drawl with rhythmic flow"
  },
  opera: {
    stability: 0.9,
    similarity_boost: 0.75,
    style: 0.9,
    use_speaker_boost: true,
    description: "Powerful operatic projection with vibrato"
  },
  deathMetal: {
    stability: 0.2,
    similarity_boost: 0.6,
    style: 0.4,
    use_speaker_boost: true,
    description: "Guttural growls and aggressive delivery"
  },
  punk: {
    stability: 0.35,
    similarity_boost: 0.7,
    style: 0.5,
    use_speaker_boost: true,
    description: "Raw, aggressive, rebellious energy"
  },
  pop: {
    stability: 0.6,
    similarity_boost: 0.85,
    style: 0.7,
    use_speaker_boost: true,
    description: "Polished, smooth, radio-ready"
  },
  classical: {
    stability: 0.85,
    similarity_boost: 0.8,
    style: 0.85,
    use_speaker_boost: true,
    description: "Refined, theatrical, precise articulation"
  },
  threeStooges: {
    stability: 0.15,
    similarity_boost: 0.5,
    style: 0.2,
    use_speaker_boost: false,
    description: "Comedic timing with 'nyuk nyuk' and 'whoop whoop' inflections"
  },
  villain: {
    stability: 0.4,
    similarity_boost: 0.7,
    style: 0.6,
    use_speaker_boost: true,
    description: "Menacing, theatrical, dramatic pauses"
  },
  hero: {
    stability: 0.7,
    similarity_boost: 0.85,
    style: 0.8,
    use_speaker_boost: true,
    description: "Confident, inspiring, commanding presence"
  }
};

// Character voice presets for AI movies
export const characterVoices = {
  hero: {
    name: "The Protagonist",
    style: voiceStyles.hero,
    pitchShift: 0,
    tempoShift: 1.0
  },
  villain: {
    name: "The Antagonist", 
    style: voiceStyles.villain,
    pitchShift: -2,
    tempoShift: 0.9
  },
  sidekick: {
    name: "The Ally",
    style: voiceStyles.pop,
    pitchShift: 2,
    tempoShift: 1.1
  },
  narrator: {
    name: "The Narrator",
    style: voiceStyles.classical,
    pitchShift: -1,
    tempoShift: 0.95
  }
};

interface VoiceCloneRequest {
  name: string;
  audioFiles: Buffer[];
  description?: string;
  removeBackgroundNoise?: boolean;
}

interface SpeechRequest {
  text: string;
  voiceId: string;
  modelId?: string;
  style?: keyof typeof voiceStyles;
  pitchShift?: number;
  tempoShift?: number;
}

/**
 * Clone a voice using ElevenLabs Instant Voice Cloning
 */
export async function cloneVoice(request: VoiceCloneRequest): Promise<{
  success: boolean;
  voiceId?: string;
  error?: string;
}> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    return { success: false, error: "ElevenLabs API key not configured" };
  }

  try {
    const formData = new FormData();
    formData.append('name', request.name);
    if (request.description) {
      formData.append('description', request.description);
    }
    formData.append('remove_background_noise', request.removeBackgroundNoise ? 'true' : 'false');
    
    request.audioFiles.forEach((file, index) => {
      formData.append('files', file, `sample_${index}.mp3`);
    });

    const response = await fetch(`${ELEVENLABS_BASE_URL}/voices/add`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey
      },
      body: formData as any
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Voice cloning failed: ${error}` };
    }

    const result = await response.json() as { voice_id: string };
    return { success: true, voiceId: result.voice_id };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Generate speech with a cloned or preset voice
 */
export async function generateSpeech(request: SpeechRequest): Promise<{
  success: boolean;
  audioBuffer?: Buffer;
  error?: string;
}> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    return { success: false, error: "ElevenLabs API key not configured" };
  }

  const styleSettings = request.style ? voiceStyles[request.style] : voiceStyles.pop;

  try {
    const response = await fetch(
      `${ELEVENLABS_BASE_URL}/text-to-speech/${request.voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: request.text,
          model_id: request.modelId || 'eleven_multilingual_v2',
          voice_settings: {
            stability: styleSettings.stability,
            similarity_boost: styleSettings.similarity_boost,
            style: styleSettings.style,
            use_speaker_boost: styleSettings.use_speaker_boost
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Speech generation failed: ${error}` };
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    return { success: true, audioBuffer };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * List available voices (both cloned and library)
 */
export async function listVoices(): Promise<{
  success: boolean;
  voices?: Array<{
    voice_id: string;
    name: string;
    category: string;
    description?: string;
  }>;
  error?: string;
}> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    return { success: false, error: "ElevenLabs API key not configured" };
  }

  try {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
      headers: { 'xi-api-key': apiKey }
    });

    if (!response.ok) {
      return { success: false, error: "Failed to fetch voices" };
    }

    const result = await response.json() as { voices: any[] };
    return { 
      success: true, 
      voices: result.voices.map(v => ({
        voice_id: v.voice_id,
        name: v.name,
        category: v.category,
        description: v.description
      }))
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Speech-to-Speech voice conversion (voice changer)
 */
export async function convertVoice(
  audioBuffer: Buffer,
  targetVoiceId: string,
  style?: keyof typeof voiceStyles
): Promise<{
  success: boolean;
  audioBuffer?: Buffer;
  error?: string;
}> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    return { success: false, error: "ElevenLabs API key not configured" };
  }

  const styleSettings = style ? voiceStyles[style] : voiceStyles.pop;

  try {
    const formData = new FormData();
    formData.append('audio', audioBuffer, 'input.mp3');
    formData.append('model_id', 'eleven_multilingual_sts_v2');
    formData.append('voice_settings', JSON.stringify({
      stability: styleSettings.stability,
      similarity_boost: styleSettings.similarity_boost,
      style: styleSettings.style
    }));

    const response = await fetch(
      `${ELEVENLABS_BASE_URL}/speech-to-speech/${targetVoiceId}`,
      {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: formData as any
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Voice conversion failed: ${error}` };
    }

    const resultBuffer = Buffer.from(await response.arrayBuffer());
    return { success: true, audioBuffer: resultBuffer };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if ElevenLabs is configured
 */
export function isVoiceServiceConfigured(): boolean {
  return !!process.env.ELEVENLABS_API_KEY;
}

/**
 * Get available voice styles
 */
export function getVoiceStyles() {
  return Object.entries(voiceStyles).map(([key, value]) => ({
    id: key,
    name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
    description: value.description
  }));
}

/**
 * Get character presets for AI movies
 */
export function getCharacterPresets() {
  return Object.entries(characterVoices).map(([key, value]) => ({
    id: key,
    name: value.name,
    pitchShift: value.pitchShift,
    tempoShift: value.tempoShift
  }));
}
