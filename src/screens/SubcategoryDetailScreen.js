import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUSINESSES, RECENT_JOBS, TOP_PROFESSIONALS } from '../data/businessData';

export default function SubcategoryDetailScreen({ category, subcategory, onBack, onRequestQuote }) {
  
  const filteredPros = TOP_PROFESSIONALS.filter(p => p.subcategory === subcategory);
  const filteredBusinesses = BUSINESSES.filter(b => b.category === category.fullName || b.category === category.name); // Broad match for businesses
  const recentJobs = RECENT_JOBS.filter(j => j.subcategory === subcategory);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: category.iconColor || '#EA580C' }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <View style={{flex:1, alignItems:'center'}}>
            <Text style={styles.headerTitle}>{subcategory}</Text>
            <Text style={styles.headerSubtitle}>{category.name}</Text>
        </View>
        <View style={{width:24}} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* CTA PRINCIPAL */}
        <View style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>¿Necesitas un {subcategory}?</Text>
            <Text style={styles.ctaText}>Describe tu problema y recibe ofertas de los mejores profesionales.</Text>
            <TouchableOpacity style={styles.ctaButton} onPress={onRequestQuote}>
                <Text style={styles.ctaButtonText}>Pedir Presupuesto Gratis</Text>
            </TouchableOpacity>
        </View>

        {/* PROFESIONALES DESTACADOS */}
        <Text style={styles.sectionTitle}>Mejores Profesionales en {subcategory}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 20}}>
            {filteredPros.length > 0 ? filteredPros.map(pro => (
                <View key={pro.id} style={styles.proCard}>
                    <Image source={{ uri: pro.image }} style={styles.proImage} />
                    <Text style={styles.proName}>{pro.name}</Text>
                    <View style={styles.ratingRow}>
                        <FontAwesome5 name="star" solid size={12} color="#FBBF24" />
                        <Text style={styles.ratingText}>{pro.rating} ({pro.jobs} trabajos)</Text>
                    </View>
                </View>
            )) : (
                <Text style={styles.emptyText}>Sé el primero en contratar en esta categoría.</Text>
            )}
        </ScrollView>

        {/* ÚLTIMOS TRABAJOS */}
        <Text style={styles.sectionTitle}>Últimos trabajos realizados</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 20}}>
            {recentJobs.length > 0 ? recentJobs.map(job => (
                <View key={job.id} style={styles.jobCard}>
                    <Image source={{ uri: job.image }} style={styles.jobImage} />
                    <Text style={styles.jobTitle}>{job.title}</Text>
                </View>
            )) : (
                <Text style={styles.emptyText}>No hay fotos recientes.</Text>
            )}
        </ScrollView>

        {/* COMERCIOS PATROCINADOS */}
        <Text style={styles.sectionTitle}>Comercios Recomendados</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filteredBusinesses.length > 0 ? filteredBusinesses.map(biz => (
                <View key={biz.id} style={styles.bizCard}>
                    <Image source={{ uri: biz.image }} style={styles.bizImage} resizeMode="contain" />
                    <Text style={styles.bizName}>{biz.name}</Text>
                    <Text style={styles.bizPromo}>{biz.promo}</Text>
                </View>
            )) : (
                <Text style={styles.emptyText}>Espacio disponible para publicidad.</Text>
            )}
        </ScrollView>

        <View style={{height: 80}} />
      </ScrollView>

      {/* FLOATING BUTTON */}
      <View style={styles.floatingContainer}>
          <TouchableOpacity style={styles.floatingButton} onPress={onRequestQuote}>
              <Text style={styles.floatingButtonText}>Pedir Presupuesto</Text>
          </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  content: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 12, marginTop: 8 },
  
  ctaCard: { backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 24, alignItems: 'center', elevation: 2 },
  ctaTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 8, textAlign: 'center' },
  ctaText: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
  ctaButton: { backgroundColor: '#EA580C', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  ctaButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  proCard: { backgroundColor: 'white', padding: 12, borderRadius: 16, marginRight: 12, width: 140, alignItems: 'center', elevation: 2 },
  proImage: { width: 60, height: 60, borderRadius: 30, marginBottom: 8 },
  proName: { fontSize: 14, fontWeight: 'bold', color: '#1F2937', textAlign: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { fontSize: 11, color: '#4B5563', marginLeft: 4 },

  jobCard: { marginRight: 12, width: 200 },
  jobImage: { width: 200, height: 120, borderRadius: 12, marginBottom: 8 },
  jobTitle: { fontSize: 14, fontWeight: '600', color: '#374151' },

  bizCard: { backgroundColor: 'white', padding: 12, borderRadius: 16, marginRight: 12, width: 160, alignItems: 'center', elevation: 2 },
  bizImage: { width: 80, height: 40, marginBottom: 8 },
  bizName: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
  bizPromo: { fontSize: 11, color: '#EA580C', fontWeight: '600', marginTop: 2 },

  emptyText: { color: '#9CA3AF', fontStyle: 'italic' },

  floatingContainer: { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' },
  floatingButton: { backgroundColor: '#EA580C', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 30, elevation: 5, shadowColor: '#EA580C', shadowOffset: {width:0, height:4}, shadowOpacity:0.3, shadowRadius:5 },
  floatingButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
