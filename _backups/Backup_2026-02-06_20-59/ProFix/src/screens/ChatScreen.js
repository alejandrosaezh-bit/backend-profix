import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ChatScreen = ({ onBack }) => {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, text: "Hola, vi tu solicitud sobre el BMW X5.", sender: 'pro' },
    { id: 2, text: "¿El ruido lo hace solo en frío o siempre?", sender: 'pro' },
  ]);

  const sendMessage = () => {
    if (inputText.trim().length === 0) return;
    
    // Agregamos el mensaje del usuario (Cliente)
    const newMsg = { id: Date.now(), text: inputText, sender: 'me' };
    setMessages([...messages, newMsg]);
    setInputText('');

    // Simulamos respuesta automática del Pro a los 2 segundos
    setTimeout(() => {
      const reply = { id: Date.now() + 1, text: "Entendido, gracias por el dato. Prepararé el presupuesto.", sender: 'pro' };
      setMessages(prev => [...prev, reply]);
    }, 2000);
  };

  return (
    <View style={styles.container}>
      {/* Encabezado del Chat */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Taller Especializado</Text>
          <Text style={styles.status}>En línea</Text>
        </View>
      </View>

      {/* Área de Mensajes */}
      <ScrollView style={styles.msgContainer} contentContainerStyle={{ paddingBottom: 20 }}>
        {messages.map((msg) => (
          <View key={msg.id} style={[
            styles.bubble, 
            msg.sender === 'me' ? styles.bubbleMe : styles.bubblePro
          ]}>
            <Text style={[
              styles.msgText,
              msg.sender === 'me' ? styles.textMe : styles.textPro
            ]}>{msg.text}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Input de Texto */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={10}>
        <View style={styles.inputRow}>
          <TextInput 
            style={styles.input} 
            placeholder="Escribe un mensaje..." 
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Text style={styles.sendText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5DDD5' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#075E54', paddingTop: 40 },
  backBtn: { marginRight: 15 },
  backText: { color: '#fff', fontSize: 16 },
  headerTitle: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  status: { color: '#cfcfcf', fontSize: 12 },
  
  msgContainer: { flex: 1, padding: 10 },
  bubble: { maxWidth: '80%', padding: 10, borderRadius: 10, marginBottom: 10 },
  bubblePro: { alignSelf: 'flex-start', backgroundColor: '#fff' },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: '#DCF8C6' },
  msgText: { fontSize: 16 },
  textPro: { color: '#000' },
  textMe: { color: '#000' },

  inputRow: { flexDirection: 'row', padding: 10, backgroundColor: '#f0f0f0', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10, borderWidth: 1, borderColor: '#ddd' },
  sendBtn: { backgroundColor: '#075E54', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  sendText: { color: '#fff', fontWeight: 'bold', fontSize: 10 }
});

export default ChatScreen;