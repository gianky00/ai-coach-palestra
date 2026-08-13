import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  isSyncFailureFeedback,
  SYNC_DISMISS_HINT,
  SYNC_DISMISS_LABEL,
  SYNC_RETRY_HINT,
  type SyncFeedback,
  SYNCING_BANNER_TEXT,
} from '../../lib/syncFeedback';
import { Ionicons } from '../../platform/icons';
import { colors, hitSlop, radius, space } from '../../theme';

type Props = {
  feedback: SyncFeedback | null | undefined;
  testID: string;
  syncing?: boolean;
  onPress?: () => void;
  onDismiss?: () => void;
};

/** Persistent banner when offline sync fails partially or entirely. */
export function SyncFailBanner({ feedback, testID, syncing, onPress, onDismiss }: Props) {
  if (!isSyncFailureFeedback(feedback) || !feedback) return null;

  return (
    <Pressable
      testID={testID}
      style={({ pressed }) => [styles.banner, pressed && onPress && styles.pressed]}
      onPress={onPress}
      disabled={!onPress || syncing}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={syncing ? SYNCING_BANNER_TEXT : feedback.bannerText}
      accessibilityHint={onPress ? SYNC_RETRY_HINT : undefined}
      accessibilityState={{ disabled: !onPress || !!syncing, busy: !!syncing }}
    >
      {syncing ? (
        <ActivityIndicator size="small" color={colors.danger} />
      ) : (
        <Ionicons name="cloud-offline-outline" size={16} color={colors.danger} />
      )}
      <Text style={styles.text} numberOfLines={2} importantForAccessibility="no">
        {syncing ? SYNCING_BANNER_TEXT : feedback.bannerText}
      </Text>
      {onDismiss ? (
        <Pressable
          testID={`${testID}-dismiss`}
          onPress={onDismiss}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityLabel={SYNC_DISMISS_LABEL}
          accessibilityHint={SYNC_DISMISS_HINT}
        >
          <Ionicons name="close" size={18} color={colors.danger} />
        </Pressable>
      ) : (
        <View style={styles.spacer} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerMuted,
    marginHorizontal: space.xl,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    gap: space.sm,
    marginBottom: space.md,
    borderWidth: 1,
    borderColor: '#ff444455',
  },
  text: { color: colors.danger, fontWeight: '700', fontSize: 12, flex: 1 },
  pressed: { opacity: 0.85 },
  spacer: { width: 18 },
});
