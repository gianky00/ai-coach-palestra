/**
 * Platform facade: status bar.
 * Backend: React Native StatusBar (expo-status-bar compatible props).
 */
import React from 'react';
import {
  type ColorValue,
  StatusBar as RNStatusBar,
  type StatusBarStyle as RNStatusBarStyle,
} from 'react-native';

export type StatusBarStyle = 'auto' | 'inverted' | 'light' | 'dark';

export type StatusBarProps = {
  style?: StatusBarStyle;
  animated?: boolean;
  hidden?: boolean;
  backgroundColor?: ColorValue;
  translucent?: boolean;
};

function toBarStyle(style: StatusBarStyle | undefined): RNStatusBarStyle {
  switch (style) {
    case 'light':
      return 'light-content';
    case 'dark':
      return 'dark-content';
    default:
      return 'default';
  }
}

export function StatusBar({
  style = 'auto',
  animated,
  hidden,
  backgroundColor,
  translucent,
}: StatusBarProps) {
  return (
    <RNStatusBar
      barStyle={toBarStyle(style)}
      animated={animated}
      hidden={hidden}
      backgroundColor={backgroundColor}
      translucent={translucent}
    />
  );
}
