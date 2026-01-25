// Removed opening markdown fence
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SESSION_KEY = 'profix_user_session_v1';

async function saveWithSecureStore(user) {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(user));
}

async function getWithSecureStore() {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

async function deleteWithSecureStore() {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export async function saveSession(user) {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      await saveWithSecureStore(user);
    }
    return true;
  } catch (err) {
    console.warn('Error saving session:', err);
    return false;
  }
}

export async function getSession() {
  try {
    if (Platform.OS === 'web') {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    }
    return await getWithSecureStore();
  } catch (err) {
    console.warn('Error reading session:', err);
    return null;
  }
}

export async function clearSession() {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(SESSION_KEY);
    } else {
      await deleteWithSecureStore();
    }
    return true;
  } catch (err) {
    console.warn('Error clearing session:', err);
    return false;
  }
}

export default { saveSession, getSession, clearSession };
