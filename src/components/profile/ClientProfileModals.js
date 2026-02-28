import { Feather } from '@expo/vector-icons';
import {
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export function ClientEditProfileModal({
    visible,
    onClose,
    onSave,
    editedUser,
    setEditedUser,
    onPickImage,
}) {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.modalOverlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.modalContent}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <Text style={styles.modalTitle}>Editar Datos Personales</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Feather name="x" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={{ alignItems: 'center', marginBottom: 20 }}>
                            <TouchableOpacity onPress={onPickImage} style={{ position: 'relative' }}>
                                <Image source={{ uri: editedUser.avatar || 'https://placehold.co/150' }} style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#FFF7ED' }} />
                                <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#EA580C', padding: 6, borderRadius: 15, borderWidth: 2, borderColor: 'white' }}>
                                    <Feather name="camera" size={16} color="white" />
                                </View>
                            </TouchableOpacity>
                            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>Toca la foto para cambiarla</Text>
                        </View>

                        <Text style={[styles.label, { marginTop: 0 }]}>Nombre Completo</Text>
                        <TextInput
                            style={styles.input}
                            value={editedUser.name}
                            onChangeText={(t) => setEditedUser({ ...editedUser, name: t })}
                        />

                        <Text style={styles.label}>Correo Electrónico</Text>
                        <TextInput
                            style={styles.input}
                            value={editedUser.email}
                            onChangeText={(t) => setEditedUser({ ...editedUser, email: t })}
                            keyboardType="email-address"
                        />

                        <Text style={styles.label}>Teléfono</Text>
                        <TextInput
                            style={styles.input}
                            value={editedUser.phone || ''}
                            onChangeText={(t) => setEditedUser({ ...editedUser, phone: t })}
                            keyboardType="phone-pad"
                            placeholder="+56 9 1234 5678"
                        />

                        <Text style={[styles.label, { color: '#9CA3AF' }]}>Cédula de Identidad</Text>
                        <View style={[styles.input, { backgroundColor: '#F8F9FA', borderColor: '#E5E7EB', marginBottom: 20, flexDirection: 'row', alignItems: 'center' }]}>
                            <Text style={{ color: '#9CA3AF', fontSize: 17, flex: 1 }}>{editedUser.cedula || 'No registrada'}</Text>
                            <Feather name="lock" size={18} color="#9CA3AF" />
                        </View>
                    </ScrollView>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#F1F5F9', flex: 1, marginRight: 10, elevation: 0 }]}
                            onPress={onClose}
                        >
                            <Text style={[styles.actionButtonText, { color: '#4B5563' }]}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#EA580C', flex: 1, marginLeft: 10, elevation: 0 }]}
                            onPress={onSave}
                        >
                            <Text style={styles.actionButtonText}>Guardar</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        width: '100%',
        height: '92%',
        maxHeight: '100%'
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827'
    },
    label: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 10,
        marginTop: 20,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 14,
        padding: 18,
        fontSize: 17,
        color: '#1F2937',
        minHeight: 64,
    },
    actionButton: {
        flex: 1,
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    actionButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 17,
    }
});
