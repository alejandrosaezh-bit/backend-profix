import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BriefcaseLoader from '../components/BriefcaseLoader';
import { api } from '../utils/api';

// Icon mapping matching Admin Panel & app.js (Expanded)
const CAT_ICONS = {
  'home': { lib: Feather, name: 'home' },
  'car': { lib: FontAwesome5, name: 'car' },
  'heart': { lib: Feather, name: 'heart' },
  'monitor': { lib: Feather, name: 'monitor' },
  'scissors': { lib: Feather, name: 'scissors' },
  'calendar': { lib: Feather, name: 'calendar' },
  'cat': { lib: FontAwesome5, name: 'cat' },
  'briefcase': { lib: Feather, name: 'briefcase' },
  'tool': { lib: Feather, name: 'tool' },
  'truck': { lib: Feather, name: 'truck' },
  'shopping-bag': { lib: Feather, name: 'shopping-bag' },
  'book': { lib: Feather, name: 'book' },
  'music': { lib: Feather, name: 'music' },
  'camera': { lib: Feather, name: 'camera' },
  'smile': { lib: Feather, name: 'smile' },
  'map-pin': { lib: Feather, name: 'map-pin' },
  'wifi': { lib: Feather, name: 'wifi' },
  'gift': { lib: Feather, name: 'gift' },
  'coffee': { lib: Feather, name: 'coffee' },
  'smartphone': { lib: Feather, name: 'smartphone' },
  'droplet': { lib: Feather, name: 'droplet' },
  'zap': { lib: Feather, name: 'zap' },
  'lock': { lib: Feather, name: 'lock' },
  'trash-2': { lib: Feather, name: 'trash-2' },
  'wind': { lib: Feather, name: 'wind' },
  'hammer': { lib: MaterialCommunityIcons, name: 'hammer' },
  'wrench': { lib: MaterialCommunityIcons, name: 'wrench' },
  'pipe-wrench': { lib: MaterialCommunityIcons, name: 'pipe-wrench' },
  'paint-brush': { lib: FontAwesome5, name: 'paint-brush' },
  'broom': { lib: MaterialCommunityIcons, name: 'broom' },
  'flower': { lib: MaterialCommunityIcons, name: 'flower' },
  'paw': { lib: FontAwesome5, name: 'paw' },
  'baby-carriage': { lib: FontAwesome5, name: 'baby-carriage' },
  'tshirt': { lib: FontAwesome5, name: 'tshirt' },
  'utensils': { lib: FontAwesome5, name: 'utensils' },
  'air-conditioner': { lib: MaterialCommunityIcons, name: 'air-conditioner' },
  'snowflake': { lib: MaterialCommunityIcons, name: 'snowflake' },
  'fan': { lib: MaterialCommunityIcons, name: 'fan' },
  'water': { lib: MaterialCommunityIcons, name: 'water' },
  'lightbulb-on': { lib: MaterialCommunityIcons, name: 'lightbulb-on' },
  'shredder': { lib: MaterialCommunityIcons, name: 'shredder' },
  'phone': { lib: MaterialCommunityIcons, name: 'phone' }
};

export default function MyRequestsScreen({ navigation, allRequests: propsAllRequests, onRefresh: propsOnRefresh, categories: globalCategories = [] }) {
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

  // --- MEMOIZATION: Category Map for O(1) Access ---
  const categoryMap = useMemo(() => {
    const map = {};
    if (Array.isArray(globalCategories)) {
      globalCategories.forEach(cat => {
        if (cat.name) map[cat.name] = cat;
        // Map Subcategories too for direct access
        if (cat.subcategories && Array.isArray(cat.subcategories)) {
          cat.subcategories.forEach(sub => {
            const subName = typeof sub === 'string' ? sub : sub.name;
            if (subName) {
              // Store tuple: { ...sub, parentIcon: cat.icon, parentColor: cat.color }
              map[`SUB_${subName}`] = {
                ...((typeof sub === 'object') ? sub : { name: sub }),
                parentIcon: cat.icon,
                parentColor: cat.color
              };
            }
          });
        }
      });
    }
    return map;
  }, [globalCategories]);

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

  const getClientStatus = useCallback((request) => {
    if (request.calculatedClientStatus) return request.calculatedClientStatus;

    // 0. ELIMINADA (Canceled)
    if (request.status === 'canceled') return 'ELIMINADA';

    // 1. FINALIZADA (El cliente ya valoró)
    const isClientRated = request.clientRated || request.rating > 0;
    if (isClientRated) return 'FINALIZADA';

    // 2. VALORACIÓN (Both sides finished, waiting for rating)
    if (request.proFinished && request.clientFinished || request.status === 'completed' || request.status === 'rated') return 'VALORACIÓN';

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
  }, []);

  const categories = ['Todas', ...new Set(requests.map(r => r.category?.name || 'General'))].sort();

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const catMatch = filterCategory === 'Todas' || (req.category?.name || 'General') === filterCategory;
      const label = getClientStatus(req);
      const isArchived = label === 'FINALIZADA' || label === 'TERMINADO' || label === 'ELIMINADA' || label === 'Cerrada';

      if (showArchived) {
        if (!isArchived) return false;
      } else {
        if (isArchived) return false;
      }
      return catMatch;
    });
  }, [requests, filterCategory, showArchived, getClientStatus]);

  const getStatusColors = (status) => {
    switch (status) {
      case 'NUEVA': return { bg: '#ECFDF5', text: '#10B981' }; // Green/Blue Mix
      case 'CONTACTADA': return { bg: '#EFF6FF', text: '#2563EB' }; // Blue
      case 'PRESUPUESTADA': return { bg: '#FEF3C7', text: '#D97706' }; // Amber
      case 'EN EJECUCIÓN': return { bg: '#ECFDF5', text: '#059669' }; // Strong Green
      case 'VALIDANDO': return { bg: '#FFF7ED', text: '#C2410C' }; // Orange
      case 'VALORACIÓN': return { bg: '#EEF2FF', text: '#4F46E5' }; // Indigo
      case 'FINALIZADA': return { bg: '#1F2937', text: '#F9FAFB' }; // Black
      case 'TERMINADO': return { bg: '#1F2937', text: '#F9FAFB' }; // Black Legacy
      case 'RECHAZADA': return { bg: '#FEF2F2', text: '#EF4444' }; // Red
      case 'ACEPTADO': return { bg: '#4B5320', text: '#FFFFFF' }; // Verde Militar

      case 'ELIMINADA': return { bg: '#FEF2F2', text: '#EF4444' }; // Red
      case 'Cerrada': return { bg: '#FEF2F2', text: '#EF4444' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const renderItem = ({ item }) => {
    const offerCount = item.offers ? item.offers.length : 0;
    const totalUnread = (item.conversations || []).reduce((acc, c) => acc + (c.unreadCount || 0), 0);
    const hasPendingOffers = item.offers?.some(o => o.status === 'pending' && !o.seenByClient);
    const statusLabel = getClientStatus(item);
    const colors = getStatusColors(statusLabel);

    if (item.title === 'Revisión de cortocircuito') {
      console.log("[MyRequestsScreen] Rendering:", item.title, " calculatedClientStatus:", item.calculatedClientStatus, " clientStatus:", item.clientStatus);
    }

    return (
      <TouchableOpacity
        style={[styles.card, { position: 'relative' }]}
        onPress={() => navigation.navigate('RequestDetail', { item })}
      >
        {/* BADGE: NEW OFFER INDICATOR */}
        {hasPendingOffers && (
          <View style={{
            position: 'absolute', top: -6, right: 20,
            backgroundColor: '#EA580C', paddingHorizontal: 10, paddingVertical: 4,
            borderRadius: 10, zIndex: 10, elevation: 5,
            ...(Platform.OS === 'web' ? { boxShadow: '0px 2px 3px rgba(0,0,0,0.2)' } : {
              shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3
            })
          }}>
            <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>NVA. OFERTA</Text>
          </View>
        )}

        {/* MAIN TITLE */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', flex: 1, marginRight: 10 }} numberOfLines={1}>
            {item.title}
          </Text>
        </View>

        {/* CONTENT ROW: ICON & METADATA */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
          <View style={[styles.avatarContainer, { width: 54, height: 54, borderRadius: 27, marginRight: 15 }]}>
            {(() => {
              const catName = typeof item.category === 'object' ? item.category.name : item.category;
              const subName = typeof item.subcategory === 'object' ? item.subcategory.name : item.subcategory;
              const fullCat = categoryMap[catName] || (typeof item.category === 'object' ? item.category : null);

              let iconKey = null;
              if (fullCat && subName && fullCat.subcategories) {
                const subObj = fullCat.subcategories.find(s => (s.name || s) === subName);
                if (subObj && subObj.icon) iconKey = subObj.icon;
              }
              if (!iconKey && fullCat?.icon) iconKey = fullCat.icon;
              if (!iconKey && item.category?.icon) iconKey = item.category.icon;

              const IconData = CAT_ICONS[iconKey];
              if (IconData) {
                const IconLib = IconData.lib;
                return <IconLib name={IconData.name} size={28} color="#EA580C" />;
              }
              return <MaterialCommunityIcons name="clipboard-text-outline" size={28} color="#EA580C" />;
            })()}
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
              <Feather name="map-pin" size={12} color="#6B7280" />
              <Text style={{ fontSize: 13, color: '#6B7280', marginLeft: 8 }}>{item.location || 'Sin ubicación'}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="tag" size={12} color="#94A3B8" />
              <Text style={{ fontSize: 12, color: '#94A3B8', marginLeft: 8 }} numberOfLines={1}>
                {item.category?.name || 'General'} {item.subcategory ? `• ${item.subcategory}` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* FOOTER: DATE & STATUS BADGE */}
        <View style={styles.cardFooter}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="calendar" size={12} color="#94A3B8" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 12, color: '#94A3B8' }}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>
              {statusLabel.toUpperCase()}
            </Text>
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
            style={styles.archiveButton}
          >
            <Feather name="archive" size={20} color={showArchived ? '#EA580C' : 'white'} />
          </TouchableOpacity>
        </View>
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
          initialNumToRender={5}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={requests.length === 0 ? ['transparent'] : ['#EA580C']}
              tintColor={requests.length === 0 ? 'transparent' : '#EA580C'}
            />
          }
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
                  <Text style={styles.emptyTitle}>¿Qué necesitas resolver hoy?</Text>
                  <Text style={styles.emptyDescription}>
                    No importa el tamaño del proyecto: desde electricidad y plomería hasta mudanzas o reformas. Describe tu necesidad y recibe presupuestos de los mejores expertos de tu zona al instante.
                  </Text>

                  <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => navigation.navigate('Home')}
                  >
                    <Text style={styles.createButtonText}>Encontrar un Profesional</Text>
                  </TouchableOpacity>

                  <View style={styles.noteContainer}>
                    <Text style={styles.noteText}>
                      💡 Tip: Al detallar bien tu solicitud, recibes presupuestos más precisos y ahorras tiempo.
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
  container: { flex: 1, backgroundColor: '#F8F9FA' },

  // Header
  headerContainer: {
    backgroundColor: '#EA580C',
    paddingTop: Platform.OS === 'ios' ? 44 : 15,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 0
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  archiveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },

  // List
  listContent: { paddingTop: 8, paddingHorizontal: 4, paddingBottom: 120 },

  // Card
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFF7ED',
    elevation: 5,
    ...(Platform.OS === 'web' ? { boxShadow: '0px 4px 10px rgba(234, 88, 12, 0.1)' } : {
      shadowColor: '#EA580C',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
    }),
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    // borderWidth: 1, // Optional: Removing border for cleaner look
    // borderColor: '#E2E8F0' 
  },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  cardMetaText: { fontSize: 14, color: '#4B5563', marginLeft: 8, flex: 1 },

  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: 'bold' },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    marginTop: 16
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1, marginRight: 10 },

  countBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 40
  },
  countText: { fontSize: 13, fontWeight: 'bold', color: '#4B5563', marginLeft: 8 },

  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#6B7280', marginTop: 15, fontSize: 16, fontWeight: '500' },

  // Dropdown Styles
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    minHeight: 48
  },
  dropdownButtonText: { color: 'white', fontWeight: '600', fontSize: 14, flex: 1 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    padding: 24,
    elevation: 10,
    maxHeight: '80%'
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#111827', textAlign: 'center' },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    minHeight: 56
  },
  modalOptionSelected: { backgroundColor: '#FFF7ED', paddingHorizontal: 16, borderRadius: 12, borderBottomWidth: 0 },
  modalOptionText: { fontSize: 16, color: '#4B5563' },
  modalOptionTextSelected: { color: '#EA580C', fontWeight: 'bold' },

  // New Empty State Styles
  emptyContainer: {
    alignItems: 'center',
    marginTop: 0,
    paddingHorizontal: 20,
    paddingVertical: 25,
    backgroundColor: 'white',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FFF7ED',
    elevation: 5,
    ...(Platform.OS === 'web' ? { boxShadow: '0px 4px 10px rgba(234, 88, 12, 0.1)' } : {
      shadowColor: '#EA580C',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
    }),
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 8 },
  emptyDescription: { fontSize: 14, color: '#4B5563', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  createButton: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    elevation: 0,
    marginBottom: 24,
    minHeight: 52,
    justifyContent: 'center',
    width: '100%',
    alignItems: 'center'
  },
  createButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  noteContainer: {
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 16,
    width: '100%',
    marginBottom: 10
  },
  noteText: { fontSize: 13, color: '#9A3412', lineHeight: 20, textAlign: 'center' },
  linkText: { color: '#EA580C', fontWeight: 'bold', textDecorationLine: 'underline' }
});