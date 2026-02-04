import { Home, List, User } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BottomNav({ view, setView, userMode }) {
  return (
    <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setView('home')}>
            <Home size={24} color={view === 'home' ? (userMode==='client'?'#EA580C':'#2563EB') : '#9CA3AF'} />
            <Text style={[styles.navText, view === 'home' && {color: userMode==='client'?'#EA580C':'#2563EB'}]}>Inicio</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => setView('my-requests')}>
            <List size={24} color={view === 'my-requests' ? (userMode==='client'?'#EA580C':'#2563EB') : '#9CA3AF'} />
            <Text style={[styles.navText, view === 'my-requests' && {color: userMode==='client'?'#EA580C':'#2563EB'}]}>Pedidos</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => setView('profile')}>
            <User size={24} color={view === 'profile' ? (userMode==='client'?'#EA580C':'#2563EB') : '#9CA3AF'} />
            <Text style={[styles.navText, view === 'profile' && {color: userMode==='client'?'#EA580C':'#2563EB'}]}>Perfil</Text>
        </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: 'white', 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    paddingTop: 12,
    paddingBottom: Platform.OS === 'android' ? 20 : 30, 
    borderTopWidth: 1, 
    borderTopColor: '#E5E7EB', 
    elevation: 20, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  navItem: { 
    alignItems: 'center',
    paddingHorizontal: 10
  },
  navText: { 
    fontSize: 10, 
    color: '#9CA3AF', 
    marginTop: 4, 
    fontWeight: '500' 
  },
});