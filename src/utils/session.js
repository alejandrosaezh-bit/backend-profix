// Removed opening markdown fence
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'profesional_cercano_user_session_v2'; // Changed key to ensure clean start

export async function saveSession(user) {
  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return true;
  } catch (err) {
    console.warn('Error saving session:', err);
    return false;
  }
}

export async function getSession() {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Error reading session:', err);
    return null;
  }
}

export async function clearSession() {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
    return true;
  } catch (err) {
    console.warn('Error clearing session:', err);
    return false;
  }
}

export default { saveSession, getSession, clearSession };
