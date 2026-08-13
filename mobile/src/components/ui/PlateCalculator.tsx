import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getPlatesPerSide } from '../../lib/utils';

export const PlateCalculator = ({
  targetWeight,
  barWeight = 20,
}: {
  targetWeight: number;
  barWeight?: number;
}) => {
  const plates = getPlatesPerSide(targetWeight, barWeight);

  return (
    <View style={styles.container} testID="plate-calculator">
      <Text style={styles.title}>Caricamento per lato (Bilanciere {barWeight}kg):</Text>
      <View style={styles.platesRow}>
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
    backgroundColor: '#252525',
    padding: 15,
    borderRadius: 15,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  title: { color: '#888', fontSize: 12, fontWeight: '700', marginBottom: 10 },
  platesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, alignItems: 'center' },
  plate: {
    backgroundColor: '#00ff88',
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plateText: { color: '#000', fontSize: 10, fontWeight: '900' },
  empty: { color: '#666', fontStyle: 'italic', fontSize: 14 },
});
