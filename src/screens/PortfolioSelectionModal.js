import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const PortfolioSelectionModal = ({ visible, onClose, job, onSubmit }) => {
    const [selectedImages, setSelectedImages] = useState([]);

    // Extract images from projectHistory and initial job images
    const availableImages = [];

    // 1. Add initial job images
    if (job?.images && Array.isArray(job.images)) {
        job.images.forEach((img, idx) => {
            availableImages.push({
                mediaUrl: img,
                title: `Foto Inicial ${idx + 1}`
            });
        });
    }

    // 2. Add history images
    if (job?.projectHistory && Array.isArray(job.projectHistory)) {
        job.projectHistory.forEach(event => {
            if (event.mediaUrl && !availableImages.some(ai => ai.mediaUrl === event.mediaUrl)) {
                availableImages.push({
                    mediaUrl: event.mediaUrl,
                    title: event.title || event.description || 'Foto del proceso'
                });
            }
        });
    }

    // 3. Add workPhotos if they exist (sometimes stored separately)
    if (job?.workPhotos && Array.isArray(job.workPhotos)) {
        job.workPhotos.forEach((img, idx) => {
            // Avoid duplicates if already in history
            if (!availableImages.some(ai => ai.mediaUrl === img)) {
                availableImages.push({
                    mediaUrl: img,
                    title: `Foto de Trabajo ${idx + 1}`
                });
            }
        });
    }

    // 4. Add Client Management Photos (beforePhotos)
    if (job?.clientManagement?.beforePhotos) {
        job.clientManagement.beforePhotos.forEach((item, idx) => {
            if (item.url && !availableImages.some(ai => ai.mediaUrl === item.url)) {
                availableImages.push({
                    mediaUrl: item.url,
                    title: `Foto Previa ${idx + 1}`
                });
            }
        });
    }

    // 5. Add Payment Evidence Photos
    if (job?.clientManagement?.payments) {
        job.clientManagement.payments.forEach((p, idx) => {
            if (p.evidenceUrl && !availableImages.some(ai => ai.mediaUrl === p.evidenceUrl)) {
                availableImages.push({
                    mediaUrl: p.evidenceUrl,
                    title: `Comprobante ${idx + 1}`
                });
            }
        });
    }

    const toggleSelection = (mediaUrl) => {
        if (selectedImages.includes(mediaUrl)) {
            setSelectedImages(selectedImages.filter(url => url !== mediaUrl));
        } else {
            setSelectedImages([...selectedImages, mediaUrl]);
        }
    };

    const handleSave = () => {
        if (selectedImages.length === 0) {
            Alert.alert("Aviso", "No has seleccionado ninguna foto. ¿Deseas continuar sin agregar nada al portafolio?", [
                { text: "Cancelar", style: "cancel" },
                { text: "Continuar", onPress: () => onSubmit([]) }
            ]);
        } else {
            onSubmit(selectedImages);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Agregar al Portafolio</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Feather name="x" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.subtitle}>
                        Selecciona las mejores fotos de este trabajo para mostrarlas en tu perfil.
                    </Text>

                    {availableImages.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Feather name="image" size={40} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No hay fotos registradas en el historial de este trabajo.</Text>
                        </View>
                    ) : (
                        <ScrollView style={styles.gallery} contentContainerStyle={styles.galleryContent}>
                            {availableImages.map((event, index) => {
                                const isSelected = selectedImages.includes(event.mediaUrl);
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[styles.imageContainer, isSelected && styles.selectedImage]}
                                        onPress={() => toggleSelection(event.mediaUrl)}
                                    >
                                        <Image source={{ uri: event.mediaUrl }} style={styles.image} />
                                        {isSelected && (
                                            <View style={styles.checkBadge}>
                                                <Feather name="check" size={12} color="white" />
                                            </View>
                                        )}
                                        <View style={styles.labelContainer}>
                                            <Text style={styles.label}>{event.title || 'Foto'}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    )}

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelText}>Omitir</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveText}>Guardar en Portafolio ({selectedImages.length})</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 20,
    },
    gallery: {
        maxHeight: 400,
    },
    galleryContent: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    imageContainer: {
        width: '48%',
        aspectRatio: 1,
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        position: 'relative',
    },
    selectedImage: {
        borderColor: '#2563EB',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    checkBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#2563EB',
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    labelContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 6,
    },
    label: {
        color: 'white',
        fontSize: 10,
        textAlign: 'center',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        marginBottom: 20,
    },
    emptyText: {
        color: '#9CA3AF',
        marginTop: 10,
        textAlign: 'center',
    },
    footer: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    cancelText: {
        color: '#4B5563',
        fontWeight: 'bold',
    },
    saveButton: {
        flex: 2,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#2563EB',
    },
    saveText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default PortfolioSelectionModal;
