import { Feather } from '@expo/vector-icons';
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

// Colores del tema (Naranjas y oscuros)
const THEME = {
  primary: '#FF8C00', // Naranja oscuro
  secondary: '#FFA500', // Naranja claro
  background: '#F9F9F9',
  text: '#333',
  white: '#FFF'
};

// --- DATA MOCKUP PARA EL HOME (Temporal, luego vendrá de API) ---
const POPULAR_CATEGORIES = [
  { id: 1, title: 'Plomería' },
  { id: 2, title: 'Electricidad' },
  { id: 3, title: 'Limpieza' },
  { id: 4, title: 'Aire Acond.' },
];

const BLOG_POSTS = [
  { id: 1, title: '5 Tips para ahorrar agua en casa' },
  { id: 2, title: 'Mantenimiento de aires acondicionados' },
];

export default function CreateRequestScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [category, setCategory] = useState(null); // Objeto categoría completo
  const [subcategory, setSubcategory] = useState(null); // String subcategoría seleccionada
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats);
    } catch (e) {
      console.warn("Error loading categories", e);
    }
  };

  // --- LÓGICA DE CÁMARA ---
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaType.All, quality: 1 });
    if (!result.canceled) setImages([...images, result.assets[0].uri]);
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) return alert("Se requiere permiso de cámara.");
    let result = await ImagePicker.launchCameraAsync();
    if (!result.canceled) setImages([...images, result.assets[0].uri]);
  };

  const handleRequest = async () => {
    if (!title.trim()) return Alert.alert('Faltan datos', 'Por favor ingresa un título breve.');
    if (!location.trim()) return Alert.alert('Faltan datos', 'Por favor ingresa la ubicación.');
    if (!description.trim()) return Alert.alert('Faltan datos', 'Por favor describe tu problema antes de enviar.');
    if (!category) return Alert.alert('Faltan datos', 'Por favor selecciona una categoría.');

    setLoading(true);
    try {
      // Crear objeto de solicitud para el backend
      const jobData = {
        title: title.trim(),
        description: description.trim(),
        categoryId: category._id,
        category: category._id,
        subcategory: subcategory || 'General',
        location: location.trim(),
        budget: budget ? parseFloat(budget) : 0,
        images: images // Nota: Esto enviará URIs locales, para producción se deben subir primero
      };

      await api.createJob(jobData);

      Alert.alert('Éxito', 'Solicitud creada correctamente', [
        { text: 'OK', onPress: () => navigation.navigate('MyRequests') }
      ]);

      // Limpiar formulario
      setDescription('');
      setImages([]);
      setCategory(null);
      setSubcategory(null);
    } catch (err) {
      console.error(err);
      // EXTRA DEBUG
      console.log('Error creando solicitud:', JSON.stringify(err, null, 2));
      const errorMsg = err.message || JSON.stringify(err) || 'Error desconocido';

      let friendlyError = errorMsg;
      if (errorMsg.includes('Network request failed')) {
        friendlyError = 'Error de conexión: El servidor tardó en responder. Es posible que la imagen sea muy pesada o el internet lento. Intente de nuevo sin imágenes o con la conexión WiFi.';
      }

      Alert.alert('Error', friendlyError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* 1. HEADER SUPERIOR */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.roleButton} onPress={() => navigation.navigate('ProfessionalJob')}>
            <Text style={styles.roleButtonText}>Cambiar a Profesional</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Ingresar 👤</Text>
          </TouchableOpacity>
        </View>

        {/* 2. HERO SECTION */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>¿Qué necesitas resolver hoy?</Text>
          <Text style={styles.heroSubtitle}>Cuéntanos tu caso, recibe ofertas de expertos en tu zona y elige al mejor.</Text>

          <Text style={styles.label}>Resumen breve</Text>
          <TextInput
            style={styles.textInputSimple}
            placeholder="Ej: Fisioterapia a domicilio para dolor lumbar"
            value={title}
            onChangeText={setTitle}
            maxLength={60}
          />

          <Text style={styles.label}>¿Dónde necesitas el servicio?</Text>
          <TextInput
            style={styles.textInputSimple}
            placeholder="Ej. Tu urbanización, barrio o punto de referencia"
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.label}>Presupuesto (Opcional):</Text>
          <TextInput
            style={styles.textInputSimple}
            placeholder="Ej: 50000"
            value={budget}
            onChangeText={setBudget}
            keyboardType="numeric"
          />


          <View style={styles.cardForm}>
            {/* Selector de Categoría */}
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Categoría:</Text>
              <TouchableOpacity
                style={styles.fakeDropdown}
                onPress={() => setShowCategoryModal(true)}
              >
                <Text style={{ color: category ? '#000' : '#555' }}>
                  {category ? category.name : 'Seleccionar servicio... ▼'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Selector de Subcategoría (Solo si hay categoría y tiene subcategorías) */}
            {category && category.subcategories && category.subcategories.length > 0 && (
              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Especialidad:</Text>
                <TouchableOpacity
                  style={styles.fakeDropdown}
                  onPress={() => setShowSubcategoryModal(true)}
                >
                  <Text style={{ color: subcategory ? '#000' : '#555' }}>
                    {subcategory ? subcategory : 'Seleccionar especialidad... ▼'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Modal de Categorías */}
            <Modal visible={showCategoryModal} animationType="slide" transparent={true}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Selecciona una categoría</Text>
                    <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                      <Feather name="x" size={24} color="#333" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView>
                    {categories.map(cat => (
                      <TouchableOpacity
                        key={cat._id}
                        style={styles.modalItem}
                        onPress={() => {
                          setCategory(cat);
                          setSubcategory(null); // Reset subcategory
                          setShowCategoryModal(false);
                        }}
                      >
                        <Text style={styles.modalItemText}>{cat.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </Modal>

            {/* Modal de Subcategorías */}
            <Modal visible={showSubcategoryModal} animationType="slide" transparent={true}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Selecciona una especialidad</Text>
                    <TouchableOpacity onPress={() => setShowSubcategoryModal(false)}>
                      <Feather name="x" size={24} color="#333" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView>
                    {category?.subcategories?.map((sub, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.modalItem}
                        onPress={() => {
                          setSubcategory(sub);
                          setShowSubcategoryModal(false);
                        }}
                      >
                        <Text style={styles.modalItemText}>{sub}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </Modal>

            <Text style={styles.label}>Detalles del servicio</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Danos más contexto para una mejor cotización: ¿Horarios preferidos? ¿Síntomas? ¿Marca del equipo?"
              multiline
              value={description}
              onChangeText={setDescription}
            />

            <Text style={styles.label}>Agrega fotos y videos:</Text>
            <View style={styles.mediaRow}>
              <TouchableOpacity style={styles.mediaBtn} onPress={pickImage}><Text>🖼️ Galería</Text></TouchableOpacity>
              <TouchableOpacity style={styles.mediaBtn} onPress={takePhoto}><Text>📷 Cámara</Text></TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {images.map((img, i) => <Image key={i} source={{ uri: img }} style={styles.thumb} />)}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && { backgroundColor: '#ccc' }]}
              onPress={handleRequest}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitBtnText}>SOLICITAR PRESUPUESTO</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. CATEGORÍAS POPULARES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lo más buscado</Text>
          <View style={styles.tagsContainer}>
            {POPULAR_CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat.id} style={styles.tagBadge}>
                <Text style={styles.tagText}>{cat.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 4. CÓMO FUNCIONA */}
        <View style={[styles.section, styles.howItWorksBg]}>
          <Text style={styles.sectionTitle}>¿Cómo funciona?</Text>
          <View style={styles.stepsContainer}>
            <View style={styles.step}>
              <Text style={styles.stepIcon}>📝</Text>
              <Text style={styles.stepTitle}>1. Solicitas</Text>
              <Text style={styles.stepDesc}>Describe tu problema</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepIcon}>💬</Text>
              <Text style={styles.stepTitle}>2. Recibes</Text>
              <Text style={styles.stepDesc}>Ofertas rápidas</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepIcon}>🤝</Text>
              <Text style={styles.stepTitle}>3. Contratas</Text>
              <Text style={styles.stepDesc}>Eliges al mejor</Text>
            </View>
          </View>
        </View>

        {/* 5. BLOG / NOTICIAS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consejos para el hogar</Text>
          {BLOG_POSTS.map((post) => (
            <View key={post.id} style={styles.blogCard}>
              <View style={styles.blogImagePlaceholder} />
              <View style={styles.blogContent}>
                <Text style={styles.blogTitle}>{post.title}</Text>
                <Text style={styles.readMore}>Leer más...</Text>
              </View>
            </View>
          ))}
        </View>

      </InputSimple: {
        borderWidth: 2,
      borderColor: '#000',
      borderRadius: 8,
      padding: 10,
      marginBottom: 15,
      backgroundColor: '#fff',
      color: '#000',
      fontSize: 16
  },
  textScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, alignItems: 'center', backgroundColor: '#fff', elevation: 2 },
  roleButton: { padding: 8, backgroundColor: '#eee', borderRadius: 20 },
  roleButtonText: { fontSize: 12, color: '#333' },
  loginButton: { padding: 8 },
  loginText: { fontWeight: 'bold', color: THEME.primary },
  heroSection: { backgroundColor: THEME.primary, padding: 20, paddingBottom: 40, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  heroTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 5 },
  heroSubtitle: { color: '#fff', textAlign: 'center', marginBottom: 20, opacity: 0.9 },
  cardForm: { backgroundColor: '#fff', borderRadius: 15, padding: 20, elevation: 5 },
  label: { fontWeight: 'bold', marginBottom: 5, color: '#444' },
  pickerContainer: { marginBottom: 15 },
  fakeDropdown: {
    borderWidth: 2,
    borderColor: '#000',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  textArea: {
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 8,
    padding: 10,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
    backgroundColor: '#fff',
    color: '#000',
    fontSize: 16
  },
  mediaRow: { flexDirection: 'row', marginBottom: 10 },
  mediaBtn: { marginRight: 10, padding: 8, backgroundColor: '#eee', borderRadius: 5 },
  thumb: { width: 60, height: 60, borderRadius: 5, marginRight: 5, marginTop: 5 },
  submitBtn: { backgroundColor: THEME.secondary, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  tagBadge: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
  tagText: { color: '#555' },
  howItWorksBg: { backgroundColor: '#fff', marginTop: 10 },
  stepsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  step: { alignItems: 'center', flex: 1 },
  stepIcon: { fontSize: 30, marginBottom: 5 },
  stepTitle: { fontWeight: 'bold', fontSize: 14 },
  stepDesc: { fontSize: 12, color: '#666', textAlign: 'center' },
  blogCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden', marginBottom: 15, elevation: 1 },
  blogImagePlaceholder: { width: 80, height: '100%', backgroundColor: '#ddd' },
  blogContent: { padding: 10, flex: 1 },
  blogTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 5 },
  readMore: { color: THEME.primary, fontSize: 12 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', paddingBottom: 20 },
  modalHeader: { padding: 15, borderBottomWidth: 1, borderColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalItem: { padding: 15, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  modalItemText: { fontSize: 16, color: '#333' }
});