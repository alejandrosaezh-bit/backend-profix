import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { api } from '../utils/api';
import { clearRequests } from '../utils/requests';

const { width } = Dimensions.get('window');

// --- MOCK DATA REMOVED ---

export default function ProfessionalProfileScreen({
    user,
    isOwner = false,
    categories = [],
    allSubcategories = {},
    allZones = {}, // Ahora es un objeto { Ciudad: [Municipios] }
    onBack,
    onUpdate,
    onLogout,
    onSwitchMode
}) {
    // Si no hay usuario (ej: durante logout), no renderizar nada para evitar errores
    if (!user) return null;

    const [isEditing, setIsEditing] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [isLoadingReviews, setIsLoadingReviews] = useState(false);

    // Fetch reviews when category or user changes
    useEffect(() => {
        const fetchReviews = async () => {
            if (!user?._id) return;
            setIsLoadingReviews(true);
            try {
                const data = await api.getProfessionalReviews(user._id);
                setReviews(data || []);
            } catch (error) {
                console.error("Error fetching reviews:", error);
            } finally {
                setIsLoadingReviews(false);
            }
        };
        fetchReviews();
    }, [user?._id]);

    // Estado principal del perfil
    // Estructura esperada: 
    // user.profiles = { "Hogar": { bio: "...", subcategories: [], gallery: [] }, "Automotriz": ... }
    // Helper to ensure profiles is an object
    const getProfilesObj = (p) => {
        if (!p) return {};
        if (p instanceof Map) return Object.fromEntries(p); // Should not happen with current serializers but just in case
        return p;
    };

    const [profileData, setProfileData] = useState({
        ...user,
        profiles: getProfilesObj(user?.profiles)
    });

    // Categoría seleccionada actualmente en la vista (objeto completo de categoría)
    // Inicializar con la primera categoría activa si existe, sino la primera de la lista
    const [selectedCategory, setSelectedCategory] = useState(() => {
        const activeCatKey = Object.keys(user?.profiles || {})[0];
        if (activeCatKey) {
            const found = categories.find(c => (c.fullName || c.name) === activeCatKey);
            if (found) return found;
        }
        return categories[0] || { name: 'General', fullName: 'General' };
    });

    // Helper: Obtener key de la categoría (usamos fullName para coincidir con DETAILED_CATEGORIES)
    const categoryKey = selectedCategory.fullName || selectedCategory.name;

    // Efecto para sincronizar profileData cuando el usuario se actualiza externamente (ej: al cargar app)
    useEffect(() => {
        if (isEditing) {
            console.log("ProfessionalProfileScreen: User prop updated but ignored because isEditing is true.");
            return;
        }
        // Asegurar que usamos la versión más fresca de user
        const freshProfiles = user?.profiles || {};
        setProfileData({ ...user, profiles: freshProfiles });
        console.log("ProfessionalProfileScreen: User prop updated, syncing state. Active categories:", Object.keys(freshProfiles));
    }, [user, isEditing]);

    // Helper: Obtener perfil de la categoría actual
    const currentCatProfile = profileData.profiles?.[categoryKey];
    const isCategoryActive = !!currentCatProfile && currentCatProfile.isActive !== false;

    // --- ORDENAMIENTO DE CATEGORÍAS (Activas primero) ---
    const sortedCategories = [...categories].sort((a, b) => {
        const keyA = a.fullName || a.name;
        const keyB = b.fullName || b.name;
        const activeA = !!profileData.profiles?.[keyA];
        const activeB = !!profileData.profiles?.[keyB];
        if (activeA && !activeB) return -1;
        if (!activeA && activeB) return 1;
        return 0;
    });

    // --- ACCIONES ---

    const handleSave = () => {
        // Convertir Map a Objeto para la API
        const profilesObject = {};
        if (profileData.profiles instanceof Map) {
            profileData.profiles.forEach((value, key) => {
                profilesObject[key] = value;
            });
        } else if (typeof profileData.profiles === 'object' && profileData.profiles !== null) {
            // Si ya es objeto, usarlo
            Object.assign(profilesObject, profileData.profiles);
        }

        // Sanitize Data
        const dataToUpdate = {
            ...profileData,
            profiles: profilesObject
        };

        // Fix: Evitar enviar string vacío en cédula para no romper unique sparse index
        if (dataToUpdate.cedula === '') {
            dataToUpdate.cedula = undefined; // O null
        }
        // Limpiar campos nulos o undefined para reducir payload
        if (!dataToUpdate.password) delete dataToUpdate.password;

        console.log("ProfessionalProfileScreen: Handling Save.");
        console.log("- Avatar length:", dataToUpdate.avatar ? dataToUpdate.avatar.length : 0);
        console.log("- Name:", dataToUpdate.name);
        console.log("- Profiles Keys:", Object.keys(profilesObject));
        console.log("- Full Payload Preview:", JSON.stringify(dataToUpdate).substring(0, 200) + "...");

        if (onUpdate) {
            console.log("ProfessionalProfileScreen: Calling onUpdate prop...");
            onUpdate(dataToUpdate);
        } else {
            console.warn("ProfessionalProfileScreen: onUpdate prop is missing!");
        }
        setIsEditing(false);
    };

    const handleClearChats = async () => {
        Alert.alert(
            "Borrar Chats",
            "¿Estás seguro de que quieres borrar todos los chats y solicitudes locales?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Borrar",
                    style: "destructive",
                    onPress: async () => {
                        await clearRequests();
                        Alert.alert("Éxito", "Chats borrados. Por favor recarga la app.");
                    }
                }
            ]
        );
    };

    const toggleCategoryActivation = () => {
        const newProfiles = { ...profileData.profiles };

        if (isCategoryActive) {
            // Desactivar (Pausar perfil de esta categoría)
            const confirmPause = () => {
                // Soft delete: Mark as inactive
                newProfiles[categoryKey] = { ...newProfiles[categoryKey], isActive: false };
                setProfileData({ ...profileData, profiles: newProfiles });
                setIsEditing(true);
            };

            if (Platform.OS === 'web') {
                if (window.confirm("¿Pausar categoría? Dejarás de recibir solicitudes de esta categoría temporalmente, pero tus datos se conservarán.")) {
                    confirmPause();
                }
            } else {
                Alert.alert(
                    "¿Pausar categoría?",
                    "Dejarás de recibir solicitudes de esta categoría temporalmente, pero tus datos se conservarán.",
                    [
                        { text: "Cancelar", style: "cancel" },
                        {
                            text: "Pausar", style: "destructive", onPress: confirmPause
                        }
                    ]
                );
            }
        } else {
            // Activar
            if (newProfiles[categoryKey]) {
                // Reactivar existente
                newProfiles[categoryKey] = { ...newProfiles[categoryKey], isActive: true };
            } else {
                // Crear perfil nuevo
                newProfiles[categoryKey] = {
                    bio: '',
                    subcategories: [],
                    gallery: [],
                    isActive: true
                };
            }
            setProfileData({ ...profileData, profiles: newProfiles });
            setIsEditing(true);
        }
    };

    const toggleSubcategory = (sub) => {
        if (!isCategoryActive) return;
        const currentSubs = currentCatProfile.subcategories || [];
        let newSubs;
        if (currentSubs.includes(sub)) {
            newSubs = currentSubs.filter(s => s !== sub);
        } else {
            newSubs = [...currentSubs, sub];
        }

        updateCurrentProfile({ subcategories: newSubs });
    };

    const toggleZone = (zone) => {
        if (!isCategoryActive) return;
        const currentZones = currentCatProfile.zones || [];
        let newZones;
        if (currentZones.includes(zone)) {
            newZones = currentZones.filter(z => z !== zone);
        } else {
            newZones = [...currentZones, zone];
        }

        updateCurrentProfile({ zones: newZones });
    };

    const updateCurrentProfile = (updates) => {
        setProfileData(prev => ({
            ...prev,
            profiles: {
                ...prev.profiles,
                [categoryKey]: {
                    ...prev.profiles[categoryKey],
                    ...updates
                }
            }
        }));
    };

    const pickMainImage = async () => {
        // Solicitar permisos primero
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para cambiar la foto.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
            // Usar 'avatar' para coincidir con el backend y el perfil de cliente
            setProfileData(prev => ({ ...prev, avatar: base64Img }));
        }
    };

    const pickImage = async () => {
        // Solicitar permisos primero
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para subir fotos.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 5,
            quality: 0.5, // Reducir calidad para evitar payloads gigantes
            base64: true, // IMPORTANTE: Usar base64 para MongoDB
        });

        if (!result.canceled) {
            // Convertir a array de base64 strings
            const newImages = result.assets.map(asset => `data:image/jpeg;base64,${asset.base64}`);
            const currentGallery = currentCatProfile.gallery || [];
            updateCurrentProfile({ gallery: [...currentGallery, ...newImages] });
        }
    };

    const removeImage = (index) => {
        const currentGallery = currentCatProfile.gallery || [];
        const newGallery = currentGallery.filter((_, i) => i !== index);
        updateCurrentProfile({ gallery: newGallery });
    };

    // --- RENDER HELPERS ---

    const renderStars = (rating) => (
        <View style={{ flexDirection: 'row' }}>
            {[...Array(5)].map((_, i) => (
                <FontAwesome5 key={i} name="star" solid={i < rating} size={12} color="#FBBF24" />
            ))}
        </View>
    );

    // Filtrar reviews por categoría
    const categoryReviews = reviews.filter(rev => {
        // En esta etapa mostramos todas las reviews del profesional independientemente de la categoría 
        // para que no se vea vacío, o si quieres filtrar descomenta:
        // if (!rev.jobCategory) return true;
        // const revCat = (typeof rev.jobCategory === 'object') ? rev.jobCategory.name : rev.jobCategory;
        // return revCat === categoryKey;
        return true;
    });

    // Calcular stats reales
    const categoryStats = {
        jobs: user?.reviewsCount || 0,
        rating: user?.rating > 0 ? user.rating.toFixed(1) : 'Nuevo',
        success: user?.reviewsCount > 0 ? '100%' : 'N/A'
    };

    return (
        <View style={styles.container}>
            {/* Header Profil Profesional */}
            <View style={{ backgroundColor: '#2563EB', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={onBack} style={{ marginRight: 16 }}>
                    <Feather name="arrow-left" size={24} color="white" />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>Perfil Profesional</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* PROFILE CARD */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        {/* Usar 'avatar' en lugar de 'image' */}
                        {(profileData.avatar || profileData.image) ? (
                            <Image source={{ uri: profileData.avatar || profileData.image }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, { backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' }]}>
                                <Feather name="user" size={60} color="#9CA3AF" />
                            </View>
                        )}
                        {isEditing && (
                            <TouchableOpacity style={styles.editBadge} onPress={pickMainImage}>
                                <Feather name="camera" size={20} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {!isEditing ? (
                        <View style={{ alignItems: 'center', marginTop: 10 }}>
                            <Text style={styles.userName}>{profileData.name || 'Profesional'}</Text>
                            <Text style={styles.userEmail}>{profileData.email}</Text>
                            <View style={styles.ratingContainer}>
                                <Feather name="star" size={16} color="#FBBF24" style={{ marginRight: 4 }} />
                                <Text style={styles.ratingText}>{user.rating || '5.0'} (Valoración de Profesionales)</Text>
                            </View>
                            {isOwner && (
                                <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                                    <Text style={styles.editButtonText}>Editar Perfil</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <View style={{ width: '100%', marginTop: 20 }}>
                            <Text style={styles.label}>Nombre Completo</Text>
                            <TextInput
                                style={styles.input}
                                value={profileData.name}
                                onChangeText={(t) => setProfileData({ ...profileData, name: t })}
                            />

                            <Text style={styles.label}>Correo Electrónico</Text>
                            <TextInput
                                style={styles.input}
                                value={profileData.email}
                                onChangeText={(t) => setProfileData({ ...profileData, email: t })}
                                keyboardType="email-address"
                            />

                            <Text style={styles.label}>Teléfono</Text>
                            <TextInput
                                style={styles.input}
                                value={profileData.phone || ''}
                                onChangeText={(t) => setProfileData({ ...profileData, phone: t })}
                                keyboardType="phone-pad"
                                placeholder="+56 9 1234 5678"
                            />

                            <Text style={styles.label}>Cédula de Identidad (Solo lectura)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: '#E5E7EB', color: '#6B7280' }]}
                                value={profileData.cedula || ''}
                                editable={false}
                                placeholder="12.345.678-9"
                            />

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#EF4444' }]} onPress={() => setIsEditing(false)}>
                                    <Text style={styles.actionButtonText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#10B981' }]} onPress={handleSave}>
                                    <Text style={styles.actionButtonText}>Guardar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

                {/* SELECTOR DE CATEGORÍAS (SOLO VISIBLE EN MODO EDICIÓN) */}
                {isEditing && (
                    <View style={styles.categoryBar}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10 }}>
                            {sortedCategories.map((cat) => {
                                const catKey = cat.fullName || cat.name;
                                const isActive = !!profileData.profiles?.[catKey] && profileData.profiles[catKey].isActive !== false;
                                const isSelected = selectedCategory.id === cat.id;
                                return (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.catTab,
                                            isSelected && styles.catTabSelected,
                                            isActive && !isSelected && styles.catTabActive
                                        ]}
                                        onPress={() => setSelectedCategory(cat)}
                                    >
                                        {/* Renderizar icono si es componente o elemento */}
                                        {typeof cat.icon === 'function' ? <cat.icon size={16} color={isSelected ? 'white' : (isActive ? '#2563EB' : '#666')} /> : null}
                                        <Text style={[
                                            styles.catTabText,
                                            isSelected && { color: 'white' },
                                            isActive && !isSelected && { color: '#2563EB' }
                                        ]}>
                                            {cat.name}
                                        </Text>
                                        {isActive && <View style={styles.activeDot} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                {/* ESTADO DE LA CATEGORÍA */}
                <View style={styles.section}>
                    {isEditing && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                            <Text style={styles.sectionTitle}>Perfil de {selectedCategory.name}</Text>
                            {isOwner && (
                                <TouchableOpacity
                                    style={[styles.toggleButton, isCategoryActive ? styles.btnDestructive : styles.btnPrimary]}
                                    onPress={toggleCategoryActivation}
                                >
                                    <Text style={[styles.toggleButtonText, isCategoryActive ? { color: '#EF4444' } : { color: 'white' }]}>
                                        {isCategoryActive ? 'Pausar Categoría' : 'Reactivar Categoría'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {!isCategoryActive ? (
                        <View style={styles.emptyState}>
                            <Feather name="briefcase" size={48} color="#ccc" />
                            <Text style={styles.emptyStateText}>No tienes un perfil activo para {selectedCategory.name}.</Text>
                            <Text style={styles.emptyStateSubtext}>Actívalo para empezar a recibir solicitudes de este tipo.</Text>
                        </View>
                    ) : (
                        <>
                            {/* ESTADÍSTICAS DE LA CATEGORÍA */}
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{categoryStats.jobs}</Text>
                                    <Text style={styles.statLabel}>Trabajos</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{categoryStats.rating} ★</Text>
                                    <Text style={styles.statLabel}>Valoración</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>100%</Text>
                                    <Text style={styles.statLabel}>Éxito</Text>
                                </View>
                            </View>

                            {/* SUBCATEGORÍAS */}
                            <Text style={styles.label}>Especialidades (Subcategorías)</Text>
                            <View style={styles.tagsContainer}>
                                {(allSubcategories[categoryKey] || [])
                                    .filter(sub => isEditing || currentCatProfile.subcategories?.includes(sub))
                                    .map((sub, index) => {
                                        const isSelected = currentCatProfile.subcategories?.includes(sub);
                                        return (
                                            <TouchableOpacity
                                                key={index}
                                                style={[styles.tag, isSelected && styles.tagSelected]}
                                                onPress={() => isEditing && toggleSubcategory(sub)}
                                                disabled={!isEditing}
                                            >
                                                <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>{sub}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                {!isEditing && (!currentCatProfile.subcategories || currentCatProfile.subcategories.length === 0) && (
                                    <Text style={{ color: '#999', fontStyle: 'italic', fontSize: 12 }}>No hay especialidades seleccionadas.</Text>
                                )}
                            </View>

                            {/* ZONAS DE TRABAJO */}
                            <Text style={styles.label}>Zonas de Cobertura</Text>

                            {isEditing ? (
                                // MODO EDICIÓN: Mostrar lista agrupada por ciudades
                                <View>
                                    {Object.keys(allZones).map((city) => (
                                        <View key={city} style={{ marginBottom: 15 }}>
                                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#4B5563', marginBottom: 8 }}>{city}</Text>
                                            <View style={styles.tagsContainer}>
                                                {allZones[city].map((muni) => {
                                                    const fullZoneName = `${muni}, ${city}`;
                                                    const isSelected = currentCatProfile.zones?.includes(fullZoneName);
                                                    return (
                                                        <TouchableOpacity
                                                            key={muni}
                                                            style={[styles.tag, isSelected && styles.tagSelected]}
                                                            onPress={() => toggleZone(fullZoneName)}
                                                        >
                                                            <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>{muni}</Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                // MODO VISUALIZACIÓN: Mostrar solo las seleccionadas
                                <View style={styles.tagsContainer}>
                                    {(currentCatProfile.zones || []).map((zone, index) => (
                                        <View key={index} style={[styles.tag, styles.tagSelected]}>
                                            <Text style={[styles.tagText, styles.tagTextSelected]}>{zone}</Text>
                                        </View>
                                    ))}
                                    {(!currentCatProfile.zones || currentCatProfile.zones.length === 0) && (
                                        <Text style={{ color: '#999', fontStyle: 'italic', fontSize: 12 }}>No hay zonas seleccionadas.</Text>
                                    )}
                                </View>
                            )}

                            {/* PRESENTACIÓN */}
                            <Text style={styles.label}>Presentación / Bio</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.bioInput}
                                    multiline
                                    placeholder={`Describe tu experiencia en ${selectedCategory.name}...`}
                                    value={currentCatProfile.bio}
                                    onChangeText={(text) => updateCurrentProfile({ bio: text })}
                                />
                            ) : (
                                <Text style={styles.bioText}>
                                    {currentCatProfile.bio || 'Sin descripción.'}
                                </Text>
                            )}

                            {/* PORTAFOLIO */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10 }}>
                                <Text style={styles.label}>Portafolio ({selectedCategory.name})</Text>
                                {isEditing && (
                                    <TouchableOpacity onPress={pickImage}>
                                        <Text style={{ color: '#2563EB', fontWeight: 'bold' }}>+ Agregar Foto</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                                {(currentCatProfile.gallery || []).map((img, i) => (
                                    <View key={i} style={{ position: 'relative', marginRight: 10 }}>
                                        <Image source={{ uri: img }} style={styles.galleryImage} />
                                        {isEditing && (
                                            <TouchableOpacity
                                                style={styles.deleteImageButton}
                                                onPress={() => removeImage(i)}
                                            >
                                                <Feather name="x" size={12} color="white" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}
                                {(!currentCatProfile.gallery || currentCatProfile.gallery.length === 0) && (
                                    <Text style={{ color: '#999', fontStyle: 'italic' }}>No hay fotos en este portafolio.</Text>
                                )}
                            </ScrollView>

                            {/* OPINIONES */}
                            <Text style={styles.label}>Opiniones de Clientes</Text>
                            {isLoadingReviews ? (
                                <ActivityIndicator size="small" color="#2563EB" style={{ marginVertical: 20 }} />
                            ) : categoryReviews.length === 0 ? (
                                <Text style={{ color: '#999', marginBottom: 20 }}>Aún no hay opiniones.</Text>
                            ) : (
                                categoryReviews.map((review, idx) => (
                                    <View key={review._id || idx} style={styles.reviewCard}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <Text style={{ fontWeight: 'bold' }}>{review.reviewer?.name || 'Cliente'}</Text>
                                            <Text style={{ fontSize: 10, color: '#9CA3AF' }}>{new Date(review.createdAt).toLocaleDateString()}</Text>
                                        </View>
                                        {renderStars(review.rating)}
                                        <Text style={{ marginTop: 5, color: '#4B5563', fontSize: 13, fontStyle: 'italic' }}>
                                            "{review.comment || 'Sin comentarios'}"
                                        </Text>
                                    </View>
                                ))
                            )}
                        </>
                    )}
                </View>

                {isOwner && (
                    <View style={{ marginBottom: 30 }}>
                        {onSwitchMode && (
                            <TouchableOpacity 
                                style={{ alignSelf: 'center', padding: 15, backgroundColor: '#EA580C', borderRadius: 12, marginTop: 10, width: '80%' }}
                                onPress={() => {
                                    onSwitchMode('client');
                                    onBack();
                                }}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14, textAlign: 'center' }}>Cambiar a Perfil Cliente</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={{ alignSelf: 'center', padding: 15 }} onPress={onLogout}>
                            <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 14 }}>Cerrar Sesión</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ alignSelf: 'center', padding: 5, marginBottom: 20 }} onPress={handleClearChats}>
                            <Text style={{ color: '#999', fontSize: 12 }}>Borrar Chats (Dev)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onBack} style={{ alignSelf: 'center', padding: 15 }}>
                            <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 14 }}>Regresar al Mercado</Text>
                        </TouchableOpacity>
                    </View>
                )}
                <View style={{ height: 50 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    scrollContent: { paddingBottom: 40 },
    profileCard: {
        backgroundColor: 'white',
        margin: 16,
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 10,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: 'white',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#2563EB',
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'white',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 10,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 16,
    },
    ratingText: {
        color: '#D97706',
        fontWeight: '600',
        fontSize: 14,
    },
    editButton: {
        paddingVertical: 8,
        paddingHorizontal: 24,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#2563EB',
    },
    editButtonText: {
        color: '#2563EB',
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#000',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        color: '#000',
    },
    actionButton: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    actionButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },

    categoryBar: { backgroundColor: 'white', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#E5E7EB' },
    catTab: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 10, backgroundColor: '#F3F4F6' },
    catTabSelected: { backgroundColor: '#2563EB' },
    catTabActive: { backgroundColor: '#DBEAFE', borderWidth: 1, borderColor: '#2563EB' },
    catTabText: { marginLeft: 6, fontWeight: '600', color: '#666' },
    activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2563EB', position: 'absolute', top: 5, right: 5 },

    content: { flex: 1 },
    section: { backgroundColor: 'white', marginHorizontal: 20, marginBottom: 20, borderRadius: 16, padding: 20, elevation: 2 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },

    toggleButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, borderWidth: 1 },
    btnPrimary: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
    btnDestructive: { backgroundColor: 'white', borderColor: '#EF4444' },
    toggleButtonText: { fontSize: 12, fontWeight: 'bold' },

    emptyState: { alignItems: 'center', padding: 30 },
    emptyStateText: { marginTop: 10, fontSize: 16, fontWeight: 'bold', color: '#374151', textAlign: 'center' },
    emptyStateSubtext: { marginTop: 5, color: '#6B7280', textAlign: 'center' },

    statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 15, borderBottomWidth: 1, borderColor: '#F3F4F6', marginBottom: 15 },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#2563EB' },
    statLabel: { fontSize: 12, color: '#6B7280' },
    statDivider: { width: 1, backgroundColor: '#E5E7EB' },

    label: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginTop: 15, marginBottom: 10 },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
    tagSelected: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
    tagText: { color: '#6B7280', fontSize: 12 },
    tagTextSelected: { color: '#2563EB', fontWeight: 'bold' },

    bioInput: { 
        backgroundColor: '#fff', 
        borderWidth: 2, 
        borderColor: '#000', 
        borderRadius: 10, 
        padding: 10, 
        height: 100, 
        textAlignVertical: 'top',
        color: '#000',
        fontSize: 16
    },
    bioText: { color: '#4B5563', lineHeight: 20 },

    galleryImage: { width: 120, height: 90, borderRadius: 8 },
    deleteImageButton: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },

    reviewCard: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 10, marginBottom: 10 },
    logoutButton: { alignSelf: 'center', padding: 15 },
});
