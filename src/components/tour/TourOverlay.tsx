import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, Platform } from 'react-native';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import Animated, { 
  useAnimatedStyle, 
  withTiming, 
  FadeIn,
} from 'react-native-reanimated';
import { useTour } from '../../context/TourContext';
import CareviaBot from './CareviaBot';
import { useAppContext } from '../../context/AppContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TourOverlay = () => {
    const { 
        isTourActive, 
        currentStep, 
        targets, 
        nextStep, 
        skipSection, 
        skipTour 
    } = useTour();
    const { colors, themeMode, userProfile } = useAppContext();
    
    const [displayText, setDisplayText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [calibration, setCalibration] = useState({ x: 0, y: 0 });

    const targetLayout = targets[currentStep.targetId];

    // Layout from target (calibrated against overlay's own window position)
    const correctedLayout = useMemo(() => {
        if (!targetLayout) return null;
        return {
            x: targetLayout.x - calibration.x,
            y: targetLayout.y - calibration.y,
            width: targetLayout.width,
            height: targetLayout.height,
        };
    }, [targetLayout, calibration]);

    const onContainerLayout = (e: any) => {
        // Measure where THIS overlay's 0,0 is in the window
        // This handles cases where the app is pushed down by the status bar
        e.target.measureInWindow((x: number, y: number) => {
           setCalibration({ x, y });
        });
    };

    // Check if current step requires input and if that input is provided
    const isNextDisabled = useMemo(() => {
        if (!currentStep.requiresInput) return false;
        const fieldValue = (userProfile as any)?.[currentStep.requiresInput];
        // Special case for gender
        if (currentStep.requiresInput === 'gender' && (fieldValue === 'Not specified' || !fieldValue || fieldValue === 'N/A')) return true;
        // Special case for age (if it's still 'N/A')
        if (currentStep.requiresInput === 'dob' && (fieldValue === 'N/A' || !fieldValue)) return true;
        
        return !fieldValue;
    }, [currentStep, userProfile]);

    // Calculate highlight position
    const highlightStyle = useAnimatedStyle(() => {
        if (!correctedLayout || correctedLayout.width === 0) return { opacity: 0 };
        return {
            top: withTiming(correctedLayout.y - 10, { duration: 250 }),
            left: withTiming(correctedLayout.x - 10, { duration: 250 }),
            width: withTiming(correctedLayout.width + 20, { duration: 250 }),
            height: withTiming(correctedLayout.height + 20, { duration: 250 }),
            opacity: 1,
        };
    });

    // Calculate Tooltip position (above or below highlight)
    const tooltipPosition = useMemo(() => {
        if (!correctedLayout) return { top: SCREEN_HEIGHT / 3, left: 20 };
        
        const spaceBelow = SCREEN_HEIGHT - (correctedLayout.y + correctedLayout.height);
        
        if (spaceBelow > 300) {
            return { top: correctedLayout.y + correctedLayout.height + 30, left: 20 };
        } else {
            return { top: Math.max(50, correctedLayout.y - 280), left: 20 };
        }
    }, [correctedLayout]);

    // Typewriter effect
    useEffect(() => {
        if (!isTourActive) return;
        
        setDisplayText('');
        setIsTyping(true);
        let currentText = '';
        const fullText = currentStep.text;
        let i = 0;
        
        const timer = setInterval(() => {
            if (i < fullText.length) {
                currentText += fullText[i];
                setDisplayText(currentText);
                i++;
            } else {
                setIsTyping(false);
                clearInterval(timer);
            }
        }, 30);

        return () => clearInterval(timer);
    }, [currentStep, isTourActive]);

    if (!isTourActive) return null;

    return (
        <View 
            style={styles.container} 
            pointerEvents="box-none"
            onLayout={onContainerLayout}
        >
            {/* Full Screen Dimmer if layout not ready */}
            {!correctedLayout && (
                <View style={[styles.overlayBg, styles.dimmer]} />
            )}
            
            {/* Main Dimmed Overlay with Rounded Hole */}
            {correctedLayout && (
                <View style={styles.overlayBg} pointerEvents="none">
                    <Svg height={SCREEN_HEIGHT} width={SCREEN_WIDTH}>
                        <Defs>
                            <Mask id="mask">
                                <Rect height={SCREEN_HEIGHT} width={SCREEN_WIDTH} fill="white" />
                                <Rect 
                                    x={correctedLayout.x - 10} 
                                    y={correctedLayout.y - 10} 
                                    width={correctedLayout.width + 20} 
                                    height={correctedLayout.height + 20} 
                                    rx={12} // Matches the highlight border radius
                                    fill="black" 
                                />
                            </Mask>
                        </Defs>
                        <Rect 
                            height={SCREEN_HEIGHT} 
                            width={SCREEN_WIDTH} 
                            fill="rgba(0, 0, 0, 0.7)" 
                            mask="url(#mask)" 
                        />
                    </Svg>
                </View>
            )}

            {/* Highlight Border/Glow - Pass through touches */}
            {correctedLayout && (
                <Animated.View 
                    style={[styles.highlight, highlightStyle]} 
                    pointerEvents="none"
                />
            )}

            {/* Tooltip & Bot */}
            <View style={styles.overlayBg} pointerEvents="box-none">
                <Animated.View 
                    entering={FadeIn.delay(300)}
                    style={[
                        styles.tooltipContainer, 
                        { top: tooltipPosition.top }
                    ]}
                >
                    <View style={styles.botWrapper}>
                        <CareviaBot expression={isTyping ? 'talking' : 'happy'} size={80} />
                    </View>
                    
                    <View style={[styles.bubble, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                        <Text style={[styles.text, { color: colors.text }]}>{displayText}</Text>
                        
                        <View style={styles.footer}>
                            <TouchableOpacity onPress={skipTour}>
                                <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip Tour</Text>
                            </TouchableOpacity>
                            
                            <View style={styles.rightButtons}>
                                <TouchableOpacity style={styles.skipSectionBtn} onPress={skipSection}>
                                    <Text style={[styles.skipSectionText, { color: colors.primary }]}>Skip Section</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    onPress={nextStep} 
                                    style={[
                                        styles.nextBtn, 
                                        { backgroundColor: isNextDisabled ? '#CCCCCC' : colors.primary }
                                    ]}
                                    disabled={isNextDisabled}
                                >
                                    <Text style={styles.nextText}>Next</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 99999,
    },
    overlayBg: {
        ...StyleSheet.absoluteFillObject,
    },
    dimmer: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    middleRow: {
        flexDirection: 'row',
    },
    highlight: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        borderWidth: 3,
        borderColor: '#FFFFFF',
        position: 'absolute',
        shadowColor: '#FFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    tooltipContainer: {
        position: 'absolute',
        width: SCREEN_WIDTH - 40,
        left: 20,
        alignItems: 'center',
    },
    botWrapper: {
        marginBottom: -15,
        zIndex: 10,
    },
    bubble: {
        width: '100%',
        borderRadius: 25,
        borderWidth: 1,
        padding: 20,
        paddingTop: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
    },
    text: {
        fontFamily: 'Judson-Regular',
        fontSize: 18,
        lineHeight: 24,
        minHeight: 50,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
    },
    rightButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    skipText: {
        fontFamily: 'Judson-Regular',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    skipSectionBtn: {
        marginRight: 15,
    },
    skipSectionText: {
        fontFamily: 'Judson-Bold',
        fontSize: 14,
    },
    nextBtn: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 12,
    },
    nextText: {
        color: '#FFFFFF',
        fontFamily: 'Judson-Bold',
        fontSize: 15,
    },
});

export default TourOverlay;
