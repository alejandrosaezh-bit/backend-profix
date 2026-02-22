import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image, ActivityIndicator, Alert, Modal, Animated, Easing, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

import styles from '../styles/globalStyles';
import { DETAILED_CATEGORIES, CATEGORY_EXAMPLES, BLOG_POSTS, TESTIMONIALS, LOCATIONS_DATA, FLAT_ZONES_SUGGESTIONS, HOME_COPY_OPTIONS, ROTATION_KEY } from '../constants/data';
import { areIdsEqual, getClientStatus, getClientStatusColor, getProStatusColor, getProStatus, showAlert, showConfirmation, formatCurrency, formatDate } from '../utils/helpers';
import { CAT_ICONS, ICON_MAP, IconHogar, IconAuto, IconSalud, IconTech, IconBeauty, IconEvents, IconPets, IconLegal } from '../constants/icons';

const CloseRequestModal = ({ visible, onClose, onSubmit, offers }) => {
    const [reason, setReason] = useState('Lo hice con alguien de Profesional Cercano');
    const [selectedPro, setSelectedPro] = useState(null);

    const reasons = [
        'Lo hice con alguien de Profesional Cercano',
        'Lo hice por fuera de la app',
        'Ya no deseo realizar el trabajo',
        'Otros'
    ];

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
                <View style={{ backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '80%' }}>
                    <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1F2937', marginBottom: 10 }}>Cerrar Solicitud</Text>
                    <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>Ayúdanos a mejorar. ¿Porqué cierras esta solicitud?</Text>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {reasons.map((r, i) => (
                            <TouchableOpacity
                                key={i}
                                onPress={() => {
                                    setReason(r);
                                    if (r !== 'Lo hice con alguien de Profesional Cercano') setSelectedPro(null);
                                }}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: 15,
                                    borderRadius: 12,
                                    backgroundColor: reason === r ? '#EFF6FF' : '#F9FAFB',
                                    marginBottom: 10,
                                    borderWidth: 1,
                                    borderColor: reason === r ? '#2563EB' : 'transparent'
                                }}
                            >
                                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: reason === r ? '#2563EB' : '#D1D5DB', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                    {reason === r && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#2563EB' }} />}
                                </View>
                                <Text style={{ color: reason === r ? '#1E40AF' : '#4B5563', fontWeight: reason === r ? 'bold' : 'normal' }}>{r}</Text>
                            </TouchableOpacity>
                        ))}

                        {reason === 'Lo hice con alguien de Profesional Cercano' && (
                            <View style={{ marginTop: 15 }}>
                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 10 }}>¿Con quién realizaste el trabajo?</Text>
                                {offers && offers.length > 0 ? (
                                    offers.map((off, i) => (
                                        <TouchableOpacity
                                            key={i}
                                            onPress={() => setSelectedPro(off.proId)}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                padding: 12,
                                                borderRadius: 12,
                                                backgroundColor: selectedPro === off.proId ? '#ECFDF5' : 'white',
                                                borderWidth: 1,
                                                borderColor: selectedPro === off.proId ? '#10B981' : '#F1F5F9',
                                                marginBottom: 8
                                            }}
                                        >
                                            <Image source={{ uri: off.proImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(off.proName || 'Pro')}&background=random` }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
                                            <Text style={{ flex: 1, fontWeight: 'bold', color: '#1F2937' }}>{off.proName}</Text>
                                            <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: selectedPro === off.proId ? '#10B981' : '#D1D5DB', justifyContent: 'center', alignItems: 'center' }}>
                                                {selectedPro === off.proId && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' }} />}
                                            </View>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <Text style={{ color: '#9CA3AF', fontStyle: 'italic', padding: 10 }}>No hay ofertas disponibles para seleccionar.</Text>
                                )}
                            </View>
                        )}
                    </ScrollView>

                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                        <TouchableOpacity
                            onPress={onClose}
                            style={{ flex: 1, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }}
                        >
                            <Text style={{ fontWeight: 'bold', color: '#6B7280' }}>Volver</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => onSubmit({ closureReason: reason, hiredProId: selectedPro })}
                            style={{ flex: 1, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EF4444' }}
                        >
                            <Text style={{ fontWeight: 'bold', color: 'white' }}>Cerrar Solicitud</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default CloseRequestModal;
