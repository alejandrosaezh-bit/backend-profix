import { Feather, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { api } from '../utils/api';

export default function ChatScreen({ request, currentUser, userMode, onBack, onSend, onViewJob }) {
  const flatListRef = useRef(null);

  // Helper para comparar IDs de forma segura
  const areIdsEqual = (id1, id2) => {
    if (!id1 || !id2) return false;
    const s1 = typeof id1 === 'object' ? (id1._id || id1.id || id1) : id1;
    const s2 = typeof id2 === 'object' ? (id2._id || id2.id || id2) : id2;
    return String(s1) === String(s2);
  };

  // Usar estrictamente userMode para determinar el contexto visual
  const isActingAsPro = userMode === 'pro' || userMode === 'professional';

  let currentConversation = null;
  if (request.conversations) {
    if (isActingAsPro) {
      // FIX: In Pro mode (virtual jobs), the backend filters conversations for us. 
      // The 'proId' on the object actually points to the partner (Client), so ID match fails.
      // We can safely take the first conversation.
      currentConversation = request.conversations.length > 0 ? request.conversations[0] : null;
    } else {
      const targetId = request.targetUser?.id;
      const targetName = request.targetUser?.name;
      currentConversation = request.conversations.find(c => {
        const cProId = c.proId?._id || c.proId;
        if (cProId && targetId && areIdsEqual(cProId, targetId)) return true;
        return c.proName === targetName;
      });
    }
  }

  const messages = (currentConversation && Array.isArray(currentConversation.messages)) ? currentConversation.messages : [];

  useEffect(() => {
    if (currentConversation && currentConversation.id) {
      api.markChatAsRead(currentConversation.id).catch(() => { });
    }
  }, [currentConversation?.id]);

  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => flatListRef.current.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const [inputText, setInputText] = useState(() => {
    if (Array.isArray(messages) && messages.length === 0 && request.initialMessage) {
      return request.initialMessage;
    }
    return '';
  });

  const sendMessage = () => {
    if (inputText.trim().length === 0) return;
    onSend(request, inputText, 'text');
    setInputText('');
  };

  const handleAttachment = () => {
    Alert.alert(
      "Adjuntar",
      "Selecciona una opción",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Cámara", onPress: takePhoto },
        { text: "Galería", onPress: pickMedia }
      ]
    );
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permiso requerido", "Se requiere acceso a la cámara.");
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true,
      allowsEditing: true,
    });

    if (!result.canceled) {
      const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
      processSelectedMedia(base64Img, 'image');
    }
  };

  const pickMedia = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permiso requerido", "Se requiere acceso a la galería.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
      processSelectedMedia(base64Img, 'image');
    }
  };

  const processSelectedMedia = (uri, type) => {
    if (!isActingAsPro && userMode === 'client') {
      Alert.alert(
        "Agregar a la Solicitud",
        "¿Deseas agregar esta foto al perfil público de tu solicitud?",
        [
          { text: "No, solo enviar", onPress: () => onSend(request, uri, 'media') },
          {
            text: "Sí, agregar y enviar",
            onPress: async () => {
              try { await api.addJobImage(request.id, uri); } catch (e) { }
              onSend(request, uri, 'media');
            }
          }
        ]
      );
    } else {
      onSend(request, uri, 'media');
    }
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = (isActingAsPro && item.sender === 'pro') ||
      (!isActingAsPro && item.sender === 'client');

    return (
      <View style={{ alignSelf: isMyMessage ? 'flex-end' : 'flex-start', maxWidth: '85%', marginBottom: 8, paddingHorizontal: 4 }}>
        <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.theirMessage]}>
          {(item.type === 'text' || (!item.type && item.text)) && (
            <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
              {item.text || item.content}
            </Text>
          )}
          {(item.type === 'media' || (!item.type && item.media)) && (
            <View style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 4 }}>
              <Image source={{ uri: item.media }} style={{ width: 220, height: 160 }} />
              {item.mediaType === 'video' && (
                <View style={styles.videoBadge}>
                  <Feather name="play-circle" size={32} color="white" />
                </View>
              )}
            </View>
          )}
          <Text style={[styles.timestamp, { alignSelf: isMyMessage ? 'flex-end' : 'flex-start' }]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const getPlaceholder = () => {
    if (messages.length === 0) return "Saludar...";
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.sender !== (isActingAsPro ? 'pro' : 'client')) return "Responder...";
    return "Preguntar...";
  };

  const getCategoryIconName = (cat) => {
    if (!cat) return 'grid';
    const catName = (typeof cat === 'object' && cat.name) ? cat.name : cat;
    if (typeof catName !== 'string') return 'grid';
    const c = catName.toLowerCase();
    if (c.includes('hogar')) return 'home';
    if (c.includes('auto')) return 'truck';
    if (c.includes('salud')) return 'heart';
    if (c.includes('tech')) return 'monitor';
    if (c.includes('belleza')) return 'scissors';
    if (c.includes('eventos')) return 'calendar';
    if (c.includes('mascotas')) return 'smile';
    if (c.includes('legal')) return 'briefcase';
    return 'grid';
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : (Platform.Version >= 30 ? "padding" : "height")}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : (Platform.OS === 'android' ? 80 : 0)}
    >
      <View style={{ backgroundColor: isActingAsPro ? '#2563EB' : '#EA580C', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 4, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={onBack} style={{ marginRight: 12 }}>
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>

        <Image
          source={{
            uri: (request.targetUser?.avatar || request.targetUser?.image || request.targetUser?.profileImage) 
                 ? (request.targetUser?.avatar || request.targetUser?.image || request.targetUser?.profileImage)
                 : (isActingAsPro
                    ? (request.clientAvatar || request.client?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.clientName || request.client?.name || 'C')}&background=random`)
                    : (request.proImage || request.professional?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.proName || request.professional?.name || 'P')}&background=random`))
          }}
          style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', backgroundColor: '#fff' }}
        />

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }} numberOfLines={1}>
            {request.targetUser?.name 
             ? request.targetUser.name 
             : (isActingAsPro 
                ? (request.clientName || request.client?.name || 'Cliente') 
                : (request.proName || request.professional?.name || request.targetUser?.name || 'Profesional'))}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Feather name={getCategoryIconName(request.category)} size={12} color="rgba(255,255,255,0.9)" style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)' }} numberOfLines={1}>
              {(typeof request.category === 'object' ? request.category.name : request.category) || 'General'} • {request.title}
            </Text>
          </View>
        </View>

        {/* BOTONES DE ACCIÓN (Header) */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Botón Ver Solicitud (Para todos) */}
          <TouchableOpacity
            onPress={() => onViewJob && onViewJob(request)}
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginLeft: 8 }}
          >
            <Feather name="file-text" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => item.id || (item.timestamp ? item.timestamp.toString() : index.toString())}
        contentContainerStyle={styles.messagesList}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={handleAttachment} style={styles.attachButton}>
          <Feather name="image" size={24} color="#6B7280" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder={getPlaceholder()}
          value={inputText}
          onChangeText={setInputText}
          multiline
          onKeyPress={(e) => {
            if (e.nativeEvent.key === 'Enter' && !e.shiftKey) {
              e.preventDefault(); // Evitar salto de línea en web/algunos entornos
              sendMessage();
            }
          }}
        />
        <TouchableOpacity onPress={sendMessage} style={[styles.sendButton, { backgroundColor: inputText.trim() ? (isActingAsPro ? '#2563EB' : '#EA580C') : '#E5E7EB' }]} disabled={!inputText.trim()}>
          <Ionicons name="send" size={20} color={inputText.trim() ? "white" : "#9CA3AF"} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFEAE2' },
  messagesList: { padding: 16, paddingBottom: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#F0F2F5', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  attachButton: { padding: 10 },
  input: { 
    flex: 1, 
    backgroundColor: 'white', 
    borderRadius: 24, 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    marginHorizontal: 10, 
    maxHeight: 100, 
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#000',
    color: '#000'
  },
  sendButton: { padding: 10, borderRadius: 25, justifyContent: 'center', alignItems: 'center', width: 45, height: 45 },
  messageBubble: {
    padding: 12,
    paddingBottom: 4,
    borderRadius: 12,
    maxWidth: '100%',
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 2px rgba(0,0,0,0.1)',
      }
    }),
    position: 'relative',
  },
  myMessage: { backgroundColor: '#DCF8C6', alignSelf: 'flex-end', borderTopRightRadius: 2 },
  theirMessage: { backgroundColor: 'white', alignSelf: 'flex-start', borderTopLeftRadius: 2 },
  messageText: { fontSize: 16, lineHeight: 22, marginBottom: 4 },
  myMessageText: { color: '#075E54' },
  theirMessageText: { color: '#111827' },
  timestamp: { fontSize: 10, color: '#94A3B8', marginBottom: 2 },
  videoBadge: {
    position: 'absolute',
    top: '35%',
    left: '40%',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 25,
    padding: 8,
  }
});