import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image, ActivityIndicator, Alert, Modal, Animated, Easing, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

import styles from '../styles/globalStyles';
import { DETAILED_CATEGORIES, CATEGORY_EXAMPLES, BLOG_POSTS, TESTIMONIALS, LOCATIONS_DATA, FLAT_ZONES_SUGGESTIONS, HOME_COPY_OPTIONS, ROTATION_KEY } from '../constants/data';
import { areIdsEqual, getClientStatus, getClientStatusColor, getProStatusColor, getProStatus, showAlert, showConfirmation, formatCurrency, formatDate } from '../utils/helpers';
import { CAT_ICONS, ICON_MAP, IconHogar, IconAuto, IconSalud, IconTech, IconBeauty, IconEvents, IconPets, IconLegal } from '../constants/icons';

const RatingForm = ({ onSubmit, revieweeName, isForPro, onCancel }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [answers, setAnswers] = useState({
        paidOnTime: true,
        clearInstructions: true,
        deliveredOnTime: true,
        qualityAsExpected: true,
        professionalism: true
    });

    const handleFormSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onSubmit({ rating, comment, answers });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={{ backgroundColor: '#F8FAFC', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#1F2937', marginBottom: 5 }}>Valorar a {revieweeName}</Text>
            <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginBottom: 15 }}>Tu opinión ayuda a mantener la calidad en Profesional Cercano</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }}>
                {[1, 2, 3, 4, 5].map(s => (
                    <TouchableOpacity key={s} onPress={() => setRating(s)}>
                        <FontAwesome5 name="star" solid={s <= rating} size={28} color={s <= rating ? '#F59E0B' : '#E2E8F0'} style={{ marginHorizontal: 4 }} />
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#4B5563', marginBottom: 12 }}>Preguntas rápidas:</Text>

            {isForPro ? (
                <>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontSize: 12, color: '#374151' }}>¿Cumplió con los tiempos?</Text>
                        <Switch value={answers.deliveredOnTime} onValueChange={v => setAnswers({ ...answers, deliveredOnTime: v })} trackColor={{ true: '#10B981' }} />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontSize: 12, color: '#374151' }}>¿Calidad esperada?</Text>
                        <Switch value={answers.qualityAsExpected} onValueChange={v => setAnswers({ ...answers, qualityAsExpected: v })} trackColor={{ true: '#10B981' }} />
                    </View>
                </>
            ) : (
                <>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontSize: 12, color: '#374151' }}>¿Pagó a tiempo?</Text>
                        <Switch value={answers.paidOnTime} onValueChange={v => setAnswers({ ...answers, paidOnTime: v })} trackColor={{ true: '#10B981' }} />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontSize: 12, color: '#374151' }}>¿Instrucciones claras?</Text>
                        <Switch value={answers.clearInstructions} onValueChange={v => setAnswers({ ...answers, clearInstructions: v })} trackColor={{ true: '#10B981' }} />
                    </View>
                </>
            )}

            <TextInput
                placeholder="Cuéntanos más sobre tu experiencia..."
                value={comment}
                onChangeText={setComment}
                multiline
                style={{ backgroundColor: 'white', borderRadius: 12, padding: 12, height: 70, fontSize: 13, marginTop: 5, borderWidth: 1, borderColor: '#E2E8F0' }}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                {onCancel && (
                    <TouchableOpacity onPress={onCancel} style={{ flex: 1, height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' }}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#64748B' }}>Ahora no</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    onPress={handleFormSubmit}
                    disabled={isSubmitting}
                    style={{ flex: 2, height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F59E0B', opacity: isSubmitting ? 0.7 : 1 }}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : (
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: 'white' }}>ENVIAR VALORACIÓN</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default RatingForm;
