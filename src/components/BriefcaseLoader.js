import { FontAwesome5 } from '@expo/vector-icons';
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
                    duration: 1000,
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
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <View style={{ width: 60, height: 60, justifyContent: 'center', alignItems: 'center' }}>
                    {/* Círculo Bicolor Base */}
                    <View style={{
                        width: 50, height: 50, borderRadius: 25,
                        borderWidth: 5, borderColor: '#2563EB',
                        borderTopColor: '#EA580C', borderRightColor: '#EA580C',
                        transform: [{ rotate: '-45deg' }]
                    }} />
                    {/* Cabezas de Flecha */}
                    <FontAwesome5 name="caret-right" size={16} color="#EA580C" style={{ position: 'absolute', top: 1, right: 10 }} />
                    <FontAwesome5 name="caret-left" size={16} color="#2563EB" style={{ position: 'absolute', bottom: 1, left: 10 }} />
                </View>
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
    }
});
