import { useState } from 'react';
import { Button, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';

// Importamos las pantallas que acabas de crear
import ClientQuoteView from './src/screens/ClientQuoteView';
import CreateRequestScreen from './src/screens/CreateRequestScreen';
import ProfessionalJobView from './src/screens/ProfessionalJobView';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('CreateRequest');

  // --- DATOS DE PRUEBA (MOCK DATA) ---
  const mockClient = {
    name: "Alejandro",
    rating: 5.0,
    jobsCount: 12,
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
  };

  const mockPro = {
    name: "Taller Especializado",
    title: "Mecánica BMW y Toyota",
    rating: 4.9,
    completedJobs: 215,
    avatar: 'https://randomuser.me/api/portraits/men/85.jpg'
  };

  const mockRequest = {
    category: 'mecanica',
    description: "Tengo un ruido en la transmisión al pasar de 80km/h en mi X5.",
    media: ['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8Xf21rM7n7u9WvX6a6y2r2a5c4d3e3f2g1h&s'] // Foto simulada
  };

  const mockQuote = {
    price: 180,
    timeEstimate: "1 día hábil",
    message: "Incluye revisión de fluidos y diagnóstico por escáner."
  };

  // --- RENDERIZADOR ---
  const renderContent = () => {
    switch (currentScreen) {
      case 'CreateRequest':
        return <CreateRequestScreen />;
      case 'ProfessionalView':
        return <ProfessionalJobView requestData={mockRequest} clientProfile={mockClient} />;
      case 'ClientQuote':
        return <ClientQuoteView quote={mockQuote} professional={mockPro} />;
      default:
        return <Text>Pantalla no encontrada</Text>;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Menú Temporal para probar (Solo desarrollador) */}
      <View style={styles.devMenu}>
        <Text style={styles.devTitle}>MODO DESARROLLADOR</Text>
        <View style={styles.btnRow}>
          <Button title="1. Cliente Crea" onPress={() => setCurrentScreen('CreateRequest')} />
          <Button title="2. Pro Ve" onPress={() => setCurrentScreen('ProfessionalView')} />
          <Button title="3. Cliente Recibe" onPress={() => setCurrentScreen('ClientQuote')} />
        </View>
      </View>

      {/* Pantalla Activa */}
      <View style={styles.screenContainer}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  devMenu: { backgroundColor: '#333', padding: 10, alignItems: 'center' },
  devTitle: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  btnRow: { flexDirection: 'row', gap: 10 },
  screenContainer: { flex: 1 }
});