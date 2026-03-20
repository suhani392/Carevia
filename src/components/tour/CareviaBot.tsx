import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming, 
  withDelay,
  useSharedValue,
  interpolate,
  useAnimatedProps
} from 'react-native-reanimated';
import Svg, { Circle, Rect, Path, G } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CareviaBotProps {
  expression?: 'happy' | 'thinking' | 'talking';
  size?: number;
}

const CareviaBot: React.FC<CareviaBotProps> = ({ expression = 'happy', size = 120 }) => {
  const floatValue = useSharedValue(0);
  const blinkValue = useSharedValue(1);
  const armWaveValue = useSharedValue(0);

  useEffect(() => {
    // Floating animation
    floatValue.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      true
    );

    // Blinking animation
    const blinkSequence = () => {
      blinkValue.value = withSequence(
        withTiming(0.1, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
      setTimeout(blinkSequence, 3000 + Math.random() * 2000);
    };
    blinkSequence();

    // Arm waving if talking
    if (expression === 'talking') {
      armWaveValue.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 400 })
        ),
        -1,
        true
      );
    }
  }, [expression]);

  const animatedBody = useAnimatedStyle(() => ({
    transform: [{ translateY: floatValue.value }],
  }));

  const animatedEyesProps = useAnimatedProps(() => ({
    transform: [
        { translateY: 36 }, // Center of eyes approx
        { scaleY: blinkValue.value },
        { translateY: -36 }
    ]
  }));

  const animatedArmProps = useAnimatedProps(() => ({
    transform: [
        { translateX: 20 }, // Shoulder point approx
        { translateY: 65 },
        { rotate: `${interpolate(armWaveValue.value, [0, 1], [-10, 10])}deg` },
        { translateX: -20 },
        { translateY: -65 }
    ]
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={[styles.body, animatedBody]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Main Body */}
          <Rect x="20" y="35" width="60" height="50" rx="15" fill="#0062FF" />
          <Rect x="25" y="40" width="50" height="40" rx="10" fill="#E6F0FF" opacity="0.8" />
          
          {/* Head / Helmet */}
          <Path d="M25 35 C 25 20, 75 20, 75 35" fill="#0062FF" />
          <Circle cx="50" cy="35" r="30" fill="#0062FF" />
          
          {/* Face Area */}
          <Rect x="30" y="25" width="40" height="25" rx="8" fill="#FFFFFF" />
          
          {/* Eyes */}
          <G>
            <AnimatedRect 
              x="40" y="32" width="6" height="8" rx="3" fill="#001A4D" 
              animatedProps={animatedEyesProps} 
            />
            <AnimatedRect 
              x="54" y="32" width="6" height="8" rx="3" fill="#001A4D" 
              animatedProps={animatedEyesProps} 
            />
          </G>

          {/* Mouth */}
          {expression === 'happy' && (
            <Path d="M42 45 Q 50 50, 58 45" stroke="#001A4D" strokeWidth="2" fill="none" strokeLinecap="round" />
          )}
          {expression === 'thinking' && (
            <Path d="M44 46 L 56 44" stroke="#001A4D" strokeWidth="2" fill="none" strokeLinecap="round" />
          )}
           {expression === 'talking' && (
            <Circle cx="50" cy="46" r="3" fill="#001A4D" />
          )}

          {/* Antennas */}
          <Path d="M50 15 L 50 5" stroke="#0062FF" strokeWidth="3" strokeLinecap="round" />
          <Circle cx="50" cy="5" r="4" fill="#6A9EFF" />
          
          {/* Arms */}
          <AnimatedG animatedProps={animatedArmProps}>
             <Rect x="15" y="55" width="10" height="20" rx="5" fill="#0055FF" />
          </AnimatedG>
          <G>
             <Rect x="75" y="55" width="10" height="20" rx="5" fill="#0055FF" />
          </G>

          {/* Feet */}
          <Rect x="35" y="85" width="12" height="6" rx="3" fill="#001A4D" />
          <Rect x="53" y="85" width="12" height="6" rx="3" fill="#001A4D" />
        </Svg>
      </Animated.View>
    </View>
  );
};

// Simplified animated components for SVG
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedG = Animated.createAnimatedComponent(G);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    width: '100%',
    height: '100%',
  },
});

export default CareviaBot;
