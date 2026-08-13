import { beforeEach, describe, expect, it, vi } from 'vitest';

const haptic = vi.hoisted(() => ({
  trigger: vi.fn(),
}));

vi.mock('react-native-haptic-feedback', () => ({
  default: haptic,
}));

import {
  impactAsync,
  ImpactFeedbackStyle,
  notificationAsync,
  NotificationFeedbackType,
} from '../../src/platform/haptics';

describe('platform/haptics', () => {
  beforeEach(() => vi.clearAllMocks());

  it('impactAsync mappa light/medium/heavy', async () => {
    await impactAsync(ImpactFeedbackStyle.Light);
    expect(haptic.trigger).toHaveBeenCalledWith('impactLight', expect.any(Object));

    await impactAsync(ImpactFeedbackStyle.Heavy);
    expect(haptic.trigger).toHaveBeenCalledWith('impactHeavy', expect.any(Object));

    await impactAsync('medium');
    expect(haptic.trigger).toHaveBeenCalledWith('impactMedium', expect.any(Object));
  });

  it('notificationAsync mappa success/error/warning', async () => {
    await notificationAsync(NotificationFeedbackType.Success);
    expect(haptic.trigger).toHaveBeenCalledWith('notificationSuccess', expect.any(Object));

    await notificationAsync(NotificationFeedbackType.Error);
    expect(haptic.trigger).toHaveBeenCalledWith('notificationError', expect.any(Object));

    await notificationAsync('warning');
    expect(haptic.trigger).toHaveBeenCalledWith('notificationWarning', expect.any(Object));
  });
});
