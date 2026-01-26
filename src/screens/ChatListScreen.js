import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ChatListScreen({ currentUser, requests, chats = [], onSelectChat, onBack, userMode, onRefresh, refreshing }) {
    if (!currentUser) return <View style={{flex:1, backgroundColor:'white'}} />;

    const [filterCategory, setFilterCategory] = useState('Todas');
    const [filterStatus, setFilterStatus] = useState('Activas'); 
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [statusModalVisible, setStatusModalVisible] = useState(false);

    const isPro = userMode === 'pro';
    const themeColor = isPro ? '#2563EB' : '#EA580C';
    
    const showArchived = filterStatus === 'Archivadas';

    const activeChats = [];
    const visitedIds = new Set();
    const myId = currentUser._id || currentUser.id;

    // Helper para comparar IDs de forma segura
    const areIdsEqual = (id1, id2) => {
        if (!id1 || !id2) return false;
        const s1 = (typeof id1 === 'object' && id1 !== null) ? (id1._id || id1.id || id1.toString()) : String(id1);
        const s2 = (typeof id2 === 'object' && id2 !== null) ? (id2._id || id2.id || id2.toString()) : String(id2);
        const str1 = String(s1).replace(/["']/g, "").trim();
        const str2 = String(s2).replace(/["']/g, "").trim();
        return str1 === str2;
    };

    // --- 1. PROCESAR CHATS DEL BACKEND (Fuente de Verdad Limpia) ---
    // El backend ya filtra por rol:
    // - Pro: Chats donde participo postulado (excluye mis propios trabajos)
    // - Client: Chats de trabajos que yo creé
    if (chats && chats.length > 0) {
        chats.forEach(chat => {
            // Validar integridad mínima
            if (!chat.job) return;
            if (!chat.messages || chat.messages.length === 0) return; // Regla: chats vacíos no se muestran

            const relatedRequest = requests ? requests.find(r => areIdsEqual(r._id, chat.job._id || chat.job)) : null;

            // Determinar Participante (El "Otro")
            const partner = (chat.participants || []).find(p => !areIdsEqual(p._id || p, myId));
            if (!partner) return; // Chat huérfano o solo yo


            // Dedup
            if (visitedIds.has(chat._id)) return;

            // --- FILTER STRICT: CLIENT-SIDE DOUBLE CHECK ---
            // Ensure we don't show "My Own Jobs" chats when in Pro mode, and vice versa.
            // Primero intentamos determinar el cliente desde chat.job
            const jobClientObj = chat.job.clientId || chat.job.client;
            let jobClientId = null;
            if (jobClientObj) {
                if (typeof jobClientObj === 'string') jobClientId = jobClientObj;
                else if (typeof jobClientObj === 'object') jobClientId = jobClientObj._id || jobClientObj.id;
            }

            // Si falló, intentamos buscar en relatedRequest (puede tener info más completa)
            if (!jobClientId && relatedRequest) {
                 const reqClient = relatedRequest.client || relatedRequest.clientId;
                 if (typeof reqClient === 'string') jobClientId = reqClient;
                 else if (typeof reqClient === 'object') jobClientId = reqClient._id || reqClient.id;
            }
            
            // LOGIC FINAL & SAFETY:
            // Si tenemos jobClientId, aplicamos filtro estricto para evitar ver mis propios trabajos en modo Pro.
            // Si NO tenemos jobClientId (data incompleta), CONFIAMOS EN EL BACKEND que ya filtró por rol.
            // No ocultamos silenciosamente por falta de datos.
            
            // NEW REQUIREMENT: Filter out chats with self
            // "Crea un filtro que evite que pueda hablar el usuario consigo mismo"
            
            // Check Partner ID vs My ID
            if (partner && areIdsEqual(partner._id || partner.id || partner, myId)) {
                return;
            }

            // LOGICA DE VISUALIZACIÓN POR CREADOR (REQUISITO STRICT DE USUARIO)
            // 1. Pro: Solo ve chats que ÉL creó (inició).
            // 2. Cliente: Solo ve chats que ÉL NO creó (iniciados por el Pro).
            const firstMsg = chat.messages[0];
            if (firstMsg) {
                const isCreator = areIdsEqual(firstMsg.sender?._id || firstMsg.sender, myId);
                
                if (userMode === 'pro') {
                    // Si soy Pro, debo ser el Creador
                    if (!isCreator) return;
                }
                
                if (userMode === 'client') {
                    // Si soy Cliente, NO debo ser el Creador (deben ser iniciados por ofertas de Pros)
                    if (isCreator) return;
                }
            }

            visitedIds.add(chat._id);

            // Estado de Archivo (Basado en el Job)
            let isArchived = false;
            // Usar status del job embebido o del request asociado si está cargado
            const status = relatedRequest?.status || chat.job?.status;
            if (status === 'canceled' || status === 'closed' || status === 'ELIMINADA' || status === 'Cerrada') {
                isArchived = true;
            }

            // Ultimo mensaje
            const lastMsg = chat.messages[chat.messages.length - 1];

            // Construir Objeto Visual
            activeChats.push({
                id: chat._id,
                title: partner.name || 'Usuario',
                subtitle: lastMsg.content || (lastMsg.media ? '📷 Foto/Video' : ''),
                time: new Date(lastMsg.createdAt || lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                rating: '5.0', // Placeholder o calcular
                image: partner.avatar, // Si es undefined, el render maneja fallback
                unreadCount: chat.messages.filter(m => !areIdsEqual(m.sender?._id || m.sender, myId) && !m.read).length,
                requestData: {
                    ...(relatedRequest || { _id: chat.job._id || chat.job, title: chat.job.title || 'Trabajo' }),
                    // Inyectar datos mínimos para navegación si no hay request completo
                    conversations: [{ 
                        id: chat._id, 
                        proId: partner._id, 
                        // FIX: Pasar los mensajes reales del chat, no un array vacío.
                        // ChatScreen espera: { id, text, sender, timestamp, media }
                        messages: (chat.messages || []).map(m => ({
                            id: m._id,
                            text: m.content,
                            sender: areIdsEqual(m.sender?._id || m.sender, myId) ? (isPro ? 'pro' : 'client') : (isPro ? 'client' : 'pro'),
                            timestamp: m.createdAt || m.timestamp,
                            media: m.media,
                            mediaType: m.mediaType
                        }))
                    }] 
                },
                targetUser: { 
                    name: partner.name, 
                    role: isPro ? 'client' : 'pro', 
                    email: partner.email, 
                    id: partner._id, 
                    avatar: partner.avatar 
                },
                lastSender: areIdsEqual(lastMsg.sender?._id || lastMsg.sender, myId) ? 'me' : 'other',
                hasMessages: true,
                rawTimestamp: new Date(lastMsg.createdAt || lastMsg.timestamp).getTime(),
                category: relatedRequest?.category || 'General',
                isArchived: isArchived,
                isFileChat: true // Marcador de origen
            });
        });
    }

    // --- 2. FALLBACK LEGACY (SOLO CLIENTE) ---
    // Si hay conversaciones embebidas en 'requests' que no llegaron por /api/chats (raro pero posible en migración)
    if (!isPro && requests) {
        requests.forEach(req => {
            // Seguridad: Solo mis trabajos
            const rClient = req.client?._id || req.client;
            if (rClient && !areIdsEqual(rClient, myId)) return;

            if (req.conversations && req.conversations.length > 0) {
                 req.conversations.forEach(conv => {
                    // Si es un ID string, ya debería estar en 'chats'. Si es objeto, es legacy embedded.
                    if (typeof conv === 'string') return;
                    
                    const targetProId = conv.proId?._id || conv.proId;
                    
                    // Filter out self-chats in legacy too
                    if (areIdsEqual(targetProId, myId)) return;

                    const convId = conv.id || `${req._id}_${targetProId}`;

                    if (visitedIds.has(convId)) return;
                    if (visitedIds.has(conv._id)) return; // Check object id too

                    // Validar mensajes
                    // En estructura legacy, a veces 'messages' no viene, solo contadores.
                    // Si el usuario exige "chat no vacio", asumimos que legacy con unreadCount > 0 tiene algo?
                    
                    let isArchived = (req.status === 'canceled' || req.status === 'Cerrada');

                    activeChats.push({
                        id: convId,
                        title: conv.proName || 'Profesional',
                        subtitle: `Chat sobre ${req.title}`,
                        time: '', 
                        rating: '5.0',
                        image: conv.proImage,
                        unreadCount: conv.unreadCount || 0,
                        requestData: req,
                        targetUser: { name: conv.proName, role: 'pro', id: targetProId, avatar: conv.proImage },
                        hasMessages: true,
                        rawTimestamp: 0, // Al fondo
                        isArchived: isArchived,
                        category: req.category || 'General',
                        isLegacy: true
                    });
                 });
            }
        });
    }

    const getActionButton = (item) => {
        // Lógica simple de botón
        if (item.unreadCount > 0) return { text: 'Responder', color: '#EA580C', bg: '#FFF7ED' };
        if (item.lastSender === 'other') return { text: 'Responder', color: '#EA580C', bg: '#FFF7ED' };
        return { text: 'Ver Chat', color: '#3B82F6', bg: '#EFF6FF' };
    };

    // --- FILTRADO FINAL EN UI ---
    const chatsWithMeta = activeChats.map(chat => ({
        ...chat,
        actionStatus: getActionButton(chat).text,
        category: typeof chat.category === 'object' ? (chat.category.name || 'Otros') : (chat.category || 'Otros')
    }));

    const filteredChats = chatsWithMeta.filter(chat => {
        if (filterCategory !== 'Todas' && chat.category !== filterCategory) return false;
        
        // --- VISIBILIDAD DE ARCHIVADOS ---
        // Default: Ocultar archivados. Toggle: Mostrar SOLO archivados (o todos? 'Podrá verlos si activa')
        // Interpretación standard: Toggle ON = Ver archivados. Toggle OFF = Ver activos.
        // El usuario dijo: "Si solicitud no activa, chat se archiva. No se elimina, pero se archiva."
        if (showArchived) {
            return chat.isArchived;
        } else {
            return !chat.isArchived;
        }
    }).sort((a, b) => (b.rawTimestamp || 0) - (a.rawTimestamp || 0));

    const uniqueCategories = ['Todas', ...new Set(chatsWithMeta.map(c => c.category).filter(Boolean))];

    const renderItem = ({ item }) => {
        const action = getActionButton(item);
        const hasValidImage = item.image && !item.image.includes('undefined') && !item.image.includes('placeholder');
        // Fallback de imagen
        const validUri = hasValidImage ? item.image : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.title)}&background=random`;

        return (
            <TouchableOpacity
                style={styles.chatItem}
                onPress={() => onSelectChat(item.requestData, item.targetUser)}
            >
                <View style={styles.avatarContainer}>
                    <Image source={{ uri: validUri }} style={styles.avatar} />
                    {item.unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{item.unreadCount}</Text></View>}
                </View>

                <View style={styles.chatContent}>
                    <View style={styles.topRow}>
                        <Text style={styles.chatTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.chatTime}>{item.time}</Text>
                    </View>

                    <View style={styles.middleRow}>
                        <Text style={styles.jobTitle} numberOfLines={1}>{item.requestData.title}</Text>
                    </View>

                    <View style={styles.bottomRow}>
                        <Text style={[styles.chatSubtitle, item.unreadCount > 0 && styles.unreadText]} numberOfLines={1}>
                            {item.subtitle}
                        </Text>
                         <View style={[styles.actionBadge, { backgroundColor: action.bg, borderColor: action.color }]}>
                            <Text style={[styles.actionText, { color: action.color }]}>{action.text}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* HEADER TIPO TRABAJOS DISPONIBLES */}
            <View style={{ backgroundColor: themeColor, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 4, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 8 }}>
                        {isPro ? 'Conversaciones' : 'Conversaciones con Profesionales'}
                    </Text>
                    {refreshing && <ActivityIndicator color="white" size="small" />}
                </View>

                {/* FILTERS - DROPDOWNS */}
                <View style={{ flexDirection: 'row', paddingHorizontal: 0, gap: 10, marginTop: 8 }}>
                    {/* Category Dropdown */}
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 4, fontWeight: 'bold' }}>Categoría</Text>
                        <TouchableOpacity
                            onPress={() => setCategoryModalVisible(true)}
                            style={styles.dropdownButton}
                        >
                            <Text style={styles.dropdownButtonText} numberOfLines={1}>{filterCategory}</Text>
                            <Feather name="chevron-down" size={16} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Status Dropdown */}
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 4, fontWeight: 'bold' }}>Ver</Text>
                        <TouchableOpacity
                            onPress={() => setStatusModalVisible(true)}
                            style={styles.dropdownButton}
                        >
                            <Text style={styles.dropdownButtonText} numberOfLines={1}>{filterStatus}</Text>
                            <Feather name="chevron-down" size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* MODALS */}
            <Modal
                visible={categoryModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setCategoryModalVisible(false)}
            >
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCategoryModalVisible(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Filtrar por Categoría</Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {uniqueCategories.map((cat, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.modalOption, filterCategory === cat && styles.modalOptionSelected]}
                                    onPress={() => {
                                        setFilterCategory(cat);
                                        setCategoryModalVisible(false);
                                    }}
                                >
                                    <Text style={[styles.modalOptionText, filterCategory === cat && { color: themeColor, fontWeight: 'bold' }]}>{cat}</Text>
                                    {filterCategory === cat && <Feather name="check" size={16} color={themeColor} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={{ marginTop: 15, alignItems: 'center' }} onPress={() => setCategoryModalVisible(false)}>
                            <Text style={{ color: themeColor, fontWeight: 'bold' }}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={statusModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setStatusModalVisible(false)}
            >
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setStatusModalVisible(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Estado de Conversación</Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {['Activas', 'Archivadas'].map((status, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.modalOption, filterStatus === status && styles.modalOptionSelected]}
                                    onPress={() => {
                                        setFilterStatus(status);
                                        setStatusModalVisible(false);
                                    }}
                                >
                                    <Text style={[styles.modalOptionText, filterStatus === status && { color: themeColor, fontWeight: 'bold' }]}>{status}</Text>
                                    {filterStatus === status && <Feather name="check" size={16} color={themeColor} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                         <TouchableOpacity style={{ marginTop: 15, alignItems: 'center' }} onPress={() => setStatusModalVisible(false)}>
                            <Text style={{ color: themeColor, fontWeight: 'bold' }}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* LISTA */}
            <FlatList
                data={filteredChats}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[themeColor]} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Feather name="message-square" size={48} color="#D1D5DB" />
                        <Text style={styles.emptyText}>
                            {showArchived ? "No hay chats archivados" : "No tienes conversaciones activas"}
                        </Text>
                        {isPro && !showArchived && (
                            <Text style={styles.emptySubtext}>
                                Busca trabajos y envía ofertas para iniciar una conversación.
                            </Text>
                        )}
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    filterHeader: { backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 5 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: 'white' },
    filterText: { fontSize: 12, color: '#475569', fontWeight: '500' },
    archiveToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 15, paddingBottom: 10 },
    toggleBtn: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: '#64748B', alignItems: 'center', justifyContent: 'center' },
    
    chatItem: { flexDirection: 'row', backgroundColor: 'white', padding: 15, borderRadius: 16, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width:0, height:1 } },
    avatarContainer: { marginRight: 15, position: 'relative' },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F1F5F9' },
    badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' },
    badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    
    chatContent: { flex: 1, justifyContent: 'center' },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    chatTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', flex: 1 },
    chatTime: { fontSize: 11, color: '#94A3B8' },
    
    middleRow: { marginBottom: 4 },
    jobTitle: { fontSize: 12, color: '#64748B', fontStyle: 'italic' },
    
    bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    chatSubtitle: { fontSize: 13, color: '#64748B', flex: 1, marginRight: 10 },
    unreadText: { fontWeight: 'bold', color: '#1E293B' },
    
    actionBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
    actionText: { fontSize: 10, fontWeight: 'bold' },
    
    emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 50 },
    emptyText: { fontSize: 16, color: '#64748B', marginTop: 15, fontWeight: '500' },
    emptySubtext: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 8, maxWidth: 200 },

    // Dropdown Styles
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)'
    },
    dropdownButtonText: { color: 'white', fontWeight: '600', fontSize: 13, flex: 1 },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        width: '100%',
        maxWidth: 340,
        padding: 20,
        elevation: 10,
        maxHeight: '80%'
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#1E293B', textAlign: 'center' },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
    },
    modalOptionSelected: { backgroundColor: '#FFF7ED', paddingHorizontal: 10, borderRadius: 8, borderBottomWidth: 0 },
    modalOptionText: { fontSize: 15, color: '#475569' },
    modalOptionTextSelected: { color: '#EA580C', fontWeight: 'bold' }
});
