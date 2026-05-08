import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function CrossProfileNotificationModal({ visible, onClose, onSwitchMode, otherModeCount, targetMode }) {
    if (!visible || otherModeCount === 0) return null;

    const isTargetPro = targetMode === 'pro';
    const primaryColor = isTargetPro ? '#2563EB' : '#EA580C';
    const iconName = isTargetPro ? 'briefcase' : 'user';
    const modeName = isTargetPro ? 'Profesional' : 'Cliente';

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={[styles.iconContainer, { backgroundColor: isTargetPro ? '#EFF6FF' : '#FFF7ED' }]}>
                        <Feather name="bell" size={32} color={primaryColor} />
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{otherModeCount}</Text>
                        </View>
                    </View>

                    <Text style={styles.title}>¡Tienes Novedades!</Text>
                    <Text style={styles.description}>
                        Tienes notificaciones pendientes en tu perfil de {modeName}. ¿Deseas cambiar de perfil ahora para revisarlas?
                    </Text>

                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: primaryColor }]}
                        onPress={() => {
                            onClose();
                            onSwitchMode(targetMode);
                        }}
                    >
                        <Feather name={iconName} size={18} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.primaryButtonText}>Cambiar a {modeName}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={onClose}
                    >
                        <Text style={styles.secondaryButtonText}>Descartar (ver perfil actual)</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        elevation: 10,
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#EF4444',
        borderRadius: 15,
        minWidth: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
        paddingHorizontal: 5,
    },
    badgeText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 10,
        textAlign: 'center',
    },
    description: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    primaryButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    secondaryButton: {
        paddingVertical: 12,
        width: '100%',
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#94A3B8',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
