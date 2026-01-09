// Audio context for generating sounds
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
};

// Calming click sound - soft, gentle pop
const playClickSound = () => {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.frequency.setValueAtTime(800, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.1);
};

// Correct answer sound - pleasant ascending chime
const playCorrectSound = () => {
  const ctx = getAudioContext();
  
  const playNote = (freq: number, startTime: number, duration: number) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(freq, startTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.15, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  };
  
  // Pleasant ascending arpeggio
  playNote(523.25, ctx.currentTime, 0.15); // C5
  playNote(659.25, ctx.currentTime + 0.1, 0.15); // E5
  playNote(783.99, ctx.currentTime + 0.2, 0.2); // G5
};

// Wrong answer sound - gentle low tone
const playWrongSound = () => {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.frequency.setValueAtTime(200, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3);
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.3);
};

// Complete/success sound - celebratory chime
const playCompleteSound = () => {
  const ctx = getAudioContext();
  
  const playNote = (freq: number, startTime: number, duration: number) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(freq, startTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.12, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  };
  
  // Celebratory melody
  playNote(523.25, ctx.currentTime, 0.15); // C5
  playNote(659.25, ctx.currentTime + 0.12, 0.15); // E5
  playNote(783.99, ctx.currentTime + 0.24, 0.15); // G5
  playNote(1046.50, ctx.currentTime + 0.36, 0.3); // C6
};

type SoundType = 'click' | 'correct' | 'wrong' | 'complete';

export const playSound = (type: SoundType) => {
  try {
    switch (type) {
      case 'click':
        playClickSound();
        break;
      case 'correct':
        playCorrectSound();
        break;
      case 'wrong':
        playWrongSound();
        break;
      case 'complete':
        playCompleteSound();
        break;
    }
  } catch (e) {
    // Silently fail if audio isn't available
    console.log('Audio not available');
  }
};
