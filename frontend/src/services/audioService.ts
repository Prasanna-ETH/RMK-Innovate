class AudioAlertService {
  private isEnabled: boolean = true;
  private volume: number = 0.9;
  private rate: number = 1.05; // Slightly brisk for real-time safety alerts
  private lastSpokenText: string = '';
  private lastSpokenTime: number = 0;
  private minRepeatIntervalMs: number = 3000;
  private synth: SpeechSynthesis | null = null;
  private audioCtx: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled && this.synth) {
      this.synth.cancel();
    }
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0.0, Math.min(1.0, vol));
  }

  public getVolume(): number {
    return this.volume;
  }

  public setRate(rate: number): void {
    this.rate = Math.max(0.7, Math.min(1.8, rate));
  }

  public getRate(): number {
    return this.rate;
  }

  public speak(text: string, force: boolean = false): void {
    if (!this.isEnabled || !text) return;

    const now = Date.now();
    // Debounce identical speech utterances within repeat interval unless forced
    if (!force && text === this.lastSpokenText && now - this.lastSpokenTime < this.minRepeatIntervalMs) {
      return;
    }

    this.lastSpokenText = text;
    this.lastSpokenTime = now;

    if (this.synth) {
      // Cancel previous pending speech to avoid sluggish queueing
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = this.volume;
      utterance.rate = this.rate;
      utterance.pitch = 1.0;

      // Select natural English voice if available
      const voices = this.synth.getVoices();
      const preferredVoice = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      this.synth.speak(utterance);
    }
  }

  public playWarningBeep(frequency: number = 880, durationMs: number = 180): void {
    if (!this.isEnabled) return;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(this.volume * 0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + durationMs / 1000);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + durationMs / 1000);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  public testSpeech(): void {
    this.speak('BlindSpot spatial audio guidance active. All systems nominal.', true);
  }
}

export const audioAlertService = new AudioAlertService();
