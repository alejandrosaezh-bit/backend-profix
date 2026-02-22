import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { showAlert } from '../utils/helpers';
import RatingForm from './RatingForm';

const ProjectTimeline = ({ job, userMode, currentUser, onConfirmStart, onAddTimelineEvent, onFinish, onRate, onTogglePortfolio, onViewImage }) => {
    const [note, setNote] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [date, setDate] = useState(new Date());

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

    // Inject Creation Event locally for display
    if (job.createdAt) {
        events.push({
            eventType: 'job_created',
            title: 'Solicitud Creada',
            description: `Inicio del seguimiento de: ${job.title}`,
            timestamp: job.createdAt,
            actor: job.client || { _id: 'system', name: 'Sistema' },
            isPrivate: false
        });
    }

    // --- INJECT LEGACY DATA (From Removed "Gestionar Trabajo") ---
    if (job.clientManagement) {
        // Photos (Make PUBLIC so Pro can see "Antes" evidence)
        if (job.clientManagement.beforePhotos) {
            job.clientManagement.beforePhotos.forEach(p => {
                events.push({
                    eventType: 'photo_uploaded',
                    title: 'Foto "Antes" (Importada)',
                    description: 'Foto registrada en gestión anterior.',
                    mediaUrl: p.url,
                    timestamp: p.uploadedAt,
                    actor: job.client || { _id: 'system', name: 'Cliente' },
                    isPrivate: false // Migrating to Public for visibility
                });
            });
        }
        // Notes (Keep Private)
        if (job.clientManagement.privateNotes) {
            job.clientManagement.privateNotes.forEach(n => {
                events.push({
                    eventType: 'note_added',
                    title: 'Nota Privada (Importada)',
                    description: n.text,
                    timestamp: n.date,
                    actor: job.client || { _id: 'system', name: 'Cliente' },
                    isPrivate: true
                });
            });
        }
    }

    // Sort: Newest First
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const visibleEvents = events.filter(e => {
        if (!e.isPrivate) return true;
        // Show all if completed, finished, rated, or canceled
        const isFinished = ['completed', 'finished', 'rated', 'canceled', 'TERMINADO', 'Culminada'].includes(job.status);
        if (isFinished) return true;
        if (job.trackingStatus === 'finished') return true;

        // Check actor ID (handling populated object or string ID)
        const actorId = e.actor?._id || e.actor;
        return actorId?.toString() === currentUser?._id?.toString();
    });

    const handleDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === 'ios');
        setDate(currentDate);

        if (event.type === 'set' && Platform.OS !== 'ios') {
            confirmDate(currentDate);
        }
    };

    const confirmDate = (selectedDate) => {
        onAddTimelineEvent({
            eventType: 'start_date_proposed',
            title: userMode === 'pro' ? 'Fecha Propuesta por Profesional' : 'Fecha de Inicio Definida',
            description: userMode === 'pro'
                ? `El profesional propone iniciar el trabajo el: ${selectedDate.toLocaleDateString()} a las ${selectedDate.toLocaleTimeString()}`
                : `El cliente indica que el trabajo comenzará el: ${selectedDate.toLocaleDateString()} a las ${selectedDate.toLocaleTimeString()}`,
            timestamp: new Date(),
            isPrivate: false
        });
        showAlert("Fecha Guardada", "Se ha registrado la fecha de inicio esperada en el historial.");
        setShowDatePicker(false);
    };

    const handleAddNote = () => {
        if (!note.trim()) return;
        onAddTimelineEvent({
            eventType: 'note_added',
            title: 'Nota Agregada',
            description: note,
            isPrivate: isPrivate
        });
        setNote('');
    };

    return (
        <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 20, marginTop: 20, elevation: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>Historial Legal & Avance</Text>
                <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ fontSize: 10, color: '#1E40AF', fontWeight: 'bold' }}>AUDITABLE</Text>
                </View>
            </View>

            {/* --- ACTION PANEL REFACTORED --- */}
            <View style={{ backgroundColor: '#F8FAFC', borderRadius: 16, marginBottom: 25, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' }}>
                <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' }}>
                        {job.trackingStatus === 'contracted' ? '1. Inicio' :
                            (job.trackingStatus === 'started' && !job.proFinished ? '2. Avance' : '3. Cierre')}
                    </Text>
                    {/* Privacy Toggle for both */}
                    <TouchableOpacity onPress={() => setIsPrivate(!isPrivate)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Feather name={isPrivate ? "lock" : "globe"} size={14} color={isPrivate ? "#EF4444" : "#3B82F6"} style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: isPrivate ? "#EF4444" : "#3B82F6" }}>{isPrivate ? 'PRIVADO' : 'PÚBLICO'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ padding: 15 }}>
                    {/* FECHAS REPORTADAS (SIEMPRE VISIBLES PARA EL CLIENTE SI EXISTEN) */}
                    {(job.validatedStartDate || job.validatedEndDate || job.proFinished) && (
                        <View style={{ backgroundColor: 'white', padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#F1F5F9' }}>
                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#64748B', marginBottom: 8, textTransform: 'uppercase' }}>Fechas del Proyecto</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 10, color: '#94A3B8' }}>INICIO</Text>
                                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1F2937' }}>
                                        {job.validatedStartDate ? new Date(job.validatedStartDate).toLocaleDateString() : (job.startDate || 'No definida')}
                                    </Text>
                                </View>
                                {job.proFinished && (
                                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                        <Text style={{ fontSize: 10, color: '#94A3B8' }}>FIN (REPORTADO)</Text>
                                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#10B981' }}>
                                            {job.validatedEndDate ? new Date(job.validatedEndDate).toLocaleDateString() : new Date().toLocaleDateString()}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* BOTÓN DE FOTOS CONTEXTUAL SEGÚN ETAPA Y USUARIO */}
                    <View style={{ marginBottom: 15 }}>
                        {(() => {
                            let showButton = false;
                            let buttonText = "";
                            let buttonColor = "";
                            let photoType = "";

                            const isBefore = !job.trackingStatus || job.trackingStatus === 'contracted' || job.trackingStatus === 'none';
                            const isDuring = job.trackingStatus === 'started' && !job.proFinished;
                            const isAfter = job.proFinished || job.trackingStatus === 'finished' || job.status === 'completed';

                            if (isBefore) {
                                // ANTES: Ambos pueden o según regla (Pro puede siempre que no haya iniciado)
                                showButton = true;
                                buttonText = "TOMAR FOTOS DEL ANTES";
                                buttonColor = "#EA580C";
                                photoType = 'Foto "Antes"';
                            } else if (isDuring) {
                                // DURANTE: Usuario pidió que solo el cliente tome estas fotos
                                if (userMode === 'client') {
                                    showButton = true;
                                    buttonText = "TOMAR FOTOS DEL DURANTE";
                                    buttonColor = "#3B82F6";
                                    photoType = 'Foto "Durante"';
                                }
                            } else if (isAfter) {
                                // DESPUÉS: Cuando el pro marca finalizado
                                showButton = true;
                                buttonText = "TOMAR FOTOS DEL DESPUÉS";
                                buttonColor = "#10B981";
                                photoType = 'Foto "Después"';
                            }

                            if (!showButton) return null;

                            return (
                                <View>
                                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 }}>EVIDENCIA VISUAL ({isPrivate ? 'PRIVADA' : 'PÚBLICA'})</Text>
                                    <TouchableOpacity
                                        onPress={() => onAddTimelineEvent({ pickImage: true, title: photoType, isPrivate })}
                                        style={{
                                            backgroundColor: 'white', padding: 15, borderRadius: 12, alignItems: 'center',
                                            borderWidth: 2, borderColor: buttonColor, borderStyle: 'dashed',
                                            flexDirection: 'row', justifyContent: 'center'
                                        }}
                                    >
                                        <Feather name="camera" size={22} color={buttonColor} style={{ marginRight: 10 }} />
                                        <Text style={{ color: buttonColor, fontWeight: 'bold', fontSize: 15 }}>{buttonText}</Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })()}
                    </View>

                    {/* NOTAS (PARA AMBOS) */}
                    <View style={{ marginBottom: 15 }}>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TextInput
                                placeholder="Escribe algo en la bitácora..."
                                value={note}
                                onChangeText={setNote}
                                style={{ flex: 1, backgroundColor: 'white', borderRadius: 10, paddingHorizontal: 12, height: 40, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 13 }}
                            />
                            <TouchableOpacity onPress={handleAddNote} style={{ width: 40, height: 40, backgroundColor: '#334155', borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
                                <Feather name="send" size={16} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />

                    {/* ACCIONES DE ESTADO (FLUJO PRINCIPAL) */}
                    <View>
                        {/* INICIO (Solo Pro si no iniciado) */}
                        {job.trackingStatus === 'contracted' && userMode === 'pro' && !job.validatedStartDate && (
                            <TouchableOpacity
                                onPress={() => onConfirmStart(true)}
                                style={{ backgroundColor: '#4F46E5', paddingVertical: 15, borderRadius: 12, alignItems: 'center', elevation: 2 }}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>INICIAR TRABAJO</Text>
                            </TouchableOpacity>
                        )}

                        {/* FINALIZAR (Pro) */}
                        {job.trackingStatus === 'started' && userMode === 'pro' && !job.proFinished && (
                            <TouchableOpacity
                                onPress={onFinish}
                                style={{ backgroundColor: '#10B981', paddingVertical: 15, borderRadius: 12, alignItems: 'center', elevation: 2 }}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>CERRAR / TRABAJO LISTO</Text>
                            </TouchableOpacity>
                        )}

                        {/* VALIDAR (Cliente) */}
                        {job.proFinished && !job.clientFinished && userMode === 'client' && (
                            <View style={{ alignItems: 'center' }}>
                                <Text style={{ color: '#92400E', fontSize: 12, textAlign: 'center', marginBottom: 12, fontStyle: 'italic' }}>
                                    El profesional indica que ha concluido. ¿Validar y cerrar?
                                </Text>
                                <TouchableOpacity
                                    onPress={onFinish}
                                    style={{ width: '100%', backgroundColor: '#10B981', paddingVertical: 15, borderRadius: 12, alignItems: 'center', elevation: 2 }}
                                >
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>CONFIRMAR Y FINALIZAR</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* CALIFICAR / INFO VALORACIÓN (UNIFICADO) */}
                        {(() => {
                            // Professional can rate as soon as they mark as finished.
                            // Client can rate after they acknowledge/validate the finish.
                            const isFinished = (
                                job.status === 'completed' ||
                                job.status === 'TERMINADO' ||
                                job.status === 'rated' ||
                                job.status === 'Culminada' ||
                                job.proRated ||
                                job.clientRated ||
                                (job.proFinished && (userMode === 'pro' || job.clientFinished))
                            );

                            if (!isFinished) return null;

                            // Robust check for rating existence
                            const hasMyRating = (userMode === 'pro' && job.proRated) || (userMode === 'client' && job.clientRated);
                            const ratingEvents = events.filter(e =>
                                (e.eventType === 'note_added' || e.eventType === 'job_finished') &&
                                (e.title?.toLowerCase().includes('valoró') || e.description?.toLowerCase().includes('calificación'))
                            );

                            const myRatingEvent = ratingEvents.find(e => {
                                const actorId = (e.actor?._id || e.actor)?.toString();
                                const myId = currentUser?._id?.toString() || currentUser?.id?.toString();
                                return actorId === myId;
                            });
                            const otherRatingEvent = ratingEvents.find(e => {
                                const actorId = (e.actor?._id || e.actor)?.toString();
                                const myId = currentUser?._id?.toString() || currentUser?.id?.toString();
                                return actorId && actorId !== myId;
                            });

                            const showMyRatingBox = hasMyRating || !!myRatingEvent;

                            return (
                                <View style={{ width: '100%', gap: 10 }}>
                                    {/* Muestra valoración del OTRO (si existe) */}
                                    {otherRatingEvent && (
                                        <View style={{ padding: 15, backgroundColor: '#F0FDF4', borderRadius: 12, borderWidth: 1, borderColor: '#DCFCE7', marginBottom: 10 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                                <Feather name="star" size={14} color="#16A34A" style={{ marginRight: 8 }} />
                                                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#166534' }}>
                                                    {userMode === 'pro' ? 'El cliente dijo:' : 'El profesional dijo:'}
                                                </Text>
                                            </View>
                                            <Text style={{ fontSize: 12, color: '#14532D', fontStyle: 'italic' }}>"{otherRatingEvent.description}"</Text>
                                        </View>
                                    )}

                                    {/* Muestra MI valoración o el botón para darla */}
                                    {showMyRatingBox ? (
                                        <View style={{ padding: 15, backgroundColor: '#F0F9FF', borderRadius: 12, borderWidth: 1, borderColor: '#BAE6FD' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#0EA5E9', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                                                    <Feather name="check" size={12} color="white" />
                                                </View>
                                                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0369A1' }}>Tu valoración enviada correctamente</Text>
                                            </View>
                                            {myRatingEvent && (
                                                <Text style={{ fontSize: 12, color: '#0C4A6E', fontStyle: 'italic', marginBottom: 8 }}>
                                                    "{myRatingEvent.description}"
                                                </Text>
                                            )}

                                            {/* Photo Instructions (Only show if I've rated) */}
                                            {events.some(e => e.mediaUrl) && (
                                                <View style={{ marginTop: 5, borderTopWidth: 1, borderTopColor: '#E0F2FE', paddingTop: 8 }}>
                                                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1F2937' }}>📸 Crea tu Portafolio:</Text>
                                                    <Text style={{ fontSize: 11, color: '#4B5563' }}>Presiona la estrella <Feather name="star" size={10} /> en las fotos de abajo para tu perfil.</Text>
                                                </View>
                                            )}
                                        </View>
                                    ) : (
                                        <RatingForm
                                            revieweeName={revieweeName}
                                            isForPro={userMode === 'client'}
                                            onSubmit={handleRatingSubmit}
                                        />
                                    )}
                                </View>
                            );
                        })()}
                    </View>
                </View>
            </View>
            {/* --- TIMELINE FEED --- */}
            < View >
                {
                    visibleEvents.length === 0 ? (
                        <Text style={{ textAlign: 'center', color: '#9CA3AF', fontStyle: 'italic', fontSize: 13 }}>No hay eventos registrados aún.</Text>
                    ) : (
                        visibleEvents.map((e, i) => {
                            const isMe = (e.actor?._id || e.actor)?.toString() === currentUser?._id?.toString();
                            return (
                                <View key={i} style={{ flexDirection: 'row', marginBottom: 20 }}>
                                    <View style={{ alignItems: 'center', marginRight: 12, width: 30 }}>
                                        {/* Line connecting to next item (below) */}
                                        <View style={{ position: 'absolute', top: 15, bottom: -20, width: 2, backgroundColor: '#E2E8F0', zIndex: -1 }} />

                                        <View style={{
                                            width: 30, height: 30, borderRadius: 15,
                                            backgroundColor: isMe ? '#DBEAFE' : '#F1F5F9',
                                            justifyContent: 'center', alignItems: 'center',
                                            borderWidth: 2, borderColor: isMe ? '#3B82F6' : '#94A3B8'
                                        }}>
                                            <Feather
                                                name={e.eventType === 'photo_uploaded' ? 'camera' : (e.eventType === 'job_finished' ? 'check' : (e.eventType === 'job_created' ? 'file-text' : 'message-square'))}
                                                size={14}
                                                color={isMe ? '#3B82F6' : '#64748B'}
                                            />
                                        </View>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1F2937' }}>{e.title}</Text>
                                            <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(e.timestamp).toLocaleString()}</Text>
                                        </View>
                                        <Text style={{ fontSize: 13, color: '#4B5563', lineHeight: 18 }}>{e.description}</Text>

                                        {e.mediaUrl && (
                                            <View style={{ marginTop: 8, position: 'relative', width: 150 }}>
                                                <TouchableOpacity onPress={() => onViewImage(e.mediaUrl)}>
                                                    <Image source={{ uri: e.mediaUrl }} style={{ width: 150, height: 100, borderRadius: 8 }} />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => onTogglePortfolio(e.mediaUrl, categoryTitle)}
                                                    style={{
                                                        position: 'absolute', top: 5, right: 5,
                                                        backgroundColor: portfolioGallery.includes(e.mediaUrl) ? '#F59E0B' : 'rgba(0,0,0,0.5)',
                                                        padding: 6, borderRadius: 20, elevation: 3
                                                    }}
                                                >
                                                    <Feather name={portfolioGallery.includes(e.mediaUrl) ? "star" : "plus"} size={16} color="white" />
                                                </TouchableOpacity>
                                                {portfolioGallery.includes(e.mediaUrl) && (
                                                    <View style={{ position: 'absolute', bottom: 5, left: 5, backgroundColor: '#F59E0B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                                        <Text style={{ fontSize: 8, color: 'white', fontWeight: 'bold' }}>EN PORTAFOLIO</Text>
                                                    </View>
                                                )}
                                            </View>
                                        )}

                                        {/* Privacy Indicator */}
                                        {e.isPrivate && (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, backgroundColor: '#FEF2F2', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                                <Feather name="lock" size={10} color="#EF4444" style={{ marginRight: 4 }} />
                                                <Text style={{ fontSize: 10, color: '#EF4444', fontWeight: 'bold' }}>Privado</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            );
                        })
                    )
                }
            </View >
        </View >
    );
};

export default ProjectTimeline;
