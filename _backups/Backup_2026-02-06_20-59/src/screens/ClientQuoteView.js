import { Button, StyleSheet, Text, View } from 'react-native';

export default function ClientQuoteView({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Ofertas Recibidas</Text>
      
      {/* Tarjeta de ejemplo de una oferta */}
      <View style={styles.quoteCard}>
        <Text style={styles.proName}>Plomero: Juan Pérez</Text>
        <Text style={styles.price}>$45.00</Text>
        <Text>Llegada en: 30 min</Text>
        
        <View style={{marginTop: 10}}>
          <Button 
            title="Chatear con Juan" 
            onPress={() => navigation.navigate('Chat')}
          />
        </View>
      </View>

      <View style={styles.quoteCard}>
        <Text style={styles.proName}>Plomero: Reparaciones Express</Text>
        <Text style={styles.price}>$55.00</Text>
        <Text>Llegada en: 1 hora</Text>
         <View style={{marginTop: 10}}>
          <Button 
            title="Chatear con Express" 
            onPress={() => navigation.navigate('Chat')}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  quoteCard: { 
    backgroundColor: '#f9f9f9', 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#ddd' 
  },
  proName: { fontSize: 18, fontWeight: '600' },
  price: { fontSize: 18, color: 'green', fontWeight: 'bold', marginVertical: 5 }
});