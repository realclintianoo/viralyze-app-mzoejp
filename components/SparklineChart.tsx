
import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../styles/commonStyles';

const { width } = Dimensions.get('window');

interface SparklineChartProps {
  data: number[];
  height?: number;
  color?: string;
  animated?: boolean;
}

const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  height = 40,
  color = colors.primary,
  animated = true,
}) => {
  const animationProgress = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      animationProgress.value = withDelay(300, withTiming(1, { duration: 1500 }));
    } else {
      animationProgress.value = 1;
    }
  }, [animated, animationProgress]);

  const chartWidth = width * 0.3; // Adjust based on container
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  const getPointY = (value: number) => {
    return height - ((value - minValue) / range) * height;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animationProgress.value, [0, 1], [0, 1]),
    transform: [
      { scaleX: interpolate(animationProgress.value, [0, 1], [0, 1]) }
    ],
  }));

  return (
    <View style={{ width: chartWidth, height, overflow: 'hidden' }}>
      <Animated.View style={[animatedStyle, { flex: 1 }]}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end' }}>
          {data.map((value, index) => {
            const barHeight = ((value - minValue) / range) * height;
            const barWidth = chartWidth / data.length - 2;
            
            return (
              <View
                key={index}
                style={{
                  width: barWidth,
                  height: barHeight || 2,
                  marginHorizontal: 1,
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <LinearGradient
                  colors={[color, `${color}80`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={{
                    flex: 1,
                    shadowColor: color,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.6,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                />
              </View>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
};

export default SparklineChart;
