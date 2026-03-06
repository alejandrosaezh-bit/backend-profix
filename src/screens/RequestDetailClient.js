import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import CustomDropdown from '../components/CustomDropdown';
import { api } from '../utils/api';
import { getClientStatus, getClientStatusColor, showAlert } from '../utils/helpers';
import { compressImage } from '../utils/imageCompressor';
import ProjectTimeline from './ProjectTimeline';

const RequestDetailClient = ({ request, onBack, onAcceptOffer, onOpenChat, onUpdateRequest, selectedBudget, setSelectedBudget, showBudgetModal, setShowBudgetModal, startWithRejectForm, setStartWithRejectForm, categories = [], onRejectOffer, onConfirmStart, onAddWorkPhoto, onFinish, onRate, onCloseRequest, currentUser, onAddTimelineEvent, onTogglePortfolio, onViewUserProfile, onViewImage }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [data, setData] = useState(request);
    const [showArchivedChats, setShowArchivedChats] = useState(false);

    // --- PRIVATE JOB MANAGEMENT REMOVED ---


    useEffect(() => { setData(request); }, [request]);

    const handleConfirmStartInternal = (startedOnTime) => {
        onConfirmStart(request.id, startedOnTime);
    };

    const handleFinishInternal = async () => {
        await onFinish(request._id || request.id);
        if (onAddTimelineEvent) {
            await onAddTimelineEvent({
                eventType: 'job_finished',
                title: 'Trabajo Validado por Cliente',
                description: 'Has validado que el trabajo ha sido terminado. Ahora puedes valorar al profesional.',
                isPrivate: false
            });
        }
    };

    const handleRateInternal = (reviewData) => {
        onRate(request._id || request.id, reviewData);
    };

    const handleSave = async (imagesOverride = null) => {
        try {
            // Resolver ID de categoría si es un nombre
            let categoryId = data.category;
            if (typeof data.category === 'object' && data.category._id) {
                categoryId = data.category._id;
            } else {
                // Si es string (nombre), buscar el ID en categories
                const catObj = categories.find(c => c.name === data.category);
                if (catObj) categoryId = catObj.id || catObj._id;
            }

            console.log("Saving job:", { ...data, category: categoryId });

            const imagesToSave = Array.isArray(imagesOverride) ? imagesOverride : data.images;

            await api.updateJob(data._id || data.id, {
                title: data.title,
                description: data.description,
                category: categoryId,
                subcategory: data.subcategory,
                location: data.location,
                images: imagesToSave
            });
            setIsEditing(false);
            if (onUpdateRequest) onUpdateRequest({ ...data, images: imagesToSave });
            if (!Array.isArray(imagesOverride)) {
                showAlert("Actualizado", "Los cambios han sido guardados.");
            }
        } catch (e) {
            showAlert("Error", "No se pudo actualizar: " + e.message);
        }
    };

    const handleAddImage = () => {
        // En web window.confirm no soporta 3 botones. Usamos logica simplificada o custom modal si fuera necesario.
        // Como fallback para web, mostramos alerta y asumimos galeria (o window.prompt)
        // Pero para simplificar en este fix rapido:
        if (Platform.OS === 'web') {
            // En web ImagePicker.launchImageLibraryAsync abre el selector de archivo nativo (funciona como galeria/camara en movil web)
            pickImage();
            return;
        }

        Alert.alert(
            "Agregar Foto",
            "Selecciona una opción",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Cámara", onPress: takePhoto },
                { text: "Galería", onPress: pickImage }
            ]
        );
    };

    const takePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
            showAlert("Permiso requerido", "Se requiere acceso a la cámara.");
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.5,
            base64: true,
            allowsEditing: false, // Optional
        });

        if (!result.canceled) {
            const compressedImg = await compressImage(result.assets[0].uri);
            const newImages = [...(data.images || []), compressedImg];
            setData({ ...data, images: newImages });
            if (!isEditing) {
                handleSave(newImages);
                showAlert("Éxito", "La imagen se ha agregado a la solicitud.");
            }
        }
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            showAlert("Permiso requerido", "Se requiere acceso a la galería.");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            // Comprimir multiples imagenes
            const compressedPromises = result.assets.map(asset => compressImage(asset.uri));
            const newPhotos = await Promise.all(compressedPromises);
            const newImages = [...(data.images || []), ...newPhotos];
            setData({ ...data, images: newImages });
            if (!isEditing) {
                handleSave(newImages);
                showAlert("Éxito", "Las imágenes se han agregado a la solicitud.");
            }
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>


            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Caja Unificada (Header + Info) */}
                <View style={{ backgroundColor: 'white', borderBottomLeftRadius: 36, borderBottomRightRadius: 36, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, marginBottom: 30 }}>
                    {/* PARTE NARANJA (HEADER) */}
                    <View style={{
                        backgroundColor: '#EA580C',
                        paddingHorizontal: 20,
                        paddingTop: 24,
                        paddingBottom: 32,
                        borderBottomLeftRadius: 36,
                        borderBottomRightRadius: 36,
                    }}>
                        {isEditing ? (
                            <View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                    <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 'bold', letterSpacing: 1 }}>EDITANDO SOLICITUD</Text>
                                    <TouchableOpacity
                                        onPress={handleSave}
                                        style={{ backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 }}
                                    >
                                        <Text style={{ color: '#EA580C', fontWeight: 'bold', fontSize: 13 }}>Guardar</Text>
                                    </TouchableOpacity>
                                </View>
                                <TextInput
                                    value={data.title}
                                    onChangeText={t => setData({ ...data, title: t })}
                                    style={{ fontSize: 24, fontWeight: 'bold', color: 'white', borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.5)', paddingVertical: 6, marginBottom: 15 }}
                                />
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Feather name="map-pin" size={14} color="white" />
                                    <TextInput
                                        value={data.location}
                                        onChangeText={t => setData({ ...data, location: t })}
                                        style={{ flex: 1, marginLeft: 8, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.5)', paddingVertical: 4, fontSize: 14, color: 'white' }}
                                        placeholder="Ciudad, Estado"
                                        placeholderTextColor="rgba(255,255,255,0.4)"
                                    />
                                </View>
                            </View>
                        ) : (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <View style={{ flex: 1, marginRight: 15 }}>
                                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 }}>
                                        {(typeof data.category === 'object' ? data.category.name : data.category)} • {(typeof data.subcategory === 'object' ? data.subcategory.name : (data.subcategory || 'General'))}
                                    </Text>
                                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', lineHeight: 28 }}>{data.title}</Text>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                                        <View style={{
                                            backgroundColor: getClientStatusColor(getClientStatus(data)).bg,
                                            paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 12
                                        }}>
                                            <Text style={{ color: getClientStatusColor(getClientStatus(data)).text, fontSize: 10, fontWeight: 'bold' }}>
                                                {getClientStatus(data).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                                            <Feather name="map-pin" size={12} color="rgba(255,255,255,0.8)" />
                                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, marginLeft: 4 }}>{data.location || 'Sin ubicación'}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Feather name="calendar" size={12} color="rgba(255,255,255,0.8)" />
                                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, marginLeft: 4 }}>{(data.createdAt && !isNaN(new Date(data.createdAt))) ? new Date(data.createdAt).toLocaleDateString() : 'Reciente'}</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <TouchableOpacity
                                        onPress={() => setIsEditing(true)}
                                        style={{ backgroundColor: 'rgba(255,255,255,0.25)', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}
                                    >
                                        <Feather name="edit-2" size={18} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* CONTENIDO BLANCO */}
                    <View style={{ backgroundColor: 'white', padding: 24 }}>
                        {isEditing ? (
                            <View>
                                <CustomDropdown
                                    label="Categoría"
                                    value={typeof data.category === 'object' ? data.category.name : data.category}
                                    options={categories.map(c => c.name)}
                                    onSelect={(val) => setData({ ...data, category: val, subcategory: null })}
                                    placeholder="Selecciona categoría"
                                />
                                <CustomDropdown
                                    label="Subcategoría"
                                    value={data.subcategory}
                                    options={(() => {
                                        const catName = typeof data.category === 'object' ? data.category.name : data.category;
                                        const catObj = categories.find(c => c.name === catName);
                                        return catObj ? (catObj.subcategories || []) : [];
                                    })()}
                                    onSelect={(val) => setData({ ...data, subcategory: val })}
                                    placeholder="Selecciona subcategoría"
                                />
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#6B7280', marginBottom: 4, marginTop: 10 }}>Descripción</Text>
                            </View>
                        ) : null}

                        {isEditing ? (
                            <TextInput
                                value={data.description}
                                onChangeText={t => setData({ ...data, description: t })}
                                multiline
                                style={{ color: '#374151', fontSize: 15, lineHeight: 24, minHeight: 80, textAlignVertical: 'top' }}
                                placeholder="Descripción del problema..."
                            />
                        ) : (
                            <Text style={{ color: '#374151', fontSize: 18, lineHeight: 28 }}>{data.description}</Text>
                        )}

                        {/* FOTOS */}
                        {((data.images && data.images.length > 0) || isEditing || ['NUEVA', 'CONTACTADA', 'PRESUPUESTADA'].includes(getClientStatus(data))) && (
                            <View style={{ marginTop: 20 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#6B7280', marginRight: 10 }}>FOTOS ADJUNTAS</Text>
                                        {((data.images && data.images.length > 0) || isEditing) && (
                                            <TouchableOpacity onPress={handleAddImage} style={{ backgroundColor: '#F1F5F9', padding: 6, borderRadius: 8 }}>
                                                <Feather name="camera" size={14} color="#64748B" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    {isEditing && (
                                        <TouchableOpacity onPress={handleAddImage} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Feather name="plus-circle" size={16} color="#EA580C" />
                                            <Text style={{ fontSize: 12, color: '#EA580C', marginLeft: 4, fontWeight: 'bold' }}>Agregar</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {(data.images && data.images.length > 0) || isEditing ? (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {data.images && data.images.map((img, i) => (
                                            <View key={i} style={{ position: 'relative', marginRight: 10 }}>
                                                <TouchableOpacity onPress={() => onViewImage(img)}>
                                                    <Image source={{ uri: img }} style={{ width: 100, height: 100, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' }} />
                                                </TouchableOpacity>
                                                {isEditing && (
                                                    <TouchableOpacity
                                                        style={{ position: 'absolute', top: -8, right: -8, backgroundColor: 'white', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', elevation: 2 }}
                                                        onPress={() => {
                                                            const newImages = [...data.images];
                                                            newImages.splice(i, 1);
                                                            setData({ ...data, images: newImages });
                                                        }}
                                                    >
                                                        <Feather name="x" size={14} color="#EF4444" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        ))}
                                    </ScrollView>
                                ) : (
                                    <View style={{ alignItems: 'center', backgroundColor: '#F8FAFC', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed' }}>
                                        <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 15, paddingHorizontal: 10 }}>Sube fotos e imágenes para recibir presupuestos más precisos.</Text>
                                        <TouchableOpacity onPress={handleAddImage} style={{ backgroundColor: 'white', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', elevation: 2 }}>
                                            <Feather name="camera" size={16} color="#EA580C" style={{ marginRight: 8 }} />
                                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1E293B' }}>Agregar Imágenes</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </View>

                {(() => {
                    const status = getClientStatus(data);

                    const ManagementSection = (
                        <ProjectTimeline
                            job={data}
                            userMode="client"
                            currentUser={currentUser}
                            onConfirmStart={handleConfirmStartInternal}
                            onAddTimelineEvent={onAddTimelineEvent}
                            onFinish={handleFinishInternal}
                            onRate={handleRateInternal}
                            onTogglePortfolio={onTogglePortfolio}
                            onViewImage={onViewImage}
                            showSection="management"
                        />
                    );

                    const RatingSection = (
                        <ProjectTimeline
                            job={data}
                            userMode="client"
                            currentUser={currentUser}
                            onConfirmStart={handleConfirmStartInternal}
                            onAddTimelineEvent={onAddTimelineEvent}
                            onFinish={handleFinishInternal}
                            onRate={handleRateInternal}
                            onTogglePortfolio={onTogglePortfolio}
                            onViewImage={onViewImage}
                            showSection="rating"
                        />
                    );

                    const TimelineSection = (
                        <ProjectTimeline
                            job={data}
                            userMode="client"
                            currentUser={currentUser}
                            onConfirmStart={handleConfirmStartInternal}
                            onAddTimelineEvent={onAddTimelineEvent}
                            onFinish={handleFinishInternal}
                            onRate={handleRateInternal}
                            onTogglePortfolio={onTogglePortfolio}
                            onViewImage={onViewImage}
                            showSection="timeline"
                        />
                    );

                    const ChatsSection = (
                        <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: '#F1F5F9', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
                                <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E2937' }}>Mensajes</Text>
                                <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                                    <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 12 }}>
                                        {Array.from(new Set([
                                            ...(request.conversations || []).map(c => c.proId),
                                            ...(request.offers || []).map(o => o.proId)
                                        ])).length}
                                    </Text>
                                </View>
                            </View>

                            {(() => {
                                const proMap = {};
                                (request.conversations || []).forEach(conv => {
                                    const pid = conv.proId._id || conv.proId;
                                    if (!proMap[pid]) proMap[pid] = { id: pid, name: conv.proName, avatar: conv.proAvatar, email: conv.proEmail, rating: conv.proRating };
                                    proMap[pid].chat = conv;
                                });
                                (request.offers || []).forEach((offer, idx) => {
                                    const pid = offer.proId._id || offer.proId;
                                    if (!proMap[pid]) proMap[pid] = { id: pid, name: offer.proName, avatar: offer.proAvatar, rating: offer.proRating };
                                    proMap[pid].offer = {
                                        ...offer,
                                        index: idx,
                                        proName: proMap[pid].name,
                                        proAvatar: proMap[pid].avatar
                                    };
                                });

                                const allPros = Object.values(proMap).sort((a, b) => {
                                    if (a.offer?.status === 'accepted') return -1;
                                    if (b.offer?.status === 'accepted') return 1;
                                    return 0;
                                });

                                const winner = allPros.find(p => p.offer?.status === 'accepted');
                                let visiblePros = allPros;
                                let archivedPros = [];
                                if (winner) {
                                    visiblePros = [winner];
                                    archivedPros = allPros.filter(p => p.id !== winner.id);
                                }

                                const prosToRender = showArchivedChats ? allPros : visiblePros;
                                const hasHidden = archivedPros.length > 0 && !showArchivedChats;

                                return (
                                    <View style={{ paddingHorizontal: 0 }}>
                                        {prosToRender.length === 0 ? (
                                            <View style={{ backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', opacity: 0.6, overflow: 'hidden' }}>
                                                {/* MODAL LOCK OVERLAY */}
                                                <View style={{
                                                    position: 'absolute', top: -16, left: -16, right: -16, bottom: -16,
                                                    backgroundColor: 'rgba(248, 250, 252, 0.4)',
                                                    zIndex: 100, justifyContent: 'center', alignItems: 'center', borderRadius: 24
                                                }}>
                                                    <View style={{ backgroundColor: 'white', padding: 12, borderRadius: 50, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
                                                        <Feather name="lock" size={20} color="#94A3B8" />
                                                    </View>
                                                    <Text style={{ color: '#64748B', fontWeight: 'bold', fontSize: 13, marginTop: 12, textAlign: 'center', paddingHorizontal: 20 }}>
                                                        Aún no tienes mensajes.{'\n'}Los profesionales te contactarán pronto.
                                                    </Text>
                                                </View>

                                                {/* PRO HEADER MOCK */}
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                                                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                                        <Feather name="user" size={20} color="#94A3B8" />
                                                    </View>
                                                    <View>
                                                        <Text style={{ fontWeight: 'bold', color: '#94A3B8' }}>Ej. Un Profesional</Text>
                                                        <Text style={{ fontSize: 12, color: '#CBD5E1' }}>⭐ 5.0</Text>
                                                    </View>
                                                </View>

                                                {/* MESSAGES MOCK */}
                                                <View style={{ marginBottom: 10 }}>
                                                    <View style={{ backgroundColor: '#F1F5F9', padding: 8, borderRadius: 12, marginBottom: 4, alignSelf: 'flex-start', maxWidth: '85%' }}>
                                                        <Text style={{ fontSize: 12, color: '#94A3B8' }}>Hola, revisé tu solicitud.</Text>
                                                    </View>
                                                    <View style={{ backgroundColor: '#FFF7ED', padding: 8, borderRadius: 12, marginBottom: 4, alignSelf: 'flex-end', maxWidth: '85%' }}>
                                                        <Text style={{ fontSize: 12, color: '#94A3B8' }}>Perfecto, espero el presupuesto.</Text>
                                                    </View>

                                                    <View style={{ backgroundColor: '#F1F5F9', paddingVertical: 12, borderRadius: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#CBD5E1', marginTop: 6 }}>
                                                        <Text style={{ color: '#94A3B8', fontWeight: 'bold' }}>Preguntar</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        ) : prosToRender.map((pro, index) => {
                                            const messages = pro.chat?.messages || [];
                                            const lastThree = messages.slice(-3);
                                            const isLastFromPro = lastThree.length > 0 && lastThree[lastThree.length - 1].sender === 'pro';

                                            return (
                                                <View key={`chat-${index}`} style={{ marginBottom: index === prosToRender.length - 1 ? 0 : 25 }}>
                                                    {/* PRO HEADER */}
                                                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }} onPress={() => onViewUserProfile && onViewUserProfile(pro)}>
                                                        <Image source={{ uri: pro.avatar }} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 10 }} />
                                                        <View>
                                                            <Text style={{ fontWeight: 'bold', color: '#1E293B' }}>{pro.name}</Text>
                                                            <Text style={{ fontSize: 12, color: '#64748B' }}>⭐ {pro.rating || '5.0'}</Text>
                                                        </View>
                                                    </TouchableOpacity>

                                                    <View style={{ marginBottom: 10 }}>
                                                        {lastThree.map((msg, mIdx) => (
                                                            <View key={mIdx} style={{ backgroundColor: msg.sender === 'pro' ? '#F1F5F9' : '#FFF7ED', padding: 8, borderRadius: 12, marginBottom: 4, alignSelf: msg.sender === 'pro' ? 'flex-start' : 'flex-end', maxWidth: '85%' }}>
                                                                <Text style={{ fontSize: 12, color: '#334155' }}>{msg.text || (msg.media ? '📷 Archivo' : '...')}</Text>
                                                            </View>
                                                        ))}
                                                        <TouchableOpacity
                                                            style={{ backgroundColor: isLastFromPro ? '#EA580C' : 'white', paddingVertical: 12, borderRadius: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#EA580C', marginTop: 6 }}
                                                            onPress={() => onOpenChat && onOpenChat(request, { ...pro, role: 'pro' })}
                                                        >
                                                            <Text style={{ color: isLastFromPro ? 'white' : '#EA580C', fontWeight: 'bold' }}>{isLastFromPro ? 'Responder' : 'Preguntar'}</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                        {hasHidden && (
                                            <TouchableOpacity style={{ padding: 15, alignItems: 'center' }} onPress={() => setShowArchivedChats(true)}>
                                                <Text style={{ color: '#64748B', fontWeight: 'bold' }}>VER CHATS ANTERIORES ({archivedPros.length})</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            })()}
                        </View>
                    );

                    const BudgetSection = (
                        <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: '#F1F5F9', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
                                <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E2937' }}>Presupuesto</Text>
                            </View>

                            {(() => {
                                const proMap = {};
                                (request.offers || []).forEach((offer, idx) => {
                                    const pid = offer.proId._id || offer.proId;
                                    if (!proMap[pid]) proMap[pid] = { id: pid, name: offer.proName, avatar: offer.proAvatar, rating: offer.proRating };
                                    proMap[pid].offer = {
                                        ...offer,
                                        index: idx,
                                        proName: proMap[pid].name,
                                        proAvatar: proMap[pid].avatar
                                    };
                                });

                                const allPros = Object.values(proMap).sort((a, b) => {
                                    if (a.offer?.status === 'accepted') return -1;
                                    if (b.offer?.status === 'accepted') return 1;
                                    return 0;
                                });

                                const winner = allPros.find(p => p.offer?.status === 'accepted');
                                let visiblePros = allPros;
                                if (winner) {
                                    visiblePros = [winner];
                                }

                                const prosToRender = showArchivedChats ? allPros : visiblePros;
                                const prosWithOffers = prosToRender.filter(p => p.offer);

                                if (prosWithOffers.length === 0) {
                                    return (
                                        <View style={{ paddingHorizontal: 0, opacity: 0.6, overflow: 'hidden' }}>
                                            {/* MODAL LOCK OVERLAY */}
                                            <View style={{
                                                position: 'absolute', top: -16, left: -16, right: -16, bottom: -16,
                                                backgroundColor: 'rgba(248, 250, 252, 0.4)',
                                                zIndex: 100, justifyContent: 'center', alignItems: 'center', borderRadius: 24
                                            }}>
                                                <View style={{ backgroundColor: 'white', padding: 12, borderRadius: 50, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
                                                    <Feather name="lock" size={20} color="#94A3B8" />
                                                </View>
                                                <Text style={{ color: '#64748B', fontWeight: 'bold', fontSize: 13, marginTop: 12, textAlign: 'center', paddingHorizontal: 20 }}>
                                                    Aún no tienes presupuestos.{'\n'}Espera las propuestas.
                                                </Text>
                                            </View>

                                            <View style={{
                                                backgroundColor: '#F8FAFC', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0'
                                            }}>
                                                <Text style={{ fontWeight: 'bold', color: '#94A3B8', fontSize: 11, textAlign: 'center', marginBottom: 8 }}>
                                                    EJ. PRESUPUESTO RECIBIDO
                                                </Text>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                    <View><Text style={{ fontSize: 9, color: '#CBD5E1' }}>MONTO</Text><Text style={{ fontWeight: 'bold', fontSize: 13, color: '#94A3B8' }}>$0</Text></View>
                                                    <View><Text style={{ fontSize: 9, color: '#CBD5E1' }}>INICIO</Text><Text style={{ fontWeight: '600', fontSize: 12, color: '#94A3B8' }}>Pronto</Text></View>
                                                    <View><Text style={{ fontSize: 9, color: '#CBD5E1' }}>PLAZO</Text><Text style={{ fontWeight: '600', fontSize: 12, color: '#94A3B8' }}>X Días</Text></View>
                                                </View>
                                                <View style={{ marginTop: 12, backgroundColor: '#E2E8F0', height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
                                                    <Text style={{ color: '#94A3B8', fontWeight: 'bold', fontSize: 14 }}>VER PRESUPUESTO</Text>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                }

                                return (
                                    <View style={{ paddingHorizontal: 0 }}>
                                        {prosWithOffers.map((pro, index) => {
                                            const isWinner = pro.offer?.status === 'accepted';
                                            return (
                                                <View key={`budget-${index}`} style={{
                                                    backgroundColor: '#F0F9FF',
                                                    padding: 16, borderRadius: 20,
                                                    borderWidth: 1, borderColor: '#BAE6FD',
                                                    marginBottom: index === prosWithOffers.length - 1 ? 0 : 20
                                                }}>
                                                    <Text style={{ fontWeight: 'bold', color: isWinner ? '#059669' : '#1E3A8A', fontSize: 11, textAlign: 'center', marginBottom: 8 }}>
                                                        {isWinner ? '✅ PRESUPUESTO ACEPTADO' : 'PRESUPUESTO RECIBIDO'}
                                                    </Text>
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                        <View><Text style={{ fontSize: 9, color: '#64748B' }}>MONTO</Text><Text style={{ fontWeight: 'bold', fontSize: 13 }}>{pro.offer.currency || '$'}{pro.offer.amount}</Text></View>
                                                        <View><Text style={{ fontSize: 9, color: '#64748B' }}>INICIO</Text><Text style={{ fontWeight: '600', fontSize: 12 }}>{pro.offer.startDate || 'Pronto'}</Text></View>
                                                        <View><Text style={{ fontSize: 9, color: '#64748B' }}>PLAZO</Text><Text style={{ fontWeight: '600', fontSize: 12 }}>{pro.offer.duration}</Text></View>
                                                    </View>
                                                    <TouchableOpacity
                                                        style={{ marginTop: 12, backgroundColor: '#10B981', height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}
                                                        onPress={() => { setSelectedBudget(pro.offer); setShowBudgetModal(true); }}
                                                    >
                                                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>VER PRESUPUESTO</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            );
                                        })}
                                    </View>
                                );
                            })()}
                        </View>
                    );

                    const ValidationSection = status === 'VALIDANDO' ? (
                        <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 20, marginHorizontal: 20, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, borderWidth: 1, borderColor: '#F87171' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                                <View style={{ backgroundColor: '#FEE2E2', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 15 }}>
                                    <Feather name="check-circle" size={24} color="#EF4444" />
                                </View>
                                <Text style={{ flex: 1, fontSize: 16, fontWeight: 'bold', color: '#1E293B', lineHeight: 22 }}>
                                    El profesional {(data.professional?.name || (data.offers && data.offers.find(o => o.status === 'accepted')?.proName) || '')} ha indicado que el trabajo está listo o terminado.
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={handleFinishInternal}
                                style={{ backgroundColor: '#EF4444', paddingVertical: 14, borderRadius: 16, alignItems: 'center' }}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>Trabajo terminado</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null;

                    // Reorder Page Sections
                    if (status === 'NUEVA' || status === 'CONTACTADA' || status === 'PRESUPUESTADA') {
                        return <>{ChatsSection}{BudgetSection}{ManagementSection}{RatingSection}{TimelineSection}</>;
                    } else if (status === 'VALIDANDO') {
                        return <>{ValidationSection}{ManagementSection}{ChatsSection}{BudgetSection}{RatingSection}{TimelineSection}</>;
                    } else if (status === 'VALORACIÓN') {
                        return <>{RatingSection}{ManagementSection}{ChatsSection}{BudgetSection}{TimelineSection}</>;
                    } else if (status === 'FINALIZADA') {
                        return <>{RatingSection}{ManagementSection}{ChatsSection}{BudgetSection}{TimelineSection}</>;
                    } else {
                        return <>{ManagementSection}{ChatsSection}{BudgetSection}{RatingSection}{TimelineSection}</>;
                    }
                })()}

                {/* BOTÓN ELIMINAR SOLICITUD (Solo si está activa/abierta) */}
                {
                    (data.status === 'active' || data.status === 'open' || data.status === 'Abierto' || data.status === 'NUEVA') && (
                        <View style={{ marginTop: 20, marginBottom: 40, paddingHorizontal: 20 }}>
                            <TouchableOpacity
                                onPress={onCloseRequest}
                                style={{
                                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                                    padding: 15, borderRadius: 12, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA'
                                }}
                            >
                                <Feather name="trash-2" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                                <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Eliminar Solicitud</Text>
                            </TouchableOpacity>
                        </View>
                    )
                }
            </ScrollView >

            {/* Modal de Detalle de Presupuesto */}
        </View >
    );
};

export default RequestDetailClient;
