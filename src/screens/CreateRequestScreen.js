import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const CreateRequestScreen = () => {
  const [category, setCategory] = useState('plomeria'); // Por defecto
  const [description, setDescription] = useState('');
  const [media, setMedia] = useState([]);

  // Lógica: Textos que cambian según la categoría
  const getDynamicText = () => {
    switch (category) {
      case 'plomeria':
        return { 
          label: "¿Dónde está la fuga o avería?", 
          placeholder: "Ej: Debajo del fregadero de la cocina...", 
          alert: "Recuerda cerrar la llave de paso si es urgente." 
        };
      case 'ninera':
        return { 
          label: "¿Qué cuidados necesitan los niños?", 
          placeholder: "Ej: Dos niños de 5 y 8 años, ayuda con tareas...", 
          alert: "Indica si hay mascotas en casa." 
        };
      case 'mecanica':
        return { 
          label: "¿Qué falla presenta el vehículo?", 
          placeholder: "Ej: Ruido metálico al frenar...", 
          alert: "Indica modelo y año del carro." 
        };
      default:
        return { label: "Descripción", placeholder: "Detalles...", alert: "" };
    }
  };

  const texts = getDynamicText();

  // Función para seleccionar imágenes
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setMedia([...media, result.assets[0].uri]);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Nueva Solicitud</Text>
      
      {/* Selector de Categoría */}
      <Text style={styles.subLabel}>Selecciona el servicio:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
        <TouchableOpacity onPress={() => setCategory('plomeria')} style={[styles.catBtn, category === 'plomeria' && styles.activeBtn]}>
          <Text style={[styles.catText, category === 'plomeria' && styles.activeText]}>🔧 Plomería</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCategory('ninera')} style={[styles.catBtn, category === 'ninera' && styles.activeBtn]}>
          <Text style={[styles.catText, category === 'ninera' && styles.activeText]}>🍼 Niñera</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCategory('mecanica')} style={[styles.catBtn, category === 'mecanica' && styles.activeBtn]}>
          <Text style={[styles.catText, category === 'mecanica' && styles.activeText]}>🚗 Mecánica</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Formulario Dinámico */}
      <View style={styles.formCard}>
        <Text style={styles.label}>{texts.label}</Text>
        <TextInput 
          style={styles.inputArea} 
          multiline 
          placeholder={texts.placeholder} 
          value={description}
          onChangeText={setDescription}
        />
        <Text style={styles.helperText}>ℹ️ {texts.alert}</Text>
      </View>

      {/* Sección Multimedia */}
      <Text style={styles.label}>Fotos y Videos (Opcional)</Text>
      <ScrollView horizontal style={styles.mediaRow}>
        <TouchableOpacity style={styles.addMediaBtn} onPress={pickImage}>
          <Text style={{fontSize: 30, color: '#666'}}>+</Text>
        </TouchableOpacity>
        {media.map((uri, index) => (
          <Image key={index} source={{ uri }} style={styles.mediaThumb} />
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.mainButton} onPress={() => Alert.alert("Enviado", "Tu solicitud ha sido publicada para los profesionales.")}>
        <Text style={styles.mainButtonText}>Publicar Solicitud</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2', padding: 20 },
  header: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  subLabel: { fontSize: 16, marginBottom: 10, color: '#666' },
  catScroll: { marginBottom: 20, maxHeight: 50 },
  catBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#fff', borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#ddd' },
  activeBtn: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  catText: { color: '#333', fontWeight: '600' },
  activeText: { color: '#fff' },
  formCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
  inputArea: { height: 100, textAlignVertical: 'top', fontSize: 16, color: '#333' },
  helperText: { fontSize: 12, color: '#888', marginTop: 10, fontStyle: 'italic' },
  mediaRow: { flexDirection: 'row', marginBottom: 30 },
  addMediaBtn: { width: 80, height: 80, backgroundColor: '#e1e1e1', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  mediaThumb: { width: 80, height: 80, borderRadius: 10, marginRight: 10 },
  mainButton: { backgroundColor: '#007AFF', padding: 18, borderRadius: 12, alignItems: 'center', shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, elevation: 3 },
  mainButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default CreateRequestScreen;