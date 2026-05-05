import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { ClientReviewsList, ClientSettingsList, ClientStatistics } from '../components/profile/ClientProfileComponents';
import { ClientEditProfileModal } from '../components/profile/ClientProfileModals';
import NotificationPreferencesModal from '../components/NotificationPreferencesModal';
import { api } from '../utils/api';
import { areIdsEqual } from '../utils/helpers';
import { compressAvatar } from '../utils/imageCompressor';
import { clearRequests } from '../utils/requests';

export default function ClientProfileScreen({ user, isOwner, onBack, onLogout, onUpdate, requests = [], onSwitchMode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [editedUser, setEditedUser] = useState({ ...user });
  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState(null);

  const [localRequests, setLocalRequests] = useState([]);

  useEffect(() => {
    if (!user?._id) return;

    const fetchReviews = async () => {
      setIsLoadingReviews(true);
      try {
        const reviewsData = await api.getClientReviews(user._id);
        setReviews(reviewsData || []);
      } catch (error) {
        console.error("Error fetching client reviews:", error);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    const fetchJobs = async () => {
      // Only fetch if props are empty to avoid redundant network calls
      if (requests && requests.length > 0) return;

      try {
        const myJobs = await api.getMyJobs({ role: 'client' });
        setLocalRequests(Array.isArray(myJobs) ? myJobs : []);
      } catch (error) {
        console.error("Error fetching client jobs:", error);
      }
    };

    fetchReviews();
    fetchJobs();
  }, [user?._id, requests?.length]);

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Cerrando sesión...</Text>
      </View>
    );
  }

  const reviewCount = reviews.length;
  const ratingDisplay = editedUser?.rating
    ? editedUser.rating.toFixed(1)
    : (reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0');

  // Use props if available, otherwise local fetch
  const sourceRequests = (requests && requests.length > 0) ? requests : localRequests;

  const allMyRequests = sourceRequests.filter(r => {
    const rClientId = r.clientId || r.client?._id || r.client;
    const rClientEmail = r.clientEmail || r.client?.email;
    return areIdsEqual(rClientId, user._id) || (user.email && rClientEmail === user.email);
  });

  // Helper para determinar si una solicitud está completa/contratada
  const isJobHired = (r) => {
    const hiredStatuses = ['Asignada', 'En Ejecución', 'Finalizada', 'Cerrado', 'Cerrada', 'VALORACIÓN', 'TERMINADO', 'rated', 'completed', 'Culminada'];
    return hiredStatuses.includes(r.status) || r.proId || r.professionalId || r.assignedTo;
  };

  const isJobCompleted = (r) => {
    const completedStatuses = ['Finalizada', 'Cerrado', 'Cerrada', 'TERMINADO', 'rated', 'completed', 'Culminada'];
    return completedStatuses.includes(r.status) || (r.proFinished && r.clientFinished) || r.rating > 0 || r.clientRated;
  };

  // Solicitudes Activas (Pendientes de contratación)
  const activeRequests = allMyRequests.filter(r => (r.status === 'Abierto' || r.status === 'VALIDANDO') && !isJobCompleted(r));

  // Trabajos Contratados (En proceso o finalizados)
  const hiredRequests = allMyRequests.filter(isJobHired);

  // Trabajos Completados
  const completedRequests = allMyRequests.filter(isJobCompleted);

  const handleSave = () => {
    onUpdate(editedUser);
    setIsEditing(false);
  };

  const handleClearChats = async () => {
    Alert.alert(
      "Borrar Chats",
      "¿Estás seguro de que quieres borrar todos los chats y solicitudes locales?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar",
          style: "destructive",
          onPress: async () => {
            await clearRequests();
            Alert.alert("Éxito", "Chats borrados. Por favor recarga la app.");
          }
        }
      ]
    );
  };

  const pickImage = async () => {
    if (!isEditing) return;

    // Solicitar permisos primero
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para cambiar la foto.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [1, 1],
      quality: 0.5, // Reducir calidad para que no pese tanto
      base64: true, // Solicitar Base64
    });

    if (!result.canceled) {
      // Comprimir URI base64 miniatura
      const compressedAvatar = await compressAvatar(result.assets[0].uri);
      setEditedUser({ ...editedUser, avatar: compressedAvatar });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        {/* Header Cliente (Orange Banner) */}
        <View style={[styles.blueHeader, { borderBottomLeftRadius: 32, borderBottomRightRadius: 32, paddingBottom: 35 }]}>
          <View style={[styles.headerTop, { paddingTop: Platform.OS === 'ios' ? 44 : 10, marginBottom: 5 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.headerTitle}>Mi Perfil</Text>
              <View style={styles.versionBadge}>
                <Text style={styles.versionText}>V36.0</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onLogout} style={[styles.logoutButtonHeader, { marginLeft: 10 }]}>
              <Feather name="log-out" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.headerMain}>
            <View style={styles.avatarContainerHeader}>
              <Image source={{ uri: editedUser.avatar || 'https://placehold.co/150' }} style={styles.avatarHeader} />
              <TouchableOpacity style={styles.editBadgeHeader} onPress={() => setIsEditing(true)}>
                <Feather name="edit-2" size={14} color="white" />
              </TouchableOpacity>
            </View>
            <View style={{ marginLeft: 20, flex: 1, justifyContent: 'center' }}>
              <Text style={styles.headerName} numberOfLines={1}>{editedUser.name}</Text>
              <View style={styles.headerRating}>
                <FontAwesome5 name="star" solid size={14} color="#FBBF24" />
                <Text style={styles.headerRatingText}>{ratingDisplay} • {reviewCount} reseñas</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.cardContainer}>
          {/* HUGE MAIN CARD */}
          <View style={styles.profileCard}>
            {/* ESTADÍSTICAS CLIENTE REDISEÑADO */}
            <ClientStatistics
              allMyRequests={allMyRequests}
              completedRequests={completedRequests}
              hiredRequests={hiredRequests}
            />
          </View>

          {/* PORTAFOLIO DE TRABAJOS (AIRBNB STYLE) */}
          <View style={{ marginBottom: 25, marginTop: 25, marginHorizontal: -20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 20 }}>
              <Text style={[styles.sectionTitle, { paddingHorizontal: 0, fontSize: 18, marginBottom: 0 }]}>Portafolio de Trabajos</Text>
              <TouchableOpacity style={styles.arrowButton}>
                <Feather name="arrow-right" size={16} color="#111827" />
              </TouchableOpacity>
            </View>

            {(() => {
              const portfolioFolders = [];
              const clientJobs = completedRequests || [];

              clientJobs.forEach(job => {
                const jobImagesInPortfolio = [];
                const jobMedia = [];
                if (job.images) jobMedia.push(...job.images);
                if (job.workPhotos) jobMedia.push(...job.workPhotos);
                if (job.projectHistory) {
                    job.projectHistory.forEach(ev => { if (ev.mediaUrl) jobMedia.push(ev.mediaUrl); });
                }
                if (job.clientManagement?.beforePhotos) {
                    job.clientManagement.beforePhotos.forEach(p => { if (p.url) jobMedia.push(p.url); });
                }
                if (job.clientManagement?.payments) {
                    job.clientManagement.payments.forEach(p => { if (p.evidenceUrl) jobMedia.push(p.evidenceUrl); });
                }
                
                const uniqueJobMedia = [...new Set(jobMedia)];
                
                if (uniqueJobMedia.length > 0) {
                    portfolioFolders.push({
                        category: job.title || 'Trabajo completado',
                        subcategories: [(job.subCategory || 'General')],
                        images: uniqueJobMedia
                    });
                }
              });

              if (portfolioFolders.length === 0) {
                return (
                  <View style={[styles.emptyContainer, { marginHorizontal: 20 }]}>
                    <Feather name="folder" size={40} color="#E2E8F0" />
                    <Text style={styles.emptyText}>No hay trabajos en el portafolio.</Text>
                  </View>
                );
              }

              // Card de Airbnb ancha para previsualizar el siguiente ítem
              return (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20, paddingLeft: 20 }}>
                  {portfolioFolders.map((folder, index) => (
                    <TouchableOpacity key={index} style={styles.airbnbCard} onPress={() => setSelectedGallery(folder.images)}>
                      <Image source={{ uri: folder.images[0] }} style={styles.airbnbImage} resizeMode="cover" />
                      <View style={styles.airbnbInfo}>
                        <Text style={styles.airbnbTitle} numberOfLines={1}>{folder.category}</Text>
                        <Text style={styles.airbnbSubtitle} numberOfLines={1}>
                          {folder.subcategories.length > 0 ? folder.subcategories.join(', ') : 'Servicios generales'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                          <Feather name="image" size={12} color="#6B7280" />
                          <Text style={styles.airbnbCount}>{folder.images.length} fotos</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              );
            })()}
          </View>

          {/* OPINIONES / REFERENCIAS REALES */}
          <ClientReviewsList reviews={reviews} isLoading={isLoadingReviews} />

          {/* SETTINGS LINKS */}
          <ClientSettingsList 
            onEditProfile={() => setIsEditing(true)} 
            onSwitchMode={onSwitchMode} 
            onOpenNotifications={() => setShowNotifications(true)} 
          />

        </View>
      </ScrollView>

      {/* MODAL DE EDICIÓN DE PERFIL */}
      <ClientEditProfileModal
        visible={isEditing}
        onClose={() => setIsEditing(false)}
        onSave={handleSave}
        editedUser={editedUser}
        setEditedUser={setEditedUser}
        onPickImage={pickImage}
      />

      {/* GALLERY MODAL */}
      <Modal visible={!!selectedGallery} transparent={true} animationType="fade" onRequestClose={() => setSelectedGallery(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' }}>
          <TouchableOpacity
            style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20 }}
            onPress={() => setSelectedGallery(null)}
          >
            <Feather name="x" size={30} color="white" />
          </TouchableOpacity>
          <ScrollView horizontal pagingEnabled style={{ flex: 1 }}>
            {selectedGallery?.map((img, i) => (
              <View key={i} style={{ width: Dimensions.get('window').width, height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                <Image source={{ uri: img }} style={{ width: '100%', height: '80%', resizeMode: 'contain' }} />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <NotificationPreferencesModal 
        visible={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  blueHeader: {
    backgroundColor: '#EA580C',
    paddingTop: Platform.OS === 'ios' ? 44 : 5,
    paddingBottom: 25,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainerHeader: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    padding: 3,
    elevation: 5,
    position: 'relative',
  },
  avatarHeader: {
    width: '100%',
    height: '100%',
    borderRadius: 37
  },
  editBadgeHeader: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#EA580C',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  headerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  headerRatingText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginLeft: 8,
  },
  cardContainer: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  versionBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 10,
    marginTop: 2
  },
  versionText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold'
  },
  logoutButtonHeader: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  scrollContent: {
    paddingBottom: 20,
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFF7ED',
    elevation: 5,
    boxShadow: '0 4px 10px rgba(234, 88, 12, 0.1)',
  },
  logoutButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    padding: 10,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 14,
    textDecorationLine: 'underline'
  },
  profileCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    marginBottom: 0
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  ratingText: {
    color: '#D97706',
    fontWeight: '600',
    fontSize: 14,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EA580C',
  },
  editButtonText: {
    color: '#EA580C',
    fontWeight: '600',
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white'
  },
  emptyContainer: { alignItems: 'center', paddingVertical: 10 },
  emptyText: { color: '#94A3B8', fontSize: 13, textAlign: 'center', marginTop: 15, paddingHorizontal: 20 },
  airbnbCard: {
    width: 140,
    marginRight: 16,
  },
  airbnbImage: {
    width: 140,
    height: 140,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: '#F3F4F6'
  },
  airbnbInfo: {
    paddingHorizontal: 2,
  },
  airbnbTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  airbnbSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  airbnbCount: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  arrowButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' },
      default: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }
    })
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12
  }
});
