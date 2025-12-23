/**
 * Lyria Music Generation Service
 * Production-grade AI music generation using Google's Lyria model
 * 
 * Uses Gemini API for authentication (API key based)
 * Generates 30-second high-fidelity instrumental tracks at 48kHz stereo
 * Cost: ~$0.06 per 30-second generation
 */

interface LyriaRequest {
  prompt: string;
  negativePrompt?: string;
  seed?: number;
  sampleCount?: number;
}

interface LyriaGenerationResult {
  success: boolean;
  audioBase64?: string;
  mimeType?: string;
  prompt?: string;
  error?: string;
}

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
 * Requires GOOGLE_CLOUD_PROJECT and proper authentication
 */
export async function generateMusic(request: LyriaRequest): Promise<{
  success: boolean;
  audioBase64?: string;
  mimeType?: string;
  error?: string;
}> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const apiKey = process.env.VERTEX_AI_API_KEY;
  
  if (!projectId) {
    return {
      success: false,
      error: "GOOGLE_CLOUD_PROJECT environment variable not set"
    };
  }
  
  if (!apiKey) {
    return {
      success: false,
      error: "VERTEX_AI_API_KEY environment variable not set"
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
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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
  return !!(process.env.GOOGLE_CLOUD_PROJECT && process.env.VERTEX_AI_API_KEY);
}

/**
 * Get estimated cost for music generation
 * Lyria costs approximately $0.06 per 30-second clip
 */
export function estimateCost(clips: number): number {
  return clips * 0.06;
}
