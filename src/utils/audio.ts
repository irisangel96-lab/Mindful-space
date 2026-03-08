let sharedCtx: AudioContext | null = null;

export function getAudioContext() {
  if (!sharedCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    sharedCtx = new AudioContextClass();
  }
  return sharedCtx;
}

export class AmbientAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private lfos: OscillatorNode[] = [];
  private isPlaying = false;

  init() {
    if (!this.ctx) {
      this.ctx = getAudioContext();
    }
  }

  play() {
    if (this.isPlaying) return;
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = true;
    const now = this.ctx.currentTime;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, now);
    // Fade in over 8 seconds
    this.masterGain.gain.linearRampToValueAtTime(0.4, now + 8);
    this.masterGain.connect(this.ctx.destination);

    // Create a warm, low-frequency drone using slightly detuned sine waves
    const baseFreqs = [130.81, 132.5, 196.00, 261.63]; // C3, slightly detuned C3, G3, C4
    
    baseFreqs.forEach((freq, index) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      // Pan each oscillator slightly differently
      const panner = this.ctx!.createStereoPanner();
      panner.pan.value = (index % 2 === 0 ? -1 : 1) * 0.4;

      // Individual gain for each oscillator
      const oscGain = this.ctx!.createGain();
      oscGain.gain.value = 0.2;

      // LFO to modulate the gain (creating a "breathing" or "swelling" effect)
      const lfo = this.ctx!.createOscillator();
      lfo.type = 'sine';
      // Very slow modulation (e.g., 0.05 Hz = 20 seconds per cycle)
      lfo.frequency.value = 0.03 + (Math.random() * 0.02);
      
      const lfoGain = this.ctx!.createGain();
      lfoGain.gain.value = 0.1; // Amount of modulation
      
      lfo.connect(lfoGain);
      lfoGain.connect(oscGain.gain);

      osc.connect(panner);
      panner.connect(oscGain);
      oscGain.connect(this.masterGain!);

      osc.start(now);
      lfo.start(now);

      this.oscillators.push(osc);
      this.lfos.push(lfo);
    });
  }

  stop() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;
    this.isPlaying = false;
    const now = this.ctx.currentTime;
    
    // Fade out over 5 seconds
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + 5);

    setTimeout(() => {
      this.oscillators.forEach(osc => {
        try { osc.stop(); osc.disconnect(); } catch (e) {}
      });
      this.lfos.forEach(lfo => {
        try { lfo.stop(); lfo.disconnect(); } catch (e) {}
      });
      this.oscillators = [];
      this.lfos = [];
      if (this.masterGain) {
        this.masterGain.disconnect();
        this.masterGain = null;
      }
    }, 5500);
  }
}

export const ambientAudio = new AmbientAudio();

export async function playPCM(base64: string): Promise<AudioBufferSourceNode | null> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }
    
    const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);
    
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();
    return source;
  } catch (e) {
    console.error("Error playing PCM:", e);
    return null;
  }
}
