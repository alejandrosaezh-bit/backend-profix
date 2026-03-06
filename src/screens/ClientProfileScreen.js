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
import { api } from '../utils/api';
import { areIdsEqual } from '../utils/helpers';
import { compressAvatar } from '../utils/imageCompressor';
import { clearRequests } from '../utils/requests';

export default function ClientProfileScreen({ user, isOwner, onBack, onLogout, onUpdate, requests = [], onSwitchMode }) {
  const [isEditing, setIsEditing] = useState(false);
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
        <View style={styles.blueHeader}>
          <View style={styles.headerTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.headerTitle}>Mi Perfil</Text>
              <View style={styles.versionBadge}>
                <Text style={styles.versionText}>V36.0</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onLogout} style={styles.logoutButtonHeader}>
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
            <View style={{ marginLeft: 20, flex: 1 }}>
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

            {/* PORTAFOLIO DE TRABAJOS */}
            <View style={{ width: '100%', marginBottom: 25 }}>
              <Text style={[styles.sectionTitle, { paddingHorizontal: 0, fontSize: 18, marginBottom: 10 }]}>Portafolio de Trabajos</Text>
              {(() => {
                const portfolioFolders = [];
                if (user?.profiles) {
                  const profilesObj = user.profiles instanceof Map ? Object.fromEntries(user.profiles) : user.profiles;
                  Object.keys(profilesObj).forEach(cat => {
                    if (profilesObj[cat]?.gallery && profilesObj[cat].gallery.length > 0) {
                      portfolioFolders.push({
                        category: cat,
                        subcategories: profilesObj[cat].subcategories || [],
                        images: profilesObj[cat].gallery
                      });
                    }
                  });
                }

                if (portfolioFolders.length === 0) {
                  return (
                    <View style={styles.emptyContainer}>
                      <Feather name="folder" size={40} color="#E2E8F0" />
                      <Text style={styles.emptyText}>No hay trabajos en el portafolio.</Text>
                    </View>
                  );
                }

                return (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    {portfolioFolders.map((folder, index) => (
                      <TouchableOpacity key={index} style={styles.folderCard} onPress={() => setSelectedGallery(folder.images)}>
                        <View style={styles.folderTab} />
                        <View style={styles.folderContent}>
                          <Image source={{ uri: folder.images[0] }} style={styles.folderImage} />
                          <View style={styles.folderInfo}>
                            <Text style={styles.folderTitle} numberOfLines={2}>{folder.category}</Text>
                            <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2, marginBottom: 2 }} numberOfLines={1}>
                              {folder.subcategories.length > 0 ? folder.subcategories.join(', ') : 'Servicios generales'}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                              <Feather name="image" size={10} color="#94A3B8" />
                              <Text style={styles.folderCount}>{folder.images.length} fotos</Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })()}
            </View>

            {/* OPINIONES / REFERENCIAS REALES */}
            <ClientReviewsList reviews={reviews} isLoading={isLoadingReviews} />
          </View>

          {/* SETTINGS LINKS */}
          <ClientSettingsList onEditProfile={() => setIsEditing(true)} onSwitchMode={onSwitchMode} />

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
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: 35,
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
    marginBottom: 25,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 24,
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
    borderWidth: 1,
    borderColor: '#FFF7ED',
    elevation: 5,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
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
  folderCard: {
    width: '48%',
    marginBottom: 16,
    position: 'relative',
    marginTop: 10,
  },
  folderTab: {
    width: '45%',
    height: 12,
    backgroundColor: '#2563EB',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    left: 0,
    zIndex: 1
  },
  folderContent: {
    backgroundColor: 'white',
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
    zIndex: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  folderImage: {
    width: '100%',
    height: 80,
    borderTopRightRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  folderInfo: {
    padding: 8,
  },
  folderTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  folderCount: {
    fontSize: 10,
    color: '#94A3B8',
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12
  }
});
