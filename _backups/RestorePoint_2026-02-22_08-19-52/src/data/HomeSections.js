import { PlayCircle, Star } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BLOG_POSTS, CATEGORIES_DISPLAY, TESTIMONIALS } from '../data/mockData';

export default function HomeSections({ onSelectCategory }) {
  return (
    <View style={styles.container}>
      
      {/* 1. Categorías */}
      <Text style={styles.sectionTitle}>Categorías Populares</Text>
      <View style={styles.categoriesGrid}>
        {CATEGORIES_DISPLAY.map(cat => (
            <TouchableOpacity key={cat.id} style={[styles.catCard, { backgroundColor: cat.color }]}>
                <cat.icon size={24} color={cat.iconColor} />
                <Text style={styles.catText}>{cat.name}</Text>
            </TouchableOpacity>
        ))}
      </View>

      {/* 2. Cómo funciona (RECUPERADO) */}
      <View style={styles.howToCard}>
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
        <TouchableOpacity style={styles.videoButton}>
            <PlayCircle size={16} color="#2563EB" style={{marginRight:6}} />
            <Text style={styles.videoButtonText}>Ver video explicativo</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Testimonios (RECUPERADO) */}
      <Text style={styles.sectionTitle}>Opiniones de usuarios</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingRight: 20}}>
        {TESTIMONIALS.map(t => (
            <View key={t.id} style={styles.testimonialCard}>
                <View style={{flexDirection:'row', marginBottom:8}}>
                    {[...Array(t.stars)].map((_,i) => <Star key={i} size={14} color="#FBBF24" fill="#FBBF24" />)}
                </View>
                <Text style={styles.testimonialText}>"{t.text}"</Text>
                <Text style={styles.testimonialUser}>- {t.user}</Text>
            </View>
        ))}
      </ScrollView>

      {/* 4. Blog / Noticias (RECUPERADO) */}
      <Text style={styles.sectionTitle}>Consejos para el hogar</Text>
      {BLOG_POSTS.map(post => (
        <View key={post.id} style={styles.blogCard}>
            <View style={{width: 80, height: '100%', backgroundColor: '#ddd'}} />
            <View style={styles.blogContent}>
                <Text style={styles.blogCategory}>{post.category}</Text>
                <Text style={styles.blogTitle}>{post.title}</Text>
                <Text style={styles.blogLink}>Leer más ➝</Text>
            </View>
        </View>
      ))}

      <View style={{height: 100}} /> 
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333', marginTop:10 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', paddingBottom: 20 },
  catCard: { width: '23%', aspectRatio: 1, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  catText: { fontSize: 10, fontWeight: 'bold', marginTop: 5, color: '#444' },
  
  // How To Styles
  howToCard: { backgroundColor: 'white', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
  howToHeader: { backgroundColor: '#111827', padding: 16, alignItems: 'center' },
  howToTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  howToSubtitle: { color: '#9CA3AF', fontSize: 12 },
  stepsRow: { flexDirection: 'row', padding: 20, justifyContent: 'space-between' },
  step: { alignItems: 'center', flex: 1 },
  stepBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  stepNumber: { fontWeight: 'bold', fontSize: 16 },
  stepLabel: { fontSize: 12, color: '#4B5563', fontWeight: '500' },
  videoButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#F9FAFB' },
  videoButtonText: { color: '#2563EB', fontSize: 12, fontWeight: 'bold' },

  // Testimonial Styles
  testimonialCard: { backgroundColor: 'white', padding: 16, borderRadius: 16, marginRight: 16, width: 260, elevation: 2, marginBottom:20 },
  testimonialText: { fontSize: 13, color: '#4B5563', fontStyle: 'italic', marginBottom: 8, lineHeight: 18 },
  testimonialUser: { fontSize: 12, fontWeight: 'bold', color: '#1F2937' },

  // Blog Styles
  blogCard: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB', height: 90 },
  blogContent: { flex: 1, padding: 12, justifyContent: 'center' },
  blogCategory: { fontSize: 10, color: '#2563EB', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  blogTitle: { fontSize: 14, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  blogLink: { fontSize: 12, color: '#6B7280' },
});