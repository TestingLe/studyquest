// Ambient sound generator using Web Audio API
let audioContext: AudioContext | null = null;
let currentSound: { stop: () => void } | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContext();
  }
  return audioContext;
};

// Generate brown noise (softer than white noise, good for focus)
const createBrownNoise = (ctx: AudioContext, gain: GainNode) => {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    output[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = output[i];
    output[i] *= 3.5;
  }
  
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(gain);
  return source;
};

// Generate rain-like sound
const createRainSound = (ctx: AudioContext, gain: GainNode) => {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    // Mix of noise with occasional "drops"
    const noise = Math.random() * 2 - 1;
    const drop = Math.random() > 0.999 ? (Math.random() - 0.5) * 0.5 : 0;
    output[i] = noise * 0.1 + drop;
  }
  
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  
  // Add low-pass filter for softer sound
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1000;
  
  source.connect(filter);
  filter.connect(gain);
  return source;
};

// Generate cafe ambiance (soft chatter-like noise)
const createCafeSound = (ctx: AudioContext, gain: GainNode) => {
  const bufferSize = 4 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    const noise = Math.random() * 2 - 1;
    // Modulate volume to simulate conversation patterns
    const mod = Math.sin(i / ctx.sampleRate * 0.5) * 0.3 + 0.7;
    output[i] = noise * 0.05 * mod;
  }
  
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 800;
  filter.Q.value = 0.5;
  
  source.connect(filter);
  filter.connect(gain);
  return source;
};

// Generate space ambient (deep drone)
const createSpaceSound = (ctx: AudioContext, gain: GainNode) => {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const osc3 = ctx.createOscillator();
  
  osc1.type = 'sine';
  osc1.frequency.value = 60;
  
  osc2.type = 'sine';
  osc2.frequency.value = 90;
  
  osc3.type = 'sine';
  osc3.frequency.value = 120;
  
  const subGain = ctx.createGain();
  subGain.gain.value = 0.1;
  
  osc1.connect(subGain);
  osc2.connect(subGain);
  osc3.connect(subGain);
  subGain.connect(gain);
  
  return { 
    start: () => { osc1.start(); osc2.start(); osc3.start(); },
    stop: () => { osc1.stop(); osc2.stop(); osc3.stop(); }
  };
};

export type AmbientType = 'rain' | 'cafe' | 'forest' | 'space' | 'lofi' | 'silence';

export const playAmbientSound = (type: AmbientType, volume: number = 0.3) => {
  stopAmbientSound();
  
  if (type === 'silence') return;
  
  const ctx = getAudioContext();
  const masterGain = ctx.createGain();
  masterGain.gain.value = volume;
  masterGain.connect(ctx.destination);
  
  let source: AudioBufferSourceNode | { start: () => void; stop: () => void };
  
  switch (type) {
    case 'rain':
    case 'forest':
      source = createRainSound(ctx, masterGain);
      (source as AudioBufferSourceNode).start();
      break;
    case 'cafe':
    case 'lofi':
      source = createCafeSound(ctx, masterGain);
      (source as AudioBufferSourceNode).start();
      break;
    case 'space':
      source = createSpaceSound(ctx, masterGain);
      source.start();
      break;
    default:
      source = createBrownNoise(ctx, masterGain);
      (source as AudioBufferSourceNode).start();
  }
  
  currentSound = {
    stop: () => {
      try {
        if ('stop' in source) {
          source.stop();
        }
        masterGain.disconnect();
      } catch (e) {
        // Already stopped
      }
    }
  };
};

export const stopAmbientSound = () => {
  if (currentSound) {
    currentSound.stop();
    currentSound = null;
  }
};

export const setAmbientVolume = (_volume: number) => {
  // Would need to store gain node reference for this
  // For now, restart with new volume
};
