import { Briefcase, Hammer } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Header({ userMode, toggleMode }: { userMode: 'client' | 'professional'; toggleMode: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={[styles.logoIcon, { backgroundColor: userMode === 'client' ? '#F97316' : '#2563EB' }]}>
          {userMode === 'client' ? <Hammer color="white" size={18} /> : <Briefcase color="white" size={18} />}
        </View>
        <Text style={styles.logoText}>
          <Text style={{ color: '#2563EB' }}>Profesional</Text>{' '}
          <Text style={{ color: '#EA580C' }}>Cercano</Text>
        </Text>
      </View>
      <TouchableOpacity style={styles.modeButton} onPress={toggleMode}>
        <Text style={styles.modeButtonText}>{userMode === 'client' ? 'Modo Cliente' : 'Soy Pro'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: { padding: 6, borderRadius: 8, marginRight: 8 },
  logoText: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  modeButton: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#F3F4F6', borderRadius: 20 },
  modeButtonText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
});