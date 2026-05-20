class SoundService {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      // Inizializzazione lazy dell'AudioContext per bypassare il blocco dell'autoplay del browser
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /** Riproduce un click elettronico corto ed elegante */
  public playClick() {
    try {
      const ctx = this.init();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'sine';
      // Pitch sweep veloce da 800Hz a 150Hz
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);

      // Regolazione del volume per evitare distorsioni
      gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.warn('Audio non supportato o non inizializzato', e);
    }
  }

  /** Riproduce un arpeggio di accordi cibernetici ascendenti (sci-fi chime) */
  public playSuccess() {
    try {
      const ctx = this.init();
      const now = ctx.currentTime;
      
      // Frequenze per l'arpeggio ascendente (Do Maggiore 7: C4, E4, G4, B4, C5)
      const notes = [261.63, 329.63, 392.00, 493.88, 523.25];
      
      notes.forEach((freq, idx) => {
        const timeOffset = idx * 0.08;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.type = 'triangle'; // Suono più caldo del saw, meno piatto del sine
        osc.frequency.setValueAtTime(freq, now + timeOffset);
        
        // Filtro passa-basso per un suono morbido e premium
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, now + timeOffset);
        
        // Regolazione del volume con inviluppo ADSR minimale
        gainNode.gain.setValueAtTime(0.0, now + timeOffset);
        gainNode.gain.linearRampToValueAtTime(0.08, now + timeOffset + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.35);

        osc.start(now + timeOffset);
        osc.stop(now + timeOffset + 0.4);
      });
    } catch (e) {
      console.warn('Audio non supportato', e);
    }
  }

  /** Riproduce un segnale acustico di fine timer (recupero completato) */
  public playTimerComplete() {
    try {
      const ctx = this.init();
      const now = ctx.currentTime;

      // Riproduce due beep elettronici successivi
      [0, 0.25].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now + offset); // Nota D5
        
        gainNode.gain.setValueAtTime(0.0, now + offset);
        gainNode.gain.linearRampToValueAtTime(0.08, now + offset + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.2);

        osc.start(now + offset);
        osc.stop(now + offset + 0.22);
      });
    } catch (e) {
      console.warn('Audio non supportato', e);
    }
  }
}

export const soundService = new SoundService();
