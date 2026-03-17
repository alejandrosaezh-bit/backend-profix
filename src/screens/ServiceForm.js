import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Keyboard, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { CategoryGridModal, SubcategoryGridModal } from '../components/CategoryModals';
import { CATEGORY_EXAMPLES, FLAT_ZONES_SUGGESTIONS, HOME_COPY_OPTIONS } from '../constants/data';
import { ChevronDown, ChevronRight, MapPin } from '../constants/icons';
import styles from '../styles/globalStyles';
import { showAlert } from '../utils/helpers';
import { compressImage } from '../utils/imageCompressor';

const ServiceForm = ({ onSubmit, isLoggedIn, onTriggerLogin, initialCategory, initialSubcategory, categories = [], allSubcategories = {}, currentUser, dynamicCopy, scrollTo }) => {
    const copy = dynamicCopy || HOME_COPY_OPTIONS[0];
    const [coords, setCoords] = useState({});

    const handleLayout = (key, event) => {
        if (!event || !event.nativeEvent || !event.nativeEvent.layout) return;
        const layoutY = event.nativeEvent.layout.y;
        setCoords(prev => ({ ...prev, [key]: layoutY }));
    };

    const handleFocus = (key) => {
        if (scrollTo && coords[key] !== undefined) {
            // Offset matemático exacto calibrado (+90px)
            // Esto compensa el paddingTop del ServiceForm y el Divider superior para que 
            // el título quede EXACTAMENTE debajo de la barra "Profesional Cercano".
            scrollTo(coords[key] + 90);
        }
    };

    const [formData, setFormData] = useState({
        category: initialCategory || '', subcategory: initialSubcategory || '', title: '', description: '', location: ''
    });
    const [images, setImages] = useState([]);
    const [videos, setVideos] = useState([]); // Added video state
    const [isLocating, setIsLocating] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showCategoryGrid, setShowCategoryGrid] = useState(false);
    const [showSubcategoryGrid, setShowSubcategoryGrid] = useState(false);
    const [locationDetected, setLocationDetected] = useState(false);
    const titleInputRef = useRef(null);
    const descriptionInputRef = useRef(null);
    const locationInputRef = useRef(null);

    useEffect(() => {
        let shouldFocus = false;
        if (initialCategory) {
            setFormData(prev => ({ ...prev, category: initialCategory }));
        }
        if (initialSubcategory) {
            setFormData(prev => ({ ...prev, subcategory: initialSubcategory }));
            shouldFocus = true;
        }

        if (shouldFocus) {
            setTimeout(() => {
                if (titleInputRef.current) {
                    titleInputRef.current.focus();
                }
            }, 500);
        }
    }, [initialCategory, initialSubcategory]);

    // ... (rest of logic same until render) ...

    const handleLocationChange = (text) => {
        setFormData(prev => ({ ...prev, location: text }));
        setLocationDetected(false);
        if (text.length > 2) {
            const filtered = FLAT_ZONES_SUGGESTIONS.filter(z => z.toLowerCase().includes(text.toLowerCase()));
            setSuggestions(filtered.slice(0, 3)); // Max 3 sugerencias
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };

    const handleSelectSuggestion = (zone) => {
        setFormData(prev => ({ ...prev, location: zone }));
        setShowSuggestions(false);
        setLocationDetected(true);
        // Cierra el teclado para mostrar la sección de adjuntos y el botón naranja
        if (locationInputRef.current) {
            locationInputRef.current.blur();
        }
    };

    const handleLocateMe = async () => {
        handleFocus('location');
        Keyboard.dismiss(); // Cierra el teclado inmediatamente en la misma acción
        setIsLocating(true);
        setLocationDetected(false);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                showAlert('Permiso denegado', 'Necesitamos permiso para acceder a tu ubicación.');
                setIsLocating(false);
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            let address = await Location.reverseGeocodeAsync(location.coords);

            if (address && address.length > 0) {
                const item = address[0];
                // Construir una ubicación aproximada (Municipio, Ciudad)
                const zone = item.subregion || item.city || item.region;
                let city = item.city || item.region || 'Venezuela';

                // Normalización para Caracas
                if (city.toLowerCase() === 'caracas' || city.toLowerCase() === 'distrito capital') {
                    city = 'Gran Caracas';
                }

                const formatted = `${zone}, ${city}`;
                setFormData(prev => ({ ...prev, location: formatted }));
                setLocationDetected(true);
            } else {
                showAlert('Error', 'No pudimos determinar tu zona.');
            }
        } catch (error) {
            console.warn(error);
            showAlert('Error', 'Ocurrió un error al obtener la ubicación.');
        } finally {
            setIsLocating(false);
        }
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            showAlert("Permiso requerido", "Necesitas dar permiso para acceder a la galería.");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            const compressedBase64 = await compressImage(result.assets[0].uri);
            setImages([...images, compressedBase64]);
            setTimeout(() => handleFocus('location'), 100);
        }
    };

    const pickVideo = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            showAlert("Permiso requerido", "Necesitas dar permiso para acceder a la galería.");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled) {
            setVideos([...videos, result.assets[0].uri]);
            setTimeout(() => handleFocus('location'), 100);
        }
    };

    const recordVideo = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        const audioResult = { granted: true }; // Microphone permission now implicit in camera/av plugins
        if (permissionResult.granted === false || audioResult.granted === false) {
            showAlert("Permiso requerido", "Necesitas dar permiso para usar la cámara y micrófono.");
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            videoMaxDuration: 15, // Limitar videos grabados a 15 segundos
        });

        if (!result.canceled) {
            setVideos([...videos, result.assets[0].uri]);
            setTimeout(() => handleFocus('location'), 100);
        }
    };

    const takePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
            showAlert("Permiso requerido", "Necesitas dar permiso para usar la cámara.");
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            quality: 0.5,
            base64: true,
            allowsEditing: false,
        });

        if (!result.canceled) {
            const compressedBase64 = await compressImage(result.assets[0].uri);
            setImages([...images, compressedBase64]);
            setTimeout(() => handleFocus('location'), 100);
        }
    };

    const handlePreSubmit = () => {
        if (!formData.title || !formData.category || !formData.subcategory) {
            showAlert('Faltan datos', 'Por favor elige una categoría, la especialidad y ponle un título a tu necesidad.');
            return;
        }

        const isLocValid = formData.location && FLAT_ZONES_SUGGESTIONS.includes(formData.location.trim());
        if (!isLocValid) {
            showAlert('Ubicación inválida', 'Por favor escribe tu Municipio y selecciónalo de la lista, o presiona el botón rojo para autodetectarlo.\n\nTranquilo, no rastrearemos tu ubicación exacta, solo usaremos el municipio como zona de referencia.');
            return;
        }

        if (!isLoggedIn) {
            onTriggerLogin({ pendingData: { ...formData, images } });
        } else {
            onSubmit({ ...formData, images });
        }
    };

    const userName = currentUser?.name?.split(' ')[0] || '';

    // Personalización dinámica del título según el nombre del usuario
    const getDynamicTitle = () => {
        const title = copy.title;
        if (!userName) return title;

        // Insertar nombre de forma natural
        if (title.toLowerCase().startsWith('encuentra')) return `${userName}, ${title.charAt(0).toLowerCase() + title.slice(1)}`;
        if (title.toLowerCase().startsWith('soluciona')) return `${userName}, ${title.charAt(0).toLowerCase() + title.slice(1)}`;
        if (title.toLowerCase().startsWith('cualquier')) return `${userName}, ${title.charAt(0).toLowerCase() + title.slice(1)}`;
        if (title.toLowerCase().startsWith('¿qué')) return `${userName}, ${title}`;
        if (title.toLowerCase().startsWith('tu red')) return `Tu red, ${userName}`;

        return `${userName}, ${title.charAt(0).toLowerCase() + title.slice(1)}`;
    };

    const personalizedGreeting = getDynamicTitle();

    // Lógica para placeholders dinámicos
    const getPlaceholders = () => {
        if (formData.category && formData.subcategory) {
            const catObj = allSubcategories[formData.category];
            if (catObj) {
                const subObj = catObj.find(s => s.name === formData.subcategory);
                if (subObj) {
                    return {
                        title: subObj.titlePlaceholder || CATEGORY_EXAMPLES['default'].title,
                        description: subObj.descriptionPlaceholder || CATEGORY_EXAMPLES['default'].description
                    };
                }
            }
            // Fallback to locally hardcoded if backend missing
            const key = `${formData.category}:${formData.subcategory}`;
            if (CATEGORY_EXAMPLES[key]) return CATEGORY_EXAMPLES[key];
        }
        if (formData.category && CATEGORY_EXAMPLES[formData.category]) {
            return CATEGORY_EXAMPLES[formData.category];
        }
        return CATEGORY_EXAMPLES['default'];
    };

    const placeholders = getPlaceholders();

    const handleQuickAction = (cat, sub) => {
        setFormData(prev => ({ ...prev, category: cat, subcategory: sub }));
        // Esperamos a que el re-render muestre los campos y luego enfocamos
        setTimeout(() => {
            if (titleInputRef.current) {
                titleInputRef.current.focus();
            }
        }, 400);
    };

    return (
        <View style={styles.serviceFormCard}>
            <View style={[styles.serviceFormHeader, { flexDirection: 'row', alignItems: 'center' }]}>
                <View style={{ flex: 1, paddingRight: 15 }}>
                    <Text style={styles.serviceFormTitle}>{personalizedGreeting}</Text>
                </View>

            </View>
            <View style={styles.serviceFormContent}>
                {/* QuickActionsRow removed from here - moved below to UrgencyBanner */}
                <View style={{ marginBottom: 16 }}>
                    <Text style={styles.label}>Tipo de servicio</Text>
                    <TouchableOpacity
                        style={styles.pickerContainer}
                        onPress={() => setShowCategoryGrid(true)}
                    >
                        <Text style={[styles.input, { color: formData.category ? '#1F2937' : '#9CA3AF', fontWeight: 'bold', fontSize: 17 }]}>
                            {formData.category || "Seleccione..."}
                        </Text>
                        <ChevronDown name="chevron-down" size={20} color="#EA580C" />
                    </TouchableOpacity>
                </View>

                <CategoryGridModal
                    visible={showCategoryGrid}
                    onClose={() => setShowCategoryGrid(false)}
                    categories={categories}
                    onSelect={(c) => {
                        setFormData({ ...formData, category: c, subcategory: '' });
                        // Animación es fade, se puede abrir a los 100ms sin errores
                        setTimeout(() => setShowSubcategoryGrid(true), 100);
                    }}
                />

                {formData.category ? (
                    <View style={{ marginBottom: 16 }}>
                        <Text style={styles.label}>Especifica el servicio</Text>
                        <TouchableOpacity
                            style={styles.pickerContainer}
                            onPress={() => setShowSubcategoryGrid(true)}
                        >
                            <Text style={[styles.input, { color: formData.subcategory ? '#1F2937' : '#9CA3AF', fontWeight: 'bold', fontSize: 17 }]}>
                                {formData.subcategory || "Seleccione..."}
                            </Text>
                            <ChevronDown name="chevron-down" size={20} color="#EA580C" />
                        </TouchableOpacity>
                    </View>
                ) : null}

                <SubcategoryGridModal
                    visible={showSubcategoryGrid}
                    onClose={() => setShowSubcategoryGrid(false)}
                    categoryName={formData.category}
                    subcategories={allSubcategories[formData.category] || []}
                    color={categories.find(c => c.name === formData.category)?.color}
                    iconColor={categories.find(c => c.name === formData.category)?.iconColor}
                    onSelect={(s) => {
                        setFormData({ ...formData, subcategory: s });
                        // Auto-focus Title after selection - wait for render
                        setTimeout(() => {
                            handleFocus('title');
                            if (titleInputRef.current) {
                                titleInputRef.current.focus();
                            }
                        }, 500);
                    }}
                />
                {formData.category && formData.subcategory ? (
                    <>
                        <View style={styles.inputGroup} onLayout={(e) => handleLayout('title', e)}>
                            <Text style={styles.label}>Ponle un título a tu necesidad</Text>
                            <TextInput
                                ref={titleInputRef}
                                style={styles.inputBox}
                                placeholder={placeholders.title}
                                placeholderTextColor="#9CA3AF"
                                value={formData.title}
                                onChangeText={t => setFormData({ ...formData, title: t })}
                                returnKeyType="next"
                                onFocus={() => handleFocus('title')}
                                onSubmitEditing={() => {
                                    handleFocus('description');
                                    if (descriptionInputRef.current) {
                                        descriptionInputRef.current.focus();
                                    }
                                }}
                            />
                        </View>
                        <View style={styles.inputGroup} onLayout={(e) => handleLayout('description', e)}>
                            <Text style={styles.label}>Explícanos qué sucede</Text>
                            <TextInput
                                ref={descriptionInputRef}
                                style={[styles.inputBox, { height: 120, textAlignVertical: 'top' }]}
                                multiline
                                placeholder={placeholders.description}
                                placeholderTextColor="#9CA3AF"
                                value={formData.description}
                                onChangeText={t => setFormData({ ...formData, description: t })}
                                blurOnSubmit={true}
                                returnKeyType="next"
                                onFocus={() => handleFocus('description')}
                                onSubmitEditing={() => {
                                    handleFocus('location');
                                    if (locationInputRef.current) {
                                        locationInputRef.current.focus();
                                    }
                                }}
                            />
                        </View>
                    </>
                ) : null}
                <View style={[styles.inputGroup, { zIndex: 10 }]} onLayout={(e) => handleLayout('location', e)}>
                    <Text style={styles.label}>¿Dónde necesitas el servicio?</Text>

                    <Text style={[styles.privacyNote, { textAlign: 'left', marginBottom: 8, marginTop: 4 }]}>
                        Solo detectaremos tu municipio.
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <View style={[styles.inputWrapper, { flex: 1, marginTop: 0, zIndex: 100, position: 'relative' }]}>
                            <TextInput
                                ref={locationInputRef}
                                style={{ flex: 1, paddingVertical: 12, fontSize: 17, color: '#111827', fontWeight: 'bold' }}
                                placeholder="Ej: Chacao, Hatillo..."
                                placeholderTextColor="#9CA3AF"
                                value={formData.location}
                                onChangeText={handleLocationChange}
                                returnKeyType="done"
                                onFocus={() => handleFocus('location')}
                                onSubmitEditing={() => {
                                    // Cuando se le da Enter/Realiz en ubicación, baja el teclado para ver los anexos
                                    if (locationInputRef.current) {
                                        locationInputRef.current.blur();
                                    }
                                    
                                    if (formData.location && formData.location.length > 2 && !FLAT_ZONES_SUGGESTIONS.includes(formData.location.trim())) {
                                        showAlert('Precisión de Ubicación', 'No pudimos verificar esa zona. Por favor escribe tu Municipio y selecciónalo de las sugerencias, o toca el botón a la derecha para autodetectar tu ubicación (Solo tomaremos el municipio, no tu ubicación exacta).');
                                    }

                                    handleFocus('media');
                                }}
                            />
                            {locationDetected && (
                                <Feather name="check-circle" size={20} color="#10B981" style={{ marginLeft: 5 }} />
                            )}

                            {/* Autocomplete Suggestions placed INSIDE the wrapper */}
                            {showSuggestions && suggestions.length > 0 && (
                                <View style={styles.suggestionsContainer}>
                                    {suggestions.map((s, i) => (
                                        <TouchableOpacity
                                            key={i}
                                            style={styles.suggestionItem}
                                            onPress={() => handleSelectSuggestion(s)}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <MapPin name="map-pin" size={14} color="#6B7280" style={{ marginRight: 8 }} />
                                                <Text style={styles.suggestionText}>{s}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.locationIconButton, { marginLeft: 12 }]}
                            onPress={handleLocateMe}
                            disabled={isLocating}
                        >
                            {isLocating ? (
                                <ActivityIndicator size="small" color="#EF4444" />
                            ) : (
                                <MaterialCommunityIcons name="map-marker" size={28} color="#EF4444" />
                            )}
                        </TouchableOpacity>
                    </View>
                    {(!formData.location || !FLAT_ZONES_SUGGESTIONS.includes(formData.location.trim())) && formData.location.length > 2 && !showSuggestions && (
                        <Text style={{ color: '#EF4444', fontSize: 13, marginTop: 8 }}>
                            Por favor selecciona un municipio de la lista o autodetecta tu zona.
                        </Text>
                    )}
                </View>
                <View style={[styles.inputGroup, { marginTop: 15 }]} onLayout={(e) => handleLayout('media', e)}>
                    <Text style={styles.label}>Complementa con una imagen o Vídeo</Text>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: -2, marginBottom: 5, fontStyle: 'italic' }}>*Añadir multimedia ayuda a recibir mejores presupuestos.</Text>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                        {/* Botón: Subir Archivo */}
                        <TouchableOpacity
                            style={{
                                flex: 1,
                                height: 50,
                                backgroundColor: '#F3F4F6',
                                borderRadius: 12,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 8,
                                flexDirection: 'row',
                                borderWidth: 1,
                                borderColor: '#E5E7EB'
                            }}
                            onPress={pickImage}
                        >
                            <Feather name="file-plus" size={20} color="#4B5563" style={{ marginRight: 8 }} />
                            <Text style={{ color: '#4B5563', fontWeight: 'bold', fontSize: 13 }}>Archivo</Text>
                        </TouchableOpacity>

                        {/* Botón: Foto */}
                        <TouchableOpacity
                            style={{
                                flex: 1,
                                height: 50,
                                backgroundColor: '#EFF6FF',
                                borderRadius: 12,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 8,
                                flexDirection: 'row',
                                borderWidth: 1,
                                borderColor: '#BFDBFE'
                            }}
                            onPress={takePhoto}
                        >
                            <Feather name="camera" size={20} color="#2563EB" style={{ marginRight: 8 }} />
                            <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 13 }}>Foto</Text>
                        </TouchableOpacity>

                        {/* Botón: Vídeo */}
                        <TouchableOpacity
                            style={{
                                flex: 1,
                                height: 50,
                                backgroundColor: '#FEF2F2',
                                borderRadius: 12,
                                justifyContent: 'center',
                                alignItems: 'center',
                                flexDirection: 'row',
                                borderWidth: 1,
                                borderColor: '#FECACA'
                            }}
                            onPress={() => {
                                Alert.alert(
                                    "Añadir Video",
                                    "¿Grabar o Galería?",
                                    [
                                        { text: "Grabar", onPress: recordVideo },
                                        { text: "Galería", onPress: pickVideo },
                                        { text: "Cancelar", style: "cancel" }
                                    ]
                                );
                            }}
                        >
                            <Feather name="play-circle" size={20} color="#DC2626" style={{ marginRight: 8 }} />
                            <Text style={{ color: '#DC2626', fontWeight: 'bold', fontSize: 13 }}>Vídeo</Text>
                        </TouchableOpacity>
                    </View>

                    {(images.length > 0 || videos.length > 0) && (
                        <ScrollView horizontal style={{ marginTop: 12 }} showsHorizontalScrollIndicator={false}>
                            {images.map((img, i) => (
                                <View key={`img-${i}`} style={{ marginRight: 10, position: 'relative' }}>
                                    <Image source={{ uri: img }} style={{ width: 70, height: 70, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' }} />
                                    <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: 2 }}>
                                        <Feather name="check" size={10} color="white" />
                                    </View>
                                </View>
                            ))}
                            {videos.map((vid, i) => (
                                <View key={`vid-${i}`} style={{ width: 70, height: 70, borderRadius: 10, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: '#E5E7EB' }}>
                                    <Feather name="play-circle" color="white" size={24} />
                                </View>
                            ))}
                        </ScrollView>
                    )}


                </View>

                <TouchableOpacity
                    style={[
                        styles.searchButton,
                        (!formData.title || !formData.category || !formData.subcategory || !formData.location || !FLAT_ZONES_SUGGESTIONS.includes(formData.location.trim())) && { backgroundColor: '#9CA3AF' }
                    ]}
                    onPress={handlePreSubmit}
                >
                    <Text style={styles.searchButtonText}>{copy.buttonText}</Text>
                    <ChevronRight color="white" size={20} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default ServiceForm;
