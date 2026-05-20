/** Riproduce un suono di fine timer usando Web Audio API. */
export const playTimerEndSound = () => {
  try {
    const context = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, context.currentTime); // A5
    gain.gain.setValueAtTime(0.1, context.currentTime);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.5);
  } catch (e) {
    console.error('Audio error', e);
  }
};
