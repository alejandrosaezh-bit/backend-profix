import React, { useState, useEffect } from 'react';
import { View, Text, Switch, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/globalStyles';
import api from '../utils/api';

const NotificationPreferencesModal = ({ visible, onClose }) => {
    const { user, setUser } = useAuth();
    const [preferences, setPreferences] = useState({});
    const [loading, setLoading] = useState(false);
    
    // Configuración predeterminada si el usuario no tiene ninguna
    const defaultPreferences = {
        client_new_messages: { push: true, email: true },
        client_new_quotes: { push: true, email: true },
        client_status_updates: { push: true, email: true },
        client_reviews: { push: true, email: true },
        prof_new_requests: { push: true, email: true },
        prof_new_messages: { push: true, email: true },
        prof_quote_responses: { push: true, email: true },
        prof_status_updates: { push: true, email: true },
        prof_reviews: { push: true, email: true }
    };

    useEffect(() => {
        if (visible && user) {
            setPreferences(user.notificationPreferences || defaultPreferences);
        }
    }, [visible, user]);

    const handleToggle = (key, type) => {
        setPreferences(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [type]: !prev[key][type]
            }
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await api.put('/auth/profile', { notificationPreferences: preferences });
            if (res.data) {
                setUser(res.data);
                onClose();
            }
        } catch (error) {
            console.error("Error saving preferences:", error);
            alert("Error al guardar preferencias");
        } finally {
            setLoading(false);
        }
    };

    const renderPreferenceRow = (label, key) => {
        const pref = preferences[key] || { push: false, email: false };
        return (
            <View style={localStyles.row}>
                <Text style={localStyles.rowLabel}>{label}</Text>
                <View style={localStyles.togglesContainer}>
                    <View style={localStyles.toggleWrapper}>
                        <Feather name="bell" size={14} color="#666" style={{ marginBottom: 4 }} />
                        <Switch
                            trackColor={{ false: "#d1d5db", true: "#fdba74" }}
                            thumbColor={pref.push ? "#EA580C" : "#f4f3f4"}
                            onValueChange={() => handleToggle(key, 'push')}
                            value={pref.push}
                        />
                    </View>
                    <View style={localStyles.toggleWrapper}>
                        <Feather name="mail" size={14} color="#666" style={{ marginBottom: 4 }} />
                        <Switch
                            trackColor={{ false: "#d1d5db", true: "#fdba74" }}
                            thumbColor={pref.email ? "#EA580C" : "#f4f3f4"}
                            onValueChange={() => handleToggle(key, 'email')}
                            value={pref.email}
                        />
                    </View>
                </View>
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={localStyles.modalOverlay}>
                <View style={localStyles.modalContainer}>
                    <View style={localStyles.header}>
                        <Text style={localStyles.title}>Preferencias de Notificación</Text>
                        <TouchableOpacity onPress={onClose} style={localStyles.closeBtn}>
                            <Feather name="x" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={localStyles.scrollArea} showsVerticalScrollIndicator={false}>
                        <Text style={localStyles.sectionTitle}>Como Cliente</Text>
                        <View style={localStyles.sectionCard}>
                            {renderPreferenceRow("Nuevos Mensajes (Chats)", "client_new_messages")}
                            {renderPreferenceRow("Nuevos Presupuestos", "client_new_quotes")}
                            {renderPreferenceRow("Actualizaciones de Estado", "client_status_updates")}
                            {renderPreferenceRow("Valoraciones", "client_reviews")}
                        </View>

                        <Text style={localStyles.sectionTitle}>Como Profesional</Text>
                        <View style={localStyles.sectionCard}>
                            {renderPreferenceRow("Nuevas Solicitudes", "prof_new_requests")}
                            {renderPreferenceRow("Nuevos Mensajes (Chats)", "prof_new_messages")}
                            {renderPreferenceRow("Respuestas a Presupuestos", "prof_quote_responses")}
                            {renderPreferenceRow("Avances del Cliente", "prof_status_updates")}
                            {renderPreferenceRow("Valoraciones", "prof_reviews")}
                        </View>
                        <View style={{height: 20}} />
                    </ScrollView>

                    <View style={localStyles.footer}>
                        <TouchableOpacity 
                            style={[styles.primaryButton, { width: '100%', opacity: loading ? 0.7 : 1 }]} 
                            onPress={handleSave}
                            disabled={loading}
                        >
                            <Text style={styles.primaryButtonText}>{loading ? 'Guardando...' : 'Guardar Preferencias'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const localStyles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '85%',
        paddingTop: 20,
        paddingBottom: 40
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 15
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827'
    },
    closeBtn: {
        padding: 4
    },
    scrollArea: {
        paddingHorizontal: 24
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#EA580C',
        marginTop: 20,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    sectionCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    rowLabel: {
        fontSize: 15,
        color: '#374151',
        flex: 1,
        fontWeight: '500'
    },
    togglesContainer: {
        flexDirection: 'row',
        gap: 15
    },
    toggleWrapper: {
        alignItems: 'center'
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6'
    }
});

export default NotificationPreferencesModal;
