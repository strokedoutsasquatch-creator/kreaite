/**
 * AI Video Generation Service
 * Creates movie scenes, music videos, and AI films
 * 
 * Uses: Google Veo, Grok Imagine, xAI
 */

const XAI_BASE_URL = 'https://api.x.ai/v1';

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
