import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert, Image, Linking, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import CustomDropdown from '../components/CustomDropdown';
import styles from '../styles/globalStyles';
import { api } from '../utils/api';
import { getClientStatus, getClientStatusColor, showAlert, showConfirmation } from '../utils/helpers';
import ProjectTimeline from './ProjectTimeline';

const RequestDetailClient = ({ request, onBack, onAcceptOffer, onOpenChat, onUpdateRequest, selectedBudget, setSelectedBudget, showBudgetModal, setShowBudgetModal, categories = [], onRejectOffer, onConfirmStart, onAddWorkPhoto, onFinish, onRate, onCloseRequest, currentUser, onAddTimelineEvent, onTogglePortfolio, onViewUserProfile, onViewImage }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [data, setData] = useState(request);
    const [showArchivedChats, setShowArchivedChats] = useState(false);

    // --- PRIVATE JOB MANAGEMENT REMOVED ---


    useEffect(() => { setData(request); }, [request]);

    // Force refresh detailed data on mount to ensure timeline/legacy data is present
    useEffect(() => {
        const loadFullDetails = async () => {
            try {
                const id = request._id || request.id;
                console.log("Fetching full details for:", id);
                const fresh = await api.getJob(id);
                const freshData = fresh.data || fresh;
                setData(freshData);
            } catch (e) {
                console.warn("Could not refresh job details:", e);
            }
        };
        loadFullDetails();
    }, []);

    const handleRejectOfferInternal = (proId) => {
        showConfirmation(
            "Confirmar Rechazo",
            "¿Estás seguro de rechazar este presupuesto?",
            () => onRejectOffer(request._id || request.id, proId, "Rechazado desde vista previa"),
            null,
            "Rechazar",
            "Cancelar",
            true
        );
    };

    const handleConfirmStartInternal = (startedOnTime) => {
        onConfirmStart(request.id, startedOnTime);
    };

    const takeWorkPhoto = async () => {
        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.5,
            base64: true,
        });
        if (!result.canceled) {
            onAddWorkPhoto(request._id || request.id, `data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const handleFinishInternal = () => {
        onFinish(request._id || request.id);
    };

    const handleRateInternal = (reviewData) => {
        onRate(request._id || request.id, reviewData);
    };

    const handleSave = async () => {
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

            await api.updateJob(data._id || data.id, {
                title: data.title,
                description: data.description,
                category: categoryId,
                subcategory: data.subcategory,
                location: data.location,
                images: data.images
            });
            setIsEditing(false);
            if (onUpdateRequest) onUpdateRequest(data);
            showAlert("Actualizado", "Los cambios han sido guardados.");
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
            allowsEditing: true, // Optional
        });

        if (!result.canceled) {
            const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
            const newImages = [...(data.images || []), base64Img];
            setData({ ...data, images: newImages });
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
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
            const newImages = [...(data.images || []), base64Img];
            setData({ ...data, images: newImages });
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
                                            backgroundColor: '#FFFFFF',
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
                            <Text style={{ color: '#374151', fontSize: 15, lineHeight: 24 }}>{data.description}</Text>
                        )}

                        {/* FOTOS */}
                        <View style={{ marginTop: 20 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#6B7280' }}>FOTOS ADJUNTAS</Text>
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
                            ) : null}
                        </View>
                    </View>
                </View>

                {/* SECCIÓN UNIFICADA DE INTERACCIONES (CHATS + OFERTAS) */}
                <View style={{ paddingHorizontal: 0, marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 20 }}>
                        <Text style={styles.sectionTitle}>Interacciones y Ofertas</Text>
                        <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                            <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 12 }}>
                                {Array.from(new Set([
                                    ...(request.conversations || []).map(c => c.proId),
                                    ...(request.offers || []).map(o => o.proId)
                                ])).length}
                            </Text>
                        </View>
                    </View>

                    {(!request.conversations || request.conversations.length === 0) && (!request.offers || request.offers.length === 0) && (
                        <View style={{ alignItems: 'center', padding: 30, backgroundColor: 'white', borderRadius: 24, marginHorizontal: 4, elevation: 5, shadowColor: '#EA580C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, borderWidth: 1, borderColor: '#FFF7ED' }}>
                            <Feather name="message-square" size={32} color="#D1D5DB" />
                            <Text style={{ color: '#999', marginTop: 10 }}>Aún no hay mensajes ni ofertas.</Text>
                        </View>
                    )}

                    {(() => {
                        const proMap = {};
                        (request.conversations || []).forEach(conv => {
                            if (!proMap[conv.proId]) proMap[conv.proId] = { id: conv.proId, name: conv.proName, avatar: conv.proAvatar, email: conv.proEmail, rating: conv.proRating };
                            proMap[conv.proId].chat = conv;
                        });
                        (request.offers || []).forEach((offer, idx) => {
                            if (!proMap[offer.proId]) proMap[offer.proId] = { id: offer.proId, name: offer.proName, avatar: offer.proAvatar, rating: offer.proRating };
                            proMap[offer.proId].offer = {
                                ...offer,
                                index: idx,
                                proName: proMap[offer.proId].name,
                                proAvatar: proMap[offer.proId].avatar
                            };
                        });

                        const allPros = Object.values(proMap).sort((a, b) => {
                            // PRIORITY 1: Accepted Offer ALWAYS First
                            if (a.offer?.status === 'accepted') return -1;
                            if (b.offer?.status === 'accepted') return 1;

                            // PRIORITY 2: Recent Activity
                            const getLastTime = (p) => {
                                const msgTime = p.chat?.messages?.length > 0 ? new Date(p.chat.messages[p.chat.messages.length - 1].timestamp).getTime() : 0;
                                const offerTime = p.offer?.updatedAt ? new Date(p.offer.updatedAt).getTime() : (p.offer?.createdAt ? new Date(p.offer.createdAt).getTime() : 0);
                                return Math.max(msgTime, offerTime);
                            };
                            return getLastTime(b) - getLastTime(a);
                        });

                        // Logic for Hiding/Archiving
                        const winner = allPros.find(p => p.offer?.status === 'accepted');
                        let visiblePros = allPros;
                        let archivedPros = [];

                        if (winner) {
                            visiblePros = [winner];
                            archivedPros = allPros.filter(p => p !== winner);
                        }

                        // Determine what to render based on toggle
                        const prosToRender = showArchivedChats ? allPros : visiblePros;
                        const hasHidden = archivedPros.length > 0 && !showArchivedChats;

                        return (
                            <View>
                                {prosToRender.map((pro, index) => {
                                    const messages = pro.chat?.messages || [];
                                    const lastThree = messages.slice(-3);
                                    const lastMsg = lastThree.length > 0 ? lastThree[lastThree.length - 1] : null;
                                    const isLastFromPro = lastMsg?.sender === 'pro';

                                    // Check if this specific card is the winner to modify layout
                                    const isWinner = pro.offer?.status === 'accepted';

                                    return (
                                        <View key={index} style={{ backgroundColor: 'white', borderRadius: 24, padding: 16, marginHorizontal: 4, marginBottom: 16, elevation: 5, shadowColor: '#EA580C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, borderWidth: 1, borderColor: '#FFF7ED' }}>
                                            {/* Cabecera Pro */}
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                                                <TouchableOpacity
                                                    style={{ flexDirection: 'row', alignItems: 'center' }}
                                                    onPress={() => onViewUserProfile && onViewUserProfile(pro)}
                                                >
                                                    <Image
                                                        source={{ uri: pro.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(pro.name)}&background=random` }}
                                                        style={{ width: 50, height: 50, borderRadius: 25, marginRight: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9' }}
                                                    />
                                                    <View>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                            <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#1E293B' }}>{pro.name}</Text>
                                                            <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: 8 }}>
                                                                <Text style={{ fontSize: 10, color: '#EF4444', fontWeight: 'bold' }}>PRO</Text>
                                                            </View>
                                                        </View>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                                            <FontAwesome5 name="star" solid size={11} color="#F59E0B" />
                                                            <Text style={{ fontSize: 13, color: '#64748B', marginLeft: 5, fontWeight: '600' }}>{pro.rating || '5.0'}</Text>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                                {pro.offer && (
                                                    <View style={{ alignItems: 'flex-end' }}>
                                                        <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 22 }}>
                                                            {pro.offer.currency || '$'} {pro.offer.amount || pro.offer.price || '0'}
                                                        </Text>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                            {pro.offer.status === 'rejected' && (
                                                                <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginRight: 5 }}>
                                                                    <Text style={{ fontSize: 9, color: '#EF4444', fontWeight: 'bold' }}>RECHAZADO</Text>
                                                                </View>
                                                            )}
                                                            <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: 'bold' }}>OFERTA</Text>
                                                        </View>
                                                    </View>
                                                )}
                                            </View>

                                            {/* Últimos Mensajes del Chat Estilo Burbuja */}
                                            {lastThree.length > 0 && (
                                                <View style={{ marginBottom: 15 }}>
                                                    {lastThree.map((msg, mIdx) => (
                                                        <View key={mIdx} style={{
                                                            backgroundColor: msg.sender === 'pro' ? '#F1F5F9' : '#FFF7ED',
                                                            paddingVertical: 4,
                                                            paddingHorizontal: 10,
                                                            borderRadius: 14,
                                                            borderBottomLeftRadius: msg.sender === 'pro' ? 2 : 14,
                                                            borderBottomRightRadius: msg.sender === 'pro' ? 14 : 2,
                                                            marginBottom: 2,
                                                            alignSelf: msg.sender === 'pro' ? 'flex-start' : 'flex-end',
                                                            maxWidth: '85%'
                                                        }}>
                                                            <Text style={{ fontSize: 12, color: '#334155', lineHeight: 16 }}>
                                                                {msg.text || (msg.media ? '📷 Foto/Video' : '...')}
                                                            </Text>
                                                            <Text style={{ fontSize: 8, color: '#94A3B8', marginTop: 1, textAlign: 'right' }}>
                                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </Text>
                                                        </View>
                                                    ))}

                                                    <TouchableOpacity
                                                        style={{
                                                            backgroundColor: isLastFromPro ? '#EA580C' : 'white',
                                                            paddingVertical: 14,
                                                            borderRadius: 16,
                                                            alignItems: 'center',
                                                            borderWidth: 1.5,
                                                            borderColor: '#EA580C',
                                                            elevation: isLastFromPro ? 2 : 0,
                                                            marginTop: 8,
                                                            shadowColor: '#EA580C',
                                                            shadowOffset: { width: 0, height: 2 },
                                                            shadowOpacity: 0.1,
                                                            shadowRadius: 4
                                                        }}
                                                        onPress={() => onOpenChat && onOpenChat(request, {
                                                            name: pro.name,
                                                            role: 'pro',
                                                            email: pro.email,
                                                            id: pro.id,
                                                            avatar: pro.avatar
                                                        })}
                                                    >
                                                        <Text style={{ color: isLastFromPro ? 'white' : '#EA580C', fontWeight: 'bold', fontSize: 16 }}>
                                                            {isLastFromPro ? 'Responder' : 'Preguntar'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}

                                            {/* Información del Presupuesto */}
                                            {/* BANNER ACEPTADO */}
                                            {pro.offer && pro.offer.status === 'accepted' && (
                                                <View style={{ marginBottom: 15, padding: 12, backgroundColor: '#ECFDF5', borderRadius: 12, borderWidth: 1, borderColor: '#A7F3D0' }}>
                                                    <Text style={{ color: '#059669', fontWeight: 'bold', textAlign: 'center' }}>✅ PROPUESTA ACEPTADA</Text>
                                                    <Text style={{ color: '#047857', fontSize: 11, textAlign: 'center', marginTop: 4 }}>
                                                        Aceptada el: {new Date(pro.offer.updatedAt || Date.now()).toLocaleDateString()} a las {new Date(pro.offer.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </Text>

                                                </View>
                                            )}
                                            {pro.offer && (
                                                <View style={{ backgroundColor: '#F0F9FF', padding: 15, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#BAE6FD' }}>
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                        <Text style={{ fontWeight: 'bold', color: '#0369A1', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Presupuesto Recibido</Text>

                                                        {/* REMOVED "VER DETALLE" BUTTON FOR WINNER - SHOW INLINE */}
                                                        {!isWinner && (
                                                            <TouchableOpacity
                                                                style={{ backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#0284C7' }}
                                                                onPress={() => {
                                                                    setSelectedBudget(pro.offer);
                                                                    setShowBudgetModal(true);
                                                                }}
                                                            >
                                                                <Text style={{ color: '#0284C7', fontWeight: 'bold', fontSize: 11 }}>VER DETALLE</Text>
                                                            </TouchableOpacity>
                                                        )}
                                                    </View>

                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                        <View>
                                                            <Text style={{ fontSize: 10, color: '#64748B', fontWeight: 'bold', marginBottom: 2 }}>MONTO</Text>
                                                            <Text style={{ fontWeight: 'bold', color: '#0F172A', fontSize: 18 }}>
                                                                {pro.offer.currency || '$'} {pro.offer.amount || pro.offer.price || '0'}
                                                            </Text>
                                                        </View>
                                                        <View style={{ alignItems: 'center' }}>
                                                            <Text style={{ fontSize: 10, color: '#64748B', fontWeight: 'bold', marginBottom: 2 }}>INICIO</Text>
                                                            <Text style={{ fontWeight: '600', color: '#334155', fontSize: 13 }}>{pro.offer.startDate || 'Inmediato'}</Text>
                                                        </View>
                                                        <View style={{ alignItems: 'flex-end' }}>
                                                            <Text style={{ fontSize: 10, color: '#64748B', fontWeight: 'bold', marginBottom: 2 }}>DURACIÓN</Text>
                                                            <Text style={{ fontWeight: '600', color: '#334155', fontSize: 13 }}>{pro.offer.duration || 'N/A'}</Text>
                                                        </View>
                                                    </View>

                                                    {/* NEW: Inline Description for Winner or if expanded */}
                                                    {isWinner && (
                                                        <View style={{ marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#BAE6FD', gap: 12 }}>

                                                            {/* ITEMS LIST */}
                                                            {pro.offer.items && pro.offer.items.length > 0 && (
                                                                <View>
                                                                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#0369A1', marginBottom: 6, textTransform: 'uppercase' }}>Ítems Confirmados</Text>
                                                                    {pro.offer.items.map((item, idx) => (
                                                                        <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 4 }}>
                                                                            <Text style={{ flex: 1, fontSize: 13, color: '#334155', lineHeight: 20 }}>• {item.description}</Text>
                                                                            <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A', marginLeft: 10 }}>
                                                                                {pro.offer.currency || 'USD'} {Number(item.price).toFixed(2)}
                                                                            </Text>
                                                                        </View>
                                                                    ))}
                                                                </View>
                                                            )}

                                                            {/* DESCRIPTION LINE (If Separate) */}
                                                            {(pro.offer.descriptionLine || pro.offer.description) && (
                                                                <View>
                                                                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#0369A1', marginBottom: 2, textTransform: 'uppercase' }}>Descripción General</Text>
                                                                    <Text style={{ fontSize: 13, color: '#334155', lineHeight: 20 }}>{pro.offer.descriptionLine || pro.offer.description}</Text>
                                                                </View>
                                                            )}

                                                            {/* CONDITIONS GRID */}
                                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 5 }}>
                                                                {pro.offer.paymentTerms && (
                                                                    <View style={{ width: '48%', backgroundColor: '#EFF6FF', padding: 8, borderRadius: 8 }}>
                                                                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1D4ED8', marginBottom: 2 }}>FORMA DE PAGO</Text>
                                                                        <Text style={{ fontSize: 12, color: '#1E3A8A' }}>{pro.offer.paymentTerms}</Text>
                                                                    </View>
                                                                )}
                                                                {pro.offer.warranty && (
                                                                    <View style={{ width: '48%', backgroundColor: '#EFF6FF', padding: 8, borderRadius: 8 }}>
                                                                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1D4ED8', marginBottom: 2 }}>GARANTÍA</Text>
                                                                        <Text style={{ fontSize: 12, color: '#1E3A8A' }}>{pro.offer.warranty}</Text>
                                                                    </View>
                                                                )}
                                                            </View>

                                                            {/* FULL TEXT SECTIONS */}
                                                            {pro.offer.conditions && (
                                                                <View>
                                                                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#64748B', marginBottom: 2 }}>CONDICIONES</Text>
                                                                    <Text style={{ fontSize: 12, color: '#475569', fontStyle: 'italic', backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8 }}>
                                                                        {pro.offer.conditions}
                                                                    </Text>
                                                                </View>
                                                            )}

                                                            {pro.offer.observations && (
                                                                <View>
                                                                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#64748B', marginBottom: 2 }}>OBSERVACIONES</Text>
                                                                    <Text style={{ fontSize: 12, color: '#475569', backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8 }}>
                                                                        {pro.offer.observations}
                                                                    </Text>
                                                                </View>
                                                            )}

                                                            {/* TAX SUMMARY */}
                                                            {pro.offer.addTax && (
                                                                <View style={{ alignItems: 'flex-end', marginTop: 5 }}>
                                                                    <Text style={{ fontSize: 11, color: '#64748B' }}>Incluye Impuestos ({pro.offer.taxRate || 16}%)</Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                    )}

                                                    {pro.offer.status === 'rejected' && pro.offer.rejectionReason && (
                                                        <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#BAE6FD' }}>
                                                            <Text style={{ fontSize: 10, color: '#64748B', fontWeight: 'bold' }}>MOTIVO DEL CIERRE:</Text>
                                                            <Text style={{ fontSize: 12, color: '#EF4444', fontStyle: 'italic' }}>
                                                                {pro.offer.rejectionReason.includes('asignado a otro') ? "Se concretó con otro profesional en la aplicación." : `"${pro.offer.rejectionReason}"`}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                            )}

                                            {/* Botones de Finalización (Aceptar / Rechazar) o Estado */}
                                            {pro.offer && (
                                                pro.offer.status === 'rejected' ? (
                                                    <View style={{ marginTop: 10, alignItems: 'center', padding: 10, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                                                        <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>RECHAZADO</Text>
                                                        <TouchableOpacity onPress={() => { setSelectedBudget(pro.offer); setShowBudgetModal(true); }}>
                                                            <Text style={{ color: '#64748B', fontSize: 12, marginTop: 4, textDecorationLine: 'underline' }}>Ver detalle / Cambiar</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                ) : pro.offer.status === 'accepted' ? null : (
                                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                                        <TouchableOpacity
                                                            style={{
                                                                flex: 1,
                                                                height: 50,
                                                                borderRadius: 12,
                                                                justifyContent: 'center',
                                                                alignItems: 'center',
                                                                borderWidth: 1,
                                                                borderColor: '#FCA5A5',
                                                                backgroundColor: '#FEF2F2'
                                                            }}
                                                            onPress={() => handleRejectOfferInternal(pro.id)}
                                                        >
                                                            <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Rechazar</Text>
                                                        </TouchableOpacity>

                                                        <TouchableOpacity
                                                            style={{ flex: 1, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#10B981', elevation: 2 }}
                                                            onPress={() => onAcceptOffer && onAcceptOffer(request.id, pro.id)}
                                                        >
                                                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Aceptar</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                )
                                            )}
                                        </View>
                                    );
                                })}

                                {/* Toggle Button for Archived Chats */}
                                {hasHidden && (
                                    <TouchableOpacity
                                        style={{ padding: 15, alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, marginTop: 10, marginBottom: 20 }}
                                        onPress={() => setShowArchivedChats(true)}
                                    >
                                        <Text style={{ color: '#64748B', fontWeight: 'bold' }}>VER CHATS ANTERIORES ({archivedPros.length})</Text>
                                    </TouchableOpacity>
                                )}
                                {showArchivedChats && archivedPros.length > 0 && winner && (
                                    <TouchableOpacity
                                        style={{ padding: 15, alignItems: 'center', marginTop: 10 }}
                                        onPress={() => setShowArchivedChats(false)}
                                    >
                                        <Text style={{ color: '#64748B' }}>OCULTAR CHATS ANTERIORES</Text>
                                    </TouchableOpacity>
                                )}



                            </View>
                        );
                    })()}
                </View>

                {/* SHOW TIMELINE IF OFFER ACCEPTED OR TRACKING STARTED */}
                {(data.offers?.some(o => o.status === 'accepted') || ['contracted', 'started', 'in_progress', 'completed', 'finished'].includes(data.trackingStatus) || ['TERMINADO', 'Culminada', 'rated', 'completed'].includes(data.status)) && (
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
                    />
                )}

                {/* BOTÓN ELIMINAR SOLICITUD (Solo si está activa/abierta) */}
                {(data.status === 'active' || data.status === 'open' || data.status === 'Abierto' || data.status === 'NUEVA') && (
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
                )}
            </ScrollView>

            {/* Modal de Detalle de Presupuesto */}
            <Modal
                visible={showBudgetModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowBudgetModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1F2937' }}>Detalle del Presupuesto</Text>
                            <TouchableOpacity onPress={() => setShowBudgetModal(false)}>
                                <Feather name="x" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {selectedBudget && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* ENCABEZADO PROFESIONAL CLIENTE VIEW */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#2563EB', marginBottom: 20 }}>
                                    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#E2E8F0', overflow: 'hidden', borderWidth: 2, borderColor: 'white', elevation: 2 }}>
                                        {selectedBudget.proAvatar ? (
                                            <Image source={{ uri: selectedBudget.proAvatar }} style={{ width: '100%', height: '100%' }} />
                                        ) : (
                                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                                <Feather name="user" size={30} color="#94A3B8" />
                                            </View>
                                        )}
                                    </View>
                                    <View style={{ marginLeft: 16, flex: 1 }}>
                                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1E293B' }}>{selectedBudget.proName}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                            <Feather name="calendar" size={12} color="#64748B" />
                                            <Text style={{ fontSize: 12, color: '#64748B', marginLeft: 4 }}>Fecha: {new Date(selectedBudget.date || selectedBudget.createdAt || Date.now()).toLocaleDateString()}</Text>
                                        </View>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1E40AF' }}>OFERTA</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* DESGLOSE DE TRABAJO */}
                                <View style={{ marginBottom: 24 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                        <View style={{ width: 3, height: 16, backgroundColor: '#2563EB', marginRight: 8, borderRadius: 2 }} />
                                        <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#1E293B' }}>DESGLOSE DE TRABAJO</Text>
                                    </View>

                                    {selectedBudget.items && selectedBudget.items.length > 0 && (
                                        <View style={{ backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' }}>
                                            {selectedBudget.items.map((item, i) => (
                                                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: i === selectedBudget.items.length - 1 ? 0 : 1, borderBottomColor: '#F8FAFC' }}>
                                                    <View style={{ flex: 1, marginRight: 16 }}>
                                                        <Text style={{ fontSize: 14, color: '#475569', fontWeight: '500' }}>{item.description}</Text>
                                                    </View>
                                                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E293B' }}>
                                                        {selectedBudget.currency || '$'} {Number(item.price).toFixed(2)}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    {selectedBudget.descriptionLine && (
                                        <View style={{ marginTop: 12, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1' }}>
                                            <Text style={{ fontSize: 13, color: '#64748B', lineHeight: 18 }}>{selectedBudget.descriptionLine}</Text>
                                        </View>
                                    )}
                                </View>

                                {/* TOTAL Y MONTO */}
                                <View style={{ backgroundColor: '#1E293B', padding: 20, borderRadius: 20, marginBottom: 24, elevation: 4 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View>
                                            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 'bold', letterSpacing: 1 }}>TOTAL ESTIMADO</Text>
                                            {selectedBudget.addTax && (
                                                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Incluye IVA ({selectedBudget.taxRate || 16}%)</Text>
                                            )}
                                        </View>
                                        <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white' }}>
                                            {selectedBudget.currency || '$'} {Number(selectedBudget.amount || selectedBudget.price).toFixed(2)}
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
                                            <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '600', marginTop: 2 }}>{selectedBudget.startDate || 'A convenir'}</Text>
                                        </View>
                                        <View style={{ flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' }}>
                                            <Feather name="clock" size={16} color="#2563EB" />
                                            <Text style={{ fontSize: 10, color: '#64748B', fontWeight: 'bold', marginTop: 6, textTransform: 'uppercase' }}>Duración</Text>
                                            <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '600', marginTop: 2 }}>{selectedBudget.duration || selectedBudget.executionTime || 'N/A'}</Text>
                                        </View>
                                        <View style={{ flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' }}>
                                            <Feather name="credit-card" size={16} color="#2563EB" />
                                            <Text style={{ fontSize: 10, color: '#64748B', fontWeight: 'bold', marginTop: 6, textTransform: 'uppercase' }}>Pago</Text>
                                            <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '600', marginTop: 2 }}>{selectedBudget.paymentTerms || 'N/A'}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* CONDICIONES Y GARANTIAS */}
                                <View style={{ gap: 15, marginBottom: 20 }}>
                                    {selectedBudget.conditions && (
                                        <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                <Feather name="file-text" size={16} color="#2563EB" style={{ marginRight: 8 }} />
                                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E293B' }}>Condiciones</Text>
                                            </View>
                                            <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20 }}>{selectedBudget.conditions}</Text>
                                        </View>
                                    )}

                                    {selectedBudget.warranty && (
                                        <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                <Feather name="shield" size={16} color="#059669" style={{ marginRight: 8 }} />
                                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E293B' }}>Garantía</Text>
                                            </View>
                                            <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20 }}>{selectedBudget.warranty}</Text>
                                        </View>
                                    )}

                                    {selectedBudget.observations && (
                                        <View style={{ backgroundColor: '#F0F9FF', padding: 16, borderRadius: 16 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                <Feather name="info" size={16} color="#2563EB" style={{ marginRight: 8 }} />
                                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E293B' }}>Observaciones Adicionales</Text>
                                            </View>
                                            <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20, fontStyle: 'italic' }}>{selectedBudget.observations}</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Botones de Compartir */}
                                <View style={{ marginBottom: 24 }}>
                                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#64748B', marginBottom: 12, textAlign: 'center' }}>COMPARTIR O EXPORTAR</Text>
                                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20 }}>
                                        <TouchableOpacity
                                            style={{ backgroundColor: '#25D366', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', elevation: 2 }}
                                            onPress={() => Linking.openURL(`whatsapp://send?text=Hola, te comparto el presupuesto de ${selectedBudget.proName} por un monto de $${selectedBudget.price}.`)}
                                        >
                                            <FontAwesome5 name="whatsapp" size={24} color="white" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={{ backgroundColor: '#EA4335', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', elevation: 2 }}
                                            onPress={() => Linking.openURL(`mailto:?subject=Presupuesto de ${selectedBudget.proName}&body=Adjunto los detalles del presupuesto por un monto de $${selectedBudget.price}.`)}
                                        >
                                            <MaterialIcons name="mail" size={24} color="white" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={{ backgroundColor: '#1F2937', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', elevation: 2 }}
                                            onPress={() => showAlert("Exportar PDF", "Generando documento PDF... (Funcionalidad de impresión habilitada)")}
                                        >
                                            <Feather name="printer" size={24} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TextInput
                                    placeholder="Motivo del rechazo (opcional)..."
                                    style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0' }}
                                    value={rejectionReason}
                                    onChangeText={setRejectionReason}
                                />

                                <View style={{ gap: 10 }}>
                                    <TouchableOpacity
                                        style={{ backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                                        onPress={() => {
                                            setShowBudgetModal(false);
                                            onAcceptOffer(request.id, selectedBudget.proId);
                                        }}
                                    >
                                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Aceptar Presupuesto</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={{ backgroundColor: 'white', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#EF4444' }}
                                        onPress={() => {
                                            setShowBudgetModal(false);
                                            onRejectOffer(request.id, selectedBudget.proId, rejectionReason || "No especificado");
                                            setRejectionReason("");
                                        }}
                                    >
                                        <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 16 }}>Rechazar Presupuesto</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal >
        </View >
    );
};

export default RequestDetailClient;
