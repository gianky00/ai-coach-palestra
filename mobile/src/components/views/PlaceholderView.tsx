import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const PlaceholderView = ({ title }: { title: string }) => (
  <View style={styles.container}>
    <Text style={styles.text}>{title}</Text>
    <Text style={styles.sub}>In fase di sviluppo...</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  sub: { color: '#aaa', fontSize: 14, marginTop: 10 },
});
