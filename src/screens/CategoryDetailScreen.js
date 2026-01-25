import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUSINESSES, TOP_PROFESSIONALS } from '../data/businessData';

export default function CategoryDetailScreen({ category, subcategories, onBack, onSelectSubcategory }) {
  
  const filteredPros = TOP_PROFESSIONALS.filter(p => p.category === category.fullName || p.category === category.name);
  const filteredBusinesses = BUSINESSES.filter(b => b.category === category.fullName || b.category === category.name);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: category.iconColor || '#EA580C' }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category.name}</Text>
        <View style={{width:24}} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* SUBCATEGORÍAS */}
        <Text style={styles.sectionTitle}>¿Qué necesitas?</Text>
        <View style={styles.subcatGrid}>
            {subcategories.map((sub, index) => (
                <TouchableOpacity key={index} style={styles.subcatCard} onPress={() => onSelectSubcategory(sub)}>
                    <View style={[styles.iconCircle, { backgroundColor: category.color || '#FFF7ED' }]}>
                        <Feather name="chevron-right" size={20} color={category.iconColor || '#EA580C'} />
                    </View>
                    <Text style={styles.subcatText}>{sub}</Text>
                </TouchableOpacity>
            ))}
        </View>

        {/* PROFESIONALES DESTACADOS */}
        <Text style={styles.sectionTitle}>Profesionales Destacados</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 20}}>
            {filteredPros.length > 0 ? filteredPros.map(pro => (
                <View key={pro.id} style={styles.proCard}>
                    <Image source={{ uri: pro.image }} style={styles.proImage} />
                    <Text style={styles.proName}>{pro.name}</Text>
                    <Text style={styles.proSub}>{pro.subcategory}</Text>
                    <View style={styles.ratingRow}>
                        <FontAwesome5 name="star" solid size={12} color="#FBBF24" />
                        <Text style={styles.ratingText}>{pro.rating} ({pro.jobs})</Text>
                    </View>
                </View>
            )) : (
                <Text style={styles.emptyText}>Pronto tendremos profesionales destacados aquí.</Text>
            )}
        </ScrollView>

        {/* COMERCIOS RECOMENDADOS */}
        <Text style={styles.sectionTitle}>Comercios Recomendados</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filteredBusinesses.length > 0 ? filteredBusinesses.map(biz => (
                <View key={biz.id} style={styles.bizCard}>
                    <Image source={{ uri: biz.image }} style={styles.bizImage} resizeMode="contain" />
                    <Text style={styles.bizName}>{biz.name}</Text>
                    <Text style={styles.bizPromo}>{biz.promo}</Text>
                </View>
            )) : (
                <Text style={styles.emptyText}>Pronto tendremos comercios aquí.</Text>
            )}
        </ScrollView>

        <View style={{height: 50}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  content: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 12, marginTop: 8 },
  
  subcatGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  subcatCard: { width: '48%', backgroundColor: 'white', padding: 12, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  subcatText: { fontSize: 13, fontWeight: '600', color: '#374151', flex: 1 },

  proCard: { backgroundColor: 'white', padding: 12, borderRadius: 16, marginRight: 12, width: 140, alignItems: 'center', elevation: 2 },
  proImage: { width: 60, height: 60, borderRadius: 30, marginBottom: 8 },
  proName: { fontSize: 14, fontWeight: 'bold', color: '#1F2937', textAlign: 'center' },
  proSub: { fontSize: 11, color: '#6B7280', marginBottom: 4, textAlign: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 11, color: '#4B5563', marginLeft: 4 },

  bizCard: { backgroundColor: 'white', padding: 12, borderRadius: 16, marginRight: 12, width: 160, alignItems: 'center', elevation: 2 },
  bizImage: { width: 80, height: 40, marginBottom: 8 },
  bizName: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
  bizPromo: { fontSize: 11, color: '#EA580C', fontWeight: '600', marginTop: 2 },

  emptyText: { color: '#9CA3AF', fontStyle: 'italic' }
});
