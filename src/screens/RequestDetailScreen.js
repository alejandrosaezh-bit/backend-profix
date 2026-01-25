import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../utils/api';

// --- COMPONENTS ---
const CustomDropdown = ({ label, value, options, onSelect, placeholder }) => {
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity style={styles.pickerContainer} onPress={() => setModalVisible(true)}>
        <Text style={[styles.input, { color: value ? '#1F2937' : '#9CA3AF' }]}>{value || placeholder}</Text>
        <Feather name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Selecciona'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 5 }}>
                <Feather name="x" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginBottom: 10 }}>
              {options.map((item, index) => (
                <TouchableOpacity key={index} style={styles.modalOption} onPress={() => { onSelect(item); setModalVisible(false); }}>
                  <Text style={styles.modalOptionText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default function RequestDetailScreen({ route, navigation }) {
  const { item } = route.params || { item: {} };
  const [data, setData] = useState(item);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dynamic Categories State
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    setData(item);
    loadCategories();
  }, [item]);

  // Refresh job details when returning to this screen (e.g., after creating/updating an offer)
  useEffect(() => {
    const refreshJob = async () => {
      try {
        const refreshed = await api.getJob(data._id || data.id);
        setData(refreshed);
      } catch (e) {
        console.warn('Error refreshing job details', e);
      }
    };
    const unsubscribe = navigation.addListener('focus', refreshJob);
    return unsubscribe;
  }, [navigation, data._id, data.id]);

  const loadCategories = async () => {
    try {
      const list = await api.getCategories();
      if (Array.isArray(list)) {
        setCategories(list);
      }
    } catch (e) {
      console.warn("Error loading categories", e);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Ensure category is sent as ID or Name (String), never Object
      let catValue = data.category;
      if (typeof data.category === 'object' && data.category !== null) {
        // Prefer ID if available (from populated object), else Name
        catValue = data.category._id || data.category.name;
      }

      const updated = await api.updateJob(data._id || data.id, {
        title: data.title,
        description: data.description,
        category: catValue,
        subcategory: data.subcategory,
        location: data.location,
        images: data.images
      });
      // Refetch full job data to get latest offers and other fields
      const refreshed = await api.getJob(data._id || data.id);
      setData(refreshed);
      setIsEditing(false);
      Alert.alert("Éxito", "Solicitud actualizada correctamente.");
    } catch (e) {
      Alert.alert("Error", "No se pudo actualizar: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Eliminar Solicitud", "¿Seguro que deseas ELIMINAR definitivamente esta solicitud? Esta acción no se puede deshacer.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sí, eliminar", style: 'destructive', onPress: async () => {
          try {
            setLoading(true);
            await api.deleteJob(data._id || data.id);
            Alert.alert("Eliminado", "La solicitud ha sido eliminada.");
            navigation.goBack();
          } catch (e) {
            Alert.alert("Error", "No se pudo eliminar: " + e.message);
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  const handleDeleteOffer = (offerId) => {
    Alert.alert("Eliminar Oferta", "¿Seguro que deseas eliminar esta oferta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sí, eliminar", style: 'destructive', onPress: async () => {
          try {
            setLoading(true);
            await api.deleteOffer(data._id || data.id, offerId);
            const newOffers = (data.offers || []).filter(o => o._id !== offerId);
            setData({ ...data, offers: newOffers });
            Alert.alert("Éxito", "Oferta eliminada.");
          } catch (e) {
            Alert.alert("Error", "No se pudo eliminar oferta: " + e.message);
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permiso requerido", "Se requiere acceso a la cámara.");
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true,
      allowsEditing: true,
    });
    if (!result.canceled) {
      const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
      const newImages = [...(data.images || []), base64Img];
      setData({ ...data, images: newImages });
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permiso requerido", "Se requiere acceso a la galería.");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled) {
      const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
      const newImages = [...(data.images || []), base64Img];
      setData({ ...data, images: newImages });
    }
  };

  const handleAddImage = () => {
    Alert.alert("Agregar Foto", "Selecciona una opción", [
      { text: "Cancelar", style: "cancel" },
      { text: "Cámara", onPress: takePhoto },
      { text: "Galería", onPress: pickImage }
    ]);
  };

  const handleValidate = () => {
    Alert.alert("Validar Trabajo", "¿Confirmas que el trabajo ha sido realizado correctamente? Esto habilitará la opción para calificar al profesional.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sí, validar", onPress: async () => {
          try {
            setLoading(true);
            await api.finishJob(data._id || data.id);
            Alert.alert("Trabajo Validado", "Ahora puedes calificar al profesional.");
            // Refresh
            const refreshed = await api.getJob(data._id || data.id);
            setData(refreshed);
          } catch (e) {
            Alert.alert("Error", "No se pudo validar: " + e.message);
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  // Helper to find subcategories for selected category name
  const getSubcategories = () => {
    const catName = typeof data.category === 'object' ? data.category.name : data.category;
    const found = categories.find(c => c.name === catName);
    return found ? (found.subcategories || []) : [];
  };

  // Calculate offers count
  const offers = data.offers || [];

  // --- Helper Functions ---
  const getClientStatus = (request) => {
    if (!request) return 'CARGANDO';

    // 0. CANCELADA -> ELIMINADA
    if (request.status === 'canceled') return 'ELIMINADA';

    // 1. TERMINADO (Any rating exists)
    if (request.status === 'rated' || (request.rating > 0) || (request.proRating > 0)) return 'TERMINADO';

    // 2. VALORACIÓN (Both finished)
    if (request.status === 'completed' || (request.proFinished && request.clientFinished)) return 'VALORACIÓN';

    // 3. VALIDANDO (Waiting for client confirmation)
    if (request.proFinished && !request.clientFinished) return 'VALIDANDO';

    // 4. EN EJECUCIÓN (Started)
    if (request.status === 'in_progress' || request.status === 'started' || request.status === 'En Ejecución') return 'EN EJECUCIÓN';

    // 4. PRESUPUESTADA (Has active offers)
    const activeOffers = request.offers?.filter(o => o.status !== 'rejected');
    if (activeOffers && activeOffers.length > 0) return 'PRESUPUESTADA';

    // 5. CONTACTADA (Has messages but no offers yet)
    if (request.conversations && request.conversations.length > 0) return 'CONTACTADA';

    // 6. NUEVA (Default)
    return 'NUEVA';
  };

  const getStatusStyle = (statusLabel) => {
    switch (statusLabel) {
      case 'NUEVA': return { bg: '#6B7280', text: 'white' };
      case 'CONTACTADA': return { bg: '#2563EB', text: 'white' };
      case 'PRESUPUESTADA': return { bg: '#F59E0B', text: 'white' };
      case 'EN EJECUCIÓN': return { bg: '#059669', text: 'white' };
      case 'VALIDANDO': return { bg: '#F97316', text: 'white' };
      case 'VALORACIÓN': return { bg: '#8B5CF6', text: 'white' };
      case 'TERMINADO': return { bg: '#1F2937', text: 'white' };
      case 'ELIMINADA': return { bg: '#EF4444', text: 'white' };
      case 'CANCELADA': return { bg: '#EF4444', text: 'white' }; 
      default: return { bg: '#6B7280', text: 'white' };
    }
  };

  const statusLabel = getClientStatus(data);
  const statusColors = getStatusStyle(statusLabel);

  return (
    <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      {/* HEADER */}
      <View style={styles.header}>
        {isEditing ? (
          <View>
            <View style={styles.headerTopRow}>
              <Text style={styles.headerLabel}>EDITANDO</Text>
              <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>{loading ? "Guardando..." : "Guardar"}</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={data.title}
              onChangeText={t => setData({ ...data, title: t })}
              style={styles.headerTitleInput}
              placeholder="Título"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="map-pin" size={14} color="white" />
              <TextInput
                value={data.location}
                onChangeText={t => setData({ ...data, location: t })}
                style={styles.headerLocationInput}
                placeholder="Ubicación"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            </View>
          </View>
        ) : (
          <View>
            <View style={styles.headerTopRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.headerCategory}>
                  {typeof data.category === 'object' ? data.category.name : data.category} • {data.subcategory || 'General'}
                </Text>
                <Text style={styles.headerTitle} numberOfLines={1}>{data.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
                <Text style={styles.editButtonText}>Editar</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                <Text style={[styles.statusText, { color: statusColors.text }]}>{statusLabel}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                <Feather name="map-pin" size={12} color="white" />
                <Text style={styles.headerInfoText}>{data.location || 'Sin ubicación'}</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* INFO CARD */}
        <View style={styles.card}>
          {isEditing ? (
            <View>
              {categoriesLoading ? (
                <ActivityIndicator size="small" color="#EA580C" style={{ marginBottom: 10 }} />
              ) : (
                <>
                  <CustomDropdown
                    label="Categoría"
                    value={typeof data.category === 'object' ? data.category.name : data.category}
                    options={categories.map(c => c.name)}
                    onSelect={(val) => setData({ ...data, category: val, subcategory: null })}
                    placeholder="Selecciona categoría"
                  />
                  <CustomDropdown
                    label="Subcategoría"
                    value={data.subcategory}
                    options={getSubcategories()}
                    onSelect={(val) => setData({ ...data, subcategory: val })}
                    placeholder="Selecciona subcategoría"
                  />
                </>
              )}
              <Text style={styles.inputLabel}>Descripción</Text>
              <TextInput
                value={data.description}
                onChangeText={t => setData({ ...data, description: t })}
                multiline
                style={styles.textArea}
                placeholder="Descripción del problema..."
              />
            </View>
          ) : (
            <View>
              <Text style={styles.description}>{data.description}</Text>
            </View>
          )}

          {/* PHOTOS SECTION */}
          <View style={{ marginTop: 20 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>FOTOS ADJUNTAS</Text>
              {isEditing && (
                <TouchableOpacity onPress={handleAddImage} style={styles.addButton}>
                  <Feather name="plus-circle" size={16} color="#EA580C" />
                  <Text style={styles.addButtonText}>Agregar</Text>
                </TouchableOpacity>
              )}
            </View>

            {(data.images && data.images.length > 0) || isEditing ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {data.images && data.images.map((img, i) => (
                  <View key={i} style={{ position: 'relative', marginRight: 10 }}>
                    <Image source={{ uri: img }} style={styles.imageThumb} />
                    {isEditing && (
                      <TouchableOpacity
                        style={styles.deleteImageButton}
                        onPress={() => {
                          const newImages = [...data.images];
                          newImages.splice(i, 1);
                          setData({ ...data, images: newImages });
                        }}
                      >
                        <Feather name="x" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                {data.images && data.images.length === 0 && isEditing && (
                  <Text style={{ color: '#999', fontStyle: 'italic', fontSize: 12 }}>No hay fotos. Agrega una.</Text>
                )}
              </ScrollView>
            ) : (
              <Text style={{ color: '#999', fontStyle: 'italic', fontSize: 12 }}>Sin fotos adjuntas.</Text>
            )}
          </View>
        </View>

        {/* OFFERS SECTION (Only in View Mode) */}
        {!isEditing && (
          <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
            {/* VALIDATION ACTION */}
            {(statusLabel === 'VALIDANDO' || data.calculatedClientStatus === 'VALIDANDO') && (
              <TouchableOpacity onPress={handleValidate} style={{ backgroundColor: '#EA580C', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 20, elevation: 3 }}>
                <Feather name="check-circle" size={24} color="white" style={{ marginBottom: 4 }} />
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Validar Trabajo Realizado</Text>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 2 }}>El profesional ha marcado el trabajo como listo</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.bigSectionTitle}>Ofertas Recibidas ({offers.length})</Text>
            {offers.length === 0 ? (
              <View style={styles.emptyOffers}>
                <Feather name="inbox" size={32} color="#CBD5E1" />
                <Text style={{ color: '#94A3B8', marginTop: 8 }}>Aún no has recibido ofertas.</Text>
              </View>
            ) : (
              offers.map((offer, index) => (
                <View key={index} style={styles.offerCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View>
                      <Text style={styles.offerProName}>{offer.proName || 'Profesional'}</Text>
                      <Text style={styles.offerPrice}>${offer.amount}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <View style={[styles.offerStatus, { backgroundColor: offer.status === 'accepted' ? '#DCFCE7' : '#F3F4F6' }]}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: offer.status === 'accepted' ? '#166534' : '#64748B' }}>
                          {offer.status === 'accepted' ? 'ACEPTADA' : 'PENDIENTE'}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteOffer(offer._id)} style={{ marginTop: 8, padding: 4 }}>
                        <Feather name="trash-2" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.offerDesc}>{offer.description}</Text>
                  <TouchableOpacity style={styles.chatButton} onPress={() => {
                    Alert.alert("Chat", "Ve a la sección de Chats para hablar con este profesional.");
                  }}>
                    <Feather name="message-circle" size={16} color="#2563EB" />
                    <Text style={{ marginLeft: 6, color: '#2563EB', fontWeight: 'bold', fontSize: 12 }}>Contactar</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* DELETE BUTTON */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Feather name="trash-2" size={18} color="#EF4444" />
          <Text style={{ color: '#EF4444', fontWeight: 'bold', marginLeft: 8 }}>Eliminar Solicitud</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#EA580C', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 4, marginBottom: 16 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  headerLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 'bold', letterSpacing: 1 },
  headerCategory: { fontSize: 10, color: 'rgba(255,255,255,0.9)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white', lineHeight: 24 },
  headerTitleInput: { fontSize: 22, fontWeight: 'bold', color: 'white', borderBottomWidth: 1, borderColor: 'white', paddingVertical: 4, marginBottom: 10 },
  headerLocationInput: { flex: 1, marginLeft: 6, borderBottomWidth: 1, borderColor: 'white', paddingVertical: 2, fontSize: 12, color: 'white' },

  saveButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  editButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  editButtonText: { color: 'white', fontWeight: 'bold', fontSize: 10 },

  statusBadge: { backgroundColor: 'white', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginRight: 8 },
  statusText: { color: '#EA580C', fontSize: 10, fontWeight: 'bold' },
  headerInfoText: { color: 'white', fontSize: 11, marginLeft: 2 },

  card: { backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 20, elevation: 2, marginHorizontal: 20 },
  description: { color: '#374151', fontSize: 15, lineHeight: 24 },
  textArea: { color: '#374151', fontSize: 15, lineHeight: 24, minHeight: 80, textAlignVertical: 'top', borderBottomWidth: 1, borderColor: '#E5E7EB' },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#6B7280' },
  addButton: { flexDirection: 'row', alignItems: 'center' },
  addButtonText: { fontSize: 12, color: '#EA580C', marginLeft: 4, fontWeight: 'bold' },

  imageThumb: { width: 100, height: 100, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  deleteImageButton: { position: 'absolute', top: -8, right: -8, backgroundColor: 'white', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', elevation: 2 },

  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#6B7280', marginBottom: 4, marginTop: 10 },
  pickerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, backgroundColor: '#F9FAFB' },
  input: { fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 12, padding: 20, maxHeight: '80%', elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalOption: { paddingVertical: 15, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  modalOptionText: { fontSize: 16, color: '#374151' },

  bigSectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 15 },
  emptyOffers: { alignItems: 'center', padding: 20, backgroundColor: 'white', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1' },

  offerCard: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 1 },
  offerProName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  offerPrice: { fontSize: 18, fontWeight: 'bold', color: '#059669', marginVertical: 4 },
  offerDesc: { color: '#4B5563', fontSize: 14, marginBottom: 10 },
  offerStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  chatButton: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#EFF6FF', borderRadius: 8, alignSelf: 'flex-start' },

  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, marginHorizontal: 20, marginBottom: 30, backgroundColor: '#FEF2F2', borderRadius: 12, borderWidth: 1, borderColor: '#FCA5A5' }
});