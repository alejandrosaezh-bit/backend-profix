import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function BlogPostScreen({ post, onBack }) {
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState([
      { id: 1, user: 'Ana García', text: '¡Excelente consejo! Me sirvió mucho.', rating: 5 },
      { id: 2, user: 'Carlos Pérez', text: 'Muy útil, gracias por compartir.', rating: 4 }
  ]);

  const handleSendComment = () => {
      if (comment.trim()) {
          const newComment = {
              id: comments.length + 1,
              user: 'Usuario', // En una app real, usar el usuario logueado
              text: comment,
              rating: rating
          };
          setComments([newComment, ...comments]);
          setComment('');
          setRating(0);
      }
  };

  // Mock content generator based on title if no content provided
  const content = post.content || `
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

    1. Primer paso importante.
    2. Segundo paso a considerar.
    3. Conclusión final.

    Esperamos que estos consejos te sean de utilidad para mejorar tu hogar.
  `;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Consejos ProFix</Text>
        <View style={{width:24}} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: post.image }} style={styles.heroImage} />
        
        <View style={styles.articleContainer}>
            <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{post.category}</Text>
            </View>
            <Text style={styles.title}>{post.title}</Text>
            <Text style={styles.date}>Publicado el 14 de Diciembre, 2025</Text>
            
            <Text style={styles.bodyText}>{content}</Text>
        </View>

        {/* SECCIÓN DE VALORACIÓN Y COMENTARIOS */}
        <View style={styles.commentsSection}>
            <Text style={styles.sectionTitle}>¿Te sirvió este artículo?</Text>
            
            {/* Rating Input */}
            <View style={styles.ratingInput}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setRating(star)}>
                        <FontAwesome5 
                            name="star" 
                            solid={star <= rating} 
                            size={32} 
                            color={star <= rating ? "#FBBF24" : "#E5E7EB"} 
                            style={{marginHorizontal: 4}}
                        />
                    </TouchableOpacity>
                ))}
            </View>

            {/* Comment Input */}
            <View style={styles.commentInputContainer}>
                <TextInput 
                    style={styles.input}
                    placeholder="Escribe tu opinión..."
                    multiline
                    value={comment}
                    onChangeText={setComment}
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSendComment}>
                    <Feather name="send" size={20} color="white" />
                </TouchableOpacity>
            </View>

            {/* Comments List */}
            <Text style={styles.commentsHeader}>Comentarios ({comments.length})</Text>
            {comments.map((c) => (
                <View key={c.id} style={styles.commentCard}>
                    <View style={styles.commentHeader}>
                        <Text style={styles.commentUser}>{c.user}</Text>
                        <View style={{flexDirection:'row'}}>
                            {[...Array(c.rating)].map((_,i) => <FontAwesome5 key={i} name="star" solid size={10} color="#FBBF24" />)}
                        </View>
                    </View>
                    <Text style={styles.commentText}>{c.text}</Text>
                </View>
            ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EA580C',
    paddingTop: 50, // Adjust for status bar
    paddingBottom: 15,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 4,
  },
  content: {
    paddingBottom: 40,
  },
  heroImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  articleContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 16,
    elevation: 2,
  },
  categoryBadge: {
    backgroundColor: '#FFF7ED',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  categoryText: {
    color: '#EA580C',
    fontWeight: 'bold',
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 20,
  },
  bodyText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  commentsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  ratingInput: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: '#EA580C',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  commentsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  commentCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  commentUser: {
    fontWeight: 'bold',
    color: '#111827',
  },
  commentText: {
    color: '#4B5563',
    fontSize: 14,
  },
});
