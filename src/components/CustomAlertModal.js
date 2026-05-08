import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';

let alertRef = null;

export const setAlertRef = (ref) => {
    alertRef = ref;
};

export const CustomAlertService = {
    alert: (title, message, buttons) => {
        if (alertRef) {
            alertRef(title, message, buttons);
        } else {
            console.warn("CustomAlertService: alertRef is null", title, message);
        }
    }
};

export default function CustomAlertModal() {
    const [visible, setVisible] = useState(false);
    const [config, setConfig] = useState(null);

    useEffect(() => {
        setAlertRef((title, message, buttons) => {
            setConfig({ title, message, buttons });
            setVisible(true);
        });
    }, []);

    if (!visible || !config) return null;

    const { title, message, buttons } = config;

    // Default button if none provided
    const displayButtons = buttons && buttons.length > 0 
        ? buttons 
        : [{ text: 'OK', onPress: () => {} }];

    const handlePress = (onPress) => {
        setVisible(false);
        if (onPress) onPress();
    };

    const isSuccess = title?.toLowerCase().includes('éxito') || title?.toLowerCase().includes('completado');
    const isError = title?.toLowerCase().includes('error') || title?.toLowerCase().includes('denegado') || title?.toLowerCase().includes('faltan');
    const isWarning = title?.toLowerCase().includes('aviso') || title?.toLowerCase().includes('eliminar');

    let iconName = "info";
    let iconColor = "#2563EB";
    let iconBg = "#EFF6FF";

    if (isSuccess) {
        iconName = "check-circle";
        iconColor = "#16A34A";
        iconBg = "#DCFCE7";
    } else if (isError) {
        iconName = "alert-circle";
        iconColor = "#EF4444";
        iconBg = "#FEE2E2";
    } else if (isWarning) {
        iconName = "alert-triangle";
        iconColor = "#F59E0B";
        iconBg = "#FEF3C7";
    }

    return (
        <Modal transparent animationType="fade" visible={visible} onRequestClose={() => setVisible(false)}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                        <Feather name={iconName} size={32} color={iconColor} />
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    {message ? <Text style={styles.message}>{message}</Text> : null}
                    
                    <View style={[styles.buttonContainer, displayButtons.length > 2 && { flexDirection: 'column' }]}>
                        {displayButtons.map((btn, index) => {
                            const isDestructive = btn.style === 'destructive';
                            const isCancel = btn.style === 'cancel' || btn.text?.toLowerCase() === 'cancelar';
                            
                            return (
                                <TouchableOpacity 
                                    key={index} 
                                    style={[
                                        styles.button, 
                                        isDestructive && styles.buttonDestructive,
                                        isCancel && styles.buttonCancel,
                                        displayButtons.length <= 2 && { flex: 1, marginHorizontal: 4 },
                                        displayButtons.length > 2 && { width: '100%', marginBottom: 8 }
                                    ]}
                                    onPress={() => handlePress(btn.onPress)}
                                >
                                    <Text style={[
                                        styles.buttonText,
                                        isDestructive && styles.buttonTextDestructive,
                                        isCancel && styles.buttonTextCancel
                                    ]}>
                                        {btn.text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
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
        padding: 20 
    },
    card: { 
        backgroundColor: 'white', 
        borderRadius: 24, 
        padding: 24, 
        width: '100%', 
        maxWidth: 340, 
        alignItems: 'center',
        elevation: 10, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 10 }, 
        shadowOpacity: 0.15, 
        shadowRadius: 20 
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    title: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        color: '#1E293B', 
        marginBottom: 8, 
        textAlign: 'center' 
    },
    message: { 
        fontSize: 15, 
        color: '#64748B', 
        textAlign: 'center', 
        marginBottom: 24, 
        lineHeight: 22 
    },
    buttonContainer: { 
        flexDirection: 'row', 
        justifyContent: 'center', 
        width: '100%' 
    },
    button: { 
        backgroundColor: '#2563EB', 
        paddingVertical: 14, 
        paddingHorizontal: 20, 
        borderRadius: 16, 
        alignItems: 'center', 
        minWidth: 100 
    },
    buttonCancel: { 
        backgroundColor: '#F1F5F9' 
    },
    buttonDestructive: { 
        backgroundColor: '#FEF2F2', 
        borderWidth: 1, 
        borderColor: '#FECACA' 
    },
    buttonText: { 
        color: 'white', 
        fontWeight: 'bold', 
        fontSize: 15 
    },
    buttonTextCancel: { 
        color: '#64748B' 
    },
    buttonTextDestructive: { 
        color: '#EF4444' 
    }
});
