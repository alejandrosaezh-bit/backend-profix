import * as ImagePicker from 'expo-image-picker';
import { Camera, ChevronDown, ChevronRight, Crosshair, ImagePlus, MapPin, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import HomeSections from '../data/HomeSections';
import { api } from '../utils/api';

// Dropdown Component interno
const CustomDropdown = ({ label, value, options, onSelect, placeholder }) => {
    const [modalVisible, setModalVisible] = useState(false);
    return (
      <View style={{ marginBottom: 16 }}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity style={styles.pickerContainer} onPress={() => setModalVisible(true)}>
          <Text style={[styles.input, { color: value ? '#1F2937' : '#9CA3AF' }]}>{value || placeholder}</Text>
          <ChevronDown size={20} color="#6B7280" />
        </TouchableOpacity>
        <Modal visible={modalVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:15}}>
                <Text style={{fontSize:18, fontWeight:'bold'}}>Selecciona una opción</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}><X size={24} color="red"/></TouchableOpacity>
              </View>
              <ScrollView style={{maxHeight: 500}}>
                {options.length === 0 && <Text style={{padding:15, color:'#666'}}>Cargando categorías...</Text>}
                {options.map((item, index) => (
                  <TouchableOpacity key={index} style={{padding: 15, borderBottomWidth: 1, borderColor: '#eee'}} onPress={() => { onSelect(item); setModalVisible(false); }}>
                    <Text style={{fontSize: 16}}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
};

export default function HomeScreen({ onSubmit, isLoggedIn, onTriggerLogin, initialCategory }) {
    const [formData, setFormData] = useState({
      category: initialCategory || '', subcategory: '', title: '', description: '', location: ''
    });
    const [images, setImages] = useState([]);
    const [isLocating, setIsLocating] = useState(false);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const loadCats = async () => {
            try {
                const cats = await api.getCategories();
                console.log("HomeScreen loaded categories:", cats.length, cats.map(c => c.name));
                setCategories(Array.isArray(cats) ? cats : []);
            } catch (e) {
                console.warn("Error loading categories in Home:", e);
                setCategories([]);
            }
        };
        loadCats();
        
        // Refresh interval to ensure categories are loaded if network was slow initially
        const interval = setInterval(loadCats, 5000);
        return () => clearInterval(interval);
    }, []);
    
    useEffect(() => {
        if(initialCategory) setFormData(prev => ({...prev, category: initialCategory}));
    }, [initialCategory]);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaType.All, quality: 1 });
        if (!result.canceled) setImages([...images, result.assets[0].uri]);
    };
    const takePhoto = async () => {
        const { granted } = await ImagePicker.requestCameraPermissionsAsync();
        if (!granted) return Alert.alert("Permiso denegado", "Necesitas dar acceso a la cámara");
        let result = await ImagePicker.launchCameraAsync();
        if (!result.canceled) setImages([...images, result.assets[0].uri]);
    };
    const handleLocateMe = () => {
        setIsLocating(true);
        setTimeout(() => {
            setIsLocating(false);
            setFormData({...formData, location: 'Caracas, Baruta (GPS)'});
        }, 1500);
    };

    const handlePreSubmit = () => {
        if(!formData.category || !formData.title || !formData.location) {
            return Alert.alert("Faltan datos", "Categoría, Título y Ubicación son obligatorios.");
        }
        if (!isLoggedIn) {
            Alert.alert("Inicia Sesión", "Para enviar tu solicitud, regístrate o inicia sesión.", [
                { text: "Cancelar" },
                { text: "Ir al Login", onPress: () => onTriggerLogin({ pendingData: { ...formData, images } }) } 
            ]);
        } else {
            onSubmit({ ...formData, images });
        }
    };

    return (
        <ScrollView style={styles.content} contentContainerStyle={{paddingBottom: 100}}>
            {/* FORMULARIO */}
            <View style={styles.heroCard}>
                <View style={styles.heroHeader}>
                    <Text style={styles.heroTitle}>Nueva Solicitud</Text>
                    <Text style={styles.heroSubtitle}>Describe tu problema para recibir ofertas.</Text>
                </View>
                <View style={styles.formContainer}>
                    <CustomDropdown 
                        label="CATEGORÍA" 
                        placeholder="Selecciona..." 
                        value={formData.category} 
                        options={categories.map(c => c.name)} 
                        onSelect={(c) => setFormData({...formData, category: c, subcategory: ''})} 
                    />
                    {formData.category && (
                        <CustomDropdown 
                            label="SUBCATEGORÍA" 
                            placeholder="Específico..." 
                            value={formData.subcategory} 
                            options={categories.find(c => c.name === formData.category)?.subcategories || []} 
                            onSelect={(s) => setFormData({...formData, subcategory: s})} 
                        />
                    )}
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>TÍTULO</Text>
                        <TextInput style={styles.inputBox} placeholder="Ej. Fuga en el baño" value={formData.title} onChangeText={t => setFormData({...formData, title: t})} />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>DESCRIPCIÓN</Text>
                        <TextInput style={[styles.inputBox, {height:80, textAlignVertical:'top'}]} multiline placeholder="Detalles..." value={formData.description} onChangeText={t => setFormData({...formData, description: t})} />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>UBICACIÓN</Text>
                        <View style={styles.inputWrapper}>
                            <MapPin size={18} color="#666" style={{marginRight:5}} />
                            <TextInput style={{flex:1}} placeholder="Ej. Caracas, Altamira" value={formData.location} onChangeText={t => setFormData({...formData, location: t})} />
                            <TouchableOpacity onPress={handleLocateMe}>
                                {isLocating ? <ActivityIndicator size="small" color="#EA580C"/> : <Crosshair size={20} color="#2563EB"/>}
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>EVIDENCIA</Text>
                        <View style={{flexDirection:'row', gap:10}}>
                            <TouchableOpacity style={styles.mediaButton} onPress={pickImage}><ImagePlus size={20} color="#4B5563" /><Text style={{marginLeft:5}}>Galería</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.mediaButton} onPress={takePhoto}><Camera size={20} color="#4B5563" /><Text style={{marginLeft:5}}>Cámara</Text></TouchableOpacity>
                        </View>
                        <ScrollView horizontal style={{marginTop:10}}>
                            {images.map((img, i) => <Image key={i} source={{uri: img}} style={{width:60, height:60, borderRadius:8, marginRight:5}} />)}
                        </ScrollView>
                    </View>
                    <TouchableOpacity style={styles.searchButton} onPress={handlePreSubmit}>
                        <Text style={styles.searchButtonText}>Pedir Presupuesto</Text>
                        <ChevronRight color="white" size={20} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* SECCIONES RECUPERADAS (BLOG, CÓMO FUNCIONA) */}
            <HomeSections onSelectCategory={(cat) => setFormData({...formData, category: cat.name})} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 15 },
  heroCard: { backgroundColor: 'white', borderRadius: 15, overflow: 'hidden', marginBottom: 20, elevation: 3 },
  heroHeader: { backgroundColor: '#EA580C', padding: 20 },
  heroTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  heroSubtitle: { color: 'rgba(255,255,255,0.9)' },
  formContainer: { padding: 20 },
  label: { fontSize: 11, fontWeight: 'bold', color: '#666', marginBottom: 5 },
  pickerContainer: { flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, backgroundColor: '#F9FAFB' },
  inputBox: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, backgroundColor: '#F9FAFB' },
  inputGroup: { marginBottom: 15 },
  inputWrapper: { flexDirection:'row', alignItems:'center', borderWidth:1, borderColor:'#ddd', borderRadius:8, paddingHorizontal:10, backgroundColor:'#F9FAFB' },
  mediaButton: { flexDirection:'row', alignItems:'center', padding:10, backgroundColor:'#eee', borderRadius:8 },
  searchButton: { backgroundColor: '#111827', flexDirection: 'row', justifyContent: 'center', padding: 15, borderRadius: 10, alignItems:'center' },
  searchButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginRight: 5 },
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  modalContent: { backgroundColor:'white', padding:25, borderTopLeftRadius:20, borderTopRightRadius:20 },
});