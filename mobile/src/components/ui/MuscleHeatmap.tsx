import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

interface MuscleHeatmapProps {
  muscleStats: Record<string, number>; // Gruppo -> Volume o Sets
}

export const MuscleHeatmap: React.FC<MuscleHeatmapProps> = ({ muscleStats }) => {
  const getIntensity = (muscle: string) => {
    const val = muscleStats[muscle] || 0;
    if (val === 0) return '#333';
    if (val < 1000) return '#006633';
    if (val < 3000) return '#009944';
    return '#00ff88'; // Massimo vigore
  };

  return (
    <View style={styles.container}>
      <Svg width="160" height="240" viewBox="0 0 160 240">
        <G fill="#333">
          {/* Testa */}
          <Path d="M80 10c-8 0-15 6-15 15s7 15 15 15 15-6 15-15-7-15-15-15z" />

          {/* Petto */}
          <Path d="M60 45h40l5 25-25 5-25-5z" fill={getIntensity('Petto')} />

          {/* Addominali */}
          <Path d="M65 75h30l2 25-17 5-17-5z" fill={getIntensity('Core')} />

          {/* Spalla Sx */}
          <Path d="M50 45l10 5-5 15-10-5z" fill={getIntensity('Spalle')} />
          {/* Spalla Dx */}
          <Path d="M100 45l10 5-5 15-10-5z" fill={getIntensity('Spalle')} />

          {/* Bicipite Sx */}
          <Path d="M45 65l10 5-5 20-8-5z" fill={getIntensity('Bicipiti')} />
          {/* Bicipite Dx */}
          <Path d="M105 65l10 5-5 20-8-5z" fill={getIntensity('Bicipiti')} />

          {/* Gamba Sx (Quadricipiti) */}
          <Path d="M60 110h15l2 60-15-2z" fill={getIntensity('Gambe')} />
          {/* Gamba Dx (Quadricipiti) */}
          <Path d="M85 110h15l-2 60-15-2z" fill={getIntensity('Gambe')} />

          {/* Dorsali (visti da davanti) */}
          <Path d="M55 55l5 5-2 20-10-15z" fill={getIntensity('Schiena')} />
          <Path d="M105 55l-5 5 2 20 10-15z" fill={getIntensity('Schiena')} />
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#252525',
    padding: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#333',
  },
});
