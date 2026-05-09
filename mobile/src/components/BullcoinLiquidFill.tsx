import React, {useEffect, useMemo, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
} from 'react-native-svg';

type Props = {
  size: number;
  /** 0–100, доля цикла майнинга — как `percentage` на Home.tsx TWA */
  percentage: number;
};

/**
 * Геометрия как frontend/src/pages/Home.tsx:
 * `liquidTop`, `beforeRadius`, `afterRadius` → CSS vars для `.liquid::before/::after`.
 * Центр слоя после `top` + `translate(-50%, -75%)` из animation.css.
 */
function liquidLayers(size: number, pct: number) {
  const miningPct = Math.min(100, Math.max(0, pct));
  const liquidTop = -150 - miningPct;
  const topPx = (liquidTop / 100) * size;
  const H = 10 * size;
  const centerX = size / 2;
  const centerY = topPx + H / 2 - 0.75 * H;

  const beforeRadius =
    miningPct < 50
      ? 50 - miningPct / 50
      : 49 + (miningPct - 50) / 50;
  const afterRadius =
    miningPct < 50
      ? 50 - (miningPct / 50) * 2
      : 48 + ((miningPct - 50) / 50) * 2;

  const rx1 = 5 * size * (beforeRadius / 50);
  const ry1 = 5 * size;
  const rx2 = 5 * size * (afterRadius / 50);
  const ry2 = 5 * size;

  return {centerX, centerY, rx1, ry1, rx2, ry2};
}

/**
 * Как animation.css: два слоя `rgba(20,20,20,…)`, вращение 10s / 15s.
 * Горизонтальный сдвиг (translate) усиливает эффект «течёт слева направо» внутри круга —
 * на вебе его даёт вращение больших эллипсов в клипе; здесь то же + лёгкое качание по X.
 *
 * Кадр через `requestAnimationFrame`: надёжнее, чем Reanimated `animatedProps` на `<G>` в RNSVG.
 */
export function BullcoinLiquidFill({size, percentage}: Props) {
  const clipId = useMemo(
    () => `lc_${Math.random().toString(36).slice(2, 10)}`,
    [],
  );

  const {centerX, centerY, rx1, ry1, rx2, ry2} = liquidLayers(
    size,
    percentage,
  );

  const [, setTick] = useState(0);
  const t0 = useRef(Date.now());

  useEffect(() => {
    let id = 0;
    const loop = () => {
      setTick(x => (x + 1) % 1_000_000);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  const elapsed = (Date.now() - t0.current) / 1000;

  /** Тот же угловой темп, что `animation: animate 10s linear infinite` */
  const angle1 = ((elapsed * 360) / 10) % 360;
  /** `15s linear infinite` для второго слоя */
  const angle2 = ((elapsed * 360) / 15) % 360;

  /** Лёгкое «бульканье» по горизонтали внутри монеты (разные фазы у слоёв). */
  const slide1 = Math.sin(elapsed * 2.6) * size * 0.055;
  const slide2 = Math.sin(elapsed * 2.1 + 1.4) * size * 0.048;

  const tf1 = `translate(${slide1}, 0) rotate(${angle1} ${centerX} ${centerY})`;
  const tf2 = `translate(${slide2}, 0) rotate(${angle2} ${centerX} ${centerY})`;

  return (
    <View style={styles.layer} pointerEvents="none">
      <Svg width={size} height={size}>
        <Defs>
          <ClipPath id={clipId}>
            <Circle cx={size / 2} cy={size / 2} r={size / 2} />
          </ClipPath>
        </Defs>
        <G clipPath={`url(#${clipId})`}>
          <G transform={tf1}>
            <Ellipse
              cx={centerX}
              cy={centerY}
              rx={rx1}
              ry={ry1}
              fill="rgba(20, 20, 20, 0.75)"
            />
          </G>
          <G transform={tf2}>
            <Ellipse
              cx={centerX}
              cy={centerY}
              rx={rx2}
              ry={ry2}
              fill="rgba(20, 20, 20, 0.5)"
            />
          </G>
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});
