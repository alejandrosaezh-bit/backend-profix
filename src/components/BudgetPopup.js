
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Image, Linking, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const BudgetPopup = ({ visible, budget, onClose, onAccept, onReject, request, startWithRejectForm = false }) => {
    const [rejectionReason, setRejectionReason] = useState("");
    const [showRejectForm, setShowRejectForm] = useState(startWithRejectForm);

    useEffect(() => {
        if (visible) {
            setShowRejectForm(startWithRejectForm);
        }
    }, [visible, startWithRejectForm]);

    if (!budget) return null;

    const handleCloseInternal = () => {
        setShowRejectForm(false);
        setRejectionReason("");
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCloseInternal}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
                <View style={{
                    backgroundColor: 'white',
                    borderTopLeftRadius: 36,
                    borderTopRightRadius: 36,
                    maxHeight: '90%',
                    width: '100%'
                }}>
                    {/* INDICADOR DE MODAL */}
                    <View style={{ width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, alignSelf: 'center', marginTop: 12, marginBottom: 8 }} />

                    {/* HEADER */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Image
                                source={{ uri: budget.proAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(budget.proName || 'P')}&background=random` }}
                                style={{ width: 48, height: 48, borderRadius: 24, marginRight: 15, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9' }}
                            />
                            <View>
                                <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E293B' }}>Presupuesto</Text>
                                <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>de {budget.proName || 'Profesional'}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={handleCloseInternal} style={{ backgroundColor: '#F1F5F9', padding: 8, borderRadius: 15 }}>
                            <Feather name="x" size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    {/* CONTENT (SCROLLABLE) */}
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}>
                        {showRejectForm ? (
                            <View style={{ marginTop: 10 }}>
                                <View style={{ backgroundColor: '#FEF2F2', padding: 20, borderRadius: 24, marginBottom: 25, borderWidth: 1, borderColor: '#FEE2E2' }}>
                                    <View style={{ backgroundColor: '#FEE2E2', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 15 }}>
                                        <Feather name="alert-circle" size={24} color="#EF4444" />
                                    </View>
                                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#991B1B', marginBottom: 12 }}>¿Deseas rechazar este presupuesto?</Text>
                                    <Text style={{ fontSize: 14, color: '#B91C1C', lineHeight: 22, opacity: 0.8 }}>
                                        Antes de cerrar, indica al profesional en qué no estás de acuerdo o qué quisieras agregar o eliminar. ¡También puedes lanzar una contraoferta para mejorar las condiciones!
                                    </Text>
                                </View>

                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#64748B', marginBottom: 10, marginLeft: 5 }}>MOTIVO O COMENTARIO</Text>
                                <TextInput
                                    placeholder="Escribe aquí tus observaciones..."
                                    multiline
                                    numberOfLines={4}
                                    style={{
                                        backgroundColor: '#F9FAFB',
                                        borderRadius: 20,
                                        padding: 18,
                                        fontSize: 15,
                                        marginBottom: 10,
                                        borderWidth: 1.5,
                                        borderColor: '#E2E8F0',
                                        minHeight: 120,
                                        textAlignVertical: 'top',
                                        color: '#1E293B'
                                    }}
                                    value={rejectionReason}
                                    onChangeText={setRejectionReason}
                                />
                            </View>
                        ) : (
                            <>
                                {/* HEADER SECTION - THE AMOUNT */}
                                <View style={{ backgroundColor: '#F0F7FF', borderRadius: 24, padding: 25, marginBottom: 25, borderWidth: 1, borderColor: '#E0EEFF', alignItems: 'center' }}>
                                    <View style={{ backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#DBEAFE' }}>
                                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#2563EB', letterSpacing: 1 }}>MONTO TOTAL DEL PROYECTO</Text>
                                    </View>
                                    <Text style={{ fontSize: 42, fontWeight: '900', color: '#1E3A8A' }}>
                                        {budget.currency || '$'} {Number(budget.amount || budget.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </Text>
                                    {budget.addTax && (
                                        <Text style={{ fontSize: 13, color: '#64748B', marginTop: 8, fontWeight: '500' }}>IVA incluido ({budget.taxRate || 16}%)</Text>
                                    )}
                                </View>

                                {/* ITEMS LIST */}
                                <View style={{ marginBottom: 25 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 }}>Detalle del Servicio</Text>
                                        <View style={{ height: 1, backgroundColor: '#F1F5F9', flex: 1, marginLeft: 10 }} />
                                    </View>
                                    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 }}>
                                        {budget.items && budget.items.length > 0 ? (
                                            budget.items.map((item, idx) => (
                                                <View key={idx} style={{ padding: 18, borderBottomWidth: idx === budget.items.length - 1 ? 0 : 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <View style={{ flex: 1, marginRight: 15 }}>
                                                        <Text style={{ fontSize: 15, color: '#1E293B', fontWeight: '600' }}>{item.description}</Text>
                                                    </View>
                                                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>
                                                        {budget.currency || '$'} {Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </Text>
                                                </View>
                                            ))
                                        ) : (
                                            <View style={{ padding: 20 }}>
                                                <Text style={{ color: '#64748B', fontStyle: 'italic', lineHeight: 22 }}>
                                                    {budget.descriptionLine || budget.description || 'Sin detalle de ítems adicionales.'}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {/* TERMS & CONDITIONS GRID */}
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 25 }}>
                                    {[
                                        { icon: 'calendar', label: 'INICIO', value: budget.startDate || 'A convenir', color: '#0369A1', bg: '#F0F9FF', bdr: '#E0F2FE' },
                                        { icon: 'clock', label: 'DURACIÓN', value: budget.duration || 'N/A', color: '#0369A1', bg: '#F0F9FF', bdr: '#E0F2FE' },
                                        { icon: 'credit-card', label: 'PAGO', value: budget.paymentTerms || 'Efectivo', color: '#15803D', bg: '#F0FDF4', bdr: '#DCFCE7' },
                                        { icon: 'shield', label: 'GARANTÍA', value: budget.warranty || 'No aplica', color: '#C2410C', bg: '#FFF7ED', bdr: '#FFEDD5' }
                                    ].map((term, i) => (
                                        <View key={i} style={{ width: '48%', backgroundColor: term.bg, padding: 15, borderRadius: 20, borderWidth: 1, borderColor: term.bdr }}>
                                            <View style={{ backgroundColor: 'white', width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10, elevation: 1 }}>
                                                <Feather name={term.icon} size={16} color={term.color} />
                                            </View>
                                            <Text style={{ fontSize: 10, fontWeight: '800', color: term.color, marginBottom: 4, letterSpacing: 0.5 }}>{term.label}</Text>
                                            <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B' }} numberOfLines={1}>{term.value}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* OBSERVATIONS */}
                                {(budget.conditions || budget.observations) && (
                                    <View style={{ marginBottom: 30, backgroundColor: '#F8FAFC', padding: 20, borderRadius: 24, borderLeftWidth: 5, borderLeftColor: '#CBD5E1' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                            <Feather name="file-text" size={14} color="#64748B" style={{ marginRight: 8 }} />
                                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1 }}>Condiciones Extra</Text>
                                        </View>
                                        <Text style={{ fontSize: 14, color: '#475569', lineHeight: 24 }}>{budget.conditions || budget.observations}</Text>
                                    </View>
                                )}

                                {/* SHARE SECTION */}
                                <View style={{ marginBottom: 35, alignItems: 'center' }}>
                                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#94A3B8', marginBottom: 20, letterSpacing: 1.5 }}>COMPARTIR PRESUPUESTO</Text>
                                    <View style={{ flexDirection: 'row', gap: 24 }}>
                                        <TouchableOpacity
                                            style={{ backgroundColor: '#25D366', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
                                            onPress={() => Linking.openURL(`whatsapp://send?text=Hola, te comparto el presupuesto de ${budget.proName} por un monto de ${budget.currency || '$'}${budget.price}.`)}
                                        >
                                            <FontAwesome5 name="whatsapp" size={26} color="white" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={{ backgroundColor: '#EA4335', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#EA4335', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
                                            onPress={() => Linking.openURL(`mailto:?subject=Presupuesto de ${budget.proName}&body=Adjunto los detalles del presupuesto por un monto de ${budget.currency || '$'}${budget.price}.`)}
                                        >
                                            <Feather name="mail" size={26} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </>
                        )}
                    </ScrollView>

                    {/* FIXED FOOTER WITH ACTION BUTTONS */}
                    <View style={{
                        paddingHorizontal: 24,
                        paddingTop: 16,
                        paddingBottom: Platform.OS === 'android' ? 40 : 40,
                        borderTopWidth: 1,
                        borderTopColor: '#F1F5F9',
                        backgroundColor: 'white'
                    }}>
                        {showRejectForm ? (
                            <View style={{ gap: 12 }}>
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: '#EF4444',
                                        paddingVertical: 18,
                                        borderRadius: 20,
                                        alignItems: 'center',
                                        elevation: 4,
                                        shadowColor: '#EF4444',
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.2,
                                        shadowRadius: 8
                                    }}
                                    onPress={() => {
                                        onReject(request?.id || request?._id, budget.proId, rejectionReason || "Rechazado por el cliente");
                                        handleCloseInternal();
                                    }}
                                >
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>CONFIRMAR RECHAZO</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{ paddingVertical: 8, alignItems: 'center' }}
                                    onPress={() => setShowRejectForm(false)}
                                >
                                    <Text style={{ color: '#64748B', fontWeight: 'bold' }}>Volver al presupuesto</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            budget.status !== 'accepted' ? (
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <TouchableOpacity
                                        style={{
                                            flex: 1,
                                            backgroundColor: '#EF4444',
                                            paddingVertical: 16,
                                            borderRadius: 20,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            elevation: 4,
                                            shadowColor: '#EF4444',
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.2,
                                            shadowRadius: 8
                                        }}
                                        onPress={() => setShowRejectForm(true)}
                                    >
                                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>RECHAZAR</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={{
                                            flex: 1,
                                            backgroundColor: '#10B981',
                                            paddingVertical: 16,
                                            borderRadius: 20,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            elevation: 6,
                                            shadowColor: '#10B981',
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.3,
                                            shadowRadius: 10
                                        }}
                                        onPress={() => {
                                            onAccept(request?.id || request?._id, budget.proId);
                                            onClose();
                                        }}
                                    >
                                        <Text style={{ color: 'white', fontWeight: '900', fontSize: 15 }}>ACEPTAR</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={{ backgroundColor: '#ECFDF5', padding: 18, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: '#A7F3D0', flexDirection: 'row', justifyContent: 'center' }}>
                                    <Feather name="check-circle" size={20} color="#059669" style={{ marginRight: 10 }} />
                                    <Text style={{ color: '#059669', fontWeight: 'bold', fontSize: 16 }}>PROPUESTA ACEPTADA</Text>
                                </View>
                            )
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default BudgetPopup;
