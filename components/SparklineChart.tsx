
import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { colors } from '../styles/commonStyles';

const { width } = Dimensions.get('window');

interface SparklineChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
}

export default function SparklineChart({
  data,
  width: chartWidth = width * 0.6,
  height: chartHeight = 60,
  color = colors.neonTeal,
  strokeWidth = 2,
}: SparklineChartProps) {
  const animationProgress = useSharedValue(0);

  useEffect(() => {
    animationProgress.value = withTiming(1, { duration: 1500 });
  }, [data, animationProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: animationProgress.value,
  }));

  if (!data || data.length < 2) {
    return (
      <View style={{
        width: chartWidth,
        height: chartHeight,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <View style={{
          width: '100%',
          height: 2,
          backgroundColor: colors.backgroundSecondary,
          borderRadius: 1,
        }} />
      </View>
    );
  }

  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const range = maxValue - minValue || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * chartWidth;
    const y = chartHeight - ((value - minValue) / range) * chartHeight;
    return { x, y };
  });

  // Create SVG path
  const pathData = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    return `${path} L ${point.x} ${point.y}`;
  }, '');

  return (
    <Animated.View style={[
      {
        width: chartWidth,
        height: chartHeight,
        position: 'relative',
      },
      animatedStyle
    ]}>
      {/* Background grid */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
          <View
            key={index}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: ratio * chartHeight,
              height: 1,
              backgroundColor: colors.backgroundSecondary + '40',
            }}
          />
        ))}
      </View>

      {/* Data points */}
      {points.map((point, index) => (
        <Animated.View
          key={index}
          style={[
            {
              position: 'absolute',
              left: point.x - 2,
              top: point.y - 2,
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: color,
              shadowColor: color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 4,
              elevation: 4,
            },
            useAnimatedStyle(() => ({
              opacity: interpolate(
                animationProgress.value,
                [0, (index + 1) / points.length],
                [0, 1]
              ),
              transform: [{
                scale: interpolate(
                  animationProgress.value,
                  [0, (index + 1) / points.length],
                  [0, 1]
                )
              }],
            }))
          ]}
        />
      ))}

      {/* Connecting lines */}
      {points.slice(1).map((point, index) => {
        const prevPoint = points[index];
        const distance = Math.sqrt(
          Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)
        );
        const angle = Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x);

        return (
          <Animated.View
            key={index}
            style={[
              {
                position: 'absolute',
                left: prevPoint.x,
                top: prevPoint.y - strokeWidth / 2,
                width: distance,
                height: strokeWidth,
                backgroundColor: color,
                transformOrigin: '0 50%',
                transform: [{ rotate: `${angle}rad` }],
                shadowColor: color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 2,
                elevation: 2,
              },
              useAnimatedStyle(() => ({
                opacity: interpolate(
                  animationProgress.value,
                  [0, (index + 2) / points.length],
                  [0, 1]
                ),
                transform: [
                  { rotate: `${angle}rad` },
                  {
                    scaleX: interpolate(
                      animationProgress.value,
                      [0, (index + 2) / points.length],
                      [0, 1]
                    )
                  }
                ],
              }))
            ]}
          />
        );
      })}

      {/* Gradient fill area */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: chartHeight,
        opacity: 0.1,
      }}>
        {points.map((point, index) => (
          <Animated.View
            key={index}
            style={[
              {
                position: 'absolute',
                left: point.x - 1,
                bottom: 0,
                width: 2,
                height: chartHeight - point.y,
                backgroundColor: color,
              },
              useAnimatedStyle(() => ({
                opacity: interpolate(
                  animationProgress.value,
                  [0, (index + 1) / points.length],
                  [0, 0.3]
                ),
                transform: [{
                  scaleY: interpolate(
                    animationProgress.value,
                    [0, (index + 1) / points.length],
                    [0, 1]
                  )
                }],
              }))
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
}
