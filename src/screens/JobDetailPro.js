import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Image, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { api } from '../utils/api';
import { areIdsEqual, getProStatus, showAlert, showConfirmation } from '../utils/helpers';
import ProjectTimeline from './ProjectTimeline';

const JobDetailPro = ({ job: initialJob, onBack, onSendQuote, onOpenChat, proStatus, onUpdateStatus, onArchive, onGoToQuote, onViewProfile, currentUser, onConfirmStart, onAddWorkPhoto, onFinish, onRate, onAddTimelineEvent, onStartJob, categories, userMode, onTogglePortfolio, onViewImage }) => {
    const [job, setJob] = useState(initialJob);
    const [showMyProposal, setShowMyProposal] = useState(false);

    // Sync with prop updates
    useEffect(() => { setJob(initialJob); }, [initialJob]);

    // Force refresh detailed data on mount
    useEffect(() => {
        const loadFullDetails = async () => {
            try {
                const id = initialJob._id || initialJob.id;
                console.log("JobDetailPro: Fetching full details for:", id);
                const fresh = await api.getJob(id);
                const freshData = fresh.data || fresh;
                setJob(freshData);
            } catch (e) {
                console.warn("JobDetailPro: Could not refresh job details:", e);
            }
        };
        loadFullDetails();
    }, []);

    // Al abrir, si es NUEVA, pasar a ABIERTA
    useEffect(() => {
        if (proStatus === 'NUEVA') {
            onUpdateStatus('ABIERTA');
        }
    }, []);

    // Pro status color helper moved to top level as getProStatusColor

    // Encontrar mi oferta
    const myOffer = job.offers?.find(o =>
        areIdsEqual(o.proId?._id || o.proId, currentUser?._id) ||
        o.proEmail === currentUser?.email
    );

    // Check if I am the winner
    const isWinner = myOffer && myOffer.status === 'accepted';

    // Encontrar conversación para este pro
    // Si soy pro, en teoría solo debo tener una o ninguna en el objeto job (filtrado por backend)
    // Pero usamos una búsqueda segura
    const myConversation = job.conversations?.find(c =>
        areIdsEqual(c.proId?._id || c.proId, currentUser?._id) ||
        c.proEmail === currentUser?.email ||
        (proStatus !== 'NUEVA' && job.conversations && job.conversations.length === 1 && (userMode === 'pro' || currentUser?.role === 'professional'))
    );
    const messages = myConversation?.messages || [];
    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    const isClientLast = lastMsg?.sender === 'client';

    const takeWorkPhoto = async () => {
        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.5,
            base64: true,
        });
        if (!result.canceled) {
            onAddWorkPhoto(job._id || job.id, `data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const handleFinishInternal = () => {
        onFinish(job._id || job.id);
    };

    const handleRateInternal = (reviewData) => {
        onRate(job._id || job.id, reviewData);
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            {/* Modal para ver imagen ampliada eliminado - se usa el global */}

            {/* Modal para ver MI propuesta */}
            <Modal visible={showMyProposal} transparent animationType="slide" onRequestClose={() => setShowMyProposal(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937' }}>Mi Propuesta Enviada</Text>
                            <TouchableOpacity onPress={() => setShowMyProposal(false)}>
                                <Feather name="x" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        {myOffer ? (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* ENCABEZADO PROFESIONAL */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#2563EB', marginBottom: 20 }}>
                                    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#E2E8F0', overflow: 'hidden', borderWidth: 2, borderColor: 'white', elevation: 2 }}>
                                        {currentUser.avatar ? (
                                            <Image source={{ uri: currentUser.avatar }} style={{ width: '100%', height: '100%' }} />
                                        ) : (
                                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                                <Feather name="user" size={30} color="#94A3B8" />
                                            </View>
                                        )}
                                    </View>
                                    <View style={{ marginLeft: 16, flex: 1 }}>
                                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1E293B' }}>{currentUser.name}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                            <Feather name="calendar" size={12} color="#64748B" />
                                            <Text style={{ fontSize: 12, color: '#64748B', marginLeft: 4 }}>Emitido: {new Date(myOffer.createdAt || Date.now()).toLocaleDateString()}</Text>
                                        </View>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1E40AF' }}>PRESUPUESTO</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* DESGLOSE DE TRABAJO */}
                                <View style={{ marginBottom: 24 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                        <View style={{ width: 3, height: 16, backgroundColor: '#2563EB', marginRight: 8, borderRadius: 2 }} />
                                        <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#1E293B' }}>DESGLOSE DE TRABAJO</Text>
                                    </View>

                                    {myOffer.items && myOffer.items.length > 0 && (
                                        <View style={{ backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' }}>
                                            {myOffer.items.map((item, i) => (
                                                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: i === myOffer.items.length - 1 ? 0 : 1, borderBottomColor: '#F8FAFC' }}>
                                                    <View style={{ flex: 1, marginRight: 16 }}>
                                                        <Text style={{ fontSize: 14, color: '#475569', fontWeight: '500' }}>{item.description}</Text>
                                                    </View>
                                                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E293B' }}>
                                                        {myOffer.currency || '$'} {Number(item.price).toFixed(2)}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    {myOffer.descriptionLine && (
                                        <View style={{ marginTop: 12, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1' }}>
                                            <Text style={{ fontSize: 13, color: '#64748B', lineHeight: 18 }}>{myOffer.descriptionLine}</Text>
                                        </View>
                                    )}
                                </View>

                                {/* TOTAL Y MONTO */}
                                <View style={{ backgroundColor: '#1E293B', padding: 20, borderRadius: 20, marginBottom: 24, elevation: 4 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View>
                                            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 'bold', letterSpacing: 1 }}>TOTAL A PAGAR</Text>
                                            {myOffer.addTax && (
                                                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Incluye IVA ({myOffer.taxRate}%)</Text>
                                            )}
                                        </View>
                                        <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white' }}>
                                            {myOffer.currency || '$'} {Number(myOffer.amount || myOffer.price).toFixed(2)}
                                        </Text>
                                    </View>
                                </View>

                                {/* DETALLES Y COMPROMISOS */}
                                <View style={{ marginBottom: 24 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                        <View style={{ width: 3, height: 16, backgroundColor: '#2563EB', marginRight: 8, borderRadius: 2 }} />
                                        <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#1E293B' }}>DETALLES DE EJECUCIÓN</Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                        <View style={{ flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' }}>
                                            <Feather name="calendar" size={16} color="#2563EB" />
                                            <Text style={{ fontSize: 10, color: '#64748B', fontWeight: 'bold', marginTop: 6, textTransform: 'uppercase' }}>Inicio</Text>
                                            <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '600', marginTop: 2 }}>{myOffer.startDate || 'A convenir'}</Text>
                                        </View>
                                        <View style={{ flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' }}>
                                            <Feather name="clock" size={16} color="#2563EB" />
                                            <Text style={{ fontSize: 10, color: '#64748B', fontWeight: 'bold', marginTop: 6, textTransform: 'uppercase' }}>Duración</Text>
                                            <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '600', marginTop: 2 }}>{myOffer.duration || myOffer.executionTime || 'N/A'}</Text>
                                        </View>
                                        <View style={{ flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' }}>
                                            <Feather name="credit-card" size={16} color="#2563EB" />
                                            <Text style={{ fontSize: 10, color: '#64748B', fontWeight: 'bold', marginTop: 6, textTransform: 'uppercase' }}>Pago</Text>
                                            <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '600', marginTop: 2 }}>{myOffer.paymentTerms || 'N/A'}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* CONDICIONES Y GARANTIAS */}
                                <View style={{ gap: 15, marginBottom: 20 }}>
                                    {myOffer.conditions && (
                                        <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                <Feather name="file-text" size={16} color="#2563EB" style={{ marginRight: 8 }} />
                                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E293B' }}>Condiciones</Text>
                                            </View>
                                            <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20 }}>{myOffer.conditions}</Text>
                                        </View>
                                    )}

                                    {myOffer.warranty && (
                                        <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                <Feather name="shield" size={16} color="#059669" style={{ marginRight: 8 }} />
                                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E293B' }}>Garantía</Text>
                                            </View>
                                            <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20 }}>{myOffer.warranty}</Text>
                                        </View>
                                    )}

                                    {myOffer.observations && (
                                        <View style={{ backgroundColor: '#F0F9FF', padding: 16, borderRadius: 16 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                <Feather name="info" size={16} color="#2563EB" style={{ marginRight: 8 }} />
                                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E293B' }}>Observaciones Adicionales</Text>
                                            </View>
                                            <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20, fontStyle: 'italic' }}>{myOffer.observations}</Text>
                                        </View>
                                    )}
                                </View>
                            </ScrollView>
                        ) : (
                            <Text>No se encontró la información de la oferta.</Text>
                        )}
                    </View>
                </View>
            </Modal>




            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                {/* CABECERA AZUL (SCROLLABLE) */}
                <View style={{
                    backgroundColor: '#2563EB', paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 5 : 20,
                    paddingBottom: 18, paddingHorizontal: 24, borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
                    elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10,
                    marginBottom: -20, zIndex: 1
                }}>
                    <View>
                        {/* Título Principal - Ancho Completo */}
                        <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white', lineHeight: 32, letterSpacing: -0.5 }}>{job.title}</Text>

                        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: 'bold', textTransform: 'uppercase', marginTop: 8, letterSpacing: 0.5 }}>
                            {(() => {
                                const c = job.category;
                                if (typeof c === 'object' && c.name) return c.name;
                                const found = categories && categories.find(cat => cat.id === c || cat._id === c);
                                return found ? found.name : c;
                            })()} • {(typeof job.subcategory === 'object' ? job.subcategory.name : (job.subcategory || 'General'))}
                        </Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                            <Feather name="map-pin" size={12} color="rgba(255,255,255,0.8)" />
                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginLeft: 6 }}>{job.location || 'Sin ubicación'}</Text>
                        </View>

                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>
                            Creado el {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '22/2/2026'}
                        </Text>

                        {/* Sección de Cliente y Estado - Alineados en Fila */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 }}>
                            <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20 }}>
                                <Text style={{ color: '#059669', fontSize: 11, fontWeight: 'bold' }}>
                                    {getProStatus(job, currentUser?._id).toUpperCase()}
                                </Text>
                            </View>

                            <TouchableOpacity onPress={onViewProfile} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1.5, borderColor: 'white', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
                                    {(job.clientAvatar || job.client?.avatar) ? (
                                        <Image source={{ uri: job.clientAvatar || job.client?.avatar }} style={{ width: '100%', height: '100%' }} />
                                    ) : (
                                        <Feather name="user" size={20} color="white" />
                                    )}
                                </View>
                                <View style={{ marginLeft: 10 }}>
                                    <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold' }}>{job.clientName || job.client?.name || 'Cliente'}</Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Ver perfil</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                {/* PARTE BLANCA (INFO) como tarjeta */}
                <View style={{ backgroundColor: 'white', borderRadius: 36, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, marginBottom: 30 }}>
                    <View style={{ padding: 24 }}>
                        {myOffer && (myOffer.status === 'rejected' || proStatus === 'PERDIDA') && (
                            <View style={{ backgroundColor: '#FEE2E2', padding: 18, borderRadius: 20, marginBottom: 24, borderWidth: 1, borderColor: '#FCA5A5' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                    <Feather name={proStatus === 'PERDIDA' ? "slash" : "alert-triangle"} size={22} color="#EF4444" />
                                    <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 16, marginLeft: 10 }}>
                                        {proStatus === 'PERDIDA' ? 'TRABAJO PERDIDO' : 'PRESUPUESTO RECHAZADO'}
                                    </Text>
                                </View>
                                <Text style={{ color: '#7F1D1D', fontSize: 14, lineHeight: 20, marginBottom: 15 }}>
                                    {proStatus === 'PERDIDA'
                                        ? 'Esta solicitud ha sido asignada a otro profesional o ya no está disponible.'
                                        : 'El cliente ha rechazado tu presupuesto.'}
                                    {myOffer.rejectionReason && (
                                        <Text style={{ fontWeight: 'bold' }}>{"\n"}Motivo: "{myOffer.rejectionReason}"</Text>
                                    )}
                                </Text>
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <TouchableOpacity
                                        style={{ flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#EF4444' }}
                                        onPress={() => {
                                            showConfirmation(
                                                "Confirmar Archivo",
                                                "¿Estás seguro de archivar esta oferta? No podrás verla nuevamente en la lista principal.",
                                                () => {
                                                    onArchive();
                                                    showAlert("Archivado", "La solicitud ha sido archivada.");
                                                    onBack();
                                                },
                                                null,
                                                "Archivar",
                                                "Cancelar"
                                            );
                                        }}
                                    >
                                        <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Archivar</Text>
                                    </TouchableOpacity>

                                    {proStatus !== 'PERDIDA' && (
                                        <TouchableOpacity
                                            style={{ flex: 1, backgroundColor: '#EF4444', padding: 12, borderRadius: 10, alignItems: 'center' }}
                                            onPress={onGoToQuote}
                                        >
                                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Modificar y Reenviar</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        )}

                        <Text style={{ fontSize: 17, color: '#1F2937', lineHeight: 26, marginBottom: 24 }}>{job.description}</Text>

                        {job.images && job.images.length > 0 && (
                            <View>
                                <Text style={{ fontSize: 11, fontWeight: '800', color: '#94A3B8', marginBottom: 15, letterSpacing: 1 }}>FOTOS ADJUNTAS</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {job.images.map((img, i) => (
                                        <TouchableOpacity
                                            key={i}
                                            onPress={() => onViewImage(img)}
                                            activeOpacity={0.9}
                                        >
                                            <Image source={{ uri: img }} style={{ width: 140, height: 140, borderRadius: 20, marginRight: 15, borderWidth: 1, borderColor: '#F1F5F9' }} />
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                </View>

                {/* Resto del contenido con padding */}
                <View style={{ paddingHorizontal: 0 }}>

                    {/* HEADER: Conversaciones con el Cliente */}
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 15, marginTop: 10, paddingHorizontal: 20 }}>
                        Conversaciones con el Cliente
                    </Text>

                    {/* Chat Styled Like Reference Image */}
                    <View style={{
                        backgroundColor: 'white',
                        borderRadius: 20,
                        padding: 16,
                        marginHorizontal: 4,
                        marginBottom: 35,
                        elevation: 4,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8
                    }}>
                        {/* Header: Avatar + Name + Rating */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                            <Image
                                source={
                                    (job.client && job.client.profileImage) ? { uri: job.client.profileImage } :
                                        (job.client && job.client.avatar) ? { uri: job.client.avatar } :
                                            (job.clientAvatar) ? { uri: job.clientAvatar } :
                                                (job.clientProfileImage) ? { uri: job.clientProfileImage } :
                                                    { uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }
                                }
                                style={{ width: 50, height: 50, borderRadius: 25, marginRight: 15, backgroundColor: '#E2E8F0' }}
                                resizeMode="cover"
                            />
                            <View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginRight: 8 }}>
                                        {job.clientName || (job.client && job.client.name) || 'Cliente'}
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                                    <Feather name="star" size={14} color="#F59E0B" style={{ marginRight: 4 }} />
                                    <Text style={{ color: '#64748B', fontSize: 13, fontWeight: 'bold' }}>{job.clientRating || '5.0'}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Messages Area */}
                        <View style={{ marginBottom: 20 }}>
                            {messages.length === 0 ? (
                                <View style={{ padding: 15, backgroundColor: '#F3F4F6', borderRadius: 12 }}>
                                    <Text style={{ color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}>
                                        Inicia la conversación con {job.clientName}...
                                    </Text>
                                </View>
                            ) : (
                                messages.slice(-3).map((msg, i) => (
                                    <View key={i} style={{
                                        maxWidth: '85%',
                                        paddingVertical: 4,
                                        paddingHorizontal: 10,
                                        borderRadius: 14,
                                        marginBottom: 2,
                                        alignSelf: msg.sender === 'pro' ? 'flex-end' : 'flex-start',
                                        backgroundColor: msg.sender === 'pro' ? '#FFF7ED' : '#F3F4F6', // Orange tint for Pro, Gray for Client
                                        borderBottomRightRadius: msg.sender === 'pro' ? 4 : 14,
                                        borderBottomLeftRadius: msg.sender === 'pro' ? 14 : 4,
                                    }}>
                                        <Text style={{ color: '#374151', fontSize: 12, lineHeight: 16 }}>{msg.text}</Text>
                                        <Text style={{ color: '#9CA3AF', fontSize: 8, marginTop: 1, textAlign: 'right' }}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase()}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </View>

                        {/* Button "Preguntar" / "Responder" Style */}
                        <TouchableOpacity
                            onPress={() => {
                                onUpdateStatus('CONTACTADO');
                                const cName = job.clientName || job.client?.name || 'Cliente';
                                const pName = currentUser?.name || 'Profesional';
                                const defaultMsg = `Hola ${cName}, mi nombre es ${pName}. Me interesa tu solicitud de ${job.title}.`;
                                onOpenChat && onOpenChat(job, null, messages.length > 0 ? null : defaultMsg);
                            }}
                            style={{
                                backgroundColor: (messages.length > 0 && isClientLast) ? '#EA580C' : 'white',
                                borderWidth: 1.5,
                                borderColor: '#EA580C',
                                paddingVertical: 14,
                                borderRadius: 16,
                                alignItems: 'center',
                                elevation: (messages.length > 0 && isClientLast) ? 2 : 0,
                                shadowColor: '#EA580C',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4
                            }}
                        >
                            <Text style={{ color: (messages.length > 0 && isClientLast) ? 'white' : '#EA580C', fontWeight: 'bold', fontSize: 16 }}>
                                {messages.length === 0 ? 'Saludar' : (isClientLast ? 'Responder' : 'Preguntar')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* SECCIÓN PRECIOS Y PRESUPUESTOS (NUEVA LÓGICA) */}
                    <View style={{ marginBottom: 25 }}>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#64748B', marginBottom: 10, letterSpacing: 1 }}>PRESUPUESTOS</Text>

                        {!myOffer ? (
                            <TouchableOpacity
                                onPress={onGoToQuote}
                                style={{
                                    backgroundColor: '#2563EB',
                                    paddingVertical: 16,
                                    borderRadius: 16,
                                    alignItems: 'center',
                                    elevation: 3,
                                    shadowColor: '#2563EB',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 5
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Feather name="plus-circle" size={20} color="white" style={{ marginRight: 8 }} />
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>ENVIAR PRESUPUESTO</Text>
                                </View>
                            </TouchableOpacity>
                        ) : (
                            <View style={{
                                backgroundColor: myOffer.status === 'rejected' ? '#FEF2F2' : (myOffer.status === 'accepted' ? '#ECFDF5' : 'white'),
                                borderRadius: 16,
                                padding: 16,
                                borderWidth: 1,
                                borderColor: myOffer.status === 'rejected' ? '#FCA5A5' : (myOffer.status === 'accepted' ? '#6EE7B7' : '#E2E8F0'),
                                elevation: 2
                            }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={{
                                            width: 8, height: 8, borderRadius: 4,
                                            backgroundColor: myOffer.status === 'rejected' ? '#EF4444' : (myOffer.status === 'accepted' ? '#10B981' : '#F59E0B'),
                                            marginRight: 8
                                        }} />
                                        <Text style={{
                                            fontWeight: 'bold',
                                            color: myOffer.status === 'rejected' ? '#991B1B' : (myOffer.status === 'accepted' ? '#065F46' : '#92400E'),
                                            fontSize: 14
                                        }}>
                                            {myOffer.status === 'rejected' ? 'PROPUESTA RECHAZADA' : (myOffer.status === 'accepted' ? '¡PROPUESTA ACEPTADA!' : 'PRESUPUESTO ENVIADO')}
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: 11, color: '#64748B' }}>
                                        {new Date(myOffer.createdAt).toLocaleDateString()}
                                    </Text>
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15 }}>
                                    <View>
                                        <Text style={{ fontSize: 11, color: '#64748B', fontWeight: 'bold' }}>MONTO TOTAL</Text>
                                        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1F2937' }}>
                                            {myOffer.currency || '$'} {myOffer.amount || myOffer.price}
                                        </Text>
                                    </View>
                                    {myOffer.status === 'pending' && (
                                        <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                                            <Text style={{ fontSize: 10, color: '#D97706', fontWeight: 'bold' }}>PENDIENTE</Text>
                                        </View>
                                    )}
                                </View>

                                {myOffer.status === 'rejected' && (
                                    <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 10, borderRadius: 8, marginBottom: 15 }}>
                                        <Text style={{ color: '#7F1D1D', fontSize: 13, fontStyle: 'italic' }}>
                                            "{myOffer.rejectionReason || 'No especificado'}"
                                        </Text>
                                    </View>
                                )}

                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <TouchableOpacity
                                        onPress={() => setShowMyProposal(true)}
                                        style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1' }}
                                    >
                                        <Text style={{ color: '#475569', fontWeight: 'bold', fontSize: 13 }}>Ver Detalle</Text>
                                    </TouchableOpacity>

                                    {myOffer.status !== 'accepted' && (
                                        <TouchableOpacity
                                            onPress={onGoToQuote}
                                            style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#3B82F6', borderRadius: 8 }}
                                        >
                                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>
                                                {myOffer.status === 'rejected' ? 'Modificar y Reenviar' : 'Editar'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        )}
                    </View>

                    {/* ACCIONES DE ESTADO (Iniciar/Finalizar) - Solo si Ganada o Terminada */}
                    {(isWinner || ['TERMINADO', 'Culminada', 'rated', 'completed'].includes(job.status)) && (
                        <View style={{ marginBottom: 15 }}>
                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#64748B', marginBottom: 5, letterSpacing: 1 }}>HISTORIAL LEGAL & AVANCE</Text>
                            {/* El botón de inicio se maneja dentro de ProjectTimeline para evitar duplicados */}
                        </View>
                    )}

                    {
                        (isWinner || ['TERMINADO', 'Culminada', 'rated', 'completed'].includes(job.status)) &&
                        (job.trackingStatus !== 'none' || ['TERMINADO', 'Culminada', 'rated', 'completed'].includes(job.status)) && (
                            <ProjectTimeline
                                job={job}
                                userMode={userMode}
                                currentUser={currentUser}
                                onConfirmStart={(val) => onStartJob(val || job.id)}
                                onAddTimelineEvent={onAddTimelineEvent}
                                onFinish={handleFinishInternal}
                                onRate={handleRateInternal}
                                onTogglePortfolio={onTogglePortfolio}
                                onViewImage={onViewImage}
                            />
                        )
                    }

                </View>
            </ScrollView>
        </View >
    );
};

export default JobDetailPro;
