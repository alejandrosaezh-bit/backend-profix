import { Feather } from '@expo/vector-icons';
import { Dimensions, Image, Text, TouchableOpacity, View } from 'react-native';

import { BLOG_POSTS } from '../constants/data';
import { CAT_ICONS, ICON_MAP } from '../constants/icons';
import styles from '../styles/globalStyles';
import { SectionDivider } from './Dividers';

const { width } = Dimensions.get('window');

export const QuickActionsRow = ({ onActionPress, categories }) => {
    // 1. Flatten all subcategories and filter isUrgent
    const urgentSubs = [];
    (categories || []).forEach(cat => {
        (cat.subcategories || []).forEach(sub => {
            if (typeof sub === 'object' && sub.isUrgent) {
                urgentSubs.push({
                    name: sub.name,
                    icon: sub.icon,
                    category: cat.name,
                    color: cat.color || '#F3F4F6'
                });
            }
        });
    });

    // 2. Limit to 6
    const actions = urgentSubs.slice(0, 6);

    if (actions.length === 0) return null;

    // Calcular el tamaño proporcional para que se vean más discretos pero claros
    const ITEM_SIZE = width / 8.8;

    return (
        <View style={{
            marginTop: 15,
            marginBottom: 25,
            flexDirection: 'row',
            justifyContent: 'space-around', // Mejor distribución para tamaños pequeños
            alignItems: 'center',
            paddingHorizontal: 10
        }}>
            {actions.map((action, index) => {
                const iconData = CAT_ICONS[action.icon] || { lib: Feather, name: 'layers' };
                const Lib = iconData.lib;
                return (
                    <TouchableOpacity
                        key={index}
                        onPress={() => onActionPress(action.category, action.name)}
                        style={{ alignItems: 'center' }}
                        activeOpacity={0.6}
                    >
                        <View style={{
                            width: ITEM_SIZE,
                            height: ITEM_SIZE,
                            borderRadius: ITEM_SIZE / 2,
                            backgroundColor: '#F1F5F9', // Gris neutro claro
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 1.5,
                            borderColor: '#E2E8F0', // Borde sutil
                            // Sombras muy minimalistas
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 2,
                            elevation: 1
                        }}>
                            <Lib name={iconData.name} size={ITEM_SIZE * 0.5} color="#475569" />
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

export const HomeSections = ({ onSelectCategory, onSelectPost, categories, articles }) => {
    const displayCategories = (categories && categories.length > 0) ? categories : [];
    const displayArticles = (articles && articles.length > 0) ? articles : BLOG_POSTS;

    return (
        <View style={{ backgroundColor: 'transparent' }}>
            {/* Categorías */}
            <View style={{ backgroundColor: 'white', marginHorizontal: 4, borderRadius: 24, borderWidth: 1, borderColor: '#FFF7ED', shadowColor: '#EA580C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, paddingHorizontal: 20, paddingVertical: 24 }}>
                <Text style={styles.sectionTitle}>Categorías Populares</Text>
                <View style={styles.categoriesGrid}>
                    {displayCategories.slice(0, 9).map(cat => (
                        <TouchableOpacity
                            key={cat.id}
                            style={styles.catCard}
                            onPress={() => onSelectCategory(cat)}
                        >
                            <View style={[styles.catIconCircle, { backgroundColor: cat.color || '#F3F4F6', marginBottom: 6 }]}>
                                {cat.icon && <cat.icon size={24} color={cat.iconColor || "#EA580C"} />}
                            </View>
                            <Text style={[styles.catTextCard, { textAlign: 'center' }]} numberOfLines={2}>{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <SectionDivider />

            {/* Cómo funciona */}
            <View style={[styles.howToCard, { marginBottom: 0, marginHorizontal: 4, borderRadius: 24, borderWidth: 1, borderColor: '#FFF7ED', elevation: 5, shadowColor: '#EA580C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 }]}>
                <View style={styles.howToHeader}>
                    <Text style={styles.howToTitle}>¿Cómo funciona?</Text>
                    <Text style={styles.howToSubtitle}>Resuelve tu problema en 3 pasos</Text>
                </View>
                <View style={styles.stepsRow}>
                    <View style={styles.step}>
                        <View style={[styles.stepBadge, { backgroundColor: '#FFEDD5' }]}><Text style={[styles.stepNumber, { color: '#EA580C' }]}>1</Text></View>
                        <Text style={styles.stepLabel}>Pide</Text>
                    </View>
                    <View style={styles.step}>
                        <View style={[styles.stepBadge, { backgroundColor: '#DBEAFE' }]}><Text style={[styles.stepNumber, { color: '#2563EB' }]}>2</Text></View>
                        <Text style={styles.stepLabel}>Recibe</Text>
                    </View>
                    <View style={styles.step}>
                        <View style={[styles.stepBadge, { backgroundColor: '#DCFCE7' }]}><Text style={[styles.stepNumber, { color: '#16A34A' }]}>3</Text></View>
                        <Text style={styles.stepLabel}>Elige</Text>
                    </View>
                </View>
                <View style={{ alignItems: 'center', paddingBottom: 25 }}>
                    <View style={{ width: '90%', height: 180, borderRadius: 20, overflow: 'hidden', position: 'relative', marginTop: 10, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }}>
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1581578731522-5b17b88bb7d5?auto=format&fit=crop&w=800&q=80' }}
                            style={{ width: '100%', height: '100%' }}
                        />
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)' }}>
                            <View style={{ backgroundColor: '#FF0000', width: 68, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }}>
                                <Feather name="play" size={28} color="white" />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

export const UrgencyBanner = ({ onPress, onActionPress, categories }) => {
    // Logic from QuickActionsRow to get urgent subcategories
    const urgentSubs = [];
    (categories || []).forEach(cat => {
        (cat.subcategories || []).forEach(sub => {
            if (typeof sub === 'object' && sub.isUrgent) {
                urgentSubs.push({
                    name: sub.name,
                    icon: sub.icon,
                    category: cat.name,
                    color: cat.color || '#F3F4F6',
                    emergencyIcon: sub.emergencyIcon // Added support for custom emergency icon
                });
            }
        });
    });

    const actions = urgentSubs.slice(0, 5); // Limit to 5 for better layout in banner

    return (
        <View style={{ marginHorizontal: 4, marginTop: 0, marginBottom: 0 }}>
            <View
                style={{
                    backgroundColor: 'white',
                    borderRadius: 24,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: '#FFF7ED',
                    shadowColor: '#EA580C',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    elevation: 5
                }}
            >
                {/* Icons inside the banner (moved to top) */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 25, backgroundColor: 'rgba(249,250,251,0.5)', borderRadius: 24, paddingVertical: 15 }}>
                    {actions.map((action, index) => {
                        const IconComponent = ICON_MAP[action.icon] || ICON_MAP['default'];
                        return (
                            <TouchableOpacity
                                key={index}
                                onPress={() => onActionPress(action.category, action.name)}
                                style={{ alignItems: 'center', flex: 1 }}
                                activeOpacity={0.7}
                            >
                                <View style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 28,
                                    backgroundColor: 'white',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderWidth: 1.5,
                                    borderColor: '#FED7AA',
                                    elevation: 2,
                                    overflow: 'hidden'
                                }}>
                                    {action.emergencyIcon ? (
                                        <Image source={{ uri: action.emergencyIcon }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                    ) : (
                                        <IconComponent size={26} color="#EA580C" />
                                    )}
                                </View>
                                <Text style={{ fontSize: 9, color: '#4B5563', fontWeight: 'bold', marginTop: 8, textAlign: 'center' }} numberOfLines={1}>{action.name}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Title and Subtitle centered (moved to bottom) */}
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={onPress}
                    style={{ alignItems: 'center', justifyContent: 'center' }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <View style={{
                            width: 32, height: 32,
                            borderRadius: 16,
                            backgroundColor: '#FFEDD5',
                            justifyContent: 'center', alignItems: 'center',
                            marginRight: 10,
                            borderWidth: 1,
                            borderColor: '#FED7AA'
                        }}>
                            <Feather name="zap" size={18} color="#EA580C" />
                        </View>
                        <Text style={{ fontSize: 20, fontWeight: '800', color: '#111811' }}>Urgencias 24/7</Text>
                    </View>
                    <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center' }}>Expertos listos para salir ahora mismo.</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};
