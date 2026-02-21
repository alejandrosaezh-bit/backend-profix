import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

export default function BriefcaseLoader() {
    const spinValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const startAnimation = () => {
            spinValue.setValue(0);
            Animated.loop(
                Animated.timing(spinValue, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        };

        startAnimation();
    }, [spinValue]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            {/* Central Briefcase - Fixed */}
            <View style={styles.centerIcon}>
                <MaterialCommunityIcons name="briefcase-variant" size={32} color="#64748B" />
            </View>

            {/* Rotating Ring Container */}
            <Animated.View style={[styles.rotatingContainer, { transform: [{ rotate: spin }] }]}>
                {/* Blue Element (Top) */}
                <View style={[styles.orbitDot, styles.blueDot]} />

                {/* Orange Element (Bottom) */}
                <View style={[styles.orbitDot, styles.orangeDot]} />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerIcon: {
        zIndex: 1,
        opacity: 0.8,
    },
    rotatingContainer: {
        position: 'absolute',
        width: 70,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
    },
    orbitDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        position: 'absolute',
    },
    blueDot: {
        backgroundColor: '#3B82F6', // Blue-500
        top: 0,
    },
    orangeDot: {
        backgroundColor: '#F97316', // Orange-500
        bottom: 0,
    }
});
