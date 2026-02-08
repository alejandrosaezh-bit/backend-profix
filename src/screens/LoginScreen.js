import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { api } from '../utils/api';
import { OTA_VERSION } from '../utils/version';

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
  const [diagStatus, setDiagStatus] = useState(''); // Estado para diagnóstico

  const runDiagnostics = async () => {
    setDiagStatus('Ejecutando pruebas exhaustivas...');
    try {
      const res = await api.checkConnection();
      setDiagStatus(`${res.ok ? '✅ ÉXITO' : '❌ ERROR'}\nLogs: ${res.logs}`);
    } catch (e) {
      setDiagStatus(`❌ Error Critico: ${e.message}`);
    }
  };

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
      // Doble confirmación visual
      // Alert.alert("Error de Registro", error.message || 'Error desconocido');
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
          {!keyboardVisible && (
            <View style={{ backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 10, marginTop: 10 }}>
              <Text style={styles.title}>
                <Text style={{ color: '#2563EB' }}>Profesional</Text>{' '}
                <Text style={{ color: '#EA580C' }}>Cercano</Text>
              </Text>
            </View>
          )}
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
                placeholderTextColor="#4B5563"
                style={styles.input}
                value={name}
                onChangeText={setName}
              />
            </View>
            <View style={styles.inputGroup}>
              <Feather name="credit-card" size={20} color="#000000" style={styles.inputIcon} />
              <TextInput
                placeholder="Cédula de Identidad"
                placeholderTextColor="#4B5563"
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
                placeholderTextColor="#4B5563"
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
            placeholderTextColor="#4B5563"
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
            placeholderTextColor="#4B5563"
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

      {/* Zona de Diagnóstico e Información de Versión */}
      <View style={{ marginTop: 30, alignItems: 'center', opacity: 0.8 }}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Versión: {OTA_VERSION}</Text>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <TouchableOpacity
            onPress={runDiagnostics}
            style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 8 }}
          >
            <Text style={{ color: 'white', fontSize: 12 }}>Diagnosticar Conexión</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              Alert.alert(
                "Reiniciar Aplicación",
                "Esto borrará la sesión actual y el historial local. Úsalo si ves errores de 'base de datos llena'.",
                [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Limpiar y Reiniciar",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await AsyncStorage.clear();
                        Alert.alert("Éxito", "Datos borrados. Reinicia la app manualmente.");
                      } catch (e) {
                        Alert.alert("Error", "No se pudieron borrar los datos.");
                      }
                    }
                  }
                ]
              );
            }}
            style={{ backgroundColor: 'rgba(255,0,0,0.2)', padding: 10, borderRadius: 8 }}
          >
            <Text style={{ color: 'white', fontSize: 12 }}>Limpiar Datos (Reset)</Text>
          </TouchableOpacity>
        </View>

        {diagStatus ? (
          <View style={{ marginTop: 10, backgroundColor: '#333', padding: 10, borderRadius: 5, width: '100%' }}>
            <Text style={{ color: '#00FF00', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10 }}>
              {diagStatus}
            </Text>
          </View>
        ) : null}
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
  container: { flex: 1, backgroundColor: '#F8F9FA' }, // Surface instead of Orange
  scrollContainer: { flexGrow: 1, justifyContent: 'flex-start', padding: 24, paddingBottom: 100, paddingTop: 40 },
  header: { alignItems: 'center', marginBottom: 32, marginTop: 20 },
  logoContainer: { backgroundColor: '#EA580C', padding: 16, borderRadius: 24, marginBottom: 12 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#111827' }, // Grey-900
  subtitle: { fontSize: 16, color: '#4B5563', marginTop: 8 }, // Grey-600

  formCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  formTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 24, textAlign: 'center' },

  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB', // Subtler border
    minHeight: 56
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16, // Body 16px
    color: '#111827', // Grey-900
    fontWeight: '500'
  },

  authButton: {
    backgroundColor: '#EA580C',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    minHeight: 56,
    justifyContent: 'center'
  },
  authButtonText: { color: 'white', fontWeight: 'bold', fontSize: 18 },

  switchText: { textAlign: 'center', color: '#EA580C', fontWeight: '600', fontSize: 14, marginTop: 16 }
});