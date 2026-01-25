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


export default function ClientProfileScreen({ user, isOwner, onBack, onLogout, onUpdate, requests = [], onSwitchMode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({ ...user });
  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
        if (!user?._id) return;
        setIsLoadingReviews(true);
        try {
            const data = await api.getClientReviews(user._id);
            setReviews(data || []);
        } catch (error) {
            // console.error("Error fetching client reviews:", error);
        } finally {
            setIsLoadingReviews(false);
        }
    };
    fetchReviews();
  }, [user?._id]);

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Cerrando sesión...</Text>
      </View>
    );
  }

  // Filtrar solicitudes del usuario

  const myRequests = requests.filter(r => r.clientEmail === user.email);
  // Filtrar contratados (En Ejecución, Finalizada, o con oferta aceptada)
  const hiredRequests = myRequests.filter(r => ['En Ejecución', 'Finalizada', 'Cerrado'].includes(r.status) || r.offers?.some(o => o.status === 'accepted'));

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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* PROFILE CARD */}
        <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
                <Image source={{ uri: editedUser.avatar || 'https://via.placeholder.com/150' }} style={styles.avatar} />
                {isEditing && (
                    <TouchableOpacity style={styles.editBadge} onPress={pickImage}>
                        <Feather name="camera" size={20} color="white" />
                    </TouchableOpacity>
                )}
            </View>
            
            {!isEditing ? (
                <View style={{alignItems:'center', marginTop: 10}}>
                    <Text style={styles.userName}>{editedUser.name}</Text>
                    <Text style={styles.userEmail}>{editedUser.email}</Text>
                    <View style={styles.ratingContainer}>
                        <Feather name="star" size={16} color="#FBBF24" style={{marginRight:4}} />
                        <Text style={styles.ratingText}>{user.rating || '5.0'} (Valoración de Profesionales)</Text>
                    </View>
                    <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                        <Text style={styles.editButtonText}>Editar Perfil</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={{width: '100%', marginTop: 20}}>
                    <Text style={styles.label}>Nombre Completo</Text>
                    <TextInput 
                        style={styles.input} 
                        value={editedUser.name} 
                        onChangeText={(t) => setEditedUser({...editedUser, name: t})} 
                    />
                    
                    <Text style={styles.label}>Correo Electrónico</Text>
                    <TextInput 
                        style={styles.input} 
                        value={editedUser.email} 
                        onChangeText={(t) => setEditedUser({...editedUser, email: t})} 
                        keyboardType="email-address"
                    />

                    <Text style={styles.label}>Teléfono</Text>
                    <TextInput 
                        style={styles.input} 
                        value={editedUser.phone || ''} 
                        onChangeText={(t) => setEditedUser({...editedUser, phone: t})} 
                        keyboardType="phone-pad"
                        placeholder="+56 9 1234 5678"
                    />

                    <View style={{flexDirection:'row', justifyContent:'space-between', marginTop: 20}}>
                        <TouchableOpacity style={[styles.actionButton, {backgroundColor:'#EF4444'}]} onPress={() => setIsEditing(false)}>
                            <Text style={styles.actionButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, {backgroundColor:'#10B981'}]} onPress={handleSave}>
                            <Text style={styles.actionButtonText}>Guardar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>

        {/* TRABAJOS SOLICITADOS */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trabajos Solicitados ({myRequests.length})</Text>
            {myRequests.length === 0 ? (
                <Text style={{color:'#999', fontStyle:'italic'}}>No has solicitado trabajos aún.</Text>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop: 10}}>
                    {myRequests.map((item) => (
                        <View key={item.id} style={styles.activityCard}>
                            <Image source={{ uri: (item.images && item.images[0]) || 'https://via.placeholder.com/150' }} style={styles.activityImage} />
                            <View style={styles.activityInfo}>
                                <Text style={styles.activityTitle} numberOfLines={1}>{item.title}</Text>
                                <Text style={styles.activityDate}>{item.date}</Text>
                                <View style={[styles.statusBadge, {backgroundColor: item.status === 'Abierto' ? '#DBEAFE' : '#DCFCE7'}]}>
                                    <Text style={[styles.statusText, {color: item.status === 'Abierto' ? '#2563EB' : '#16A34A'}]}>{item.status}</Text>
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
                <Text style={{color:'#999', fontStyle:'italic'}}>No has contratado a nadie aún.</Text>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop: 10}}>
                    {hiredRequests.map((item) => (
                        <View key={item.id} style={styles.activityCard}>
                            <Image source={{ uri: (item.images && item.images[0]) || 'https://via.placeholder.com/150' }} style={styles.activityImage} />
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
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                     <Image 
                                        source={{ uri: review.reviewer?.avatar || 'https://via.placeholder.com/40' }} 
                                        style={{width: 30, height: 30, borderRadius: 15, marginRight: 8}} 
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
                <View style={{flexDirection:'row', alignItems:'center'}}>
                    <View style={[styles.iconBox, {backgroundColor:'#DBEAFE'}]}>
                        <Feather name="map-pin" size={20} color="#2563EB" />
                    </View>
                    <Text style={styles.settingText}>Mis Direcciones</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingRow}>
                <View style={{flexDirection:'row', alignItems:'center'}}>
                    <View style={[styles.iconBox, {backgroundColor:'#FEF3C7'}]}>
                        <Feather name="credit-card" size={20} color="#D97706" />
                    </View>
                    <Text style={styles.settingText}>Métodos de Pago</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingRow}>
                <View style={{flexDirection:'row', alignItems:'center'}}>
                    <View style={[styles.iconBox, {backgroundColor:'#E0E7FF'}]}>
                        <Feather name="bell" size={20} color="#4F46E5" />
                    </View>
                    <Text style={styles.settingText}>Notificaciones</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
        </View>

        {onSwitchMode && user.role === 'professional' && (
            <TouchableOpacity 
                onPress={() => {
                    onSwitchMode('pro');
                    onBack();
                }} 
                style={[styles.logoutButton, { backgroundColor: '#2563EB', marginTop: 20 }]}
            >
                <Text style={[styles.logoutText, { color: 'white' }]}>Cambiar a Perfil Profesional</Text>
            </TouchableOpacity>
        )}

        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleClearChats} style={[styles.logoutButton, { marginTop: 5 }]}>
            <Text style={[styles.logoutText, { color: '#999', fontSize: 12 }]}>Borrar Chats (Dev)</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    paddingHorizontal: 20,
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
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginRight: 16,
    width: 200,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
