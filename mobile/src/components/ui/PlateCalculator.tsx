import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const PLATES = [20, 15, 10, 5, 2.5, 1.25];

export const PlateCalculator = ({ targetWeight }: { targetWeight: number }) => {
  const calculatePlates = (weight: number) => {
    let remaining = (weight - 20) / 2; // Sottraiamo il bilanciere da 20kg
    if (remaining <= 0) return [];

    const result = [];
    for (const plate of PLATES) {
      const count = Math.floor(remaining / plate);
      if (count > 0) {
        for (let i = 0; i < count; i++) result.push(plate);
        remaining -= count * plate;
      }
    }
    return result;
  };

  const plates = calculatePlates(targetWeight);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Caricamento per lato (Bilanciere 20kg):</Text>
      <View style={styles.platesRow}>
        {plates.length === 0 ? (
          <Text style={styles.empty}>Solo bilanciere vuoto</Text>
        ) : (
          plates.map((p, i) => (
            <View key={i} style={[styles.plate, { width: 30 + p * 1.5 }]}>
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
