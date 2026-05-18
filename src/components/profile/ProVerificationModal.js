import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { compressImage } from '../../utils/imageCompressor';
import { api } from '../../utils/api';

export function ProVerificationModal({ visible, onClose, user, onUpdate }) {
    const [idFront, setIdFront] = useState(null);
    const [idBack, setIdBack] = useState(null);
    const [selfie, setSelfie] = useState(null);
    const [loading, setLoading] = useState(false);

    const pickImage = async (setter) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets[0]) {
            const compressedBase64 = await compressImage(result.assets[0].uri);
            setter(compressedBase64);
        }
    };

    const pickCamera = async (setter) => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Necesitamos acceso a tu cámara.');
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets[0]) {
            const compressedBase64 = await compressImage(result.assets[0].uri);
            setter(compressedBase64);
        }
    };

    const handleOptions = (setter) => {
        Alert.alert(
            "Seleccionar imagen",
            "Elige la fuente",
            [
                { text: "Cámara", onPress: () => pickCamera(setter) },
                { text: "Galería", onPress: () => pickImage(setter) },
                { text: "Cancelar", style: "cancel" }
            ]
        );
    };

    const submitVerification = async () => {
        if (!idFront || !idBack || !selfie) {
            Alert.alert("Faltan fotos", "Debes subir la parte frontal, trasera de tu documento y una selfie.");
            return;
        }

        setLoading(true);
        try {
            const res = await api.verifyProfile({ idFront, idBack, selfie });
            Alert.alert("Éxito", "Tus documentos han sido enviados a revisión.");
            if (onUpdate && res.data?.user) {
                onUpdate(res.data.user);
            }
            onClose();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "No se pudo enviar la verificación.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusUI = () => {
        const status = user?.verificationDetails?.status || 'unverified';
        if (user?.isVerified || status === 'verified') return { icon: 'check-circle', color: '#10B981', text: 'Perfil Verificado', bg: '#D1FAE5' };
        if (status === 'pending') return { icon: 'clock', color: '#F59E0B', text: 'Verificación en proceso', bg: '#FEF3C7' };
        if (status === 'rejected') return { icon: 'x-circle', color: '#EF4444', text: 'Verificación rechazada', bg: '#FEE2E2', extra: user?.verificationDetails?.rejectionReason };
        return null;
    };

    const statusUI = getStatusUI();

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={[styles.modalContent, { height: '85%' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <Text style={styles.modalTitle}>Verificación de Identidad</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Feather name="x" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {statusUI && (
                            <View style={{ backgroundColor: statusUI.bg, padding: 15, borderRadius: 12, marginBottom: 20, flexDirection: 'row', alignItems: 'flex-start' }}>
                                <Feather name={statusUI.icon} size={24} color={statusUI.color} style={{ marginRight: 10, marginTop: 2 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontWeight: 'bold', color: statusUI.color, fontSize: 16 }}>{statusUI.text}</Text>
                                    {statusUI.extra && <Text style={{ color: statusUI.color, marginTop: 4 }}>{statusUI.extra}</Text>}
                                </View>
                            </View>
                        )}

                        {(!statusUI || statusUI.icon === 'x-circle') && (
                            <>
                                <Text style={{ color: '#4B5563', marginBottom: 20 }}>
                                    Para obtener la insignia de "Verificado" y generar más confianza, necesitamos validar tu identidad subiendo fotos de tu documento y una selfie.
                                </Text>

                                <Text style={styles.sectionTitle}>1. Documento Frontal</Text>
                                <TouchableOpacity style={styles.imageUploadBtn} onPress={() => handleOptions(setIdFront)}>
                                    {idFront ? <ExpoImage source={{ uri: idFront }} style={styles.imagePreview} /> : <Feather name="camera" size={30} color="#9CA3AF" />}
                                </TouchableOpacity>

                                <Text style={styles.sectionTitle}>2. Documento Reverso</Text>
                                <TouchableOpacity style={styles.imageUploadBtn} onPress={() => handleOptions(setIdBack)}>
                                    {idBack ? <ExpoImage source={{ uri: idBack }} style={styles.imagePreview} /> : <Feather name="camera" size={30} color="#9CA3AF" />}
                                </TouchableOpacity>

                                <Text style={styles.sectionTitle}>3. Selfie</Text>
                                <TouchableOpacity style={styles.imageUploadBtn} onPress={() => handleOptions(setSelfie)}>
                                    {selfie ? <ExpoImage source={{ uri: selfie }} style={styles.imagePreview} /> : <Feather name="user" size={30} color="#9CA3AF" />}
                                </TouchableOpacity>

                                <View style={{ height: 20 }} />
                            </>
                        )}
                    </ScrollView>

                    {(!statusUI || statusUI.icon === 'x-circle') && (
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                            <TouchableOpacity style={[styles.btnCancel, { backgroundColor: '#F1F5F9' }]} onPress={onClose}>
                                <Text style={{ color: '#64748B', fontWeight: 'bold' }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnSave} onPress={submitVerification} disabled={loading}>
                                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnTextSave}>Enviar Verificación</Text>}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, width: '100%' },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 10, marginTop: 10 },
    imageUploadBtn: { height: 150, backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    imagePreview: { width: '100%', height: '100%' },
    btnCancel: { flex: 1, padding: 16, borderRadius: 14, alignItems: 'center' },
    btnSave: { flex: 1, padding: 16, borderRadius: 14, alignItems: 'center', backgroundColor: '#2563EB' },
    btnTextSave: { color: 'white', fontWeight: 'bold' }
});
