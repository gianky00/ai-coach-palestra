import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

import { getHeatmapIntensity } from '../../lib/heatmap';

interface MuscleHeatmapProps {
  muscleStats: Record<string, number>; // Gruppo -> Volume o Sets
}

const MuscleHeatmapComponent: React.FC<MuscleHeatmapProps> = ({ muscleStats }) => {
  const fills = useMemo(
    () => ({
      petto: getHeatmapIntensity(muscleStats['Petto'] || 0),
      core: getHeatmapIntensity(muscleStats['Core'] || 0),
      spalle: getHeatmapIntensity(muscleStats['Spalle'] || 0),
      bicipiti: getHeatmapIntensity(muscleStats['Bicipiti'] || 0),
      gambe: getHeatmapIntensity(muscleStats['Gambe'] || 0),
      schiena: getHeatmapIntensity(muscleStats['Schiena'] || 0),
    }),
    [muscleStats],
  );

  return (
    <View style={styles.container} testID="analytics-heatmap">
      <Svg width="160" height="240" viewBox="0 0 160 240">
        <G fill="#333">
          {/* Testa */}
          <Path d="M80 10c-8 0-15 6-15 15s7 15 15 15 15-6 15-15-7-15-15-15z" />

          {/* Petto */}
          <Path d="M60 45h40l5 25-25 5-25-5z" fill={fills.petto} />

          {/* Addominali */}
          <Path d="M65 75h30l2 25-17 5-17-5z" fill={fills.core} />

          {/* Spalla Sx */}
          <Path d="M50 45l10 5-5 15-10-5z" fill={fills.spalle} />
          {/* Spalla Dx */}
          <Path d="M100 45l10 5-5 15-10-5z" fill={fills.spalle} />

          {/* Bicipite Sx */}
          <Path d="M45 65l10 5-5 20-8-5z" fill={fills.bicipiti} />
          {/* Bicipite Dx */}
          <Path d="M105 65l10 5-5 20-8-5z" fill={fills.bicipiti} />

          {/* Gamba Sx (Quadricipiti) */}
          <Path d="M60 110h15l2 60-15-2z" fill={fills.gambe} />
          {/* Gamba Dx (Quadricipiti) */}
          <Path d="M85 110h15l-2 60-15-2z" fill={fills.gambe} />

          {/* Dorsali (visti da davanti) */}
          <Path d="M55 55l5 5-2 20-10-15z" fill={fills.schiena} />
          <Path d="M105 55l-5 5 2 20 10-15z" fill={fills.schiena} />
        </G>
      </Svg>
    </View>
  );
};

export const MuscleHeatmap = React.memo(MuscleHeatmapComponent);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
});
