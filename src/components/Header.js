import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const Header = ({ userMode, toggleMode, isLoggedIn, onLoginPress, currentUser, onOpenProfile, clientCounts, proCounts }) => {
    const rotateAnim = useRef(new Animated.Value(userMode === 'client' ? 0 : 1)).current;

    useEffect(() => {
        Animated.timing(rotateAnim, {
            toValue: userMode === 'client' ? 0 : 1,
            duration: 400,
            useNativeDriver: Platform.OS !== 'web',
            easing: Easing.bezier(0.4, 0, 0.2, 1)
        }).start();
    }, [userMode]);

    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg']
    });

    const hasOtherModeNotifications = userMode === 'client'
        ? (proCounts?.chats > 0 || proCounts?.updates > 0)
        : (clientCounts?.chats > 0 || clientCounts?.updates > 0);

    return (
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#2563EB' }}>Profesional</Text>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#EA580C', marginLeft: 6 }}>Cercano</Text>
                </View>
            </View>

            <View style={styles.headerRight}>
                {isLoggedIn ? (
                    <TouchableOpacity
                        onPress={toggleMode}
                        activeOpacity={0.8}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: 'white',
                            borderRadius: 30,
                            padding: 4,
                            borderWidth: 1.5,
                            borderColor: '#F1F5F9',
                            elevation: 3,
                            boxShadow: `0 2px 5px rgba(${userMode === 'client' ? '234, 88, 12' : '37, 99, 235'}, 0.15)`
                        }}
                    >
                        {/* Lado Cliente */}
                        <View style={{
                            width: userMode === 'client' ? 45 : 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: userMode === 'client' ? '#EA580C' : '#FFF7ED',
                            justifyContent: 'center',
                            alignItems: 'center',
                            position: 'relative'
                        }}>
                            <Feather name="user" size={16} color={userMode === 'client' ? 'white' : '#EA580C'} />
                            {userMode === 'pro' && (clientCounts?.chats > 0 || clientCounts?.updates > 0) && (
                                <View style={{
                                    position: 'absolute',
                                    top: -2,
                                    right: -2,
                                    width: 10,
                                    height: 10,
                                    borderRadius: 5,
                                    backgroundColor: '#EF4444',
                                    borderWidth: 1.5,
                                    borderColor: 'white'
                                }} />
                            )}
                        </View>

                        {/* Flecha Central */}
                        <View style={{ marginHorizontal: 4 }}>
                            <Feather
                                name={userMode === 'client' ? "arrow-right" : "arrow-left"}
                                size={14}
                                color={userMode === 'client' ? "#2563EB" : "#EA580C"}
                            />
                        </View>

                        {/* Lado Profesional */}
                        <View style={{
                            width: userMode === 'pro' ? 45 : 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: userMode === 'pro' ? '#2563EB' : '#EFF6FF',
                            justifyContent: 'center',
                            alignItems: 'center',
                            position: 'relative'
                        }}>
                            <MaterialCommunityIcons name="hammer" size={16} color={userMode === 'pro' ? 'white' : '#2563EB'} />
                            {userMode === 'client' && (proCounts?.chats > 0 || proCounts?.updates > 0) && (
                                <View style={{
                                    position: 'absolute',
                                    top: -2,
                                    right: -2,
                                    width: 10,
                                    height: 10,
                                    borderRadius: 5,
                                    backgroundColor: '#EF4444',
                                    borderWidth: 1.5,
                                    borderColor: 'white'
                                }} />
                            )}
                        </View>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.loginButtonHeader} onPress={onLoginPress}>
                        <Text style={styles.loginButtonHeaderText}>Entrar</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View >
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 10,
        backgroundColor: 'white',
        borderBottomWidth: 0,
        elevation: 5,
        boxShadow: '0 4px 10px rgba(234, 88, 12, 0.1)',
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    loginButtonHeader: {
        backgroundColor: '#EA580C',
        paddingHorizontal: 20,
        borderRadius: 24,
        minHeight: 48,
        justifyContent: 'center'
    },
    loginButtonHeaderText: { color: 'white', fontSize: 15, fontWeight: 'bold' }
});

export default Header;
