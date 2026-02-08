import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const API_URL = 'http://localhost:5000/api'; // Adjust if needed

export default function ManageJobModal({ visible, onClose, job, onUpdate }) {
    const [activeTab, setActiveTab] = useState('agenda'); // agenda, photos, payments
    const [loading, setLoading] = useState(false);

    // Data States
    const [payments, setPayments] = useState(job?.clientManagement?.payments || []);
    const [notes, setNotes] = useState(job?.clientManagement?.privateNotes || []);
    const [photos, setPhotos] = useState(job?.clientManagement?.beforePhotos || []);
    const [validatedStartDate, setValidatedStartDate] = useState(job?.clientManagement?.validatedStartDate);
    const [validatedEndDate, setValidatedEndDate] = useState(job?.clientManagement?.validatedEndDate);

    // Form States
    const [noteText, setNoteText] = useState('');
    const [amount, setAmount] = useState('');
    const [paymentNote, setPaymentNote] = useState('');

    useEffect(() => {
        if (job && job.clientManagement) {
            setPayments(job.clientManagement.payments || []);
            setNotes(job.clientManagement.privateNotes || []);
            setPhotos(job.clientManagement.beforePhotos || []);
            setValidatedStartDate(job.clientManagement.validatedStartDate);
            setValidatedEndDate(job.clientManagement.validatedEndDate);
        }
    }, [job]);

    // --- ACTIONS ---

    const handleAddNote = async () => {
        if (!noteText.trim()) return;
        setLoading(true);
        try {
            const token = "YOUR_TOKEN"; // In real app, pass token via props or context
            // Since we are inside App.js usually, we might need axios instance with interceptor
            // For now, assuming Global Axios or we need to pass token.
            // Let's assume onUpdate handles the actual API call or we use the passed 'onUpdate' to refresh.
            // Actually, better to do the API call here if we have the token. 
            // BUT, ensuring token availability is tricky in a standalone component without Context.

            // SIMPLIFIED: We will use the parent's update function to trigger refresh, 
            // but we need to execute the POST here.

            // ALERT: We need the token. Let's assume it's passed in 'job' or accessible.
            // If not, we should probably pass 'token' as prop.

            // For this implementation, I will emit an event to the parent to save.
            // OR simpler: assume axios is configured globally (often true in these apps).

            // Let's try to pass an "onAction" prop pattern.
            await onUpdate('add-note', { text: noteText });
            setNoteText('');
        } catch (error) {
            Alert.alert('Error', 'No se pudo guardar la nota.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddPayment = async () => {
        if (!amount || isNaN(amount)) {
            Alert.alert('Error', 'Ingrese un monto válido');
            return;
        }
        setLoading(true);
        try {
            await onUpdate('add-payment', { amount: parseFloat(amount), note: paymentNote });
            setAmount('');
            setPaymentNote('');
        } catch (error) {
            Alert.alert('Error', 'No se pudo guardar el pago.');
        } finally {
            setLoading(false);
        }
    };

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setLoading(true);
            try {
                // In a real app, upload to Cloudinary/S3 here.
                // For demo, we just save the local URI or base64.
                // Assuming backend accepts a URL (or we send a dummy one for local).
                await onUpdate('add-photo', { url: result.assets[0].uri });
            } catch (error) {
                Alert.alert('Error', 'No se pudo subir la foto.');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleUpdateDate = async (type, date) => {
        // Implementation for date picker would go here
        // For now, simple prompt or sim
        Alert.alert('Info', 'Selector de fecha pendiente de implementación UI');
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.container}>
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Feather name="x" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Gestión del Trabajo</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* TABS */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity style={[styles.tab, activeTab === 'agenda' && styles.activeTab]} onPress={() => setActiveTab('agenda')}>
                        <Text style={[styles.tabText, activeTab === 'agenda' && styles.activeTabText]}>Agenda</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, activeTab === 'photos' && styles.activeTab]} onPress={() => setActiveTab('photos')}>
                        <Text style={[styles.tabText, activeTab === 'photos' && styles.activeTabText]}>Fotos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, activeTab === 'payments' && styles.activeTab]} onPress={() => setActiveTab('payments')}>
                        <Text style={[styles.tabText, activeTab === 'payments' && styles.activeTabText]}>Pagos</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content}>
                    {/* AGENDA TAB */}
                    {activeTab === 'agenda' && (
                        <View>
                            <View style={styles.card}>
                                <Text style={styles.sectionTitle}>Fechas Validadas</Text>
                                <View style={styles.row}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.label}>Inicio</Text>
                                        <TouchableOpacity onPress={() => handleUpdateDate('start')} style={styles.dateBox}>
                                            <Text>{formatDate(validatedStartDate)}</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ width: 10 }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.label}>Fin</Text>
                                        <TouchableOpacity onPress={() => handleUpdateDate('end')} style={styles.dateBox}>
                                            <Text>{formatDate(validatedEndDate)}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.card}>
                                <Text style={styles.sectionTitle}>Notas Privadas</Text>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Agregar nota..."
                                        value={noteText}
                                        onChangeText={setNoteText}
                                        multiline
                                    />
                                    <TouchableOpacity style={styles.sendButton} onPress={handleAddNote} disabled={loading}>
                                        <Feather name="send" size={20} color="white" />
                                    </TouchableOpacity>
                                </View>
                                {notes.map((note, index) => (
                                    <View key={index} style={styles.noteItem}>
                                        <Text style={styles.noteText}>{note.text}</Text>
                                        <Text style={styles.noteDate}>{formatDate(note.date)}</Text>
                                    </View>
                                ))}
                                {notes.length === 0 && <Text style={styles.placeholderText}>No hay notas registradas.</Text>}
                            </View>
                        </View>
                    )}

                    {/* PHOTOS TAB */}
                    {activeTab === 'photos' && (
                        <View>
                            <TouchableOpacity style={styles.uploadButton} onPress={handlePickImage} disabled={loading}>
                                <Feather name="camera" size={20} color="white" />
                                <Text style={styles.uploadButtonText}>Subir Foto (Antes/Progreso)</Text>
                            </TouchableOpacity>

                            <View style={styles.photosGrid}>
                                {photos.map((photo, index) => (
                                    <View key={index} style={styles.photoWrapper}>
                                        <Image source={{ uri: photo.url }} style={styles.photo} />
                                        <Text style={styles.photoDate}>{new Date(photo.uploadedAt).toLocaleDateString()}</Text>
                                    </View>
                                ))}
                            </View>
                            {photos.length === 0 && <Text style={styles.placeholderText}>No hay fotos registradas.</Text>}
                        </View>
                    )}

                    {/* PAYMENTS TAB */}
                    {activeTab === 'payments' && (
                        <View>
                            <View style={styles.card}>
                                <Text style={styles.sectionTitle}>Registrar Pago</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Monto ($)"
                                    keyboardType="numeric"
                                    value={amount}
                                    onChangeText={setAmount}
                                />
                                <TextInput
                                    style={[styles.input, { marginTop: 10 }]}
                                    placeholder="Nota (ej. Anticipo, Materiales)"
                                    value={paymentNote}
                                    onChangeText={setPaymentNote}
                                />
                                <TouchableOpacity style={styles.primaryButton} onPress={handleAddPayment} disabled={loading}>
                                    <Text style={styles.primaryButtonText}>Guardar Pago</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.card}>
                                <Text style={styles.sectionTitle}>Historial de Pagos</Text>
                                {payments.map((p, index) => (
                                    <View key={index} style={styles.paymentItem}>
                                        <View>
                                            <Text style={styles.paymentAmount}>${p.amount}</Text>
                                            <Text style={styles.paymentNote}>{p.note || 'Sin nota'}</Text>
                                        </View>
                                        <Text style={styles.paymentDate}>{formatDate(p.date)}</Text>
                                    </View>
                                ))}
                                {payments.length === 0 && <Text style={styles.placeholderText}>No hay pagos registrados.</Text>}
                            </View>
                        </View>
                    )}
                </ScrollView>

                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#EA580C" />
                    </View>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: 'white', elevation: 2 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    closeButton: { padding: 8 },
    tabContainer: { flexDirection: 'row', backgroundColor: 'white', marginTop: 1 },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: '#EA580C' },
    tabText: { color: '#6B7280', fontWeight: '500' },
    activeTabText: { color: '#EA580C', fontWeight: 'bold' },
    content: { padding: 16 },
    card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 16, elevation: 1 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 12 },
    row: { flexDirection: 'row' },
    label: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
    dateBox: { padding: 10, backgroundColor: '#F9FAFB', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    input: { flex: 1, backgroundColor: '#F9FAFB', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8 },
    sendButton: { backgroundColor: '#EA580C', padding: 12, borderRadius: 8 },
    noteItem: { backgroundColor: '#FFF7ED', padding: 12, borderRadius: 8, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#EA580C' },
    noteText: { color: '#374151', marginBottom: 4 },
    noteDate: { fontSize: 10, color: '#9CA3AF', textAlign: 'right' },
    placeholderText: { textAlign: 'center', color: '#9CA3AF', fontStyle: 'italic', marginTop: 10 },
    uploadButton: { backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, marginBottom: 16 },
    uploadButtonText: { color: 'white', fontWeight: 'bold', marginLeft: 8 },
    photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    photoWrapper: { width: '48%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
    photo: { width: '100%', height: '100%' },
    photoDate: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', fontSize: 10, padding: 4, textAlign: 'center' },
    primaryButton: { backgroundColor: '#EA580C', padding: 14, borderRadius: 8, marginTop: 16, alignItems: 'center' },
    primaryButtonText: { color: 'white', fontWeight: 'bold' },
    paymentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    paymentAmount: { fontSize: 16, fontWeight: 'bold', color: '#10B981' },
    paymentNote: { fontSize: 12, color: '#6B7280' },
    paymentDate: { fontSize: 12, color: '#9CA3AF' },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' }

});
