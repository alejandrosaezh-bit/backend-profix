import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Image, Platform, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_URL } from '../utils/api'; // NEW: Import API_URL

export default function ChatListScreen({ currentUser, requests, chats = [], onSelectChat, onBack, userMode, onRefresh, refreshing, onGoToProfile }) {
    if (!currentUser) return <View style={{ flex: 1, backgroundColor: 'white' }} />;

    const [filterCategory, setFilterCategory] = useState('Todas');
    const [filterStatus, setFilterStatus] = useState('Todas');

    const isPro = userMode === 'pro';
    const themeColor = isPro ? '#2563EB' : '#EA580C';
    const [showArchived, setShowArchived] = useState(false);

    // --- MEMOIZED HELPERS & DATA PROCESSING ---

    // Helper para comparar IDs de forma segura (Memoized to avoid recreation, though generic)
    const areIdsEqual = (id1, id2) => {
        if (!id1 || !id2) return false;
        const s1 = (typeof id1 === 'object' && id1 !== null) ? (id1._id || id1.id || id1.toString()) : String(id1);
        const s2 = (typeof id2 === 'object' && id2 !== null) ? (id2._id || id2.id || id2.toString()) : String(id2);
        const str1 = String(s1).replace(/["']/g, "").trim();
        const str2 = String(s2).replace(/["']/g, "").trim();
        return str1 === str2;
    };

    // 1. PROCESAMIENTO DE CHATS (Heavy Logic Memoized)
    const activeChats = useMemo(() => {
        const processedChats = [];
        const visitedIds = new Set();
        const myId = currentUser?._id || currentUser?.id;

        if (!myId) return [];

        // Pre-indexar solicitudes para búsqueda O(1)
        const requestMap = {};
        if (requests) {
            requests.forEach(r => {
                requestMap[String(r._id || r.id)] = r;
            });
        }

        // --- A. DATA DEL BACKEND (/api/chats) ---
        if (chats && chats.length > 0) {
            chats.forEach(chat => {
                const jobId = String(chat.job?._id || chat.job);
                const relatedRequest = requestMap[jobId];

                // Partner check
                const partner = (chat.participants || []).find(p => !areIdsEqual(p._id || p, myId));
                if (!partner) return;

                if (visitedIds.has(chat._id)) return;
                visitedIds.add(chat._id);

                // --- ROLE & ARCHIVE FILTERING ---
                const backendRole = chat.chatRole;
                if (backendRole && backendRole !== (isPro ? 'pro' : 'client')) return;

                // Archived Status
                let isArchived = chat.isArchived ?? false;
                if (chat.isArchived === undefined) {
                    const status = relatedRequest?.status || chat.job?.status;
                    const archivedStatuses = ['canceled', 'closed', 'ELIMINADA', 'Cerrada', 'TERMINADO', 'FINALIZADA', 'rejected', 'lost', 'rated', 'completed'];
                    if (archivedStatuses.includes(status)) isArchived = true;
                }

                const lastMsg = (chat.messages && chat.messages.length > 0)
                    ? chat.messages[chat.messages.length - 1]
                    : {
                        content: chat.lastMessage || 'Conversación iniciada',
                        createdAt: chat.lastMessageDate || chat.updatedAt || chat.createdAt || new Date().toISOString(),
                        sender: 'other',
                        read: true
                    };

                processedChats.push({
                    id: chat._id,
                    title: partner.name || 'Usuario',
                    subtitle: lastMsg.content || (lastMsg.media ? '📷 Foto/Video' : ''),
                    time: new Date(lastMsg.createdAt || lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    rating: '5.0',
                    image: partner.avatar,
                    unreadCount: chat.unreadCount || 0,
                    requestData: {
                        ...(relatedRequest || { _id: chat.job._id || chat.job, title: chat.job.title || 'Trabajo' }),
                        conversations: [{
                            id: chat._id,
                            proId: partner._id,
                            messages: chat.messages ? chat.messages.map(m => ({
                                id: m._id,
                                text: m.content,
                                sender: areIdsEqual(m.sender?._id || m.sender, myId) ? (isPro ? 'pro' : 'client') : (isPro ? 'client' : 'pro'),
                                timestamp: m.createdAt || m.timestamp,
                                media: m.media,
                                mediaType: m.mediaType
                            })) : []
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
                    isFileChat: true
                });
            });
        }

        // --- B. FALLBACK LEGACY (SOLO CLIENTE) ---
        if (!isPro && requests) {
            requests.forEach(req => {
                const rClient = req.client?._id || req.client;
                if (rClient && !areIdsEqual(rClient, myId)) return;

                if (req.conversations && req.conversations.length > 0) {
                    req.conversations.forEach(conv => {
                        if (typeof conv === 'string') return;
                        const targetProId = conv.proId?._id || conv.proId;
                        if (areIdsEqual(targetProId, myId)) return;

                        const convId = conv.id || `${req._id}_${targetProId}`;
                        if (visitedIds.has(convId) || visitedIds.has(conv._id)) return;

                        let isArchived = ['canceled', 'closed', 'Cerrada', 'TERMINADO', 'FINALIZADA', 'ELIMINADA', 'rejected', 'lost'].includes(req.status);

                        processedChats.push({
                            id: convId,
                            title: conv.proName || 'Profesional',
                            subtitle: `Chat sobre ${req.title}`,
                            time: '',
                            rating: '5.0',
                            image: conv.proImage || conv.proAvatar,
                            unreadCount: conv.unreadCount || 0,
                            requestData: req,
                            targetUser: { name: conv.proName, role: 'pro', id: targetProId, avatar: conv.proImage || conv.proAvatar },
                            hasMessages: true,
                            rawTimestamp: 0,
                            isArchived: isArchived,
                            category: req.category || 'General',
                            isLegacy: true
                        });
                    });
                }
            });
        }
        return processedChats;
    }, [chats, requests, currentUser, userMode, isPro]);

    // 2. FILTRADO FINAL (Memoized)
    const filteredChats = useMemo(() => {
        const getActionButton = (item) => {
            if (item.unreadCount > 0) return { text: 'Responder' };
            if (item.lastSender === 'other') return { text: 'Responder' };
            return { text: 'Preguntar' };
        };

        const chatsWithMeta = activeChats.map(chat => ({
            ...chat,
            actionStatus: getActionButton(chat).text,
            category: typeof chat.category === 'object' ? (chat.category.name || 'Otros') : (chat.category || 'Otros')
        }));

        return chatsWithMeta.filter(chat => {
            if (filterCategory !== 'Todas' && chat.category !== filterCategory) return false;
            return showArchived ? chat.isArchived : !chat.isArchived;
        }).sort((a, b) => (b.rawTimestamp || 0) - (a.rawTimestamp || 0));

    }, [activeChats, filterCategory, showArchived]);

    // Categories for filter
    const uniqueCategories = useMemo(() => {
        return ['Todas', ...new Set(activeChats.map(c => {
            return typeof c.category === 'object' ? (c.category.name || 'Otros') : (c.category || 'Otros');
        }).filter(Boolean))];
    }, [activeChats]);

    const renderItem = ({ item }) => {
        const hasValidImage = item.image && !item.image.includes('undefined') && !item.image.includes('placeholder');

        const getFullImageUrl = (img) => {
            if (!img) return null;
            if (img.startsWith('http') || img.startsWith('file://') || img.startsWith('data:')) return img;
            const baseUrl = API_URL.replace('/api', '');
            const cleanPath = img.startsWith('/') ? img.substring(1) : img;
            return `${baseUrl}/${cleanPath}`;
        };

        const validUri = hasValidImage ? getFullImageUrl(item.image) : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.title)}&background=random`;

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

                        <View style={[
                            styles.responderButton,
                            item.actionStatus === 'Responder' && styles.responderButtonActive
                        ]}>
                            <Text style={[
                                styles.responderText,
                                item.actionStatus === 'Responder' && styles.responderTextActive
                            ]}>{item.actionStatus}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={[styles.headerContainer, { backgroundColor: themeColor }]}>
                <View style={[styles.headerTop, { marginBottom: 0 }]}>
                    <Text style={styles.headerTitle}>
                        {isPro ? 'Conversaciones' : 'Chatear'}
                    </Text>
                    <TouchableOpacity
                        onPress={() => setShowArchived(!showArchived)}
                        style={styles.archiveButton}
                    >
                        <Feather name="archive" size={20} color={showArchived ? themeColor : 'white'} />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={filteredChats}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingHorizontal: 10, paddingTop: 8, paddingBottom: 100 }}
                initialNumToRender={8}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[themeColor]} />}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 0, paddingBottom: 25 }}>
                        {isPro ? (
                            <View style={{
                                width: '100%', backgroundColor: 'white', borderRadius: 24, padding: 25,
                                elevation: 5, borderWidth: 1, borderColor: '#F1F5F9',
                                ...(Platform.OS === 'web' ? { boxShadow: '0px 4px 10px rgba(37, 99, 235, 0.1)' } : {
                                    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10
                                })
                            }}>
                                <View style={{ alignItems: 'center', marginBottom: 25 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15 }}>
                                        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#BFDBFE', marginRight: -15, zIndex: 2 }}>
                                            <Feather name="shield" size={32} color="#2563EB" />
                                        </View>
                                        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#BFDBFE', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
                                            <Feather name="briefcase" size={32} color="#2563EB" />
                                        </View>
                                    </View>

                                    <Text style={{ fontSize: 20, fontWeight: '800', color: '#1E3A8A', textAlign: 'center' }}>
                                        {showArchived ? "Archivo de Conversaciones" : "Negocios con Privacidad"}
                                    </Text>
                                    <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 5, paddingHorizontal: 10 }}>
                                        {showArchived
                                            ? "Aquí se guardan tus acuerdos pasados y chats finalizados."
                                            : "Gestiona tus clientes sin compartir información de contacto. Mantén el control y respaldo de cada acuerdo."}
                                    </Text>
                                </View>

                                {!showArchived && (
                                    <View style={{ gap: 15 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                                <Feather name="lock" size={20} color="#2563EB" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontWeight: 'bold', color: '#1E293B', fontSize: 13 }}>Privacidad Total</Text>
                                                <Text style={{ color: '#64748B', fontSize: 11 }}>Chatea y acuerda precios sin revelar tu número o correo personal.</Text>
                                            </View>
                                        </View>

                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                                <Feather name="file-text" size={20} color="#16A34A" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontWeight: 'bold', color: '#1E293B', fontSize: 13 }}>Historial de Acuerdos</Text>
                                                <Text style={{ color: '#64748B', fontSize: 11 }}>Todo lo conversado queda guardado como respaldo profesional.</Text>
                                            </View>
                                        </View>

                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                                <Feather name="camera" size={20} color="#EA580C" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontWeight: 'bold', color: '#1E293B', fontSize: 13 }}>Control de Evidencia</Text>
                                                <Text style={{ color: '#64748B', fontSize: 11 }}>Sube fotos de tu progreso para dar confianza y evitar reclamos.</Text>
                                            </View>
                                        </View>

                                        <View style={{ marginTop: 25, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                                            {(!currentUser.profiles || Object.keys(currentUser.profiles).length === 0) ? (
                                                <TouchableOpacity
                                                    onPress={() => onGoToProfile && onGoToProfile()}
                                                    style={{
                                                        backgroundColor: '#2563EB',
                                                        paddingVertical: 14,
                                                        borderRadius: 16,
                                                        alignItems: 'center',
                                                        shadowColor: '#2563EB',
                                                        shadowOffset: { width: 0, height: 4 },
                                                        shadowOpacity: 0.3,
                                                        shadowRadius: 8,
                                                        elevation: 4
                                                    }}
                                                >
                                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>Completar Perfil Profesional</Text>
                                                </TouchableOpacity>
                                            ) : (
                                                <View style={{ alignItems: 'center' }}>
                                                    <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', fontStyle: 'italic' }}>
                                                        Busca ofertas en la pantalla principal para iniciar nuevas conversaciones.
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                )}
                            </View>
                        ) : (
                            <View style={{
                                width: '100%', backgroundColor: 'white', borderRadius: 24, padding: 25,
                                elevation: 5, borderWidth: 1, borderColor: '#FFF7ED',
                                ...(Platform.OS === 'web' ? { boxShadow: '0px 4px 10px rgba(234, 88, 12, 0.1)' } : {
                                    shadowColor: '#EA580C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10
                                })
                            }}>
                                <View style={{ alignItems: 'center', marginBottom: 25 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15 }}>
                                        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FED7AA', marginRight: -15, zIndex: 2 }}>
                                            <Feather name="shield" size={32} color="#EA580C" />
                                        </View>
                                        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#FED7AA', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
                                            <Feather name="message-circle" size={32} color="#EA580C" />
                                        </View>
                                    </View>

                                    <Text style={{ fontSize: 20, fontWeight: '800', color: '#9A3412', textAlign: 'center' }}>
                                        {showArchived ? "Archivo de Chats" : "Chatea con Seguridad"}
                                    </Text>
                                    <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 5, paddingHorizontal: 10 }}>
                                        {showArchived ? "Aquí están tus conversaciones antiguas." : "Conecta con expertos sin revelar tus datos personales. Cada conversación queda guardada como respaldo de tu solicitud."}
                                    </Text>
                                </View>

                                {!showArchived && (
                                    <View style={{ gap: 15 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                                <Feather name="users" size={20} color="#EA580C" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontWeight: 'bold', color: '#1E293B', fontSize: 13 }}>Privacidad Blindada</Text>
                                                <Text style={{ color: '#64748B', fontSize: 11 }}>Tu número y correo permanecen ocultos en todo momento.</Text>
                                            </View>
                                        </View>

                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                                <Feather name="shield" size={20} color="#16A34A" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontWeight: 'bold', color: '#1E293B', fontSize: 13 }}>Garantía de Registro</Text>
                                                <Text style={{ color: '#64748B', fontSize: 11 }}>Todo lo conversado se organiza por solicitud para aclarar dudas o resolver controversias.</Text>
                                            </View>
                                        </View>

                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                                <Feather name="image" size={20} color="#2563EB" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontWeight: 'bold', color: '#1E293B', fontSize: 13 }}>Evidencia Visual</Text>
                                                <Text style={{ color: '#64748B', fontSize: 11 }}>Comparte fotos y videos del trabajo para recibir presupuestos exactos.</Text>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    headerContainer: {
        backgroundColor: '#EA580C',
        paddingTop: Platform.OS === 'ios' ? 44 : 15,
        paddingBottom: 25,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        elevation: 0,
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 28, fontWeight: '800', color: 'white', letterSpacing: 0.5 },
    archiveButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },

    chatItem: {
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 20,
        marginBottom: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    avatarContainer: { marginRight: 12, justifyContent: 'flex-start' },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F3F4F6' },
    badge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#EF4444', minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' },
    badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

    chatContent: { flex: 1 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 },
    chatTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827', flex: 1, marginRight: 8 },
    chatTime: { fontSize: 11, color: '#6B7280' },

    middleRow: { marginBottom: 4 },
    jobTitle: { fontSize: 13, color: '#4B5563', fontStyle: 'italic' },

    bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    chatSubtitle: { fontSize: 13, color: '#4B5563', flex: 1, marginRight: 10 },
    unreadText: { fontWeight: '600', color: '#111827' },

    responderButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#EA580C',
        backgroundColor: 'white',
        justifyContent: 'center'
    },
    responderButtonActive: {
        backgroundColor: '#EA580C',
    },
    responderText: { fontSize: 11, fontWeight: 'bold', color: '#EA580C' },
    responderTextActive: { color: 'white' },

    emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 50 },
    emptyText: { fontSize: 18, color: '#4B5563', marginTop: 16, fontWeight: '600' },
    emptySubtext: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginTop: 8, maxWidth: 240, lineHeight: 22 }
});
