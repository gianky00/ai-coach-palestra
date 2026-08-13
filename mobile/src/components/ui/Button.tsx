import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors, hitSlop, radius, space } from '../../theme';

type Variant = 'primary' | 'danger' | 'ghost' | 'icon' | 'outline';

type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  title?: string;
  children?: React.ReactNode;
  variant?: Variant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
};

const spinnerColor: Record<Variant, string> = {
  primary: colors.accentOn,
  danger: colors.text,
  ghost: colors.accent,
  icon: colors.accent,
  outline: colors.accent,
};

/**
 * Shared pressable control with consistent pressed/disabled states.
 */
export function Button({
  title,
  children,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  textStyle,
  testID,
  accessibilityRole = 'button',
  accessibilityLabel,
  hitSlop: hitSlopProp,
  ...rest
}: ButtonProps) {
  const isDisabled = !!(disabled || loading);
  const label = accessibilityLabel ?? title;

  return (
    <Pressable
      testID={testID}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: !!loading }}
      hitSlop={hitSlopProp ?? (variant === 'icon' || variant === 'ghost' ? hitSlop : undefined)}
      disabled={isDisabled}
      android_ripple={
        variant === 'icon' || variant === 'ghost'
          ? { color: colors.accentMuted, borderless: true, radius: 22 }
          : { color: colors.accentMuted }
      }
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor[variant]} />
      ) : (
        (children ?? <Text style={[styles.text, textStyles[variant], textStyle]}>{title}</Text>)
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: space.sm,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.45 },
  text: { fontWeight: '900', fontSize: 15 },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.accent,
    paddingVertical: space.lg,
    paddingHorizontal: space.xxl,
    borderRadius: radius.md,
  },
  danger: {
    backgroundColor: colors.danger,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
  },
  ghost: {
    backgroundColor: 'transparent',
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  outline: {
    backgroundColor: colors.surfaceMuted,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

const textStyles = StyleSheet.create({
  primary: { color: colors.accentOn },
  danger: { color: colors.text },
  ghost: { color: colors.accent, fontWeight: '700', fontSize: 14 },
  outline: { color: colors.text, fontWeight: '700' },
  icon: { color: colors.accent },
});
