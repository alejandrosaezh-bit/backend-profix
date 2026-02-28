import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { ClientReviewsList, ClientSettingsList, ClientStatistics, RequestHorizontalList } from '../components/profile/ClientProfileComponents';
import { ClientEditProfileModal } from '../components/profile/ClientProfileModals';
import { api } from '../utils/api';
import { areIdsEqual } from '../utils/helpers';
import { clearRequests } from '../utils/requests';

export default function ClientProfileScreen({ user, isOwner, onBack, onLogout, onUpdate, requests = [], onSwitchMode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({ ...user });
  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

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
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5, // Reducir calidad para que no pese tanto
      base64: true, // Solicitar Base64
    });

    if (!result.canceled) {
      // Crear URI base64
      const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setEditedUser({ ...editedUser, avatar: base64Img });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Cliente */}
      <View style={styles.headerContainer}>
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
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* HUGE MAIN CARD */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: editedUser.avatar || 'https://placehold.co/150' }} style={styles.avatar} />
            <TouchableOpacity style={styles.editBadge} onPress={() => setIsEditing(true)}>
              <Feather name="edit-2" size={16} color="white" />
            </TouchableOpacity>
          </View>

          <View style={{ alignItems: 'center', marginTop: 10, width: '100%', marginBottom: 20 }}>
            <Text style={styles.userName}>{editedUser.name}</Text>
            <Text style={styles.userEmail}>{editedUser.email}</Text>
          </View>

          {/* ESTADÍSTICAS CLIENTE REDISEÑADO */}
          <ClientStatistics
            allMyRequests={allMyRequests}
            completedRequests={completedRequests}
            hiredRequests={hiredRequests}
          />

          {/* SOLICITUDES ACTIVAS */}
          <RequestHorizontalList
            title="Solicitudes Activas"
            requests={activeRequests}
            emptyMessage="No tienes solicitudes pendientes."
            getStatusStyle={(status) => ({
              badge: { backgroundColor: status === 'Abierto' ? '#DBEAFE' : '#DCFCE7' },
              text: { color: status === 'Abierto' ? '#2563EB' : '#16A34A' }
            })}
          />

          {/* TRABAJOS CONTRATADOS */}
          <RequestHorizontalList
            title="Trabajos Contratados"
            requests={hiredRequests}
            emptyMessage="No has contratado a nadie aún."
          />

          {/* OPINIONES / REFERENCIAS REALES */}
          <ClientReviewsList reviews={reviews} isLoading={isLoadingReviews} />
        </View>

        {/* SETTINGS LINKS */}
        <ClientSettingsList onEditProfile={() => setIsEditing(true)} onSwitchMode={onSwitchMode} />

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

    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerContainer: {
    backgroundColor: '#EA580C',
    paddingTop: Platform.OS === 'ios' ? 44 : 15,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 0,
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
  versionBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 10,
    marginTop: 4
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
    marginHorizontal: 4,
    marginTop: 8,
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF7ED',
    elevation: 5,
    boxShadow: '0 4px 10px rgba(234, 88, 12, 0.1)',
    marginBottom: 0
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'white',
    backgroundColor: '#F3F4F6'
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#EA580C',
    padding: 6,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'white',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
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
  }
});
