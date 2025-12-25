/**
 * Google Cloud Text-to-Speech Service
 * Professional audiobook narration using Google's neural voices
 * 
 * Features:
 * - Multiple voice styles (news, conversation, narrative)
 * - SSML support for natural pauses and emphasis
 * - High-quality audio output (24kHz, MP3/WAV)
 * - Multi-language support
 */

interface VoiceConfig {
  languageCode: string;
  name: string;
  ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL';
}

interface SynthesisRequest {
  text: string;
  voice?: Partial<VoiceConfig>;
  audioConfig?: {
    audioEncoding?: 'MP3' | 'LINEAR16' | 'OGG_OPUS';
    speakingRate?: number;
    pitch?: number;
    volumeGainDb?: number;
  };
  useSSML?: boolean;
}

interface SynthesisResponse {
  success: boolean;
  audioBase64?: string;
  mimeType?: string;
  error?: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }

  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not configured");
  }

  const crypto = await import('crypto');
  const credentials = JSON.parse(serviceAccountKey);

  const header = { alg: 'RS256', typ: 'JWT' };
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
  const jwt = `${signatureInput}.${signature}`;

  const response = await fetch(credentials.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!response.ok) {
    throw new Error(`OAuth error: ${await response.text()}`);
  }

  const tokenData = await response.json() as { access_token: string; expires_in: number };
  cachedToken = {
    token: tokenData.access_token,
    expiresAt: Date.now() + (tokenData.expires_in * 1000)
  };

  return tokenData.access_token;
}

export const narratorVoices: Record<string, VoiceConfig> = {
  male_narrator: {
    languageCode: 'en-US',
    name: 'en-US-Neural2-D',
    ssmlGender: 'MALE'
  },
  female_narrator: {
    languageCode: 'en-US',
    name: 'en-US-Neural2-F',
    ssmlGender: 'FEMALE'
  },
  male_storyteller: {
    languageCode: 'en-US',
    name: 'en-US-Studio-M',
    ssmlGender: 'MALE'
  },
  female_storyteller: {
    languageCode: 'en-US',
    name: 'en-US-Studio-O',
    ssmlGender: 'FEMALE'
  },
  male_news: {
    languageCode: 'en-US',
    name: 'en-US-News-M',
    ssmlGender: 'MALE'
  },
  female_news: {
    languageCode: 'en-US',
    name: 'en-US-News-L',
    ssmlGender: 'FEMALE'
  },
  male_casual: {
    languageCode: 'en-US',
    name: 'en-US-Casual-K',
    ssmlGender: 'MALE'
  },
  male_british: {
    languageCode: 'en-GB',
    name: 'en-GB-Neural2-B',
    ssmlGender: 'MALE'
  },
  female_british: {
    languageCode: 'en-GB',
    name: 'en-GB-Neural2-A',
    ssmlGender: 'FEMALE'
  },
  male_australian: {
    languageCode: 'en-AU',
    name: 'en-AU-Neural2-B',
    ssmlGender: 'MALE'
  },
  female_australian: {
    languageCode: 'en-AU',
    name: 'en-AU-Neural2-A',
    ssmlGender: 'FEMALE'
  }
};

export const audiobookStyles = [
  { id: 'male_narrator', name: 'Professional Male', description: 'Clear, authoritative narration', accent: 'American' },
  { id: 'female_narrator', name: 'Professional Female', description: 'Warm, engaging narration', accent: 'American' },
  { id: 'male_storyteller', name: 'Male Storyteller', description: 'Expressive, dramatic reading', accent: 'American' },
  { id: 'female_storyteller', name: 'Female Storyteller', description: 'Captivating, emotive reading', accent: 'American' },
  { id: 'male_news', name: 'News Anchor Male', description: 'Crisp, professional delivery', accent: 'American' },
  { id: 'female_news', name: 'News Anchor Female', description: 'Polished, broadcast quality', accent: 'American' },
  { id: 'male_british', name: 'British Male', description: 'Sophisticated British accent', accent: 'British' },
  { id: 'female_british', name: 'British Female', description: 'Elegant British accent', accent: 'British' },
  { id: 'male_australian', name: 'Australian Male', description: 'Friendly Australian accent', accent: 'Australian' },
  { id: 'female_australian', name: 'Australian Female', description: 'Warm Australian accent', accent: 'Australian' }
];

function textToSSML(text: string): string {
  let ssml = text
    .replace(/\n\n/g, '<break time="500ms"/>')
    .replace(/\n/g, '<break time="250ms"/>')
    .replace(/\.\s/g, '.<break time="300ms"/> ')
    .replace(/\?\s/g, '?<break time="400ms"/> ')
    .replace(/!\s/g, '!<break time="350ms"/> ')
    .replace(/,\s/g, ',<break time="150ms"/> ')
    .replace(/;\s/g, ';<break time="200ms"/> ')
    .replace(/:\s/g, ':<break time="200ms"/> ');

  ssml = ssml.replace(/\*\*(.+?)\*\*/g, '<emphasis level="strong">$1</emphasis>');
  ssml = ssml.replace(/\*(.+?)\*/g, '<emphasis level="moderate">$1</emphasis>');

  return `<speak>${ssml}</speak>`;
}

export async function synthesizeSpeechTTS(request: SynthesisRequest): Promise<SynthesisResponse> {
  try {
    const accessToken = await getAccessToken();
    
    const voice = request.voice?.name 
      ? request.voice as VoiceConfig
      : narratorVoices.male_narrator;

    const input = request.useSSML 
      ? { ssml: textToSSML(request.text) }
      : { text: request.text };

    const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input,
        voice: {
          languageCode: voice.languageCode,
          name: voice.name,
          ssmlGender: voice.ssmlGender
        },
        audioConfig: {
          audioEncoding: request.audioConfig?.audioEncoding || 'MP3',
          speakingRate: request.audioConfig?.speakingRate || 1.0,
          pitch: request.audioConfig?.pitch || 0,
          volumeGainDb: request.audioConfig?.volumeGainDb || 0,
          sampleRateHertz: 24000
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `TTS API error: ${error}` };
    }

    const result = await response.json() as { audioContent: string };
    
    const mimeTypes: Record<string, string> = {
      'MP3': 'audio/mpeg',
      'LINEAR16': 'audio/wav',
      'OGG_OPUS': 'audio/ogg'
    };

    return {
      success: true,
      audioBase64: result.audioContent,
      mimeType: mimeTypes[request.audioConfig?.audioEncoding || 'MP3']
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function synthesizeChapter(
  chapterText: string,
  voiceId: string = 'male_narrator',
  speakingRate: number = 1.0
): Promise<SynthesisResponse> {
  const voice = narratorVoices[voiceId] || narratorVoices.male_narrator;
  
  return synthesizeSpeechTTS({
    text: chapterText,
    voice,
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate
    },
    useSSML: true
  });
}

export function estimateAudioDuration(text: string, speakingRate: number = 1.0): number {
  const wordsPerMinute = 150 * speakingRate;
  const wordCount = text.split(/\s+/).length;
  return Math.ceil((wordCount / wordsPerMinute) * 60);
}

export function estimateTTSCost(characterCount: number): number {
  return (characterCount / 1000000) * 16;
}

export function isTTSConfigured(): boolean {
  return !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !!process.env.CLOUD_TEXT_TO_SPEECH_API_KEY;
}
