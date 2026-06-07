import React from 'react';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

interface KineFitLogoProps {
  size?: number;
  color?: string;
}

export const KineFitLogo: React.FC<KineFitLogoProps> = ({ size = 100, color = '#00ff88' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={color} stopOpacity="1" />
          <Stop offset="100%" stopColor="#00cc66" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      {/* Simbolo K astratto e dinamico stile Elite */}
      <Path d="M25 20v50l15-15V20z" fill="url(#grad)" />
      <Path d="M45 45l20-25h15L60 45l20 25H65z" fill="url(#grad)" />
      {/* Sottolineatura velocità */}
      <Path d="M25 75h55v4H25z" fill="#333" />
    </Svg>
  );
};
