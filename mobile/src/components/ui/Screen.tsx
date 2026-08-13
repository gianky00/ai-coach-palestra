import React from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { type Edge,SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../../theme';

type ScreenProps = {
  children: React.ReactNode;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  /** Default keeps bottom free for the tab bar. */
  edges?: Edge[];
  /** When true, skip SafeArea (e.g. nested inside another screen). */
  bare?: boolean;
};

const DEFAULT_EDGES: Edge[] = ['top', 'left', 'right'];

/**
 * Consistent screen shell: dark surface + safe area for tab screens.
 */
export function Screen({
  children,
  testID,
  style,
  edges = DEFAULT_EDGES,
  bare = false,
}: ScreenProps) {
  if (bare) {
    return (
      <View testID={testID} style={[styles.root, style]}>
        {children}
      </View>
    );
  }

  return (
    <SafeAreaView testID={testID} style={[styles.root, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
