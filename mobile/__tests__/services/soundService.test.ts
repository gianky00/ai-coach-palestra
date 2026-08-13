import { beforeEach, describe, expect, it, vi } from 'vitest';

const haptics = vi.hoisted(() => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));

const audio = vi.hoisted(() => ({
  createAudioPlayer: vi.fn(() => ({ seekTo: vi.fn(), play: vi.fn() })),
  setAudioModeAsync: vi.fn(),
}));

const storeState = vi.hoisted(() => ({
  hapticsEnabled: true,
  timerSoundEnabled: true,
}));

vi.mock('expo-haptics', () => haptics);
vi.mock('expo-audio', () => audio);
vi.mock('../../assets/timer-beep.mp3', () => ({ default: 1 }));
vi.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));
vi.mock('../../src/store/useStore', () => ({
  useStore: { getState: () => storeState },
}));

import { hapticService, soundService } from '../../src/services/soundService';

describe('hapticService / soundService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeState.hapticsEnabled = true;
    storeState.timerSoundEnabled = true;
  });

  it('haptics rispettano flag', () => {
    hapticService.light();
    hapticService.medium();
    hapticService.heavy();
    hapticService.success();
    hapticService.error();
    expect(haptics.impactAsync).toHaveBeenCalled();
    expect(haptics.notificationAsync).toHaveBeenCalled();

    storeState.hapticsEnabled = false;
    vi.clearAllMocks();
    hapticService.light();
    expect(haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('playBeep suona se abilitato', async () => {
    await soundService.playBeep();
    expect(audio.setAudioModeAsync).toHaveBeenCalled();
    expect(audio.createAudioPlayer).toHaveBeenCalled();
  });

  it('playBeep skip sound se disabilitato', async () => {
    storeState.timerSoundEnabled = false;
    await soundService.playBeep();
    expect(audio.createAudioPlayer).not.toHaveBeenCalled();
  });

  it('playClick usa light haptic', async () => {
    await soundService.playClick();
    expect(haptics.impactAsync).toHaveBeenCalled();
  });

  it('playBeep swallows errori player', async () => {
    audio.createAudioPlayer.mockImplementationOnce(() => {
      throw new Error('no asset');
    });
    await expect(soundService.playBeep()).resolves.toBeUndefined();
  });
});
