import { CheckCircle, ChevronDown, ChevronRight, ChevronUp, Crosshair, MapPin } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ServiceForm({ onSubmit, categoriesData }) {
  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    title: '',
    description: '',
    location: ''
  });
  
  const [isLocating, setIsLocating] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSubcategoryDropdown, setShowSubcategoryDropdown] = useState(false);

  const categoriesList = Object.keys(categoriesData);
  const subcategoriesList = formData.category ? categoriesData[formData.category] : [];

  const handleGetLocation = () => {
      setIsLocating(true);
      setFormData({ ...formData, location: "Buscando..." }); 
      setTimeout(() => {
          setIsLocating(false);
          setFormData({ ...formData, location: "Caracas, Baruta, El Cafetal" });
      }, 1500);
  };

  const handleSend = () => {
      if(!formData.category || !formData.title) {
          Alert.alert("Faltan datos", "Por favor selecciona una categoría y describe tu problema.");
          return;
      }
      onSubmit(formData);
  };

  const selectCategory = (cat) => {
      setFormData({...formData, category: cat, subcategory: ''});
      setShowCategoryDropdown(false);
  };

  const selectSubcategory = (sub) => {
      setFormData({...formData, subcategory: sub});
      setShowSubcategoryDropdown(false);
  };

  return (
    <View style={styles.heroCard}>
      <View style={styles.heroHeader}>
        <Text style={styles.heroTitle}>¿Qué necesitas reparar?</Text>
        <Text style={styles.heroSubtitle}>Describe tu problema y recibe presupuestos.</Text>
      </View>
      
      <View style={styles.formContainer}>
        {/* CATEGORÍA */}
        <View style={styles.inputGroup}>
            <Text style={styles.label}>CATEGORÍA</Text>
            <TouchableOpacity 
                style={[styles.dropdownTrigger, showCategoryDropdown && styles.dropdownTriggerActive]} 
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
            >
                <Text style={[styles.dropdownText, !formData.category && {color: '#9CA3AF'}]}>
                    {formData.category || "Selecciona una categoría..."}
                </Text>
                {showCategoryDropdown ? <ChevronUp size={20} color="#EA580C"/> : <ChevronDown size={20} color="#6B7280"/>}
            </TouchableOpacity>
            
            {showCategoryDropdown && (
                <View style={styles.dropdownList}>
                    {categoriesList.map((cat, index) => (
                        <TouchableOpacity key={index} style={styles.dropdownItem} onPress={() => selectCategory(cat)}>
                            <Text style={styles.dropdownItemText}>{cat}</Text>
                            {formData.category === cat && <CheckCircle size={16} color="#EA580C"/>}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>

        {/* SUBCATEGORÍA */}
        {formData.category && (
             <View style={styles.inputGroup}>
                <Text style={styles.label}>TIPO DE SERVICIO</Text>
                <TouchableOpacity 
                    style={styles.dropdownTrigger} 
                    onPress={() => setShowSubcategoryDropdown(!showSubcategoryDropdown)}
                >
                    <Text style={[styles.dropdownText, !formData.subcategory && {color: '#9CA3AF'}]}>
                        {formData.subcategory || `Selecciona en ${formData.category}...`}
                    </Text>
                    {showSubcategoryDropdown ? <ChevronUp size={20} color="#EA580C"/> : <ChevronDown size={20} color="#6B7280"/>}
                </TouchableOpacity>

                {showSubcategoryDropdown && (
                    <View style={styles.dropdownList}>
                        <ScrollView style={{maxHeight: 200}} nestedScrollEnabled={true}>
                            {subcategoriesList.map((sub, index) => (
                                <TouchableOpacity key={index} style={styles.dropdownItem} onPress={() => selectSubcategory(sub)}>
                                    <Text style={styles.dropdownItemText}>{sub}</Text>
                                    {formData.subcategory === sub && <CheckCircle size={16} color="#EA580C"/>}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>
        )}

        {/* TÍTULO */}
        <View style={styles.inputGroup}>
            <Text style={styles.label}>TÍTULO DEL PROBLEMA</Text>
            <View style={styles.inputWrapper}>
                <TextInput 
                    style={styles.input} 
                    placeholder="Ej. Aire no enfría" 
                    value={formData.title} 
                    onChangeText={t => setFormData({...formData, title: t})} 
                />
            </View>
        </View>
        
        {/* UBICACIÓN */}
        <View style={styles.inputGroup}>
            <Text style={styles.label}>UBICACIÓN</Text>
            <View style={styles.inputWrapper}>
                <MapPin size={18} color="#9CA3AF" style={{marginRight: 8}} />
                <TextInput 
                    style={styles.input} 
                    placeholder="Ej. Caracas, Baruta" 
                    value={formData.location} 
                    onChangeText={t => setFormData({...formData, location: t})} 
                />
                <TouchableOpacity onPress={handleGetLocation} style={{padding: 4}}>
                    {isLocating ? <ActivityIndicator size="small" color="#EA580C" /> : <Crosshair size={20} color="#2563EB" />}
                </TouchableOpacity>
            </View>
        </View>

        <TouchableOpacity style={styles.searchButton} onPress={handleSend}>
            <Text style={styles.searchButtonText}>Solicitar Presupuesto</Text>
            <ChevronRight color="white" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: { backgroundColor: 'white', borderRadius: 20, overflow: 'hidden', marginBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  heroHeader: { backgroundColor: '#EA580C', padding: 20 },
  heroTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  heroSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 4 },
  formContainer: { padding: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 10, fontWeight: 'bold', color: '#6B7280', marginBottom: 6, letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, height: 48 },
  input: { flex: 1, fontSize: 14, color: '#1F2937' },
  dropdownTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, height: 48 },
  dropdownTriggerActive: { borderColor: '#F97316', backgroundColor: '#FFF7ED' },
  dropdownText: { fontSize: 14, color: '#1F2937' },
  dropdownList: { marginTop: 4, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 8, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1 },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', justifyContent: 'space-between' },
  dropdownItemText: { fontSize: 14, color: '#374151' },
  searchButton: { backgroundColor: '#111827', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, marginTop: 8 },
  searchButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginRight: 8 },
});