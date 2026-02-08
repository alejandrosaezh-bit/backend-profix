import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
      <View style={{ backgroundColor: '#EA580C', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <TouchableOpacity onPress={onBack} style={{ marginRight: 16 }}>
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>Mi Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, isEditing && { paddingBottom: 100 }]}>

        {/* PROFILE CARD */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: editedUser.avatar || 'https://placehold.co/150' }} style={styles.avatar} />
            {isEditing && (
              <TouchableOpacity style={styles.editBadge} onPress={pickImage}>
                <Feather name="camera" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>

          {!isEditing ? (
            <View style={{ alignItems: 'center', marginTop: 10 }}>
              <Text style={styles.userName}>{editedUser.name}</Text>
              <Text style={styles.userEmail}>{editedUser.email}</Text>
              <View style={styles.ratingContainer}>
                <Feather name="star" size={16} color="#FBBF24" style={{ marginRight: 4 }} />
                <Text style={styles.ratingText}>{user.rating || '5.0'} (Valoración de Profesionales)</Text>
              </View>
              <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                <Text style={styles.editButtonText}>Editar Perfil</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ width: '100%', marginTop: 20 }}>
              <Text style={styles.label}>Nombre Completo</Text>
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

            </View>
          )}
        </View>

        {/* ESTADÍSTICAS CLIENTE */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: '#F9FAFB',
          borderRadius: 16,
          padding: 20,
          marginVertical: 10,
          justifyContent: 'space-between',
          borderWidth: 1.5,
          borderColor: '#9CA3AF'
        }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>{allMyRequests.length}</Text>
            <Text style={{ fontSize: 11, color: '#6B7280', textAlign: 'center', marginTop: 4 }}>Trabajos{'\n'}Solicitados</Text>
          </View>
          <View style={{ width: 1, height: '80%', backgroundColor: '#D1D5DB', alignSelf: 'center' }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>
              {completedRequests.length}
            </Text>
            <Text style={{ fontSize: 11, color: '#6B7280', textAlign: 'center', marginTop: 4 }}>Trabajos{'\n'}Completados</Text>
          </View>
          <View style={{ width: 1, height: '80%', backgroundColor: '#D1D5DB', alignSelf: 'center' }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>
              {allMyRequests.length > 0 ? Math.round((hiredRequests.length / allMyRequests.length) * 100) : 0}%
            </Text>
            <Text style={{ fontSize: 11, color: '#6B7280', textAlign: 'center', marginTop: 4 }}>Porcentaje{'\n'}Contratación</Text>
          </View>
        </View>

        {/* SOLICITUDES ACTIVAS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Solicitudes Activas ({activeRequests.length})</Text>
          {activeRequests.length === 0 ? (
            <Text style={{ color: '#999', fontStyle: 'italic' }}>No tienes solicitudes pendientes.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              {activeRequests.map((item) => (
                <View key={item.id} style={styles.activityCard}>
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trabajos Contratados ({hiredRequests.length})</Text>
          {hiredRequests.length === 0 ? (
            <Text style={{ color: '#999', fontStyle: 'italic' }}>No has contratado a nadie aún.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              {hiredRequests.map((item) => (
                <View key={item.id} style={styles.activityCard}>
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Referencias Recibidas</Text>
          {isLoadingReviews ? (
            <ActivityIndicator size="small" color="#EA580C" style={{ marginVertical: 20 }} />
          ) : reviews.length === 0 ? (
            <Text style={{ color: '#999', fontStyle: 'italic' }}>Aún no hay opiniones de profesionales.</Text>
          ) : (
            <View style={{ marginTop: 10 }}>
              {reviews.map((review, idx) => (
                <View key={review._id || idx} style={styles.reviewCard}>
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

        {/* SETTINGS LINKS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ajustes</Text>
          <TouchableOpacity style={styles.settingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                <Feather name="star" size={20} color="#16A34A" />
              </View>
              <Text style={styles.settingText}>Mi Suscripción</Text>
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
        </View>

        <TouchableOpacity
          onPress={onLogout}
          style={{ alignSelf: 'center', padding: 15, backgroundColor: '#EF4444', borderRadius: 12, marginTop: 20, width: '80%', alignItems: 'center' }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>Cerrar Sesión</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* FIXED FOOTER BUTTONS */}
      {
        isEditing && (
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            paddingHorizontal: 20,
            paddingVertical: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#EF4444', marginRight: 10 }]}
              onPress={() => setIsEditing(false)}
            >
              <Text style={styles.actionButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#10B981', marginLeft: 10 }]}
              onPress={handleSave}
            >
              <Text style={styles.actionButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        )
      }
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6'
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
    paddingVertical: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 120, // Larger photo as requested
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'white',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#EA580C',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
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
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginRight: 16,
    width: 200,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 1px 4px rgba(0,0,0,0.05)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      }
    }),
    elevation: 2,
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
    borderRadius: 12,
    marginBottom: 10,
    ...Platform.select({
      web: { boxShadow: '0px 1px 2px rgba(0,0,0,0.05)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      }
    }),
    elevation: 1,
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
  }
});
