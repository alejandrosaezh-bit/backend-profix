import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, StyleSheet, Dimensions, Linking, useWindowDimensions } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';



const ICON_MAP = {
    'Hogar': 'home',
    'Autos': 'truck',
    'Automotriz': 'truck',
    'Mascotas': 'heart',
    'Evento': 'calendar',
    'Eventos': 'calendar',
    'Salud': 'activity',
    'Salud y Bienestar': 'activity',
    'Belleza': 'scissors',
    'Belleza y Estética': 'scissors',
    'Tech': 'cpu',
    'Tecnología': 'cpu',
    'Asesoría': 'briefcase',
    'Empresas': 'briefcase'
};

const levelNames = { 1: 'ASPIRANTE', 2: 'VERIFICADO', 3: 'DESTACADO', 4: 'MAESTRO' };

export default function ProfessionalProfileView({
    user,
    profileData,
    categoryKey,
    isOwner,
    isPreviewMode,
    activeTheme,
    activeColor,
    catReviews = [],
    categoryStats = { jobs: 0, rating: 0, success: '0%' },
    combinedHistory = [],
    isLoadingProfile,
    isCategoryActive,
    isCategoryUncreated,
    onActivateCategory,
    setOuterScrollEnabled,
    onViewImage,
    onViewGallery,
    onContact,
    onEditProfile,
    onChangeCategory,
    onGamification,
    topInset = 0,
    onClose,
    children
}) {
    const { width: SCREEN_WIDTH } = useWindowDimensions();

    const getAvatarUri = () => {
        if (user?.avatar?.startsWith('data:image')) return user.avatar;
        if (user?.avatar?.startsWith('http')) return user.avatar;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Pro')}&background=random`;
    };

    const ratingAvg = catReviews.length > 0 ? (catReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / catReviews.length).toFixed(1) : '0.0';

    const subcategories = profileData?.subcategories?.length ? profileData.subcategories : ['Servicios generales'];
    
    // Formateador inteligente de Zonas para no repetir la región (ej. "Gran Caracas")
    const rawZones = profileData?.zones?.length ? profileData.zones : ['No especificadas'];
    let formattedZonesStr = '';
    if (rawZones[0] === 'No especificadas') {
        formattedZonesStr = 'No especificadas';
    } else {
        const regionMap = {};
        rawZones.forEach(z => {
            const parts = z.split(',');
            const region = parts.length > 1 ? parts[parts.length - 1].trim() : 'Zonas';
            const city = parts[0].trim();
            if (!regionMap[region]) regionMap[region] = [];
            if (!regionMap[region].includes(city)) regionMap[region].push(city);
        });
        formattedZonesStr = Object.entries(regionMap)
            .map(([region, cities]) => `${region}: ${cities.join(', ')}`)
            .join(' • ');
    }

    const bio = profileData?.bio || 'Profesional disponible para nuevos proyectos.';

    // Nuevas Estadísticas Derivadas
    const jobsWon = categoryStats.jobs || 0;
    const isVerified = user?.isVerified || true; // TODO: conectar con estado real
    
    // Calcular "Cotizaciones Enviadas" a partir del % de éxito si no existe en la BD
    let quotesSent = categoryStats.quotes || 0;
    if (quotesSent === 0 && jobsWon > 0) {
        const successRate = parseInt(categoryStats.success) || 30; // default 30%
        quotesSent = Math.round(jobsWon / (successRate / 100));
    }

    // Galerías separadas: Fotos de Presentación vs Portafolio de Trabajos
    const presentationImages = profileData?.gallery || [];
    const hiddenImages = profileData?.hiddenPortfolioImages || [];
    const portfolioImages = [];
    const portfolioImagesWithDetails = [];
    combinedHistory.forEach(item => {
        if (item.images) {
            const visibleJobImages = item.images.filter(img => !hiddenImages.includes(img));
            visibleJobImages.forEach(img => { 
                if (!portfolioImages.includes(img)) {
                    portfolioImages.push(img);
                    portfolioImagesWithDetails.push({ 
                        url: img, 
                        rating: item.review?.rating || null,
                        jobId: item.id,
                        title: item.title,
                        jobImages: visibleJobImages
                    });
                }
            });
        }
    });

    // --------------------------------------------------------------------------------
    // RENDER: THEME MODULAR (Dark Mode, Widgets)
    // --------------------------------------------------------------------------------
    const renderModular = () => {
        return (
            <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 16, paddingTop: Math.max(topInset + 10, 16) }}>
                {/* BACK BUTTON */}
                {(!isOwner || isPreviewMode) && (
                    <TouchableOpacity onPress={onClose} style={{ marginBottom: 15 }}>
                        <Feather name="arrow-left" size={24} color="white" />
                    </TouchableOpacity>
                )}

                {/* VIDEO / HERO PRESENTATION */}
                {profileData?.presentationVideoUrl ? (
                    <View style={{ width: '100%', height: 220, backgroundColor: '#1E293B', borderRadius: 20, overflow: 'hidden', marginBottom: 20 }}>
                        <ExpoImage source={{ uri: profileData.presentationVideoUrl.endsWith('.mp4') ? profileData.presentationVideoUrl.replace('.mp4', '.jpg') : profileData.presentationVideoUrl }} style={{ width: '100%', height: '100%', opacity: 0.6 }} />
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                            <Feather name="play-circle" size={54} color="white" />
                        </View>
                        <View style={{ position: 'absolute', bottom: 15, left: 15 }}>
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>VIDEO DE PRESENTACIÓN</Text>
                        </View>
                    </View>
                ) : (
                    presentationImages.length > 0 && (
                        <View style={{ marginBottom: 20 }}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}
                            onTouchStart={() => setOuterScrollEnabled && setOuterScrollEnabled(false)}
                            onTouchEnd={() => setOuterScrollEnabled && setOuterScrollEnabled(true)}
                            onTouchCancel={() => setOuterScrollEnabled && setOuterScrollEnabled(true)}
                            onScrollEndDrag={() => setOuterScrollEnabled && setOuterScrollEnabled(true)}>
                                {presentationImages.map((img, idx) => (
                                    <TouchableOpacity key={idx} onPress={() => onViewImage && onViewImage(img)}>
                                        <ExpoImage source={{ uri: img }} style={{ width: SCREEN_WIDTH - 60, height: 200, borderRadius: 20, marginRight: 15 }} />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )
                )}

                {/* IDENTITY CARD */}
                <View style={{ backgroundColor: '#1E293B', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                    <TouchableOpacity onPress={() => onViewImage && onViewImage(getAvatarUri())}>
                        <ExpoImage source={{ uri: getAvatarUri() }} style={{ width: 70, height: 70, borderRadius: 35, marginRight: 15 }} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginRight: 8 }}>{profileData?.name || user?.name}</Text>
                            {isVerified && <View style={{ backgroundColor: '#10B981', borderRadius: 12, padding: 2 }}><Feather name="check" size={12} color="white" /></View>}
                        </View>
                        <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 2 }} numberOfLines={1}>{subcategories.join(', ')}</Text>
                        <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}><Feather name="map-pin" size={10} /> {formattedZonesStr}</Text>
                    </View>
                </View>

                {/* STATS BLOCKS */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20, gap: 10 }}>
                    <View style={{ backgroundColor: '#1E293B', borderRadius: 15, width: '48%', padding: 15, alignItems: 'center' }}>
                        <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: 'bold', marginBottom: 5 }}>NIVEL</Text>
                        <Text style={{ color: activeColor || '#38BDF8', fontSize: 18, fontWeight: 'bold' }}>{levelNames[user?.gamification?.currentLevel || 1]}</Text>
                    </View>
                    <View style={{ backgroundColor: '#1E293B', borderRadius: 15, width: '48%', padding: 15, alignItems: 'center' }}>
                        <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: 'bold', marginBottom: 5 }}>VALORACIÓN</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ color: '#FBBF24', fontSize: 18, fontWeight: 'bold', marginRight: 4 }}>{ratingAvg}</Text>
                            <FontAwesome5 name="star" solid size={12} color="#FBBF24" />
                        </View>
                    </View>
                    <View style={{ backgroundColor: '#1E293B', borderRadius: 15, width: '48%', padding: 15, alignItems: 'center' }}>
                        <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: 'bold', marginBottom: 5 }}>COTIZADAS</Text>
                        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>{quotesSent}</Text>
                    </View>
                    <View style={{ backgroundColor: '#1E293B', borderRadius: 15, width: '48%', padding: 15, alignItems: 'center' }}>
                        <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: 'bold', marginBottom: 5 }}>GANADAS</Text>
                        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>{jobsWon}</Text>
                    </View>
                </View>

                {/* ABOUT */}
                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Sobre Mí</Text>
                <View style={{ backgroundColor: '#1E293B', borderRadius: 15, padding: 16, marginBottom: 20 }}>
                    <Text style={{ color: '#CBD5E1', fontSize: 14, lineHeight: 22 }}>{bio}</Text>
                </View>

                {/* PORTFOLIO (TRABAJOS REALIZADOS) */}
                {combinedHistory.length > 0 && (
                    <>
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>Portafolio de Trabajos</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}
                            onTouchStart={() => setOuterScrollEnabled && setOuterScrollEnabled(false)}
                            onTouchEnd={() => setOuterScrollEnabled && setOuterScrollEnabled(true)}
                            onTouchCancel={() => setOuterScrollEnabled && setOuterScrollEnabled(true)}
                            onScrollEndDrag={() => setOuterScrollEnabled && setOuterScrollEnabled(true)} style={{ marginBottom: 20 }}>
                            {combinedHistory.map((item, idx) => {
                                const visibleImages = (item.images || []).filter(img => !hiddenImages.includes(img));
                                if (item.images?.length > 0 && visibleImages.length === 0) return null; // Skip if all were hidden
                                return (
                                <TouchableOpacity key={idx} style={{ width: 160, height: 160, borderRadius: 15, marginRight: 12, overflow: 'hidden', backgroundColor: '#1E293B', position: 'relative' }} onPress={() => {
                                    if (visibleImages.length) {
                                        if (onViewGallery) onViewGallery({ title: item.title, images: visibleImages, rating: item.review?.rating, jobId: item.id });
                                        else if (onViewImage) onViewImage(visibleImages[0]);
                                    }
                                }}>
                                    {visibleImages.length > 0 ? (
                                        <ExpoImage source={{ uri: visibleImages[0] }} style={{ width: '100%', height: '100%', opacity: 0.8 }} />
                                    ) : (
                                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Feather name="image" size={30} color="#334155" /></View>
                                    )}
                                    <View style={{ position: 'absolute', bottom: 10, left: 10, right: 10 }}>
                                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }} numberOfLines={2}>{item.title}</Text>
                                    </View>
                                    {item.review?.rating && (
                                        <View style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold', marginRight: 4 }}>{item.review.rating.toFixed(1)}</Text>
                                            <FontAwesome5 name="star" solid size={10} color="#FBBF24" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </>
                )}

                {/* TESTIMONIALS */}
                {combinedHistory.some(h => h.review) && (
                    <>
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>Testimonios</Text>
                        {combinedHistory.filter(h => h.review).slice(0, 3).map((item, idx) => (
                            <View key={idx} style={{ backgroundColor: '#1E293B', borderRadius: 15, padding: 15, marginBottom: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <ExpoImage source={{ uri: item.review?.reviewer?.avatar || 'https://ui-avatars.com/api/?name=C' }} style={{ width: 30, height: 30, borderRadius: 15, marginRight: 10 }} />
                                    <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold' }}>{item.review?.reviewer?.name || 'Cliente'}</Text>
                                </View>
                                <Text style={{ color: '#CBD5E1', fontSize: 13, fontStyle: 'italic' }}>&quot;{item.review?.comment}&quot;</Text>
                            </View>
                        ))}
                    </>
                )}
                
                <View style={{ height: 40 }} />
            </View>
        );
    };

    // --------------------------------------------------------------------------------
    // RENDER: THEME CLÁSICO (LinkedIn / CV Style)
    // --------------------------------------------------------------------------------
    const renderClasico = () => {
        return (
            <View style={{ flex: 1, backgroundColor: 'white' }}>
                {/* HEADER COLOR */}
                <View style={{ backgroundColor: activeColor || '#3B82F6', height: 120 + topInset, position: 'relative' }}>
                    {(!isOwner || isPreviewMode) && (
                        <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: topInset + 20, left: 20, zIndex: 10 }}>
                            <Feather name="arrow-left" size={24} color="white" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* AVATAR OVERLAP */}
                <View style={{ alignItems: 'center', marginTop: -75, paddingHorizontal: 20 }}>
                    <TouchableOpacity onPress={() => onViewImage && onViewImage(getAvatarUri())}>
                        <View style={{ width: 150, height: 150, borderRadius: 75, backgroundColor: 'white', padding: 5, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, position: 'relative' }}>
                            <ExpoImage source={{ uri: getAvatarUri() }} style={{ width: '100%', height: '100%', borderRadius: 70 }} />
                            {isVerified && (
                                <View style={{ position: 'absolute', bottom: 4, right: 4, backgroundColor: '#10B981', borderRadius: 14, padding: 5, borderWidth: 3, borderColor: 'white' }}>
                                    <Feather name="check" size={16} color="white" />
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginTop: 10, textAlign: 'center' }}>{profileData?.name || user?.name}</Text>
                    <Text style={{ fontSize: 15, color: activeColor || '#3B82F6', fontWeight: 'bold', marginTop: 4, textAlign: 'center' }}>{subcategories.join(' • ')}</Text>
                    <Text style={{ fontSize: 14, color: '#64748B', marginTop: 4, textAlign: 'center' }}><Feather name="map-pin" size={12} /> {formattedZonesStr}</Text>
                </View>

                <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
                    {/* ACTION BUTTONS */}
                    {(!isOwner || isPreviewMode) && (
                        <View style={{ flexDirection: 'row', marginTop: 20, marginBottom: 10, gap: 10 }}>
                            <TouchableOpacity style={{ flex: 1, backgroundColor: activeColor || '#3B82F6', paddingVertical: 12, borderRadius: 25, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }} onPress={onContact}>
                                <Feather name="message-circle" size={18} color="white" style={{ marginRight: 8 }} />
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>Contactar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ flex: 1, backgroundColor: 'white', borderWidth: 1, borderColor: activeColor || '#3B82F6', paddingVertical: 12, borderRadius: 25, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }} onPress={() => portfolioImages.length > 0 && onViewImage && onViewImage(portfolioImages[0])}>
                                <Feather name="image" size={18} color={activeColor || '#3B82F6'} style={{ marginRight: 8 }} />
                                <Text style={{ color: activeColor || '#3B82F6', fontWeight: 'bold', fontSize: 14 }}>Galería</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* STATS LIST */}
                    <View style={{ backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, marginTop: 20, flexDirection: 'row', flexWrap: 'wrap' }}>
                        <View style={{ width: '50%', flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(251, 191, 36, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                <FontAwesome5 name="star" solid size={14} color="#D97706" />
                            </View>
                            <View>
                                <Text style={{ fontSize: 12, color: '#64748B' }}>Valoración</Text>
                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E293B' }}>{ratingAvg} ({catReviews.length})</Text>
                            </View>
                        </View>
                        <View style={{ width: '50%', flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(56, 189, 248, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                <Feather name="award" size={14} color="#0284C7" />
                            </View>
                            <View>
                                <Text style={{ fontSize: 12, color: '#64748B' }}>Nivel</Text>
                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E293B' }}>{levelNames[user?.gamification?.currentLevel || 1]}</Text>
                            </View>
                        </View>
                        <View style={{ width: '50%', flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(16, 185, 129, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                <Feather name="briefcase" size={14} color="#059669" />
                            </View>
                            <View>
                                <Text style={{ fontSize: 12, color: '#64748B' }}>Ganadas</Text>
                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E293B' }}>{jobsWon} Trabajos</Text>
                            </View>
                        </View>
                        <View style={{ width: '50%', flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(99, 102, 241, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                <Feather name="send" size={14} color="#4F46E5" />
                            </View>
                            <View>
                                <Text style={{ fontSize: 12, color: '#64748B' }}>Cotizadas</Text>
                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E293B' }}>{quotesSent} Veces</Text>
                            </View>
                        </View>
                    </View>

                    {/* PRESENTATION */}
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 25, marginBottom: 10 }}>Sobre Mí</Text>
                    <Text style={{ fontSize: 14, color: '#4B5563', lineHeight: 22, marginBottom: 15 }}>{bio}</Text>
                    
                    {presentationImages.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}
                            onTouchStart={() => setOuterScrollEnabled && setOuterScrollEnabled(false)}
                            onTouchEnd={() => setOuterScrollEnabled && setOuterScrollEnabled(true)}
                            onTouchCancel={() => setOuterScrollEnabled && setOuterScrollEnabled(true)}
                            onScrollEndDrag={() => setOuterScrollEnabled && setOuterScrollEnabled(true)} style={{ marginBottom: 10 }}>
                            {presentationImages.map((img, idx) => (
                                <TouchableOpacity key={idx} onPress={() => onViewImage && onViewImage(img)}>
                                    <ExpoImage source={{ uri: img }} style={{ width: 120, height: 120, borderRadius: 12, marginRight: 10 }} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    {/* PORTFOLIO TIMELINE */}
                    {combinedHistory.length > 0 && (
                        <>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 25, marginBottom: 15 }}>Portafolio de Trabajos</Text>
                            {combinedHistory.map((item, idx) => {
                                const visibleImages = (item.images || []).filter(img => !hiddenImages.includes(img));
                                if (item.images?.length > 0 && visibleImages.length === 0) return null;
                                return (
                                <View key={idx} style={{ flexDirection: 'row', marginBottom: 20, backgroundColor: 'white', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F1F5F9' }}>
                                    {visibleImages.length > 0 ? (
                                        <TouchableOpacity style={{ position: 'relative' }} onPress={() => {
                                            if (onViewGallery) onViewGallery({ title: item.title, images: visibleImages, rating: item.review?.rating, jobId: item.id });
                                            else if (onViewImage) onViewImage(visibleImages[0]);
                                        }}>
                                            <ExpoImage source={{ uri: visibleImages[0] }} style={{ width: 80, height: 80, borderRadius: 8, marginRight: 15 }} />
                                            {item.review?.rating && (
                                                <View style={{ position: 'absolute', top: 4, right: 19, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, paddingHorizontal: 4, paddingVertical: 2, flexDirection: 'row', alignItems: 'center' }}>
                                                    <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold', marginRight: 2 }}>{item.review.rating.toFixed(1)}</Text>
                                                    <FontAwesome5 name="star" solid size={8} color="#FBBF24" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 15 }}>
                                            <Feather name="image" size={24} color="#CBD5E1" />
                                        </View>
                                    )}
                                    <View style={{ flex: 1, justifyContent: 'center' }}>
                                        <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 }}>{item.title}</Text>
                                        {item.review ? (
                                            <View>
                                                <Text style={{ fontSize: 12, color: '#10B981', fontWeight: 'bold' }}>Trabajo Calificado</Text>
                                                <Text style={{ fontSize: 13, color: '#64748B', fontStyle: 'italic', marginTop: 4 }} numberOfLines={2}>&quot;{item.review.comment}&quot;</Text>
                                            </View>
                                        ) : (
                                            <Text style={{ fontSize: 13, color: '#64748B' }}>Proyecto completado con éxito.</Text>
                                        )}
                                    </View>
                                </View>
                                );
                            })}
                        </>
                    )}
                </View>
            </View>
        );
    };

    // --------------------------------------------------------------------------------
    // RENDER: THEME SOCIAL (Instagram Style)
    // --------------------------------------------------------------------------------
    const renderSocial = () => {
        const gap = 1;
        const itemSize = (SCREEN_WIDTH - (gap * 2)) / 3;
        
        return (
            <View style={{ flex: 1, backgroundColor: 'white' }}>
                {/* HEADER (Top bar) */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingTop: Math.max(topInset + 10, 15), paddingBottom: 10 }}>
                    {(!isOwner || isPreviewMode) ? (
                        <TouchableOpacity onPress={onClose} style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Feather name="arrow-left" size={24} color="#111827" />
                            <Text style={{ fontSize: 18, fontWeight: 'bold', marginLeft: 15, color: '#111827' }}>{profileData?.name || user?.name}</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>{profileData?.name || user?.name}</Text>
                        </View>
                    )}
                </View>

                {/* PROFILE HEADER INFO (Avatar + Stats) */}
                <View style={{ flexDirection: 'row', paddingHorizontal: 15, marginTop: 5, alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => onViewImage && onViewImage(getAvatarUri())}>
                        <View style={{ width: 86, height: 86, borderRadius: 43, borderWidth: 2, borderColor: activeColor || '#E2E8F0', padding: 3 }}>
                            <ExpoImage source={{ uri: getAvatarUri() }} style={{ width: '100%', height: '100%', borderRadius: 40 }} />
                        </View>
                    </TouchableOpacity>
                    
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-around', marginLeft: 15 }}>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>{levelNames[user?.gamification?.currentLevel || 1]}</Text>
                            <Text style={{ fontSize: 13, color: '#111827' }}>Nivel</Text>
                        </View>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>{quotesSent}</Text>
                            <Text style={{ fontSize: 13, color: '#111827' }}>Enviadas</Text>
                        </View>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>{jobsWon}</Text>
                            <Text style={{ fontSize: 13, color: '#111827' }}>Ganadas</Text>
                        </View>
                    </View>
                </View>

                {/* BIO AND DETAILS (Left aligned) */}
                <View style={{ paddingHorizontal: 15, marginTop: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111827' }}>{profileData?.name || user?.name}</Text>
                        {isVerified && <Feather name="check-circle" size={14} color={activeColor || "#3B82F6"} style={{ marginLeft: 4 }} />}
                    </View>
                    <Text style={{ fontSize: 14, color: '#64748B', marginTop: 2 }}>{subcategories.join(', ')}</Text>
                    <Text style={{ fontSize: 14, color: '#111827', marginTop: 2, lineHeight: 20 }}>{bio}</Text>
                    <Text style={{ fontSize: 13, color: '#3B82F6', marginTop: 4, fontWeight: '500' }}><Feather name="map-pin" size={12} /> {formattedZonesStr}</Text>
                </View>

                {/* ACTION BUTTONS */}
                {(!isOwner || isPreviewMode) && (
                    <View style={{ flexDirection: 'row', marginTop: 15, paddingHorizontal: 15, gap: 8 }}>
                        <TouchableOpacity style={{ flex: 1, backgroundColor: '#EFEFEF', paddingVertical: 8, borderRadius: 8, alignItems: 'center' }} onPress={onContact}>
                            <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 14 }}>Contactar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ flex: 1, backgroundColor: '#EFEFEF', paddingVertical: 8, borderRadius: 8, alignItems: 'center' }}>
                            <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 14 }}>Mensaje</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* PRESENTATION CAROUSEL (Highlights) */}
                {presentationImages.length > 0 && (
                    <View style={{ marginTop: 20, paddingBottom: 10 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}
                            onTouchStart={() => setOuterScrollEnabled && setOuterScrollEnabled(false)}
                            onTouchEnd={() => setOuterScrollEnabled && setOuterScrollEnabled(true)}
                            onTouchCancel={() => setOuterScrollEnabled && setOuterScrollEnabled(true)}
                            onScrollEndDrag={() => setOuterScrollEnabled && setOuterScrollEnabled(true)} style={{ paddingHorizontal: 10 }}>
                            {presentationImages.map((img, idx) => (
                                <View key={idx} style={{ alignItems: 'center', marginHorizontal: 8 }}>
                                    <TouchableOpacity onPress={() => onViewImage && onViewImage(img)}>
                                        <View style={{ width: 64, height: 64, borderRadius: 32, padding: 2, borderWidth: 1, borderColor: '#D1D5DB' }}>
                                            <View style={{ width: '100%', height: '100%', borderRadius: 30, borderWidth: 2, borderColor: 'white', overflow: 'hidden' }}>
                                                <ExpoImage source={{ uri: img }} style={{ width: '100%', height: '100%' }} />
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                    <Text style={{ fontSize: 11, color: '#111827', marginTop: 4, maxWidth: 64 }} numberOfLines={1}>
                                        Trabajo {idx + 1}
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* GRID TABS */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', height: 44, borderTopWidth: 1, borderColor: '#F1F5F9' }}>
                    <View style={{ flex: 1, alignItems: 'center', borderBottomWidth: 1, borderColor: '#111827', paddingVertical: 10 }}>
                        <Feather name="grid" size={24} color="#111827" />
                    </View>
                    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 10 }}>
                        <Feather name="star" size={24} color="#9CA3AF" />
                    </View>
                </View>

                {/* PORTFOLIO GRID */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: gap }}>
                    {portfolioImagesWithDetails.length > 0 ? portfolioImagesWithDetails.map((item, idx) => (
                        <TouchableOpacity key={idx} style={{ position: 'relative' }} onPress={() => {
                            if (onViewGallery) onViewGallery({ title: item.title, images: item.jobImages, rating: item.rating, jobId: item.jobId });
                            else if (onViewImage) onViewImage(item.url);
                        }}>
                            <ExpoImage source={{ uri: item.url }} style={{ width: itemSize, height: itemSize, backgroundColor: '#F1F5F9' }} />
                            {item.rating && (
                                <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold', marginRight: 3 }}>{item.rating.toFixed(1)}</Text>
                                    <FontAwesome5 name="star" solid size={8} color="#FBBF24" />
                                </View>
                            )}
                        </TouchableOpacity>
                    )) : (
                        <View style={{ width: '100%', padding: 40, alignItems: 'center' }}>
                            <Feather name="grid" size={40} color="#E2E8F0" />
                            <Text style={{ color: '#94A3B8', marginTop: 10 }}>Sin trabajos en el portafolio</Text>
                        </View>
                    )}
                </View>
                
                {/* TESTIMONIALS (SOCIAL) */}
                {combinedHistory.some(h => h.review) && (
                    <View style={{ marginTop: 25, paddingHorizontal: 20 }}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 15 }}>Reseñas Destacadas</Text>
                        {combinedHistory.filter(h => h.review).map((item, idx) => (
                            <View key={idx} style={{ flexDirection: 'row', marginBottom: 15 }}>
                                <ExpoImage source={{ uri: item.review?.reviewer?.avatar || 'https://ui-avatars.com/api/?name=C' }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 12 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#111827' }}>{item.review?.reviewer?.name || 'Cliente'} <Text style={{ fontWeight: 'normal', color: '#64748B' }}>para {item.title}</Text></Text>
                                    <Text style={{ fontSize: 13, color: '#111827', marginTop: 4, lineHeight: 18 }}>{item.review?.comment}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
                
                <View style={{ height: 60 }} />
            </View>
        );
    };

    // --------------------------------------------------------------------------------
    // MAIN RENDER SELECTOR
    // --------------------------------------------------------------------------------
    if (isLoadingProfile) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#F8FAFC' }}>
                <ActivityIndicator size="large" color={activeColor} />
                <Text style={{ marginTop: 15, color: '#64748B' }}>Cargando perfil profesional...</Text>
            </View>
        );
    }

    const renderContent = () => {
        if (!isCategoryActive) {
            return (
                <View style={{ flex: 1, padding: 20, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                    {(!isOwner || isPreviewMode) ? (
                        <View style={{ backgroundColor: '#FFFBEB', borderRadius: 16, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#FEF3C7', width: '100%', maxWidth: 500 }}>
                            <Feather name="info" size={20} color="#D97706" style={{ marginRight: 12 }} />
                            <Text style={{ flex: 1, fontSize: 13, color: '#92400E' }}>
                                Este profesional tiene pausadas las nuevas solicitudes para esta categoría temporalmente.
                            </Text>
                        </View>
                    ) : (
                        <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, width: '100%', maxWidth: 400 }}>
                            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: isCategoryUncreated ? '#EFF6FF' : '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                                <Feather name={isCategoryUncreated ? "plus-circle" : "pause-circle"} size={40} color={isCategoryUncreated ? "#3B82F6" : "#9CA3AF"} />
                            </View>
                            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 10, textAlign: 'center' }}>
                                Categoría no activada
                            </Text>
                            <Text style={{ fontSize: 15, color: '#64748B', textAlign: 'center', marginBottom: 25, lineHeight: 22 }}>
                                Aún no tienes activada esta categoría. ¿Deseas activarla para poder obtener solicitudes de clientes y ganar dinero con ella?
                            </Text>
                            <TouchableOpacity onPress={onActivateCategory} style={{ backgroundColor: activeColor || '#3B82F6', width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 }}>
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Activar Categoría</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onChangeCategory} style={{ paddingVertical: 10 }}>
                                <Text style={{ color: '#64748B', fontWeight: '600', fontSize: 14 }}>Ver otras categorías</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            );
        }

        switch (activeTheme) {
            case 'modular': return renderModular();
            case 'clasico': return renderClasico();
            case 'social': return renderSocial();
            default: return renderClasico(); // Fallback a clasico si algo falla
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {renderContent()}
                {children}
            </ScrollView>

            {/* BOTONES INFERIORES SEGÚN ROL */}
            {isOwner && !isPreviewMode ? (
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 12, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#E5E7EB', paddingBottom: 25, minHeight: 70 }}>
                    <TouchableOpacity style={{ alignItems: 'center', padding: 8, flex: 1 }} onPress={onClose}>
                        <Feather name="arrow-left" size={24} color="#64748B" />
                        <Text style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>Atrás</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={{ alignItems: 'center', padding: 8, flex: 1 }} onPress={onChangeCategory}>
                        <Feather name="layers" size={24} color={activeColor} />
                        <Text style={{ fontSize: 10, color: activeColor, marginTop: 4 }}>Categoría</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={{ alignItems: 'center', padding: 8, flex: 1 }} onPress={onEditProfile}>
                        <Feather name="edit-3" size={24} color={activeColor} />
                        <Text style={{ fontSize: 10, color: activeColor, marginTop: 4 }}>Editar</Text>
                    </TouchableOpacity>
                </View>
            ) : null}
        </View>
    );
}
