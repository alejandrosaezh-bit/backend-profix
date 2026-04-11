import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../utils/api';
import RatingForm from './RatingForm';




const ProjectTimeline = ({ job, userMode, currentUser, onConfirmStart, onAddTimelineEvent, onFinish, onRate, onTogglePortfolio, onViewImage, showSection = 'all', customTitle = null }) => {
    const areIdsEqual = (id1, id2) => {
        if (!id1 || !id2) return false;
        const s1 = (typeof id1 === 'object' && id1 !== null) ? (id1._id || id1.id || id1.toString()) : String(id1);
        const s2 = (typeof id2 === 'object' && id2 !== null) ? (id2._id || id2.id || id2.toString()) : String(id2);
        return s1 === s2;
    };

    const [loading, setLoading] = useState(false);

    const handleTogglePrivacy = async (event) => {
        try {
            setLoading(true);
            const updatedJob = await api.toggleTimelineEventPrivacy(job._id || job.id, event.timestamp);
            if (onAddTimelineEvent) {
                // To force a refresh we can just call an empty update or relies on polling/sockets
                // But since job state is usually maintained by the parent, we might need a prop like onUpdateJob
                // Since we don't have it explicitly, we can show an alert that it was changed
                Alert.alert("Éxito", `El evento ahora es ${!event.isPrivate ? 'Privado' : 'Público'}. Los cambios se verán reflejados en breve.`);
            }
        } catch (error) {
            console.error("Error toggling privacy:", error);
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    // ... rest of state
    const [note, setNote] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [date, setDate] = useState(new Date());

    const [showMediaModal, setShowMediaModal] = useState(false);
    const [pendingMediaType, setPendingMediaType] = useState(null);

    // Get user's current portfolio for this specific category
    const categoryTitle = typeof job.category === 'string' ? job.category : (job.category?.name || 'General');
    const portfolioGallery = currentUser?.profiles?.[categoryTitle]?.gallery || [];

    const events = [...(job.projectHistory || [])];

    const revieweeName = userMode === 'client'
        ? (job.professionalName || job.professional?.name || 'Profesional')
        : (job.clientName || job.client?.name || 'Cliente');

    const handleRatingSubmit = async (reviewData) => {
        await onRate(reviewData);
    };

    // Determine current stage for the stepper
    // 0: Antes, 1: Durante, 2: Después, 3: Valoración
    let currentStage = 0;

    const isITheWinner = userMode === 'pro' && ((job.professional && areIdsEqual(job.professional._id || job.professional, currentUser?._id)) ||
        (job.offers?.some(o => areIdsEqual(o.proId?._id || o.proId, currentUser?._id) && o.status === 'accepted')));

    // For client, isAccepted means a professional is already working on it
    const isAccepted = userMode === 'pro' ? isITheWinner : (!!job.professional || job.offers?.some(o => o.status === 'accepted'));
    const isFinished = ['completed', 'finished', 'rated', 'TERMINADO', 'FINALIZADA', 'Culminada'].includes(job.status) || job.clientFinished || job.proFinished;

    if (isFinished) {
        currentStage = 3;
    } else if (job.proFinished || job.trackingStatus === 'finished') {
        currentStage = 2;
    } else if (job.trackingStatus === 'started') {
        currentStage = 1;
    }

    const stageNames = ['Antes', 'Durante', 'Después', 'Valoración'];

    const handlePickMedia = (type) => {
        setPendingMediaType(type);
        setShowMediaModal(true);
    };

    const executePickMedia = async (isMediaPrivate) => {
        setShowMediaModal(false);
        const type = pendingMediaType;
        if (!type) return;

        let result;
        const options = {
            mediaTypes: type === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
            quality: 0.5,
            base64: true,
            allowsMultipleSelection: type !== 'camera',
        };

        if (type === 'camera') {
            result = await ImagePicker.launchCameraAsync(options);
        } else {
            result = await ImagePicker.launchImageLibraryAsync(options);
        }

        if (!result.canceled) {
            setLoading(true);
            try {
                const photoType = currentStage === 0 ? 'Foto "Antes"' : (currentStage === 1 ? 'Foto "Durante"' : 'Foto "Después"');

                // Process each asset
                for (const asset of result.assets) {
                    await onAddTimelineEvent({
                        eventType: 'photo_uploaded',
                        title: photoType,
                        description: `Evidencia visual de la etapa: ${stageNames[currentStage]}`,
                        mediaUrl: asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri,
                        isPrivate: isMediaPrivate
                    });
                }
            } finally {
                setLoading(false);
                setPendingMediaType(null);
            }
        } else {
            setPendingMediaType(null);
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
            setShowNoteModal(false);
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

    // Inject Creation Event locally for display (only if not already in history)
    const hasCreationEvent = job.projectHistory?.some(e => e.eventType === 'job_created');
    if (job.createdAt && !hasCreationEvent) {
        events.push({
            eventType: 'job_created',
            title: 'Solicitud Creada',
            description: `Inicio del seguimiento de: ${job.title}`,
            timestamp: job.createdAt,
            actor: job.client || { _id: 'system', name: 'Sistema' },
            isPrivate: false
        });
    }

    // --- INJECT BUDGET EVENTS FROM OFFERS ---
    if (job.offers && Array.isArray(job.offers)) {
        job.offers.forEach(offer => {
            const actor = { _id: offer.proId, name: offer.proName || 'Profesional' };

            // Offer Sent
            if (offer.createdAt) {
                const hasSentEvent = job.projectHistory?.some(e => e.eventType === 'offer_sent' && e.actor?._id === offer.proId);
                if (!hasSentEvent) {
                    events.push({
                        eventType: 'offer_sent',
                        title: 'Presupuesto Enviado',
                        description: `El profesional ${offer.proName || 'Profesional'} envió una propuesta por ${job.currency || offer.currency || '$'} ${offer.amount || offer.price || '0'}`,
                        timestamp: offer.createdAt,
                        actor: actor,
                        isPrivate: false
                    });
                }
            }

            // Offer Accepted
            if (offer.status === 'accepted' && offer.acceptedAt) {
                const hasAcceptedEvent = job.projectHistory?.some(e => e.eventType === 'offer_accepted');
                if (!hasAcceptedEvent) {
                    events.push({
                        eventType: 'offer_accepted',
                        title: 'Presupuesto Aceptado',
                        description: 'El cliente ha aceptado la propuesta del profesional.',
                        timestamp: offer.acceptedAt,
                        actor: job.client || { name: 'Cliente' },
                        isPrivate: false
                    });
                }
            }

            // Offer Rejected
            if (offer.status === 'rejected' && offer.rejectedAt) {
                events.push({
                    eventType: 'offer_rejected',
                    title: 'Presupuesto Rechazado',
                    description: `La propuesta fue rechazada. Motivo: ${offer.rejectionReason || 'No especificado'}`,
                    timestamp: offer.rejectedAt,
                    actor: job.client || { name: 'Cliente' },
                    isPrivate: false
                });
            }
        });
    }

    // --- INJECT LEGACY DATA (From Removed "Gestionar Trabajo") ---
    if (job.clientManagement) {
        if (job.clientManagement.beforePhotos) {
            job.clientManagement.beforePhotos.forEach(p => {
                events.push({
                    eventType: 'photo_uploaded',
                    title: 'Foto "Antes" (Importada)',
                    description: 'Foto registrada en gestión anterior.',
                    mediaUrl: p.url,
                    timestamp: p.uploadedAt,
                    actor: job.client || { _id: 'system', name: 'Cliente' },
                    isPrivate: false
                });
            });
        }
    }

    // Sort: Newest First
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const visibleEvents = events.filter(e => {
        if (!e.isPrivate) return true;
        // Si es privado, SOLO el autor puede verlo, siempre.
        const actorId = e.actor?._id || e.actor;
        return actorId?.toString() === currentUser?._id?.toString();
    });

    return (
        <View style={{ marginTop: 8 }}>
            {/* PANEL DE GESTIÓN INTEGRADO (Solo si es el Pro y no ha terminado, o si el cliente tiene permisos) */}
            {/* PANEL DE GESTIÓN INTEGRADO (Unificado para Pro y Cliente) */}
            {(showSection === 'all' || showSection === 'management') && (
                <View style={[styles.managementCard, !isAccepted && { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', overflow: 'hidden' }]}>
                    {/* Bloqueo Visual */}
                    {!isAccepted && (
                        <View style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(248, 250, 252, 0.4)',
                            zIndex: 100,
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 50, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
                                <Feather name="lock" size={24} color="#94A3B8" />
                            </View>
                            <Text style={{ color: '#64748B', fontWeight: 'bold', fontSize: 13, marginTop: 12, textAlign: 'center', paddingHorizontal: 40 }}>
                                {userMode === 'pro'
                                    ? "Esta sección se activará cuando el cliente acepte tu presupuesto."
                                    : "Esta sección se activará cuando aceptes un presupuesto."
                                }
                            </Text>
                        </View>
                    )}

                    <View style={[!isAccepted && { opacity: 0.4 }]}>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <View>
                                <Text style={[styles.managementTitle, !isAccepted && { color: '#94A3B8' }]}>
                                    {userMode === 'pro' ? 'Gestión de Avances' : 'Gestión de Avance'}
                                </Text>
                            </View>
                        </View>

                        {/* Journey Map Stepper */}
                        <View style={[styles.journeyContainer, !isAccepted && { opacity: 0.4 }]}>
                            {stageNames.map((name, index) => {
                                const isActive = isAccepted && index === currentStage;
                                const isCompleted = isAccepted && index < currentStage;
                                const themeColor = userMode === 'pro' ? '#2563EB' : '#EA580C';
                                const inactiveColor = userMode === 'pro' ? '#DBEAFE' : '#FFEDD5';
                                const activeTextColor = 'white';
                                const inactiveTextColor = userMode === 'pro' ? '#1E3A8A' : '#9A3412';

                                const bgColor = (isActive || isCompleted) ? themeColor : inactiveColor;
                                const textColor = (isActive || isCompleted) ? activeTextColor : inactiveTextColor;

                                return (
                                    <View key={index} style={[styles.journeyStep, { zIndex: 10 - index }]}>
                                        <View style={[styles.journeyBlock, { backgroundColor: bgColor }]}>
                                            {index > 0 && <View style={styles.leftCutout} />}
                                            <Text style={[styles.journeyText, { color: textColor }]}>{name}</Text>
                                            <View style={[styles.rightPoint, { borderLeftColor: bgColor }]} />
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Instructional Text */}
                        {isAccepted && (
                            <View style={styles.instructionBox}>
                                <Feather name="info" size={14} color="#64748B" style={{ marginRight: 6 }} />
                                <Text style={styles.instructionText}>
                                    {userMode === 'pro' ? (
                                        currentStage === 0 ? "Registra el estado inicial del sitio antes de comenzar." :
                                            currentStage === 1 ? "Sube avances del proceso para dar tranquilidad al cliente." :
                                                currentStage === 2 ? "Registra el resultado final para cerrar el servicio con éxito." :
                                                    "Trabajo finalizado. ¡Gracias por usar ProFix!"
                                    ) : (
                                        currentStage === 0 ? "El profesional está preparando el inicio de la labor." :
                                            currentStage === 1 ? "El trabajo está en curso. Revisa el historial para ver fotos del avance." :
                                                currentStage === 2 ? "Recuerda subir fotos del trabajo final para tu control y portafolio de trabajos realizados." :
                                                    "¡Trabajo finalizado! No olvides calificar el servicio."
                                    )}
                                </Text>
                            </View>
                        )}

                        {/* Actions Grid (Show for pro, and also for client if they want to contribute?) */}
                        {/* User requested 'igual', so we show controls if accepted, or at least common actions */}
                        <View style={[styles.actionsGrid, !isAccepted && { opacity: 0.3 }]}>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#F1F5F9' }]}
                                onPress={() => handlePickMedia('library')}
                                disabled={!isAccepted}
                            >
                                <Feather name="file-text" size={18} color="#334155" />
                                <Text style={styles.actionBtnText}>Archivo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: userMode === 'pro' ? '#DBEAFE' : '#FFEDD5' }]}
                                onPress={() => handlePickMedia('camera')}
                                disabled={!isAccepted}
                            >
                                <Feather name="camera" size={18} color={userMode === 'pro' ? '#2563EB' : '#EA580C'} />
                                <Text style={styles.actionBtnText}>Foto</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}
                                onPress={() => handlePickMedia('video')}
                                disabled={!isAccepted}
                            >
                                <Feather name="video" size={18} color="#EF4444" />
                                <Text style={styles.actionBtnText}>Vídeo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#F3F4F6' }]}
                                onPress={() => setShowNoteModal(true)}
                                disabled={!isAccepted}
                            >
                                <Feather name="edit-3" size={18} color="#4B5563" />
                                <Text style={styles.actionBtnText}>Nota</Text>
                            </TouchableOpacity>
                        </View>



                        {/* Main action btn ONLY for PRO or very specific client action */}
                        {userMode === 'pro' && currentStage < 2 && isAccepted && (
                            <TouchableOpacity
                                onPress={handleMainAction}
                                style={[
                                    styles.mainActionBtn,
                                    { backgroundColor: currentStage === 0 ? '#2563EB' : '#10B981' }
                                ]}
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator color="white" /> : (
                                    <Text style={styles.mainActionText}>
                                        {currentStage === 0 ? 'Iniciar Obra / Trabajo' : 'Cambiar Estado a: TERMINADO'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}

                        {/* MODAL PARA ELEGIR PRIVACIDAD DE MEDIOS */}
                        <Modal
                            visible={showMediaModal}
                            transparent
                            animationType="fade"
                            onRequestClose={() => setShowMediaModal(false)}
                        >
                            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                                <View style={{ backgroundColor: 'white', borderRadius: 28, padding: 24, width: '100%', elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10 }}>
                                    <Text style={{ fontSize: 20, fontWeight: '900', color: '#1E293B', marginBottom: 8, textAlign: 'center' }}>
                                        Visibilidad del Archivo
                                    </Text>
                                    <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 28, paddingHorizontal: 10, lineHeight: 18 }}>
                                        Selecciona quién podrá ver los archivos que vas a subir al historial.
                                    </Text>

                                    <View style={{ gap: 14 }}>
                                        <TouchableOpacity
                                            onPress={() => executePickMedia(false)}
                                            style={{ backgroundColor: '#F0F9FF', borderColor: '#E0F2FE', borderWidth: 1, padding: 18, borderRadius: 20, flexDirection: 'row', alignItems: 'center' }}
                                        >
                                            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                                <Feather name="eye" size={22} color="#0284C7" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0369A1' }}>Completamente Público</Text>
                                                <Text style={{ fontSize: 12, color: '#0284C7', marginTop: 3 }}>Será visible para ambas partes.</Text>
                                            </View>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => executePickMedia(true)}
                                            style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderWidth: 1, padding: 18, borderRadius: 20, flexDirection: 'row', alignItems: 'center' }}
                                        >
                                            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                                <Feather name="lock" size={22} color="#475569" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#334155' }}>Solo para mí (Privado)</Text>
                                                <Text style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>Para bitácora interna, uso personal.</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>

                                    <TouchableOpacity onPress={() => setShowMediaModal(false)} style={{ marginTop: 24, alignItems: 'center', paddingVertical: 12 }}>
                                        <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#64748B' }}>Cancelar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Modal>

                        {/* MODAL PARA AGREGAR NOTA */}
                        <Modal
                            visible={showNoteModal}
                            transparent
                            animationType="slide"
                            onRequestClose={() => setShowNoteModal(false)}
                        >
                            <KeyboardAvoidingView
                                behavior={Platform.OS === "ios" ? "padding" : "height"}
                                style={{ flex: 1 }}
                            >
                                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
                                    <View style={{
                                        backgroundColor: 'white',
                                        borderTopLeftRadius: 36,
                                        borderTopRightRadius: 36,
                                        padding: 24,
                                        paddingTop: 12,
                                        maxHeight: '90%',
                                        width: '100%'
                                    }}>
                                        {/* INDICADOR DE MODAL (Drag Handle) */}
                                        <View style={{ width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, alignSelf: 'center', marginBottom: 15 }} />

                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                                            <View>
                                                <Text style={{ fontSize: 22, fontWeight: '900', color: '#1E293B' }}>Agregar Nota</Text>
                                                <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>Registro para el historial</Text>
                                            </View>
                                            <TouchableOpacity onPress={() => setShowNoteModal(false)} style={{ backgroundColor: '#F1F5F9', padding: 8, borderRadius: 15 }}>
                                                <Feather name="x" size={24} color="#64748B" />
                                            </TouchableOpacity>
                                        </View>

                                        <ScrollView showsVerticalScrollIndicator={false}>
                                            <TextInput
                                                style={{
                                                    backgroundColor: '#F8FAFC',
                                                    borderRadius: 24,
                                                    borderWidth: 1.5,
                                                    borderColor: '#E2E8F0',
                                                    padding: 20,
                                                    fontSize: 16,
                                                    color: '#1E293B',
                                                    minHeight: 180,
                                                    textAlignVertical: 'top',
                                                    marginBottom: 25,
                                                    lineHeight: 24
                                                }}
                                                placeholder={userMode === 'pro' ? "Escribe una nota detallada para el historial del proyecto..." : "Escribe una observación para el profesional..."}
                                                value={note}
                                                onChangeText={setNote}
                                                multiline
                                                autoFocus
                                            />

                                            <View style={{ marginBottom: 30 }}>
                                                <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>VISIBILIDAD DE LA NOTA</Text>
                                                <View style={{ flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 18, padding: 5 }}>
                                                    <TouchableOpacity
                                                        onPress={() => setIsPrivate(false)}
                                                        style={{
                                                            flex: 1,
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            paddingVertical: 14,
                                                            borderRadius: 14,
                                                            backgroundColor: !isPrivate ? (userMode === 'pro' ? '#2563EB' : '#EA580C') : 'transparent',
                                                            gap: 10,
                                                            elevation: !isPrivate ? 2 : 0
                                                        }}
                                                    >
                                                        <Feather name="eye" size={18} color={!isPrivate ? 'white' : '#64748B'} />
                                                        <Text style={{ fontWeight: 'bold', color: !isPrivate ? 'white' : '#64748B', fontSize: 15 }}>Público</Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        onPress={() => setIsPrivate(true)}
                                                        style={{
                                                            flex: 1,
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            paddingVertical: 14,
                                                            borderRadius: 14,
                                                            backgroundColor: isPrivate ? '#1E293B' : 'transparent',
                                                            gap: 10,
                                                            elevation: isPrivate ? 2 : 0
                                                        }}
                                                    >
                                                        <Feather name="lock" size={18} color={isPrivate ? 'white' : '#64748B'} />
                                                        <Text style={{ fontWeight: 'bold', color: isPrivate ? 'white' : '#64748B', fontSize: 15 }}>Privado</Text>
                                                    </TouchableOpacity>
                                                </View>

                                                <View style={{ marginTop: 15, backgroundColor: '#F0F9FF', padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: '#E0F2FE' }}>
                                                    <Feather name="info" size={16} color="#0369A1" style={{ marginRight: 10, marginTop: 2 }} />
                                                    <Text style={{ flex: 1, color: '#0369A1', fontSize: 13, lineHeight: 20, fontWeight: '500' }}>
                                                        {!isPrivate
                                                            ? "Este mensaje será visible para ambas partes (Cliente y Profesional) en el historial."
                                                            : "Este mensaje es estrictamente privado y SOLO tú podrás verlo. Ideal para gastos personales, recordatorios o bitácora interna."
                                                        }
                                                    </Text>
                                                </View>
                                            </View>

                                            <TouchableOpacity
                                                onPress={handleAddNote}
                                                disabled={loading || !note.trim()}
                                                style={{
                                                    backgroundColor: userMode === 'pro' ? '#2563EB' : '#EA580C',
                                                    paddingVertical: 18,
                                                    borderRadius: 24,
                                                    alignItems: 'center',
                                                    marginBottom: Platform.OS === 'ios' ? 20 : 0,
                                                    opacity: (!note.trim() || loading) ? 0.6 : 1,
                                                    shadowColor: userMode === 'pro' ? '#2563EB' : '#EA580C',
                                                    shadowOffset: { width: 0, height: 6 },
                                                    shadowOpacity: 0.3,
                                                    shadowRadius: 12,
                                                    elevation: 6
                                                }}
                                            >
                                                {loading ? (
                                                    <ActivityIndicator color="white" />
                                                ) : (
                                                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 17 }}>Agregar Nota al Historial</Text>
                                                )}
                                            </TouchableOpacity>
                                        </ScrollView>
                                    </View>
                                </View>
                            </KeyboardAvoidingView>
                        </Modal>

                    </View>
                </View>
            )}

            {/* SECCIÓN DE VALORACIÓN (Always visible, but disabled if not finished or not the winner) */}
            {(showSection === 'all' || showSection === 'rating') && (
                <View style={[styles.managementCard, !(isFinished && (userMode === 'client' || isITheWinner)) && { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', padding: 0, overflow: 'hidden' }]}>
                    <View style={[{ padding: 20 }, !(isFinished && (userMode === 'client' || isITheWinner)) && { opacity: 0.4 }]}>
                        <Text style={styles.managementTitle}>{customTitle || 'Valoración del Servicio'}</Text>
                        {((userMode === 'client' && job.clientRated) || (userMode === 'pro' && job.proRated)) ? (
                            <View style={{ alignItems: 'center', padding: 20, backgroundColor: '#ECFDF5', borderRadius: 16, marginTop: 15 }}>
                                <Feather name="check-circle" size={32} color="#10B981" />
                                <Text style={{ color: '#065F46', fontWeight: 'bold', fontSize: 15, marginTop: 10, textAlign: 'center' }}>
                                    ¡Gracias por tu valoración!
                                </Text>
                                <Text style={{ color: '#047857', fontSize: 13, marginTop: 4, textAlign: 'center' }}>
                                    Tu opinión ayuda a mejorar la comunidad de Profesional Cercano.
                                </Text>
                            </View>
                        ) : (
                            <View style={{ position: 'relative' }}>
                                {!(isFinished && (userMode === 'client' || isITheWinner)) && (
                                    <View style={{
                                        position: 'absolute',
                                        top: -20, left: -20, right: -20, bottom: -20, // Cover the paddings
                                        backgroundColor: 'rgba(248, 250, 252, 0.5)',
                                        zIndex: 100,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        borderRadius: 24
                                    }}>
                                        <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 50, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
                                            <Feather name="lock" size={24} color="#94A3B8" />
                                        </View>
                                        <Text style={{ color: '#64748B', fontWeight: 'bold', fontSize: 13, marginTop: 12, textAlign: 'center', paddingHorizontal: 40 }}>
                                            {(isFinished && userMode === 'pro' && !isITheWinner) 
                                                ? "Solicitud no contratada. Bloqueado."
                                                : "Esta sección se activará cuando termines un trabajo."}
                                        </Text>
                                    </View>
                                )}
                                <View style={{ marginTop: 15, pointerEvents: (isFinished && (userMode === 'client' || isITheWinner)) ? 'auto' : 'none', opacity: (isFinished && (userMode === 'client' || isITheWinner)) ? 1 : 0.3 }}>
                                    <RatingForm
                                        onSubmit={handleRatingSubmit}
                                        revieweeName={revieweeName}
                                        isForPro={userMode === 'client'}
                                        isBlocked={!(isFinished && (userMode === 'client' || isITheWinner))}
                                    />
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            )}

            {/* FEED DE EVENTOS */}
            {(showSection === 'all' || showSection === 'timeline') && (
                <View style={{ marginTop: showSection === 'timeline' ? 0 : 20 }}>
                    <Text style={[styles.managementTitle, { marginBottom: 20, paddingHorizontal: 5 }]}>
                        {customTitle === 'Histórico' ? 'Historial de Actividad' : (customTitle || 'Historial de Actividad')}
                    </Text>
                    <View style={{ paddingHorizontal: 4 }}>
                        {visibleEvents.length === 0 ? (
                            <Text style={{ textAlign: 'center', color: '#9CA3AF', fontStyle: 'italic', fontSize: 13, marginTop: 20 }}>No hay eventos registrados aún.</Text>
                        ) : (
                            visibleEvents.map((e, i) => {
                                const isMe = (e.actor?._id || e.actor)?.toString() === currentUser?._id?.toString();
                                return (
                                    <View key={i} style={{ flexDirection: 'row', marginBottom: 24 }}>
                                        <View style={{ alignItems: 'center', marginRight: 12, width: 30 }}>
                                            <View style={{ position: 'absolute', top: 30, bottom: -24, width: 2, backgroundColor: '#E2E8F0', zIndex: -1 }} />
                                            <View style={{
                                                width: 32, height: 32, borderRadius: 16,
                                                backgroundColor: isMe ? '#DBEAFE' : '#FFFFFF',
                                                justifyContent: 'center', alignItems: 'center',
                                                borderWidth: 2, borderColor: isMe ? '#2563EB' : '#94A3B8'
                                            }}>
                                                <Feather
                                                    name={
                                                        e.eventType === 'photo_uploaded' ? 'camera' :
                                                            e.eventType === 'job_finished' ? 'check' :
                                                                e.eventType === 'job_created' ? 'file-text' :
                                                                    e.eventType === 'work_started' ? 'play' :
                                                                        e.eventType === 'offer_sent' ? 'dollar-sign' :
                                                                            e.eventType === 'offer_accepted' ? 'user-check' :
                                                                                e.eventType === 'offer_rejected' ? 'user-x' : 'message-square'
                                                    }
                                                    size={14}
                                                    color={isMe ? '#2563EB' : '#64748B'}
                                                />
                                            </View>
                                        </View>
                                        <View style={{ flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1E2937' }}>
                                                    {e.title} {e.isPrivate && <Feather name="lock" size={12} color="#EF4444" />}
                                                </Text>
                                                <Text style={{ fontSize: 10, color: '#94A3B8' }}>
                                                    {new Date(e.timestamp).toLocaleDateString()} {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                            </View>
                                            <Text style={{ fontSize: 13, color: '#4B5563', lineHeight: 18 }}>{e.description}</Text>

                                            {isMe && e.eventType !== 'offer_sent' && e.eventType !== 'offer_accepted' && e.eventType !== 'offer_rejected' && e.eventType !== 'job_created' && (
                                                <TouchableOpacity
                                                    onPress={() => handleTogglePrivacy(e)}
                                                    style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: e.isPrivate ? '#FEE2E2' : '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}
                                                >
                                                    <Feather name={e.isPrivate ? "lock" : "unlock"} size={10} color={e.isPrivate ? "#EF4444" : "#64748B"} style={{ marginRight: 4 }} />
                                                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: e.isPrivate ? "#EF4444" : "#64748B" }}>
                                                        {e.isPrivate ? 'Privado' : 'Hacer Privado'}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                            {e.mediaUrl && (
                                                <View style={{ marginTop: 10 }}>
                                                    <TouchableOpacity onPress={() => onViewImage(e.mediaUrl)}>
                                                        <Image source={{ uri: e.mediaUrl }} style={{ width: '100%', height: 180, borderRadius: 12 }} />
                                                    </TouchableOpacity>
                                                    {isMe && onTogglePortfolio && (
                                                        <TouchableOpacity
                                                            onPress={() => onTogglePortfolio(e.mediaUrl, categoryTitle)}
                                                            style={{
                                                                position: 'absolute',
                                                                bottom: 8,
                                                                right: 8,
                                                                backgroundColor: portfolioGallery.includes(e.mediaUrl) ? '#10B981' : 'rgba(0,0,0,0.6)',
                                                                paddingVertical: 6,
                                                                paddingHorizontal: 12,
                                                                borderRadius: 16,
                                                                flexDirection: 'row',
                                                                alignItems: 'center'
                                                            }}
                                                        >
                                                            <Feather name={portfolioGallery.includes(e.mediaUrl) ? "check" : "image"} size={12} color="white" style={{ marginRight: 6 }} />
                                                            <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>
                                                                {portfolioGallery.includes(e.mediaUrl) ? "En Portafolio" : "Añadir a Portafolio"}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    managementCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    managementTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E2937',
    },
    statusLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748B',
    },
    auditableBadge: {
        backgroundColor: '#DBEAFE',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    auditableText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#2563EB',
    },
    journeyContainer: {
        flexDirection: 'row',
        marginBottom: 25,
        height: 32,
        paddingRight: 15,
    },
    journeyStep: {
        flex: 1,
        height: '100%',
        marginRight: 4,
    },
    journeyBlock: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    journeyText: {
        fontSize: 12,
        fontWeight: 'bold',
        zIndex: 5,
        marginLeft: 8,
    },
    rightPoint: {
        position: 'absolute',
        right: -12,
        top: 0,
        width: 0,
        height: 0,
        borderTopWidth: 16,
        borderBottomWidth: 16,
        borderLeftWidth: 12,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        zIndex: 10,
    },
    leftCutout: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        borderTopWidth: 16,
        borderBottomWidth: 16,
        borderLeftWidth: 12,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderLeftColor: 'white',
        zIndex: 4,
    },
    instructionBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        marginBottom: 15,
    },
    instructionText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '600',
        flex: 1,
    },
    actionsGrid: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    actionBtn: {
        flex: 1,
        height: 60,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionBtnText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1E2937',
        marginTop: 4,
    },
    mainActionBtn: {
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
        elevation: 2,
    },
    mainActionText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '900',
    },
});

export default ProjectTimeline;
