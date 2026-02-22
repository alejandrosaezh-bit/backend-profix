import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CustomDropdown = ({ label, value, options, onSelect, placeholder }) => {
    const [modalVisible, setModalVisible] = useState(false);
    return (
        <View style={{ marginBottom: 16 }}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity style={styles.pickerContainer} onPress={() => setModalVisible(true)}>
                <Text style={[styles.input, { color: value ? '#1F2937' : '#9CA3AF' }]}>{value || placeholder}</Text>
                <Feather name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
            <Modal visible={modalVisible} transparent={true} animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, maxHeight: '80%', elevation: 5 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>{label || 'Selecciona'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 5 }}>
                                <Feather name="x" size={24} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ marginBottom: 10 }}>
                            {options.map((item, index) => (
                                <TouchableOpacity key={index} style={{ paddingVertical: 15, borderBottomWidth: 1, borderColor: '#F3F4F6' }} onPress={() => { onSelect(item); setModalVisible(false); }}>
                                    <Text style={{ fontSize: 16, color: '#374151' }}>{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    label: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
    pickerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: '#9CA3AF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 4,
        minHeight: 48,
        alignItems: 'center'
    },
    input: {
        fontSize: 15,
        color: '#111827'
    }
});

export default CustomDropdown;
