import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, Alert, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api } from '../../utils/api'; 

export const ProSubscriptionModal = ({
    visible,
    onClose,
    user,
}) => {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [phone, setPhone] = useState('');
    const [reference, setReference] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Current Plan Details
    const currentPlan = user?.subscription?.plan || 'FREE';
    const leadsUsed = user?.subscription?.jobsUnlockedThisCycle || 0;
    
    // Limits
    let leadsLimit = 3;
    if (currentPlan === 'PRO') leadsLimit = 10;
    if (currentPlan === 'ELITE') leadsLimit = 'Ilimitados';

    const handleReportPayment = async () => {
        if (!selectedPlan) {
            Alert.alert("Selecciona un Plan", "Por favor selecciona el plan que deseas adquirir.");
            return;
        }
        if (!phone || !reference) {
            Alert.alert("Datos Incompletos", "Ingresa tu número de teléfono y el número de referencia del Pago Móvil.");
            return;
        }

        setIsLoading(true);
        try {
            // Fetch configuration directly here to avoid storing in modal
            const req = {
                planRequested: selectedPlan,
                paymentSourcePhone: phone,
                paymentReference: reference,
                // Monto en bs
                amountBs: selectedPlan === 'PRO' ? 700 : 1800 // This ideally should come from backend BCV
            };

            await api.reportSubscriptionPayment(req);
            Alert.alert("¡Pago Reportado!", "Tu pago ha sido registrado y será verificado a la brevedad. Tu plan se actualizará tras la verificación.");
            onClose();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", error.response?.data?.message || "Ocurrió un error al reportar el pago.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.dragHandle} />
                    
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Mis Suscripciones</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Feather name="x" size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <KeyboardAvoidingView 
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                        style={{ flex: 1 }}
                    >
                    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                        
                        {/* Current Plan Card */}
                        <View style={[styles.planCard, { backgroundColor: currentPlan === 'FREE' ? '#F8FAFC' : (currentPlan === 'PRO' ? '#EFF6FF' : '#FEF3C7') }]}>
                            <Text style={styles.planBadgeText}>PLAN ACTUAL</Text>
                            <Text style={[styles.planCardTitle, { color: currentPlan === 'FREE' ? '#475569' : (currentPlan === 'PRO' ? '#1D4ED8' : '#B45309') }]}>{currentPlan}</Text>
                            <Text style={styles.planDetailText}>Contactos consumidos: {leadsUsed} de {leadsLimit}</Text>
                            {currentPlan === 'FREE' && leadsUsed >= 3 && (
                                <Text style={styles.warningText}>Has alcanzado tu límite gratuito mensual.</Text>
                            )}
                        </View>

                        <Text style={styles.sectionTitle}>Mejora tu Paquete</Text>
                        <Text style={styles.sectionSubtitle}>Incrementa tu volumen de trabajo mensual mediante nuestros planes Premium.</Text>

                        {/* Plan Options */}
                        <TouchableOpacity 
                            style={[styles.optionCard, selectedPlan === 'PRO' && styles.optionCardSelected]}
                            onPress={() => setSelectedPlan('PRO')}
                        >
                            <View style={styles.optionHeader}>
                                <Text style={styles.optionTitle}>Plan PRO</Text>
                                <Text style={styles.optionPrice}>$20 <Text style={styles.optionPriceMonth}>/mes</Text></Text>
                            </View>
                            <Text style={styles.optionFeatures}>✓ Hasta 10 solicitudes de presupuesto</Text>
                            <Text style={styles.optionFeatures}>✓ Insignia Pro en tu perfil</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.optionCard, { marginBottom: 30 }, selectedPlan === 'ELITE' && styles.optionCardSelected]}
                            onPress={() => setSelectedPlan('ELITE')}
                        >
                            <View style={styles.optionHeader}>
                                <Text style={styles.optionTitle}>Plan ELITE</Text>
                                <Text style={styles.optionPrice}>$50 <Text style={styles.optionPriceMonth}>/mes</Text></Text>
                            </View>
                            <Text style={styles.optionFeatures}>✓ Contactos de presupuesto Ilimitados</Text>
                            <Text style={styles.optionFeatures}>✓ Prioridad de posicionamiento en búsquedas</Text>
                        </TouchableOpacity>

                        {/* Payment Instructions & Form */}
                        {selectedPlan && (
                            <View style={styles.paymentSection}>
                                <Text style={styles.paymentTitle}>Reportar Pago Móvil</Text>
                                <Text style={styles.paymentSubtitle}>Realiza tu pago móvil y luego reporta el número de referencia aquí debajo. Monto a transferir: {selectedPlan === 'PRO' ? '700 Bs' : '1800 Bs'}</Text>
                                
                                <View style={{ backgroundColor: '#DBEAFE', padding: 12, borderRadius: 12, marginBottom: 20 }}>
                                    <Text style={{ fontSize: 13, color: '#1E40AF', fontWeight: 'bold' }}>Banco: BNC (0191)</Text>
                                    <Text style={{ fontSize: 13, color: '#1E40AF', fontWeight: 'bold', marginTop: 4 }}>C.I o RIF: J-12345678-9</Text>
                                    <Text style={{ fontSize: 13, color: '#1E40AF', fontWeight: 'bold', marginTop: 4 }}>Teléfono: 0424-1234567</Text>
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Número de Teléfono Emisor</Text>
                                    <TextInput 
                                        style={styles.input}
                                        placeholder="0414-XXXXXXX"
                                        keyboardType="phone-pad"
                                        value={phone}
                                        onChangeText={setPhone}
                                    />
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Número de Referencia</Text>
                                    <TextInput 
                                        style={styles.input}
                                        placeholder="Últimos 6 u 8 dígitos"
                                        keyboardType="numeric"
                                        value={reference}
                                        onChangeText={setReference}
                                    />
                                </View>

                                <TouchableOpacity 
                                    style={[styles.submitButton, (!phone || !reference || isLoading) && styles.submitButtonDisabled]}
                                    onPress={handleReportPayment}
                                    disabled={!phone || !reference || isLoading}
                                >
                                    <Text style={styles.submitButtonText}>{isLoading ? 'Procesando...' : 'Reportar Pago'}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        
                    </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '92%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 20,
    },
    dragHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#E2E8F0',
        borderRadius: 5,
        alignSelf: 'center',
        marginTop: 15,
        marginBottom: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    closeButton: {
        backgroundColor: '#F1F5F9',
        padding: 8,
        borderRadius: 20,
    },
    planCard: {
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 30,
        alignItems: 'center',
    },
    planBadgeText: {
        color: '#64748B',
        fontWeight: 'bold',
        fontSize: 12,
        marginBottom: 8,
    },
    planCardTitle: {
        fontSize: 32,
        fontWeight: '900',
        marginBottom: 8,
    },
    planDetailText: {
        fontSize: 14,
        color: '#475569',
        fontWeight: '600'
    },
    warningText: {
        color: '#EF4444',
        fontSize: 13,
        marginTop: 10,
        fontWeight: 'bold'
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 5,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 20,
        lineHeight: 20,
    },
    optionCard: {
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        backgroundColor: 'white'
    },
    optionCardSelected: {
        borderColor: '#2563EB',
        backgroundColor: '#EFF6FF'
    },
    optionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    optionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    optionPrice: {
        fontSize: 20,
        fontWeight: '900',
        color: '#2563EB',
    },
    optionPriceMonth: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: 'normal'
    },
    optionFeatures: {
        fontSize: 14,
        color: '#475569',
        marginTop: 8,
    },
    paymentSection: {
        backgroundColor: '#F8FAFC',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 40,
    },
    paymentTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 10,
    },
    paymentSubtitle: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 20,
        lineHeight: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#475569',
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 12,
        height: 50,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#1E293B',
    },
    submitButton: {
        backgroundColor: '#2563EB',
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    submitButtonDisabled: {
        backgroundColor: '#93C5FD',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
