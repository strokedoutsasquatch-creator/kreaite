/**
 * Production-Grade Audio Processing Service
 * Professional DAW-level audio manipulation
 * 
 * Features:
 * - Parametric EQ (8-band)
 * - Compressor/Limiter
 * - Reverb, Delay, Chorus, Flanger
 * - Distortion & Saturation
 * - Auto-tune / Pitch Correction
 * - Turntable scratching
 * - Sidechain compression (Bassnectar-style)
 * - Stereo widening
 * - Mastering suite
 */

// EQ Presets for different styles
export const eqPresets = {
  bassnectar: {
    name: "Bassnectar Bass Drop",
    bands: [
      { frequency: 30, gain: 12, Q: 0.7 },    // Sub bass boost
      { frequency: 60, gain: 10, Q: 0.8 },    // Deep bass
      { frequency: 120, gain: 6, Q: 1.0 },    // Bass body
      { frequency: 250, gain: -3, Q: 1.2 },   // Mud cut
      { frequency: 500, gain: -2, Q: 1.0 },   // Low mid cut
      { frequency: 2000, gain: 3, Q: 1.5 },   // Presence
      { frequency: 8000, gain: 4, Q: 1.0 },   // Air
      { frequency: 16000, gain: 2, Q: 0.7 }   // Sparkle
    ]
  },
  vocal: {
    name: "Vocal Clarity",
    bands: [
      { frequency: 80, gain: -6, Q: 0.7 },    // Rumble cut
      { frequency: 150, gain: -2, Q: 1.0 },   // Chest reduction
      { frequency: 250, gain: 0, Q: 1.0 },
      { frequency: 500, gain: 2, Q: 1.2 },    // Body
      { frequency: 2500, gain: 4, Q: 1.5 },   // Presence
      { frequency: 5000, gain: 3, Q: 1.2 },   // Clarity
      { frequency: 8000, gain: 2, Q: 1.0 },   // Air
      { frequency: 12000, gain: 1, Q: 0.8 }   // Brilliance
    ]
  },
  trap: {
    name: "Trap 808",
    bands: [
      { frequency: 40, gain: 14, Q: 0.5 },    // 808 fundamental
      { frequency: 80, gain: 8, Q: 0.7 },     // 808 body
      { frequency: 200, gain: -4, Q: 1.0 },   // Clean up
      { frequency: 400, gain: -2, Q: 1.2 },
      { frequency: 1000, gain: 0, Q: 1.0 },
      { frequency: 3000, gain: 2, Q: 1.5 },   // Hi-hat presence
      { frequency: 8000, gain: 4, Q: 0.8 },   // Hi-hat sparkle
      { frequency: 14000, gain: 3, Q: 0.7 }
    ]
  },
  metal: {
    name: "Metal Crunch",
    bands: [
      { frequency: 60, gain: 4, Q: 0.8 },     // Low end punch
      { frequency: 150, gain: -4, Q: 1.0 },   // Mud cut
      { frequency: 400, gain: 2, Q: 1.2 },    // Guitar body
      { frequency: 800, gain: 3, Q: 1.5 },    // Attack
      { frequency: 2000, gain: 5, Q: 1.8 },   // Crunch
      { frequency: 4000, gain: 4, Q: 1.2 },   // Edge
      { frequency: 8000, gain: 2, Q: 1.0 },
      { frequency: 12000, gain: 1, Q: 0.8 }
    ]
  },
  warmth: {
    name: "Analog Warmth",
    bands: [
      { frequency: 60, gain: 2, Q: 0.7 },
      { frequency: 150, gain: 3, Q: 0.8 },
      { frequency: 300, gain: 2, Q: 1.0 },
      { frequency: 600, gain: 1, Q: 1.2 },
      { frequency: 1200, gain: 0, Q: 1.0 },
      { frequency: 3000, gain: -1, Q: 1.5 },  // Slight harshness cut
      { frequency: 8000, gain: -2, Q: 0.8 },
      { frequency: 14000, gain: -3, Q: 0.7 }  // Roll off highs
    ]
  }
};

// Compressor presets
export const compressorPresets = {
  punch: {
    name: "Punchy Drums",
    threshold: -18,
    ratio: 4,
    attack: 10,
    release: 100,
    knee: 6,
    makeupGain: 4
  },
  glue: {
    name: "Mix Glue",
    threshold: -12,
    ratio: 2,
    attack: 30,
    release: 200,
    knee: 10,
    makeupGain: 2
  },
  vocal: {
    name: "Vocal Control",
    threshold: -20,
    ratio: 3,
    attack: 5,
    release: 150,
    knee: 4,
    makeupGain: 6
  },
  limiter: {
    name: "Brick Wall Limiter",
    threshold: -1,
    ratio: 20,
    attack: 0.1,
    release: 50,
    knee: 0,
    makeupGain: 0
  },
  sidechain: {
    name: "Sidechain Pump",
    threshold: -30,
    ratio: 8,
    attack: 0.5,
    release: 200,
    knee: 2,
    makeupGain: 0
  }
};

// Reverb presets
export const reverbPresets = {
  hall: {
    name: "Concert Hall",
    roomSize: 0.9,
    dampening: 0.3,
    wetLevel: 0.4,
    dryLevel: 0.6,
    decay: 4.0,
    preDelay: 50
  },
  plate: {
    name: "Plate Reverb",
    roomSize: 0.6,
    dampening: 0.5,
    wetLevel: 0.35,
    dryLevel: 0.65,
    decay: 2.5,
    preDelay: 20
  },
  room: {
    name: "Small Room",
    roomSize: 0.3,
    dampening: 0.6,
    wetLevel: 0.25,
    dryLevel: 0.75,
    decay: 1.0,
    preDelay: 10
  },
  cathedral: {
    name: "Cathedral",
    roomSize: 1.0,
    dampening: 0.2,
    wetLevel: 0.5,
    dryLevel: 0.5,
    decay: 8.0,
    preDelay: 80
  },
  ambient: {
    name: "Ambient Wash",
    roomSize: 0.95,
    dampening: 0.4,
    wetLevel: 0.7,
    dryLevel: 0.3,
    decay: 10.0,
    preDelay: 100
  }
};

// Delay presets
export const delayPresets = {
  slapback: {
    name: "Slapback",
    time: 80,
    feedback: 0.1,
    wetLevel: 0.3,
    pingPong: false
  },
  quarter: {
    name: "Quarter Note",
    time: 500,
    feedback: 0.4,
    wetLevel: 0.3,
    pingPong: false
  },
  pingPong: {
    name: "Ping Pong",
    time: 375,
    feedback: 0.5,
    wetLevel: 0.35,
    pingPong: true
  },
  dubDelay: {
    name: "Dub Delay",
    time: 750,
    feedback: 0.6,
    wetLevel: 0.4,
    pingPong: true
  }
};

// Auto-tune settings
export const autoTunePresets = {
  natural: {
    name: "Natural Correction",
    speed: 50,
    scale: 'chromatic',
    key: 'C',
    strength: 0.5
  },
  tpain: {
    name: "T-Pain Effect",
    speed: 0,
    scale: 'chromatic',
    key: 'C',
    strength: 1.0
  },
  subtle: {
    name: "Subtle Polish",
    speed: 100,
    scale: 'major',
    key: 'C',
    strength: 0.3
  },
  robotic: {
    name: "Robotic",
    speed: 0,
    scale: 'chromatic',
    key: 'C',
    strength: 1.0,
    formantShift: -2
  }
};

// Turntable/DJ effects
export const djEffects = {
  scratch: {
    name: "Vinyl Scratch",
    scratchSpeed: 1.0,
    scratchDepth: 0.8
  },
  spinDown: {
    name: "Power Down",
    duration: 2000,
    curve: 'exponential'
  },
  spinUp: {
    name: "Power Up",
    duration: 1500,
    curve: 'exponential'
  },
  beatRepeat: {
    name: "Beat Repeat",
    division: '1/8',
    repeats: 4
  },
  stutter: {
    name: "Stutter",
    division: '1/16',
    gate: 0.5
  },
  filter: {
    name: "Filter Sweep",
    type: 'lowpass',
    startFreq: 20000,
    endFreq: 200,
    duration: 4000
  }
};

// Mastering chain presets
export const masteringPresets = {
  loud: {
    name: "Loud & Clear",
    eq: eqPresets.warmth,
    compressor: compressorPresets.glue,
    limiter: { ...compressorPresets.limiter, threshold: -0.3 },
    stereoWidth: 1.2,
    targetLUFS: -8
  },
  streaming: {
    name: "Streaming Optimized",
    eq: eqPresets.vocal,
    compressor: compressorPresets.glue,
    limiter: compressorPresets.limiter,
    stereoWidth: 1.1,
    targetLUFS: -14
  },
  vinyl: {
    name: "Vinyl Warmth",
    eq: eqPresets.warmth,
    compressor: { ...compressorPresets.glue, ratio: 1.5 },
    limiter: { ...compressorPresets.limiter, threshold: -2 },
    stereoWidth: 0.9,
    targetLUFS: -12,
    vinylNoise: 0.02
  }
};

/**
 * Generate Web Audio API processing graph config
 * This is used client-side to build the audio processing chain
 */
export function generateProcessingConfig(preset: string) {
  const config: any = {
    eq: eqPresets[preset as keyof typeof eqPresets] || eqPresets.vocal,
    compressor: compressorPresets.glue,
    reverb: reverbPresets.room,
    delay: delayPresets.quarter
  };
  
  return config;
}

/**
 * Get all available presets
 */
export function getAllPresets() {
  return {
    eq: Object.entries(eqPresets).map(([id, preset]) => ({ id, ...preset })),
    compressor: Object.entries(compressorPresets).map(([id, preset]) => ({ id, ...preset })),
    reverb: Object.entries(reverbPresets).map(([id, preset]) => ({ id, ...preset })),
    delay: Object.entries(delayPresets).map(([id, preset]) => ({ id, ...preset })),
    autoTune: Object.entries(autoTunePresets).map(([id, preset]) => ({ id, ...preset })),
    dj: Object.entries(djEffects).map(([id, preset]) => ({ id, ...preset })),
    mastering: Object.entries(masteringPresets).map(([id, preset]) => ({ id, ...preset }))
  };
}

/**
 * Calculate BPM sync delay time
 */
export function calculateSyncedDelay(bpm: number, division: '1/4' | '1/8' | '1/16' | '1/32'): number {
  const beatMs = 60000 / bpm;
  const divisionMap = {
    '1/4': 1,
    '1/8': 0.5,
    '1/16': 0.25,
    '1/32': 0.125
  };
  return beatMs * divisionMap[division];
}

/**
 * Get musical scales for auto-tune
 */
export function getMusicalScales() {
  return {
    chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    pentatonicMajor: [0, 2, 4, 7, 9],
    pentatonicMinor: [0, 3, 5, 7, 10],
    blues: [0, 3, 5, 6, 7, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10]
  };
}

/**
 * Get all musical keys
 */
export function getMusicalKeys() {
  return ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
}
