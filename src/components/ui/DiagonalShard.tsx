import React, { useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Polygon, Stop } from 'react-native-svg';

interface DiagonalShardProps {
  style?: StyleProp<ViewStyle>;
  /** Gradient stops, e.g. `[colors.warning, colors.energy]`. */
  colors: readonly [string, string];
  opacity?: number;
}

/**
 * Diagonal parallelogram shard, echoing the AmaX logo's X mark — used as a
 * decorative accent behind the splash screen and auth hero panels. Each
 * instance gets its own gradient id so multiple shards on one screen don't
 * collide (SVG gradient ids resolve DOM-wide on web, not per-<Svg>).
 */
export function DiagonalShard({ style, colors: gradColors, opacity = 0.14 }: DiagonalShardProps) {
  const [id] = useState(() => `shard-${Math.random().toString(36).slice(2)}`);

  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={style}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={gradColors[0]} />
          <Stop offset="1" stopColor={gradColors[1]} />
        </LinearGradient>
      </Defs>
      <Polygon points="60,0 100,0 40,100 0,100" fill={`url(#${id})`} opacity={opacity} />
    </Svg>
  );
}
