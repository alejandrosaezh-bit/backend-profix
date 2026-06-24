import os

code = """import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, StyleSheet, Dimensions, Linking } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    onViewImage,
    onViewGallery,
    onContact,
    onEditProfile,
    onChangeCategory,
    onGamification,
    onClose,
    children
}) {

    const getAvatarUri = () => {
        if (user?.avatar?.startsWith('data:image')) return user.avatar;
        if (user?.avatar?.startsWith('http')) return user.avatar;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Pro')}&background=random`;
    };

    const ratingAvg = catReviews.length > 0 ? (catReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / catReviews.length).toFixed(1) : '0.0';

    const subcategories = profileData?.subcategories?.length ? profileData.subcategories : ['Servicios generales'];
    const zones = profileData?.zones?.length ? profileData.zones : ['No especificadas'];
    const bio = profileData?.bio || 'Profesional disponible para nuevos proyectos.';

    const allImages = [];
    if (profileData?.gallery) {
        profileData.gallery.forEach(img => { if (!allImages.includes(img)) allImages.push(img); });
    }
    combinedHistory.forEach(item => {
        if (item.images) {
            item.images.forEach(img => { if (!allImages.includes(img)) allImages.push(img); });
        }
    });

    // --------------------------------------------------------------------------------
    // RENDER: THEME MODULAR (Dark Mode, Widgets)
    // --------------------------------------------------------------------------------
    const renderModular = () => {
        return (
            <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 16 }}>
                {/* BACK BUTTON */}
                {(!isOwner || isPreviewMode) && (
                    <TouchableOpacity onPress={onClose} style={{ marginBottom: 15 }}>
                        <Feather name="arrow-left" size={24} color="white" />
                    </TouchableOpacity>
                )}

                {/* VIDEO / HERO */}
                <View style={{ width: '100%', height: 200, backgroundColor: '#1E293B', borderRadius: 20, overflow: 'hidden', marginBottom: 20 }}>
                    {profileData?.presentationVideoUrl ? (
                        <>
                            <ExpoImage source={{ uri: profileData.presentationVideoUrl.endsWith('.mp4') ? profileData.presentationVideoUrl.replace('.mp4', '.jpg') : profileData.presentationVideoUrl }} style={{ width: '100%', height: '100%', opacity: 0.6 }} />
                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                                <Feather name="play-circle" size={54} color="white" />
                            </View>
                            <View style={{ position: 'absolute', bottom: 15, left: 15 }}>
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>VIDEO DE PRESENTACIÓN</Text>
                            </View>
                        </>
                    ) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Feather name="video-off" size={40} color="#334155" />
                            <Text style={{ color: '#475569', marginTop: 10 }}>Sin video disponible</Text>
                        </View>
                    )}
                </View>

                {/* PROFILE INFO */}
                <View style={{ backgroundColor: '#1E293B', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                    <ExpoImage source={{ uri: getAvatarUri() }} style={{ width: 70, height: 70, borderRadius: 35, marginRight: 15 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>{profileData?.name || user?.name}</Text>
                        <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 2 }}>{categoryKey?.toUpperCase()} | Nivel {levelNames[user?.gamification?.currentLevel || 1]}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                            <FontAwesome5 name="star" solid size={12} color="#FBBF24" />
                            <Text style={{ color: '#CBD5E1', fontSize: 13, marginLeft: 6 }}>{ratingAvg} ({catReviews.length} reseñas)</Text>
                        </View>
                    </View>
                </View>

                {/* STATS BLOCKS */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                    <View style={{ backgroundColor: '#1E293B', borderRadius: 15, flex: 1, padding: 15, alignItems: 'center', marginRight: 10 }}>
                        <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: 'bold', marginBottom: 5 }}>PROYECTOS</Text>
                        <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold' }}>{categoryStats.jobs}</Text>
                    </View>
                    <View style={{ backgroundColor: '#1E293B', borderRadius: 15, flex: 1, padding: 15, alignItems: 'center', marginRight: 10 }}>
                        <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: 'bold', marginBottom: 5 }}>CLIENTES</Text>
                        <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold' }}>{categoryStats.rating}</Text>
                    </View>
                    <View style={{ backgroundColor: '#1E293B', borderRadius: 15, flex: 1, padding: 15, alignItems: 'center' }}>
                        <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: 'bold', marginBottom: 5 }}>ÉXITO</Text>
                        <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold' }}>{categoryStats.success}</Text>
                    </View>
                </View>

                {/* MY SERVICES */}
                <Text style={{ color: 'white', fontSize: 15, fontWeight: 'bold', marginBottom: 12 }}>MIS SERVICIOS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                    {subcategories.map((sub, idx) => (
                        <View key={idx} style={{ backgroundColor: '#F8FAFC', borderRadius: 15, padding: 15, width: 140, marginRight: 12 }}>
                            <Text style={{ color: '#0F172A', fontWeight: 'bold', fontSize: 14, marginBottom: 8 }} numberOfLines={2}>{sub}</Text>
                            <Text style={{ color: '#475569', fontSize: 11, marginBottom: 10 }} numberOfLines={2}>{bio}</Text>
                            <TouchableOpacity style={{ backgroundColor: activeColor, paddingVertical: 6, borderRadius: 8, alignItems: 'center' }}>
                                <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>Ver más</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>

                {/* RECENT PROJECTS */}
                {combinedHistory.length > 0 && (
                    <>
                        <Text style={{ color: 'white', fontSize: 15, fontWeight: 'bold', marginBottom: 12 }}>PROYECTOS RECIENTES</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                            {combinedHistory.map((item, idx) => (
                                <TouchableOpacity key={idx} style={{ width: 160, height: 120, borderRadius: 15, marginRight: 12, overflow: 'hidden', backgroundColor: '#1E293B' }} onPress={() => item.images?.length && onViewGallery({ title: item.title, images: item.images })}>
                                    {item.images && item.images[0] ? (
                                        <ExpoImage source={{ uri: item.images[0] }} style={{ width: '100%', height: '100%', opacity: 0.8 }} />
                                    ) : (
                                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                            <Feather name="image" size={30} color="#475569" />
                                        </View>
                                    )}
                                    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, backgroundColor: 'rgba(0,0,0,0.6)' }}>
                                        <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }} numberOfLines={1}>{item.title}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </>
                )}

                {/* TESTIMONIALS */}
                {combinedHistory.some(h => h.review) && (
                    <>
                        <Text style={{ color: 'white', fontSize: 15, fontWeight: 'bold', marginBottom: 12 }}>TESTIMONIOS</Text>
                        {combinedHistory.filter(h => h.review).slice(0, 3).map((item, idx) => (
                            <View key={idx} style={{ backgroundColor: '#1E293B', borderRadius: 15, padding: 15, marginBottom: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <ExpoImage source={{ uri: item.review?.reviewer?.avatar || 'https://ui-avatars.com/api/?name=C' }} style={{ width: 30, height: 30, borderRadius: 15, marginRight: 10 }} />
                                    <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold' }}>{item.review?.reviewer?.name || 'Cliente'}</Text>
                                </View>
                                <Text style={{ color: '#CBD5E1', fontSize: 13, fontStyle: 'italic' }}>"{item.review?.comment}"</Text>
                            </View>
                        ))}
                    </>
                )}
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
                <View style={{ backgroundColor: activeColor, height: 160, position: 'relative' }}>
                    {(!isOwner || isPreviewMode) && (
                        <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 40, left: 20, zIndex: 10 }}>
                            <Feather name="arrow-left" size={24} color="white" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* AVATAR OVERLAP */}
                <View style={{ alignItems: 'center', marginTop: -60, paddingHorizontal: 20 }}>
                    <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: 'white', padding: 5, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 }}>
                        <ExpoImage source={{ uri: getAvatarUri() }} style={{ width: '100%', height: '100%', borderRadius: 55 }} />
                    </View>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginTop: 10 }}>{profileData?.name || user?.name}</Text>
                    <Text style={{ fontSize: 14, color: '#4B5563', textAlign: 'center', marginTop: 4 }}>
                        {categoryKey?.toUpperCase()} | {levelNames[user?.gamification?.currentLevel || 1]} | {zones[0]}
                    </Text>
                </View>

                <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
                    {/* ACTION BUTTONS */}
                    {(!isOwner || isPreviewMode) && (
                        <View style={{ flexDirection: 'row', marginTop: 20, marginBottom: 10, gap: 10 }}>
                            <TouchableOpacity style={{ flex: 1, backgroundColor: activeColor, paddingVertical: 12, borderRadius: 25, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }} onPress={onContact}>
                                <Feather name="message-circle" size={18} color="white" style={{ marginRight: 8 }} />
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>Contactar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ flex: 1, backgroundColor: 'white', borderWidth: 1, borderColor: activeColor, paddingVertical: 12, borderRadius: 25, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }} onPress={() => allImages.length > 0 && onViewGallery({ title: 'Portafolio', images: allImages })}>
                                <Feather name="image" size={18} color={activeColor} style={{ marginRight: 8 }} />
                                <Text style={{ color: activeColor, fontWeight: 'bold', fontSize: 14 }}>Galería</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ABOUT */}
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 25, marginBottom: 10 }}>Sobre mí</Text>
                    <Text style={{ fontSize: 14, color: '#4B5563', lineHeight: 22 }}>{bio}</Text>

                    {/* EXPERIENCE */}
                    {combinedHistory.length > 0 && (
                        <>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 25, marginBottom: 15 }}>Experiencia y Proyectos</Text>
                            {combinedHistory.slice(0, 5).map((item, idx) => (
                                <View key={idx} style={{ flexDirection: 'row', marginBottom: 15 }}>
                                    <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                        <Feather name={ICON_MAP[categoryKey] || 'briefcase'} size={20} color={activeColor} />
                                    </View>
                                    <View style={{ flex: 1, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 15 }}>
                                        <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#1E293B' }}>{item.title}</Text>
                                        <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                                            {item.review ? `Completado para ${item.review.reviewer?.name || 'Cliente'}` : 'Proyecto completado'}
                                        </Text>
                                        {item.review && (
                                            <Text style={{ fontSize: 13, color: '#4B5563', fontStyle: 'italic', marginTop: 6 }}>"{item.review.comment}"</Text>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </>
                    )}

                    {/* SKILLS */}
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 15, marginBottom: 10 }}>Habilidades / Servicios</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {subcategories.map((sub, idx) => (
                            <View key={idx} style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 }}>
                                <Text style={{ color: '#475569', fontSize: 13, fontWeight: '500' }}>{sub}</Text>
                            </View>
                        ))}
                    </View>

                    {/* CONTACT INFO */}
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 25, marginBottom: 10 }}>Información de Contacto</Text>
                    <Text style={{ fontSize: 14, color: '#4B5563', marginBottom: 4 }}><Feather name="map-pin" size={14} color="#64748B" />  {zones.join(', ')}</Text>
                    <Text style={{ fontSize: 14, color: '#4B5563', marginBottom: 4 }}><Feather name="star" size={14} color="#64748B" />  Nivel {levelNames[user?.gamification?.currentLevel || 1]} con {ratingAvg} estrellas</Text>
                </View>
            </View>
        );
    };

    // --------------------------------------------------------------------------------
    // RENDER: THEME SOCIAL (Instagram Style)
    // --------------------------------------------------------------------------------
    const renderSocial = () => {
        const itemSize = (SCREEN_WIDTH - 4) / 3; // 3 columns, 2 gaps of 2px
        
        return (
            <View style={{ flex: 1, backgroundColor: 'white' }}>
                {/* HEADER */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 40, paddingBottom: 15 }}>
                    {(!isOwner || isPreviewMode) ? (
                        <TouchableOpacity onPress={onClose}><Feather name="arrow-left" size={24} color="#111827" /></TouchableOpacity>
                    ) : (
                        <View style={{ width: 24 }} />
                    )}
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>{categoryKey}</Text>
                    <TouchableOpacity><Feather name="more-horizontal" size={24} color="#111827" /></TouchableOpacity>
                </View>

                {/* PROFILE HEADER INFO */}
                <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
                    <View style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: activeColor, padding: 3, position: 'relative' }}>
                        <ExpoImage source={{ uri: getAvatarUri() }} style={{ width: '100%', height: '100%', borderRadius: 40 }} />
                        <View style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, backgroundColor: '#10B981', borderRadius: 10, borderWidth: 2, borderColor: 'white' }} />
                    </View>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginTop: 12 }}>{profileData?.name || user?.name}</Text>
                    <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{subcategories.join(', ')}</Text>
                    <Text style={{ fontSize: 13, color: '#4B5563', textAlign: 'center', marginTop: 10, lineHeight: 18 }}>{bio}</Text>
                </View>

                {/* STATS ROW */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20, paddingHorizontal: 20, alignItems: 'center' }}>
                    <View style={{ alignItems: 'center', paddingHorizontal: 15 }}>
                        <Feather name="award" size={20} color="#111827" />
                        <Text style={{ fontSize: 12, color: '#4B5563', marginTop: 4 }}>Nivel {user?.gamification?.currentLevel || 1}</Text>
                    </View>
                    <View style={{ width: 1, height: 30, backgroundColor: '#E2E8F0' }} />
                    <View style={{ alignItems: 'center', paddingHorizontal: 15 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>{ratingAvg} <FontAwesome5 name="star" solid size={12} color="#111827" /></Text>
                        <Text style={{ fontSize: 12, color: '#4B5563', marginTop: 4 }}>({catReviews.length} reseñas)</Text>
                    </View>
                    <View style={{ width: 1, height: 30, backgroundColor: '#E2E8F0' }} />
                    <View style={{ alignItems: 'center', paddingHorizontal: 15 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>{categoryStats.jobs}</Text>
                        <Text style={{ fontSize: 12, color: '#4B5563', marginTop: 4 }}>Trabajos</Text>
                    </View>
                </View>

                {/* ACTION BUTTONS */}
                {(!isOwner || isPreviewMode) && (
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20, paddingHorizontal: 20, gap: 10, marginBottom: 20 }}>
                        <TouchableOpacity style={{ flex: 1, backgroundColor: activeColor, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }} onPress={onGamification}>
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>Seguir</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 10, borderRadius: 8, alignItems: 'center' }} onPress={onContact}>
                            <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 14 }}>Mensaje</Text>
                        </TouchableOpacity>
                    </View>
                )}
                {(isOwner && !isPreviewMode) && <View style={{ marginBottom: 20 }} />}

                {/* GRID GALLERY */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
                    {allImages.length > 0 ? allImages.map((img, idx) => (
                        <TouchableOpacity key={idx} onPress={() => onViewImage && onViewImage(img)}>
                            <ExpoImage source={{ uri: img }} style={{ width: itemSize, height: itemSize, backgroundColor: '#F1F5F9' }} />
                        </TouchableOpacity>
                    )) : (
                        <View style={{ width: '100%', padding: 40, alignItems: 'center' }}>
                            <Feather name="camera-off" size={40} color="#CBD5E1" />
                            <Text style={{ color: '#94A3B8', marginTop: 10 }}>Sin fotos en la galería</Text>
                        </View>
                    )}
                </View>
                
                <View style={{ height: 100 }} />
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
                <View style={{ flex: 1, padding: 20, backgroundColor: '#F8FAFC' }}>
                    <View style={{ backgroundColor: '#FFFBEB', borderRadius: 16, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#FEF3C7' }}>
                        <Feather name="info" size={20} color="#D97706" style={{ marginRight: 12 }} />
                        <Text style={{ flex: 1, fontSize: 13, color: '#92400E' }}>
                            Este profesional tiene pausadas las nuevas solicitudes para esta categoría temporalmente.
                        </Text>
                    </View>
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
"""

with open('src/components/profile/ProfessionalProfileView.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated ProfessionalProfileView.js with new visual themes.")
