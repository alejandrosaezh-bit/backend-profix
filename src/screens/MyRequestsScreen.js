import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BriefcaseLoader from '../components/BriefcaseLoader';
import { api } from '../utils/api';

export default function MyRequestsScreen({ navigation, allRequests: propsAllRequests, onRefresh: propsOnRefresh }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [showArchived, setShowArchived] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  // Sync with props if provided
  useEffect(() => {
    if (propsAllRequests) {
      // Filter out "Virtual Jobs" (Pro interactions) - specific for Client View
      const ownedRequests = propsAllRequests.filter(req => !req.isVirtual);
      setRequests(ownedRequests);
      setLoading(false);
    }
  }, [propsAllRequests]);

  const loadRequests = async (isRefreshing = false) => {
    if (propsAllRequests) {
      if (propsOnRefresh) await propsOnRefresh();
      setRefreshing(false);
      return;
    }

    if (!isRefreshing) setLoading(true);
    setErrorMsg(null);
    try {
      const list = await api.getMyJobs();
      // Filter out "Virtual Jobs" (Pro interactions) - specific for Client View
      // DISABLED FILTER: Mostrar todo lo que venga de /me
      const ownedRequests = list; //list.filter(req => !req.isVirtual);

      if (ownedRequests.length > 0) {
        console.log("DEBUG FIRST REQUEST (RAW):", JSON.stringify(ownedRequests[0].category));
      }

      // Sort: Active/In Progress first, then by Date Descending
      ownedRequests.sort((a, b) => {
        const isClosedA = a.status === 'completed' || a.status === 'canceled';
        const isClosedB = b.status === 'completed' || b.status === 'canceled';

        if (isClosedA !== isClosedB) {
          return isClosedA ? 1 : -1; // Closed goes to bottom
        }

        return new Date(b.createdAt) - new Date(a.createdAt); // Newest first
      });

      setRequests(ownedRequests);
    } catch (err) {
      console.warn('No se pudieron cargar las solicitudes:', err);
      setErrorMsg('Error al cargar solicitudes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRequests(true);
  }, [propsAllRequests, propsOnRefresh]);

  useEffect(() => {
    if (!propsAllRequests) {
      loadRequests();
    }
    const unsub = navigation.addListener('focus', () => {
      loadRequests();
    });
    return unsub;
  }, []); // Se elimina 'navigation' de las dependencias para evitar bucle por objeto literal en app.js

  const getClientStatus = (request) => {
    if (request.calculatedClientStatus) return request.calculatedClientStatus;

    // 0. ELIMINADA (Canceled)
    if (request.status === 'canceled') return 'ELIMINADA';

    // 1. TERMINADO (Any rating exists)
    if (request.status === 'rated' || request.rating > 0 || request.proRating > 0 || request.clientRating > 0) return 'TERMINADO';

    // 2. VALORACIÓN (Both finished)
    if (request.status === 'completed' || (request.proFinished && request.clientFinished)) return 'VALORACIÓN';

    // 3. VALIDANDO (Pro Finished, waiting for Client)
    if (request.proFinished && !request.clientFinished) return 'VALIDANDO';

    // 4. EN EJECUCIÓN (Started)
    if (request.status === 'in_progress' || request.status === 'started' || request.status === 'En Ejecución') return 'EN EJECUCIÓN';

    // 5. ACEPTADO (Accepted Offer)
    // "Acepta Presupuesto -> Aceptado"
    const acceptedOffer = request.offers?.find(o => o.status === 'accepted');
    if (acceptedOffer) return 'ACEPTADO';

    // 6. PRESUPUESTADA (Active Offers, not accepted)
    const activeOffers = request.offers?.filter(o => o.status !== 'rejected' && o.status !== 'accepted');
    if (activeOffers && activeOffers.length > 0) return 'PRESUPUESTADA';

    // 7. CONTACTADA (Messages)
    if (request.conversations && request.conversations.length > 0) return 'CONTACTADA';

    // 8. NUEVA
    return 'NUEVA';
  };

  const categories = ['Todas', ...new Set(requests.map(r => r.category?.name || 'General'))].sort();

  const filteredRequests = requests.filter(req => {
    const catMatch = filterCategory === 'Todas' || (req.category?.name || 'General') === filterCategory;
    const label = getClientStatus(req);
    const isArchived = label === 'TERMINADO' || label === 'ELIMINADA' || label === 'Cerrada';

    // DEBUG LOG
    // console.log(`[MyRequests] ID: ${req._id} | StatusLabel: ${label} | IsArchived: ${isArchived} | ShowArchivedMode: ${showArchived}`);

    if (showArchived) {
      if (!isArchived) return false;
    } else {
      if (isArchived) return false;
    }
    return catMatch;
  });

  const getStatusColors = (status) => {
    switch (status) {
      case 'NUEVA': return { bg: '#ECFDF5', text: '#10B981' }; // Green/Blue Mix
      case 'CONTACTADA': return { bg: '#EFF6FF', text: '#2563EB' }; // Blue
      case 'PRESUPUESTADA': return { bg: '#FEF3C7', text: '#D97706' }; // Amber
      case 'EN EJECUCIÓN': return { bg: '#ECFDF5', text: '#059669' }; // Strong Green
      case 'VALIDANDO': return { bg: '#FFF7ED', text: '#C2410C' }; // Orange
      case 'VALORACIÓN': return { bg: '#EEF2FF', text: '#4F46E5' }; // Indigo
      case 'TERMINADO': return { bg: '#1F2937', text: '#F9FAFB' }; // Black
      case 'RECHAZADA': return { bg: '#FEF2F2', text: '#EF4444' }; // Red
      case 'ACEPTADO': return { bg: '#F0FDF4', text: '#16A34A' }; // Green

      case 'ELIMINADA': return { bg: '#FEF2F2', text: '#EF4444' }; // Red
      case 'Cerrada': return { bg: '#FEF2F2', text: '#EF4444' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const renderItem = ({ item }) => {
    const offerCount = item.offers ? item.offers.length : 0;
    const chatCount = item.conversations ? item.conversations.length : 0;
    const statusLabel = getClientStatus(item);
    const colors = getStatusColors(statusLabel);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('RequestDetail', { item })}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={styles.avatarContainer}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={24} color="#EA580C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName} numberOfLines={1}>{item.title}</Text>
              <View style={styles.cardMetaRow}>
                <Feather name="map-pin" size={12} color="#94A3B8" />
                <Text style={styles.cardMetaText}>{item.location || 'Sin ubicación'}</Text>
              </View>
              <View style={[styles.cardMetaRow, { marginTop: 2 }]}>
                <Feather name="tag" size={12} color="#94A3B8" />
                <Text style={styles.cardMetaText}>
                  {item.category && item.category.name ? item.category.name : 'Sin Categoría'}
                  {item.subcategory && item.subcategory !== 'General' ? ' • ' + item.subcategory : ''}
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>
              {statusLabel.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748B', flex: 1, marginRight: 10 }}>
            Publicado el {new Date(item.createdAt).toLocaleDateString()}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* PRESUPUESTOS (Offers) */}
            <View style={[styles.countBadge, item.offers?.some(o => o.status === 'pending') && { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}>
              {item.offers?.some(o => o.status === 'pending') && (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', position: 'absolute', top: -2, right: -2, borderWidth: 1.5, borderColor: 'white' }} />
              )}
              <Feather name="file-text" size={14} color={item.offers?.some(o => o.status === 'pending') ? '#EF4444' : '#64748B'} />
              <Text style={[styles.countText, item.offers?.some(o => o.status === 'pending') && { color: '#EF4444' }]}>
                {offerCount}
              </Text>
            </View>

            {/* CHATS */}
            <View style={[styles.countBadge, item.conversations?.some(c => c.unreadCount > 0) && { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}>
              {item.conversations?.some(c => c.unreadCount > 0) && (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', position: 'absolute', top: -2, right: -2, borderWidth: 1.5, borderColor: 'white' }} />
              )}
              <Feather name="message-square" size={14} color={item.conversations?.some(c => c.unreadCount > 0) ? '#EF4444' : '#64748B'} />
              <Text style={[styles.countText, item.conversations?.some(c => c.unreadCount > 0) && { color: '#EF4444' }]}>
                {chatCount}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER NARANJA TALL VERSION */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Mis Solicitudes</Text>
          <TouchableOpacity
            onPress={() => setShowArchived(!showArchived)}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: showArchived ? 'white' : 'rgba(255,255,255,0.2)',
              justifyContent: 'center', alignItems: 'center'
            }}
          >
            <Feather name="archive" size={20} color={showArchived ? '#EA580C' : 'white'} />
          </TouchableOpacity>
        </View>

        {/* FILTERS - CATEGORY ONLY */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 10 }}>
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
                {categories.map((cat, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.modalOption, filterCategory === cat && styles.modalOptionSelected]}
                    onPress={() => {
                      setFilterCategory(cat);
                      setCategoryModalVisible(false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, filterCategory === cat && styles.modalOptionTextSelected]}>{cat}</Text>
                    {filterCategory === cat && <Feather name="check" size={16} color="#EA580C" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerLoading}>
          <BriefcaseLoader />
          <Text style={{ marginTop: 20, color: '#64748B', fontSize: 14, fontWeight: '500' }}>Cargando solicitudes...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EA580C']} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {showArchived ? (
                <>
                  <MaterialCommunityIcons name="archive-off-outline" size={60} color="#CBD5E1" style={{ marginBottom: 15 }} />
                  <Text style={styles.emptyTitle}>No tienes solicitudes archivadas</Text>
                  <Text style={styles.emptyDescription}>
                    Aquí encontrarás el historial de tus trabajos que han sido finalizados o cancelados.
                  </Text>
                  <TouchableOpacity
                    style={[styles.createButton, { backgroundColor: 'white', borderColor: '#EA580C', borderWidth: 1, elevation: 0 }]}
                    onPress={() => setShowArchived(false)}
                  >
                    <Text style={[styles.createButtonText, { color: '#EA580C' }]}>Volver a Activos</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.emptyTitle}>¡Comienza con tu primera solicitud!</Text>
                  <Text style={styles.emptyDescription}>
                    ProFix te conecta con los mejores profesionales. Describe lo que necesitas (ej. "Reparar fuga de agua") y recibe presupuestos al instante.
                  </Text>

                  <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => navigation.navigate('Home')}
                  >
                    <Text style={styles.createButtonText}>Crear Solicitud Ahora</Text>
                  </TouchableOpacity>

                  <View style={styles.noteContainer}>
                    <Text style={styles.noteText}>
                      💡 Nota: Una vez que un trabajo finaliza, se moverá automáticamente a tu{' '}
                      <Text style={styles.linkText} onPress={() => setShowArchived(true)}>
                        Historial (Archivados)
                      </Text>.
                    </Text>
                  </View>
                </>
              )}
            </View>
          }
        />
      )
      }
    </View >
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Header
  headerContainer: {
    backgroundColor: '#EA580C',
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...Platform.select({
      web: { boxShadow: '0px 10px 15px rgba(234, 88, 12, 0.2)' },
      default: {
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
      }
    }),
    elevation: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  filterScroll: {
    paddingLeft: 20,
    paddingRight: 10
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  filterPillActive: {
    backgroundColor: 'white',
    elevation: 4
  },
  filterText: { color: 'white', fontSize: 13, fontWeight: '700' },
  filterTextActive: { color: '#EA580C' },
  filterDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.3)', alignSelf: 'center', marginHorizontal: 8 },

  // List
  listContent: { padding: 20, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.05)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      }
    }),
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#FFEDD5'
  },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  cardMetaText: { fontSize: 13, color: '#64748B', marginLeft: 6, flex: 1 },

  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: 'bold' },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginTop: 12
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#334155', flex: 1, marginRight: 10 },

  unreadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8
  },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444', marginRight: 6 },
  unreadText: { fontSize: 10, color: '#EF4444', fontWeight: 'bold' },

  countBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  countText: { fontSize: 12, fontWeight: 'bold', color: '#475569', marginLeft: 6 },

  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#94A3B8', marginTop: 15, fontSize: 16, fontWeight: '500' },

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
  modalOptionTextSelected: { color: '#EA580C', fontWeight: 'bold' },

  // New Empty State Styles
  emptyContainer: { alignItems: 'center', marginTop: 40, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', textAlign: 'center', marginBottom: 12 },
  emptyDescription: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  createButton: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 40
  },
  createButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  noteContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    width: '100%',
  },
  noteText: { fontSize: 13, color: '#64748B', lineHeight: 20, textAlign: 'center' },
  linkText: { color: '#EA580C', fontWeight: 'bold', textDecorationLine: 'underline' }
});