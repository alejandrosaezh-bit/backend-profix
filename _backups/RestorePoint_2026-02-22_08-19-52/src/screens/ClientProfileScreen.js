import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { api } from '../utils/api';
import { clearRequests } from '../utils/requests';




// Helper para comparar IDs de forma segura
const areIdsEqual = (id1, id2) => {
  if (!id1 || !id2) return false;
  const s1 = (typeof id1 === 'object' && id1 !== null) ? (id1._id || id1.id || id1.toString()) : String(id1);
  const s2 = (typeof id2 === 'object' && id2 !== null) ? (id2._id || id2.id || id2.toString()) : String(id2);
  const str1 = String(s1).replace(/["']/g, "").trim();
  const str2 = String(s2).replace(/["']/g, "").trim();
  return str1 === str2;
};

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
        setIsLoadingReviews(false); // Update loading state independently
      }
    };

    const fetchJobs = async () => {
      try {
        const myJobs = await api.getMyJobs();
        setLocalRequests(Array.isArray(myJobs) ? myJobs : []);
      } catch (error) {
        console.error("Error fetching client jobs:", error);
      }
    };

    fetchReviews();
    fetchJobs();
  }, [user?._id]);

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Cerrando sesión...</Text>
      </View>
    );
  }

  // Filtrar solicitudes del usuario (Prefer local fetch, fallback to props)
  const sourceRequests = localRequests.length > 0 ? localRequests : requests;

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
      <View style={{ backgroundColor: '#EA580C', paddingVertical: 18, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>Mi Perfil</Text>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 10 }}>
            <Text style={{ fontSize: 10, color: 'white', fontWeight: 'bold' }}>V32.0</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onLogout} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
          <Feather name="log-out" size={20} color="white" />
        </TouchableOpacity>
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F3F4F6', marginBottom: 25 }}>
            <View style={styles.statBox}>
              <View style={[styles.statIconContainer, { backgroundColor: '#DBEAFE' }]}>
                <Feather name="clipboard" size={20} color="#2563EB" />
              </View>
              <Text style={styles.statNumber}>{allMyRequests.length}</Text>
              <Text style={styles.statLabel}>Solicitudes</Text>
            </View>
            <View style={styles.statDividerVertical} />
            <View style={styles.statBox}>
              <View style={[styles.statIconContainer, { backgroundColor: '#DCFCE7' }]}>
                <Feather name="check-circle" size={20} color="#16A34A" />
              </View>
              <Text style={styles.statNumber}>{completedRequests.length}</Text>
              <Text style={styles.statLabel}>Completadas</Text>
            </View>
            <View style={styles.statDividerVertical} />
            <View style={styles.statBox}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <Feather name="pie-chart" size={20} color="#D97706" />
              </View>
              <Text style={styles.statNumber}>
                {allMyRequests.length > 0 ? Math.round((hiredRequests.length / allMyRequests.length) * 100) : 0}%
              </Text>
              <Text style={styles.statLabel}>Éxito</Text>
            </View>
          </View>

          {/* SOLICITUDES ACTIVAS */}
          <View style={{ width: '100%', marginBottom: 25 }}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: 0, fontSize: 18, marginBottom: 10 }]}>Solicitudes Activas ({activeRequests.length})</Text>
            {activeRequests.length === 0 ? (
              <Text style={{ color: '#999', fontStyle: 'italic' }}>No tienes solicitudes pendientes.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 5 }}>
                {activeRequests.map((item) => (
                  <View key={item.id} style={[styles.activityCard, { elevation: 2, shadowOpacity: 0.05, borderColor: '#F1F5F9' }]}>
                    <Image source={{ uri: (item.images && item.images[0]) || 'https://placehold.co/150' }} style={styles.activityImage} />
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.activityDate}>{item.date}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: item.status === 'Abierto' ? '#DBEAFE' : '#DCFCE7' }]}>
                        <Text style={[styles.statusText, { color: item.status === 'Abierto' ? '#2563EB' : '#16A34A' }]}>{item.status}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* TRABAJOS CONTRATADOS */}
          <View style={{ width: '100%', marginBottom: 25 }}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: 0, fontSize: 18, marginBottom: 10 }]}>Trabajos Contratados ({hiredRequests.length})</Text>
            {hiredRequests.length === 0 ? (
              <Text style={{ color: '#999', fontStyle: 'italic' }}>No has contratado a nadie aún.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 5 }}>
                {hiredRequests.map((item) => (
                  <View key={item.id} style={[styles.activityCard, { elevation: 2, shadowOpacity: 0.05, borderColor: '#F1F5F9' }]}>
                    <Image source={{ uri: (item.images && item.images[0]) || 'https://placehold.co/150' }} style={styles.activityImage} />
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.activityDate}>{item.date}</Text>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{item.status}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* OPINIONES / REFERENCIAS REALES */}
          <View style={{ width: '100%', marginBottom: 10 }}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: 0, fontSize: 18, marginBottom: 10 }]}>Referencias Recibidas</Text>
            {isLoadingReviews ? (
              <ActivityIndicator size="small" color="#EA580C" style={{ marginVertical: 20 }} />
            ) : reviews.length === 0 ? (
              <Text style={{ color: '#999', fontStyle: 'italic' }}>Aún no hay opiniones de profesionales.</Text>
            ) : (
              <View style={{ marginTop: 5 }}>
                {reviews.map((review, idx) => (
                  <View key={review._id || idx} style={[styles.reviewCard, { elevation: 0, borderWidth: 1, borderColor: '#F1F5F9', shadowOpacity: 0 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image
                          source={{ uri: review.reviewer?.avatar || 'https://placehold.co/100' }}
                          style={{ width: 30, height: 30, borderRadius: 15, marginRight: 8 }}
                        />
                        <View>
                          <Text style={{ fontWeight: 'bold', fontSize: 13 }}>{review.reviewer?.name || 'Profesional'}</Text>
                          <View style={{ flexDirection: 'row' }}>
                            {[...Array(5)].map((_, i) => (
                              <FontAwesome5 key={i} name="star" solid={i < review.rating} size={10} color="#FBBF24" />
                            ))}
                          </View>
                        </View>
                      </View>
                      <Text style={{ fontSize: 10, color: '#9CA3AF' }}>{new Date(review.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <Text style={{ marginTop: 8, color: '#4B5563', fontSize: 13, fontStyle: 'italic', paddingLeft: 38 }}>
                      "{review.comment || 'Sin comentarios'}"
                    </Text>
                    {review.job && (
                      <Text style={{ marginTop: 4, fontSize: 10, color: '#6B7280', paddingLeft: 38 }}>
                        Trabajo: {review.job.title || 'Servicio'}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* SETTINGS LINKS */}
        <View style={[styles.section, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Ajustes de Cuenta</Text>

          <TouchableOpacity style={styles.settingRow} onPress={() => setIsEditing(true)}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconBox, { backgroundColor: '#F3F4F6' }]}>
                <Feather name="user" size={20} color="#4B5563" />
              </View>
              <Text style={styles.settingText}>Editar Mis Datos Personales</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                <Feather name="star" size={20} color="#16A34A" />
              </View>
              <Text style={styles.settingText}>Mis Suscripciones</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconBox, { backgroundColor: '#E0E7FF' }]}>
                <Feather name="bell" size={20} color="#4F46E5" />
              </View>
              <Text style={styles.settingText}>Notificaciones</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={{
            backgroundColor: '#2563EB',
            paddingVertical: 14,
            paddingHorizontal: 30,
            borderRadius: 24,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
            marginTop: 20,
            marginBottom: 20,
            shadowColor: '#2563EB',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4
          }}
            onPress={() => onSwitchMode && onSwitchMode('pro')}
          >
            <Feather name="briefcase" size={18} color="white" style={{ marginRight: 8 }} />
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Cambiar a Profesional</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* MODAL DE EDICIÓN DE PERFIL */}
      <Modal
        visible={isEditing}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditing(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={styles.modalTitle}>Editar Datos Personales</Text>
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <Feather name="x" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <TouchableOpacity onPress={pickImage} style={{ position: 'relative' }}>
                  <Image source={{ uri: editedUser.avatar || 'https://placehold.co/150' }} style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#FFF7ED' }} />
                  <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#EA580C', padding: 6, borderRadius: 15, borderWidth: 2, borderColor: 'white' }}>
                    <Feather name="camera" size={16} color="white" />
                  </View>
                </TouchableOpacity>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>Toca la foto para cambiarla</Text>
              </View>

              <Text style={[styles.label, { marginTop: 0 }]}>Nombre Completo</Text>
              <TextInput
                style={styles.input}
                value={editedUser.name}
                onChangeText={(t) => setEditedUser({ ...editedUser, name: t })}
              />

              <Text style={styles.label}>Correo Electrónico</Text>
              <TextInput
                style={styles.input}
                value={editedUser.email}
                onChangeText={(t) => setEditedUser({ ...editedUser, email: t })}
                keyboardType="email-address"
              />

              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={editedUser.phone || ''}
                onChangeText={(t) => setEditedUser({ ...editedUser, phone: t })}
                keyboardType="phone-pad"
                placeholder="+56 9 1234 5678"
              />

              <Text style={[styles.label, { color: '#9CA3AF' }]}>Cédula de Identidad</Text>
              <View style={[styles.input, { backgroundColor: '#F8F9FA', borderColor: '#E5E7EB', marginBottom: 20, flexDirection: 'row', alignItems: 'center' }]}>
                <Text style={{ color: '#9CA3AF', fontSize: 17, flex: 1 }}>{editedUser.cedula || 'No registrada'}</Text>
                <Feather name="lock" size={18} color="#9CA3AF" />
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#F1F5F9', flex: 1, marginRight: 10, elevation: 0 }]}
                onPress={() => setIsEditing(false)}
              >
                <Text style={[styles.actionButtonText, { color: '#4B5563' }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#EA580C', flex: 1, marginLeft: 10, elevation: 0 }]}
                onPress={handleSave}
              >
                <Text style={styles.actionButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
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
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
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
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    marginTop: 20,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 18,
    fontSize: 17,
    color: '#1F2937',
    minHeight: 64,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 17,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    marginRight: 16,
    width: 200,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFF7ED',
    elevation: 5,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  activityImage: {
    width: '100%',
    height: 100,
  },
  activityInfo: {
    padding: 12,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 24,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFF7ED',
    elevation: 5,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#374151',
  },
  // New Styles
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white'
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginTop: 8,
    marginBottom: 0,
    marginHorizontal: 4,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#FFF7ED',
    elevation: 5,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  statBox: {
    flex: 1,
    alignItems: 'center'
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827'
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2
  },
  statDividerVertical: {
    width: 1,
    height: '60%',
    backgroundColor: '#E5E7EB',
    alignSelf: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    width: '100%',
    height: '92%',
    maxHeight: '100%'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827'
  }
});
