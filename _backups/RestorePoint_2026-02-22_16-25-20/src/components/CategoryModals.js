import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { CAT_ICONS, Layers, X } from '../constants/icons';
import styles from '../styles/globalStyles';

export const CategoryGridModal = ({ visible, onClose, onSelect, categories }) => {
    return (
        <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
            <View style={styles.categoryGridModalOverlay}>
                <View style={styles.categoryGridModalContent}>
                    <View style={styles.categoryGridHeader}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={styles.categoryGridTitle}>¿Qué área necesitas?</Text>
                            <Text style={styles.categoryGridSubtitle}>Selecciona la categoría de tu solicitud</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.categoryGridCloseButton}>
                            <X name="x" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.categoryGridScroll}>
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={styles.categoryGridItem}
                                onPress={() => {
                                    onSelect(cat.name);
                                    onClose();
                                }}
                            >
                                <View style={[styles.categoryGridIconWrapper, { backgroundColor: cat.color || '#F3F4F6' }]}>
                                    <cat.icon size={28} color={cat.iconColor || '#EA580C'} />
                                </View>
                                <Text style={styles.categoryGridLabel} numberOfLines={1}>{cat.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

// CAT_ICONS removed, imported from icons.js\n

export const SubcategoryGridModal = ({ visible, onClose, onSelect, subcategories, categoryName, color, iconColor }) => {
    return (
        <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
            <View style={styles.categoryGridModalOverlay}>
                <View style={styles.categoryGridModalContent}>
                    <View style={styles.categoryGridHeader}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={styles.categoryGridTitle} numberOfLines={1}>{categoryName}: Especialidades</Text>
                            <Text style={styles.categoryGridSubtitle}>Selecciona el servicio específico</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.categoryGridCloseButton}>
                            <X name="x" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.categoryGridScroll}>
                        {subcategories.map((sub, index) => {
                            const subName = typeof sub === 'object' ? sub.name : sub;

                            // Dynamic Icon Logic
                            let IconComponent = Layers;
                            let activeIconColor = iconColor || "#2563EB";
                            let iconName = "layers";

                            if (typeof sub === 'object' && sub.icon && CAT_ICONS[sub.icon]) {
                                const iconData = CAT_ICONS[sub.icon];
                                IconComponent = iconData.lib;
                                iconName = iconData.name;
                            }

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.categoryGridItem}
                                    onPress={() => {
                                        onSelect(subName);
                                        onClose();
                                    }}
                                >
                                    <View style={[styles.categoryGridIconWrapper, { backgroundColor: color || '#EFF6FF' }]}>
                                        <IconComponent name={iconName} size={28} color={activeIconColor} />
                                    </View>
                                    <Text style={styles.categoryGridLabel} numberOfLines={2}>{subName}</Text>
                                </TouchableOpacity>
                            );
                        })}
                        {subcategories.length === 0 && (
                            <Text style={{ textAlign: 'center', width: '100%', color: '#9CA3AF', marginTop: 20 }}>No hay especialidades disponibles.</Text>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

