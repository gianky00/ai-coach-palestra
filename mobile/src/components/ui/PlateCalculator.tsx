import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getPlatesPerSide } from '../../lib/utils';
import { colors, radius, space, typography } from '../../theme';

export const PlateCalculator = ({
  targetWeight,
  barWeight = 20,
}: {
  targetWeight: number;
  barWeight?: number;
}) => {
  const plates = getPlatesPerSide(targetWeight, barWeight);
  const a11yLabel =
    plates.length === 0
      ? `Caricamento: solo bilanciere da ${barWeight} chilogrammi`
      : `Caricamento per lato, bilanciere ${barWeight} chilogrammi: ${plates
          .map((p) => `${p} chilogrammi`)
          .join(', ')}`;

  return (
    <View
      style={styles.container}
      testID="plate-calculator"
      accessible
      accessibilityRole="summary"
      accessibilityLabel={a11yLabel}
    >
      <Text style={styles.title} importantForAccessibility="no">
        Caricamento per lato (Bilanciere {barWeight}kg):
      </Text>
      <View style={styles.platesRow} importantForAccessibility="no">
        {plates.length === 0 ? (
          <Text style={styles.empty}>Solo bilanciere vuoto</Text>
        ) : (
          plates.map((p, i) => (
            <View key={`${p}-${i}`} style={[styles.plate, { width: 30 + p * 1.5 }]}>
              <Text style={styles.plateText}>{p}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceMuted,
    padding: space.lg,
    borderRadius: radius.lg,
    marginTop: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    marginBottom: space.sm,
  },
  platesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, alignItems: 'center' },
  plate: {
    backgroundColor: colors.accent,
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plateText: { color: colors.accentOn, fontSize: 10, fontWeight: '900' },
  empty: { color: colors.textDim, fontStyle: 'italic', fontSize: 14 },
});
