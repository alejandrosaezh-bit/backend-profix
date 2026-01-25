import { Feather } from '@expo/vector-icons';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login, register, isLoading } = useContext(AuthContext);
  const [isRegistering, setIsRegistering] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cedula, setCedula] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); // Estado para mensajes de error en UI

  const handleSubmit = async () => {
    setErrorMessage(''); // Limpiar errores previos
    console.log("handleSubmit called. isRegistering:", isRegistering);
    console.log("Form data:", { email, password, name, phone, cedula });

    if (!email || !password) {
      console.log("Missing email or password");
      setErrorMessage('Por favor completa todos los campos requeridos');
      // Alert.alert('Error', 'Por favor completa todos los campos requeridos'); // Reemplazado por UI Text
      return;
    }

    try {
      if (isRegistering) {
        if (!name || !cedula) {
          console.log("Missing name or cedula");
          setErrorMessage('Nombre y Cédula son obligatorios');
          return;
        }
        console.log("Calling register...");
        await register(name, email, password, phone, cedula, 'client');
        console.log("Register returned");
      } else {
        console.log("Calling login...");
        await login(email, password);
        console.log("Login returned");
      }
    } catch (error) {
      console.error("handleSubmit error:", error);
      // Mostrar error en la UI en lugar de usar Alert que puede cerrarse
      setErrorMessage(error.message || 'Error de autenticación');
    }
  };

  const content = (
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingBottom: keyboardVisible ? 250 : 100 } // Aumentar padding cuando el teclado está visible
          ]} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {(!keyboardVisible || Platform.OS === 'web') && (
            <View style={[styles.header, keyboardVisible && { marginBottom: 10 }]}>
              <View style={[styles.logoContainer, keyboardVisible && { padding: 8, marginBottom: 4 }]}>
                <Feather name="tool" size={keyboardVisible ? 24 : 40} color="white" />
              </View>
              {!keyboardVisible && <Text style={styles.title}>ProFix</Text>}
              {!keyboardVisible && <Text style={styles.subtitle}>Soluciones rápidas y seguras</Text>}
            </View>
          )}

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}</Text>

            {isRegistering && (
              <>
                <View style={styles.inputGroup}>
                  <Feather name="user" size={20} color="#000000" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Nombre completo"
                    placeholderTextColor="#374151"
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Feather name="credit-card" size={20} color="#000000" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Cédula de Identidad"
                    placeholderTextColor="#374151"
                    style={styles.input}
                    value={cedula}
                    onChangeText={setCedula}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Feather name="phone" size={20} color="#000000" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Teléfono (Opcional)"
                    placeholderTextColor="#374151"
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </>
            )}

        <View style={styles.inputGroup}>
          <Feather name="mail" size={20} color="#000000" style={styles.inputIcon} />
          <TextInput
            placeholder="Correo electrónico"
            placeholderTextColor="#374151"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputGroup}>
          <Feather name="lock" size={20} color="#000000" style={styles.inputIcon} />
          <TextInput
            placeholder="Contraseña"
            placeholderTextColor="#374151"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {errorMessage ? (
          <View style={{ marginBottom: 15, padding: 10, backgroundColor: '#FEF2F2', borderRadius: 8, borderWidth: 1, borderColor: '#FCA5A5' }}>
            <Text style={{ color: '#DC2626', textAlign: 'center', fontWeight: 'bold' }}>{errorMessage}</Text>
          </View>
        ) : null}

            <TouchableOpacity
              style={styles.authButton}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.authButtonText}>
                  {isRegistering ? 'Registrarse' : 'Entrar'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={{ marginTop: 15 }}>
              <Text style={styles.switchText}>
                {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
              </Text>
            </TouchableOpacity>
          </View>
          {/* Espaciador para asegurar que el teclado no tape el último input */}
          <View style={{ height: 100 }} />
        </ScrollView>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : (Platform.OS === 'web' ? undefined : 'height')}
      style={styles.container}
    >
      {Platform.OS === 'web' ? (
        <View style={{ flex: 1 }}>{content}</View>
      ) : (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          {content}
        </TouchableWithoutFeedback>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EA580C' },
  scrollContainer: { flexGrow: 1, justifyContent: 'flex-start', padding: 20, paddingBottom: 100, paddingTop: 20 },
  header: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  logoContainer: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 20, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },

  formCard: { 
    backgroundColor: 'white', 
    borderRadius: 20, 
    padding: 20, 
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  formTitle: { fontSize: 24, fontWeight: 'bold', color: '#000000', marginBottom: 20, textAlign: 'center' },

  inputGroup: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    marginBottom: 16, 
    paddingHorizontal: 15, 
    borderWidth: 2, 
    borderColor: '#000000' // Borde negro sólido para máximo contraste
  },
  inputIcon: { marginRight: 10 },
  input: { 
    flex: 1, 
    paddingVertical: 14, 
    fontSize: 18, // Texto más grande para mejor lectura
    color: '#000000', // Negro puro
    fontWeight: '500'
  },

  authButton: { backgroundColor: '#EA580C', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  authButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },



  switchText: { textAlign: 'center', color: '#EA580C', fontWeight: '600' }
});