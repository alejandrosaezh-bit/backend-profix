import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ClientQuoteView = ({ quote, professional }) => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>¡Oferta Recibida!</Text>

      {/* Tarjeta del Profesional */}
      <View style={styles.proCard}>
        <Image source={{ uri: professional.avatar }} style={styles.proAvatar} />
        <Text style={styles.proName}>{professional.name}</Text>
        <Text style={styles.proTitle}>{professional.title}</Text>
        
        {/* Estadísticas Clave */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>⭐ {professional.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{professional.completedJobs}</Text>
            <Text style={styles.statLabel}>Trabajos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>99%</Text>
            <Text style={styles.statLabel}>Puntual</Text>
          </View>
        </View>
        <TouchableOpacity>
            <Text style={styles.link}>Ver opiniones de otros clientes</Text>
        </TouchableOpacity>
      </View>

      {/* Detalles del Presupuesto */}
      <View style={styles.quoteContainer}>
        <View style={styles.quoteHeader}>
          <Text style={styles.quoteLabel}>Presupuesto Total</Text>
          <Text style={styles.priceTag}>${quote.price}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <Text style={styles.detailItem}>⏳ Tiempo estimado: <Text style={styles.bold}>{quote.timeEstimate}</Text></Text>
        <Text style={styles.detailItem}>📝 Nota: {quote.message}</Text>
      </View>

      {/* Botones de Acción */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.chatButton} onPress={() => Alert.alert("Chat", "Abriendo chat con el profesional...")}>
          <Text style={styles.btnTextSec}>💬 Chatear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptButton} onPress={() => Alert.alert("Felicidades", "Has contratado al profesional.")}>
          <Text style={styles.btnTextPri}>Aceptar Oferta</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#111' },
  
  proCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  proAvatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 10, borderWidth: 3, borderColor: '#fff' },
  proName: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  proTitle: { fontSize: 14, color: '#666', marginBottom: 15 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15, paddingHorizontal: 10 },
  statItem: { alignItems: 'center' },
  statNum: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  statLabel: { fontSize: 12, color: '#888' },
  link: { color: '#007AFF', marginTop: 10 },

  quoteContainer: { backgroundColor: '#E3F2FD', borderRadius: 16, padding: 20, marginBottom: 25, borderLeftWidth: 6, borderLeftColor: '#2196F3' },
  quoteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quoteLabel: { fontSize: 16, color: '#0D47A1' },
  priceTag: { fontSize: 28, fontWeight: 'bold', color: '#0D47A1' },
  divider: { height: 1, backgroundColor: '#BBDEFB', marginVertical: 10 },
  detailItem: { fontSize: 16, marginBottom: 8, color: '#333' },
  bold: { fontWeight: 'bold' },

  actions: { flexDirection: 'row', gap: 15 },
  chatButton: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  acceptButton: { flex: 1, backgroundColor: '#007AFF', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnTextPri: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  btnTextSec: { color: '#333', fontWeight: 'bold', fontSize: 16 },
});

export default ClientQuoteView;