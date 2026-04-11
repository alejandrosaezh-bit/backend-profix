import { Feather } from '@expo/vector-icons';
import { useContext, useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, Modal, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { api } from '../utils/api';
import { OTA_VERSION } from '../utils/version';

export default function LoginScreen({ navigation }) {
  const { login, register, isLoading } = useContext(AuthContext);
  const [isRegistering, setIsRegistering] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Recovery States
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(1);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleRequestRecovery = async () => {
    if (!recoveryEmail) {
      Alert.alert('Error', 'Ingresa tu correo electrónico');
      return;
    }
    setIsRecovering(true);
    try {
      await api.forgotPassword(recoveryEmail);
      setRecoveryStep(2);
      Alert.alert('Éxito', 'Te hemos enviado un código a tu correo');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setIsRecovering(false);
    }
  };

  const handleResetPassword = async () => {
    if (!recoveryCode || !newPassword) {
      Alert.alert('Error', 'Completa el código y tu nueva contraseña');
      return;
    }
    setIsRecovering(true);
    try {
      await api.resetPassword(recoveryEmail, recoveryCode, newPassword);
      Alert.alert('Éxito', 'Contraseña actualizada. Ya puedes iniciar sesión.');
      setShowRecoveryModal(false);
      setRecoveryStep(1);
      setRecoveryCode('');
      setNewPassword('');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setIsRecovering(false);
    }
  };

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
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 10 }}>
            <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#4B5563" />
          </TouchableOpacity>
        </View>

        {!isRegistering && (
          <TouchableOpacity onPress={() => setShowRecoveryModal(true)} style={{ alignItems: 'flex-end', marginBottom: 15, marginTop: -5 }}>
            <Text style={{ color: '#2563EB', fontWeight: 'bold' }}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>
        )}

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
            <View style={{ transform: [{ scale: 0.6 }] }}>
              <View style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}>
                <View style={{
                  width: 30, height: 30, borderRadius: 15,
                  borderWidth: 4, borderColor: 'white',
                  borderTopColor: '#EA580C', borderRightColor: '#EA580C',
                  transform: [{ rotate: '-45deg' }]
                }} />
              </View>
            </View>
          ) : (
            <Text style={styles.authButtonText}>
              {isRegistering ? 'Registrarse' : 'Entrar'}
            </Text>
          )}
        </TouchableOpacity>

        {isLoading && (
          <Text style={{ textAlign: 'center', color: '#6B7280', fontSize: 12, marginTop: 10 }}>
            El servidor puede tardar unos segundos en despertar. Por favor, espera...
          </Text>
        )}

        <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={{ marginTop: 15 }}>
          <Text style={styles.switchText}>
            {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Zona de Información de Versión */}
      <View style={{ marginTop: 30, alignItems: 'center', opacity: 0.8 }}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Versión: {OTA_VERSION}</Text>
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

      {/* Modal de Recuperación */}
      <Modal visible={showRecoveryModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: 'white', padding: 25, borderRadius: 24, elevation: 5 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>Recuperar Contraseña</Text>
              <TouchableOpacity onPress={() => { setShowRecoveryModal(false); setRecoveryStep(1); }}>
                <Feather name="x" size={24} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {recoveryStep === 1 ? (
              <>
                <Text style={{ color: '#4B5563', marginBottom: 15 }}>Ingresa tu correo y te enviaremos un código para restablecer tu contraseña.</Text>
                <View style={styles.inputGroup}>
                  <Feather name="mail" size={20} color="#000000" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Correo electrónico"
                    style={styles.input}
                    value={recoveryEmail}
                    onChangeText={setRecoveryEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                <TouchableOpacity style={styles.authButton} onPress={handleRequestRecovery} disabled={isRecovering}>
                  <Text style={styles.authButtonText}>{isRecovering ? 'Enviando...' : 'Enviar Código'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={{ color: '#4B5563', marginBottom: 15 }}>Revisa tu correo ({recoveryEmail}) e ingresa el código de 6 dígitos.</Text>
                <View style={styles.inputGroup}>
                  <Feather name="key" size={20} color="#000000" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Código de 6 dígitos"
                    style={styles.input}
                    value={recoveryCode}
                    onChangeText={setRecoveryCode}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Feather name="lock" size={20} color="#000000" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Nueva contraseña"
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />
                </View>
                <TouchableOpacity style={styles.authButton} onPress={handleResetPassword} disabled={isRecovering}>
                  <Text style={styles.authButtonText}>{isRecovering ? 'Guardando...' : 'Guardar y Entrar'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ marginTop: 15, alignItems: 'center' }} onPress={() => setRecoveryStep(1)}>
                  <Text style={{ color: '#2563EB', fontWeight: 'bold' }}>Solicitar otro código</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

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