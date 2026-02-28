import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const ManageJobScreen = ({ job, userMode, onBack, onAddTimelineEvent, onConfirmStart, onFinish }) => {
    React.useEffect(() => { }, []);
    const [note, setNote] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [loading, setLoading] = useState(false);

    // Determine current stage for the stepper
    // 0: Antes, 1: Durante, 2: Después
    let currentStage = 0;
    if (job.trackingStatus === 'started' && !job.proFinished) {
        currentStage = 1;
    } else if (job.proFinished || job.trackingStatus === 'finished' || ['completed', 'TERMINADO', 'rated'].includes(job.status)) {
        currentStage = 2;
    }

    const handlePickMedia = async (type) => {
        let result;
        const options = {
            mediaTypes: type === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
            quality: 0.5,
            base64: true,
        };

        if (type === 'camera') {
            result = await ImagePicker.launchCameraAsync(options);
        } else {
            result = await ImagePicker.launchImageLibraryAsync(options);
        }

        if (!result.canceled) {
            setLoading(true);
            const asset = result.assets[0];
            const photoType = currentStage === 0 ? 'Foto "Antes"' : (currentStage === 1 ? 'Foto "Durante"' : 'Foto "Después"');

            try {
                await onAddTimelineEvent({
                    eventType: 'photo_uploaded',
                    title: photoType,
                    description: `Evidencia visual de la etapa: ${stageNames[currentStage]}`,
                    mediaUrl: asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri,
                    isPrivate
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleAddNote = async () => {
        if (!note.trim()) return;
        setLoading(true);
        try {
            await onAddTimelineEvent({
                eventType: 'note_added',
                title: 'Nota Agregada',
                description: note,
                isPrivate
            });
            setNote('');
        } finally {
            setLoading(false);
        }
    };

    const handleMainAction = () => {
        if (currentStage === 0) {
            onConfirmStart();
        } else if (currentStage === 1) {
            onFinish();
        }
    };

    const stageNames = ['Antes', 'Durante', 'Después'];

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Custom Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color="#1E3A8A" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <View style={styles.logoCircle}>
                            <Feather name="tool" size={16} color="white" />
                        </View>
                        <Text style={styles.headerTitle}>Profesional Cercano</Text>
                    </View>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Progress Stepper */}
                    <View style={styles.stepperContainer}>
                        <View style={styles.stepperWrapper}>
                            {stageNames.map((name, index) => (
                                <View key={index} style={styles.stepItem}>
                                    <View style={[
                                        styles.stepLine,
                                        index === 0 && { width: 0 },
                                        index <= currentStage && styles.stepLineActive
                                    ]} />
                                    <View style={[
                                        styles.stepIndicator,
                                        index <= currentStage && styles.stepIndicatorActive
                                    ]}>
                                        {index < currentStage ? (
                                            <Feather name="check" size={12} color="white" />
                                        ) : (
                                            <View style={[
                                                styles.stepDot,
                                                index === currentStage && styles.stepDotActive
                                            ]} />
                                        )}
                                    </View>
                                    <Text style={[
                                        styles.stepText,
                                        index === currentStage && styles.stepTextActive
                                    ]}>{name}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Actions Card */}
                    <View style={styles.card}>
                        <View style={styles.actionsGrid}>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#F1F5F9' }]}
                                onPress={() => handlePickMedia('library')}
                            >
                                <View style={styles.actionIconContainer}>
                                    <Feather name="file-text" size={24} color="#334155" />
                                </View>
                                <Text style={styles.actionText}>Archivo</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#DBEAFE' }]}
                                onPress={() => handlePickMedia('camera')}
                            >
                                <View style={styles.actionIconContainer}>
                                    <Feather name="camera" size={24} color="#2563EB" />
                                </View>
                                <Text style={styles.actionText}>Foto</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}
                                onPress={() => handlePickMedia('video')}
                            >
                                <View style={styles.actionIconContainer}>
                                    <Feather name="video" size={24} color="#EF4444" />
                                </View>
                                <Text style={styles.actionText}>Vídeo</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Notes Input */}
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Campo de Notas"
                                placeholderTextColor="#94A3B8"
                                value={note}
                                onChangeText={setNote}
                                multiline
                            />
                        </View>

                        {/* Privacy Toggles */}
                        <View style={styles.privacyContainer}>
                            <TouchableOpacity
                                style={[styles.privacyBtn, isPrivate && styles.privacyBtnActive]}
                                onPress={() => setIsPrivate(true)}
                            >
                                <Feather name="lock" size={18} color={isPrivate ? '#FFF' : '#1E3A8A'} />
                                <Text style={[styles.privacyText, isPrivate && styles.privacyTextActive]}>Subir como Privado</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.privacyBtn, !isPrivate && styles.privacyBtnActive]}
                                onPress={() => setIsPrivate(false)}
                            >
                                <Feather name="eye" size={18} color={!isPrivate ? '#FFF' : '#1E3A8A'} />
                                <Text style={[styles.privacyText, !isPrivate && styles.privacyTextActive]}>Subir como Público</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Submit Note Button (Optional, but useful if note is filled) */}
                    {note.trim().length > 0 && (
                        <TouchableOpacity style={styles.saveNoteBtn} onPress={handleAddNote}>
                            <Text style={styles.saveNoteText}>Guardar Nota</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>

                {/* Footer Action Button */}
                <View style={styles.footer}>
                    {currentStage < 2 ? (
                        <TouchableOpacity
                            style={styles.mainActionBtn}
                            onPress={handleMainAction}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.mainActionText}>
                                    {currentStage === 0 ? 'Iniciar Trabajo' : 'Finalizar Trabajo'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.finishedBadge}>
                            <Feather name="check-circle" size={24} color="#10B981" />
                            <Text style={styles.finishedText}>Trabajo Concluido</Text>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backButton: {
        padding: 8,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E2937',
    },
    scrollContent: {
        padding: 24,
    },
    stepperContainer: {
        marginBottom: 32,
    },
    stepperWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    stepItem: {
        alignItems: 'center',
        flex: 1,
    },
    stepLine: {
        position: 'absolute',
        top: 15,
        left: -50,
        right: 50,
        height: 4,
        backgroundColor: '#E2E8F0',
        zIndex: -1,
    },
    stepLineActive: {
        backgroundColor: '#2563EB',
    },
    stepIndicator: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    stepIndicatorActive: {
        backgroundColor: '#2563EB',
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#94A3B8',
    },
    stepDotActive: {
        backgroundColor: 'white',
    },
    stepText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    stepTextActive: {
        color: '#1E2937',
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    actionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    actionBtn: {
        flex: 1,
        marginHorizontal: 5,
        height: 90,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionIconContainer: {
        marginBottom: 8,
    },
    actionText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E2937',
    },
    inputWrapper: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 15,
        marginBottom: 24,
    },
    textInput: {
        fontSize: 16,
        color: '#1E2937',
        minHeight: 100,
        textAlignVertical: 'top',
    },
    privacyContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    privacyBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#2563EB',
    },
    privacyBtnActive: {
        backgroundColor: '#2563EB',
    },
    privacyText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#2563EB',
        marginLeft: 8,
    },
    privacyTextActive: {
        color: 'white',
    },
    saveNoteBtn: {
        marginTop: 15,
        alignSelf: 'center',
    },
    saveNoteText: {
        color: '#2563EB',
        fontWeight: 'bold',
        fontSize: 14,
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    mainActionBtn: {
        backgroundColor: '#2563EB',
        borderRadius: 20,
        paddingVertical: 18,
        alignItems: 'center',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    mainActionText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    finishedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    finishedText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#10B981',
        marginLeft: 10,
    }
});

export default ManageJobScreen;
