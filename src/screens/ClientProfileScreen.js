import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image as ExpoImage } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
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
import CrossProfileNotificationModal from '../components/CrossProfileNotificationModal';
import { api } from '../utils/api';
import { areIdsEqual } from '../utils/helpers';
import { compressAvatar } from '../utils/imageCompressor';
import { clearRequests } from '../utils/requests';

export default function ClientProfileScreen({ user, isOwner, onBack, onLogout, onUpdate, requests = [], onSwitchMode, otherModeCount }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [editedUser, setEditedUser] = useState({ ...user });
  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [showCrossPopup, setShowCrossPopup] = useState(true);

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
      try {
        const myJobs = await api.getMyJobs({ role: 'client', include_media: 'true' });
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

  // COMBINED HISTORY CALCULATION (Jobs + Reviews)
  const combinedHistory = [];
  const completedForPortfolio = (localRequests && localRequests.length > 0) 
      ? localRequests.filter(isJobCompleted) 
      : completedRequests;

  if (completedForPortfolio && completedForPortfolio.length > 0) {
      completedForPortfolio.forEach(job => {
          let jobImages = [];
          if (job.images && Array.isArray(job.images)) job.images.forEach(img => { if (img && !jobImages.includes(img)) jobImages.push(img); });
          if (job.workPhotos && Array.isArray(job.workPhotos)) job.workPhotos.forEach(img => { if (img && !jobImages.includes(img)) jobImages.push(img); });
          if (job.projectHistory && Array.isArray(job.projectHistory)) {
              job.projectHistory.forEach(hi => { if (hi && !hi.isPrivate && hi.mediaUrl && !jobImages.includes(hi.mediaUrl)) jobImages.push(hi.mediaUrl); });
          }

          if (job.portfolioOrder && Array.isArray(job.portfolioOrder) && job.portfolioOrder.length > 0) {
              const ordered = [];
              job.portfolioOrder.forEach(img => {
                  if (jobImages.includes(img)) ordered.push(img);
              });
              jobImages.forEach(img => {
                  if (!ordered.includes(img)) ordered.push(img);
              });
              jobImages = ordered;
          }

          const myPortfolio = user?.timelinePortfolio || [];
          // Filter to only show images that were manually added to the portfolio
          jobImages = jobImages.filter(img => myPortfolio.includes(img));

          const review = reviews.find(r => r.job?._id === job._id || r.job === job._id);

          combinedHistory.push({
              jobId: job._id || job.id,
              title: job.title || 'Solicitud de servicio',
              date: job.createdAt,
              images: jobImages,
              review: review
          });
      });
  }

  reviews.forEach(rev => {
      const jobId = rev.job?._id || rev.job;
      if (!combinedHistory.some(ch => ch.jobId === jobId)) {
          combinedHistory.push({
              jobId: jobId,
              title: rev.job?.title || 'Servicio valorado',
              date: rev.createdAt || new Date().toISOString(),
              images: [],
              review: rev
          });
      }
  });

  combinedHistory.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

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
              <ExpoImage source={{ uri: editedUser.avatar || 'https://placehold.co/150' }} style={styles.avatarHeader} />
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

          {/* UNIFIED HISTORY SECTION */}
          {combinedHistory && combinedHistory.length > 0 && (
              <View style={{ marginBottom: 25, marginTop: 25, marginHorizontal: -20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 20 }}>
                    <Text style={[styles.sectionTitle, { paddingHorizontal: 0, fontSize: 18, marginBottom: 0 }]}>Historial y Valoraciones</Text>
                </View>
                <FlatList
                    data={combinedHistory}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 15 }}
                    initialNumToRender={3}
                    maxToRenderPerBatch={3}
                    windowSize={5}
                    renderItem={({ item, index }) => (
                        <View style={{ backgroundColor: 'white', width: 160, borderRadius: 20, marginRight: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' }}>
                            {/* PORTADA DEL TRABAJO */}
                            {item.images && item.images.length > 0 ? (
                                <ExpoImage source={{ uri: item.images[0] }} style={{ width: '100%', aspectRatio: 1, backgroundColor: '#E2E8F0', resizeMode: 'cover' }} />
                            ) : (
                                <View style={{ width: '100%', aspectRatio: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' }}>
                                    <Feather name="image" size={32} color="#CBD5E1" />
                                </View>
                            )}

                            <View style={{ padding: 12, alignItems: 'center' }}>
                                {/* TITULO */}
                                <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#1E293B', marginBottom: 8, textAlign: 'center' }} numberOfLines={2}>{item.title}</Text>
                                
                                {item.review ? (
                                    <View style={{ width: '100%', alignItems: 'center' }}>
                                        {/* PROFESIONAL INFO */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                                            {item.review.reviewer?.avatar ? (
                                                <ExpoImage source={{ uri: item.review.reviewer.avatar }} style={{ width: 20, height: 20, borderRadius: 10, marginRight: 6, resizeMode: 'cover' }} />
                                            ) : (
                                                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 6 }}>
                                                    <Feather name="user" size={10} color="#2563EB" />
                                                </View>
                                            )}
                                            <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '500' }} numberOfLines={1}>{item.review.reviewer?.name || 'Profesional'}</Text>
                                        </View>
                                        
                                        {/* ESTRELLAS */}
                                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 6 }}>
                                            {[...Array(5)].map((_, idx) => (
                                                <FontAwesome5 key={idx} name="star" solid={idx < (item.review.rating || 5)} size={10} color="#FBBF24" style={{ marginRight: 2 }} />
                                            ))}
                                        </View>
                                        
                                        {/* COMENTARIO */}
                                        <Text style={{ fontSize: 12, color: '#4B5563', fontStyle: 'italic', textAlign: 'center' }} numberOfLines={3}>"{item.review.comment || 'Buen cliente.'}"</Text>
                                    </View>
                                ) : (
                                    <View style={{ width: '100%', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic', textAlign: 'center' }}>Completado sin reseña.</Text>
                                    </View>
                                )}

                                {/* BOTON VER MAS FOTOS */}
                                {item.images && item.images.length > 0 && (
                                    <TouchableOpacity 
                                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF', paddingVertical: 8, borderRadius: 10, marginTop: 12, width: '100%' }}
                                        onPress={() => setSelectedGallery(item.images)}
                                    >
                                        <Feather name="image" size={14} color="#2563EB" style={{ marginRight: 6 }} />
                                        <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 11 }}>Ver fotos ({item.images.length})</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}
                />
              </View>
          )}

          {/* SETTINGS LINKS */}
          <ClientSettingsList 
            onEditProfile={() => setIsEditing(true)} 
            onSwitchMode={onSwitchMode} 
            onOpenNotifications={() => setShowNotifications(true)} 
            otherModeCount={otherModeCount}
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

      {/* GRID GALLERY MODAL */}
      <Modal visible={!!selectedGallery && selectedImageIndex === null} transparent={true} animationType="slide" onRequestClose={() => setSelectedGallery(null)}>
        <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
          <View style={[styles.blueHeader, { borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingBottom: 20 }]}>
              <View style={[styles.headerTop, { paddingTop: Platform.OS === 'ios' ? 44 : 20, marginBottom: 0 }]}>
                  <Text style={styles.headerTitle}>Fotos del Trabajo</Text>
                  <TouchableOpacity onPress={() => setSelectedGallery(null)} style={styles.closeButton}>
                      <Feather name="x" size={24} color="white" />
                  </TouchableOpacity>
              </View>
          </View>
          <FlatList
            data={selectedGallery}
            keyExtractor={(item, index) => index.toString()}
            numColumns={3}
            contentContainerStyle={{ padding: 10 }}
            renderItem={({ item: img, index: i }) => (
              <TouchableOpacity 
                  style={{ width: '31%', aspectRatio: 1, margin: '1.1%', borderRadius: 12, overflow: 'hidden' }}
                  onPress={() => setSelectedImageIndex(i)}
              >
                <ExpoImage source={{ uri: img }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* FULLSCREEN IMAGE MODAL */}
      <Modal visible={selectedImageIndex !== null} transparent={true} animationType="fade" onRequestClose={() => setSelectedImageIndex(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' }}>
          <TouchableOpacity
            style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20 }}
            onPress={() => setSelectedImageIndex(null)}
          >
            <Feather name="x" size={30} color="white" />
          </TouchableOpacity>
          {selectedImageIndex !== null && (
            <FlatList
              data={selectedGallery}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={selectedImageIndex}
              getItemLayout={(data, index) => ({ length: Dimensions.get('window').width, offset: Dimensions.get('window').width * index, index })}
              renderItem={({ item }) => (
                <View style={{ width: Dimensions.get('window').width, height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                  <ExpoImage source={{ uri: item }} style={{ width: '100%', height: '80%', resizeMode: 'contain' }} />
                </View>
              )}
            />
          )}
        </View>
      </Modal>

      <NotificationPreferencesModal 
        visible={showNotifications} 
        onClose={() => setShowNotifications(false)} 
        user={user}
        onUpdate={onUpdate}
        mode="client"
      />

      <CrossProfileNotificationModal
        visible={showCrossPopup}
        onClose={() => setShowCrossPopup(false)}
        onSwitchMode={onSwitchMode}
        otherModeCount={otherModeCount}
        targetMode="pro"
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
