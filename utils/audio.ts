// Simple Web Audio API wrapper for procedural sounds
// No external assets required

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    masterGain.gain.value = 0.3; // Default volume
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const setMute = (muted: boolean) => {
  if (masterGain) {
    masterGain.gain.setValueAtTime(muted ? 0 : 0.3, audioCtx!.currentTime);
  }
};

const createOscillator = (type: OscillatorType, freq: number, duration: number, vol: number = 0.1) => {
  if (!audioCtx || !masterGain) return;
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(masterGain);
  
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
};

export const playSound = (effect: 'POP' | 'SHIMMER' | 'GROW' | 'SPLASH' | 'PORTAL' | 'EXPLOSION') => {
  if (!audioCtx) return;

  const now = audioCtx.currentTime;

  switch (effect) {
    case 'POP':
      // High pitched sine ping
      createOscillator('sine', 800 + Math.random() * 400, 0.3, 0.1);
      break;
    case 'SHIMMER':
      // Cluster of high sines
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          createOscillator('triangle', 1200 + Math.random() * 800, 0.5, 0.05);
        }, i * 50);
      }
      break;
    case 'GROW':
      // Rising pitch
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.4);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
      osc.connect(gain);
      gain.connect(masterGain!);
      osc.start();
      osc.stop(now + 0.4);
      break;
    case 'SPLASH':
      // White noise burst (approximated with many random oscillators for simplicity without buffer loading)
      for(let i=0; i<10; i++) {
         createOscillator('sawtooth', 100 + Math.random() * 100, 0.4, 0.02);
      }
      break;
    case 'PORTAL':
      // Low pulsing hum
      const lfo = audioCtx.createOscillator();
      lfo.frequency.value = 5;
      const pOsc = audioCtx.createOscillator();
      pOsc.frequency.value = 100;
      const pGain = audioCtx.createGain();
      lfo.connect(pGain.gain);
      pOsc.connect(pGain);
      pGain.connect(masterGain!);
      pOsc.start();
      lfo.start();
      pOsc.stop(now + 2.0);
      lfo.stop(now + 2.0);
      break;
    case 'EXPLOSION':
        createOscillator('square', 50, 1.5, 0.3);
        createOscillator('sawtooth', 80, 1.0, 0.2);
        break;
  }
};
