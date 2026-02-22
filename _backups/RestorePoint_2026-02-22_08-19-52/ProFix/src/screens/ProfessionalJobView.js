import { useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ProfessionalJobView = ({ requestData, clientProfile }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [price, setPrice] = useState('');
  const [time, setTime] = useState('');

  const sendQuote = () => {
    if (!price || !time) return Alert.alert("Faltan datos", "Ingresa precio y tiempo.");
    setModalVisible(false);
    Alert.alert("¡Enviado!", "El cliente ha recibido tu presupuesto.");
  };

  return (
    <View style={{flex: 1}}>
      <ScrollView style={styles.container}>
        
        {/* 1. Perfil del Cliente */}
        <View style={styles.profileCard}>
          <Image source={{ uri: clientProfile.avatar }} style={styles.avatar} />
          <View>
            <Text style={styles.clientName}>{clientProfile.name}</Text>
            <Text style={styles.stats}>⭐ {clientProfile.rating} • {clientProfile.jobsCount} Trabajos previos</Text>
            <Text style={styles.verified}>Verificado ✅</Text>
          </View>
        </View>

        {/* 2. Detalle del Problema */}
        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Solicitud:</Text>
          <Text style={styles.descText}>{requestData.description}</Text>
          
          <Text style={styles.sectionTitle}>Fotos/Videos:</Text>
          <ScrollView horizontal>
            {requestData.media.map((img, i) => (
              <Image key={i} source={{ uri: img }} style={styles.evidenceImg} />
            ))}
          </ScrollView>
        </View>

        <View style={{height: 100}} /> 
      </ScrollView>

      {/* 3. Barra de Acciones Fija Abajo */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.chatBtn} onPress={() => Alert.alert("Chat", "Iniciando chat para aclarar dudas...")}>
          <Text style={styles.chatText}>💬 Preguntar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quoteBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.quoteText}>📄 Enviar Presupuesto</Text>
        </TouchableOpacity>
      </View>

      {/* Modal para Cotizar */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Crear Presupuesto</Text>
            
            <Text style={styles.label}>Precio Total ($)</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholder="0.00" value={price} onChangeText={setPrice} />
            
            <Text style={styles.label}>Tiempo estimado</Text>
            <TextInput style={styles.input} placeholder="Ej: 2 días, 4 horas..." value={time} onChangeText={setTime} />

            <TouchableOpacity style={styles.submitBtn} onPress={sendQuote}>
              <Text style={styles.submitText}>Enviar Oferta</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15 },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  clientName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  stats: { color: '#666', marginTop: 4 },
  verified: { color: 'green', fontSize: 12, marginTop: 4, fontWeight: 'bold' },
  
  detailCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
  descText: { fontSize: 16, lineHeight: 24, color: '#444', marginBottom: 15 },
  evidenceImg: { width: 150, height: 100, borderRadius: 8, marginRight: 10, backgroundColor: '#eee' },

  actionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderTopWidth: 1, borderColor: '#eee' },
  chatBtn: { flex: 1, backgroundColor: '#E0E0E0', padding: 15, borderRadius: 10, marginRight: 10, alignItems: 'center' },
  quoteBtn: { flex: 1, backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center' },
  chatText: { color: '#333', fontWeight: 'bold' },
  quoteText: { color: '#fff', fontWeight: 'bold' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 25, borderRadius: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#555' },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
  submitBtn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelText: { textAlign: 'center', marginTop: 15, color: 'red', fontSize: 16 }
});

export default ProfessionalJobView;