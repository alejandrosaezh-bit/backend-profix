import * as SecureStore from 'expo-secure-store';
import { API_URL } from './api';

const ACCESS_TOKEN_KEY = 'profesional_cercano_access_token';
const ID_TOKEN_KEY = 'profesional_cercano_id_token';

export async function saveTokens({ accessToken, idToken }) {
  try {
    if (accessToken) await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    if (idToken) await SecureStore.setItemAsync(ID_TOKEN_KEY, idToken);
    return true;
  } catch (err) {
    console.warn('Error guardando tokens en SecureStore', err);
    return false;
  }
}

export async function getTokens() {
  try {
    const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    const idToken = await SecureStore.getItemAsync(ID_TOKEN_KEY);
    return { accessToken, idToken };
  } catch (err) {
    console.warn('Error leyendo tokens de SecureStore', err);
    return { accessToken: null, idToken: null };
  }
}

export async function clearTokens() {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(ID_TOKEN_KEY);
    return true;
  } catch (err) {
    console.warn('Error borrando tokens de SecureStore', err);
    return false;
  }
}

/**
 * Envía el access token al backend para crear/validar sesión.
 * Reemplaza `BACKEND_URL` por la URL de tu servidor.
 * El backend debe verificar el token con Google y responder con
 * la sesión propia (cookie, jwt, user data, etc.).
 */
export async function sendTokenToBackend(accessToken) {
  if (!accessToken) throw new Error('No access token provided');
  const BACKEND_URL = API_URL;

  try {
    const res = await fetch(`${BACKEND_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Backend responded ${res.status}: ${text}`);
    }
    const json = await res.json();
    return json; // espera { ok: true, user: {...}, token: '...' } o similar
  } catch (err) {
    console.warn('Error enviando token al backend:', err);
    throw err;
  }
}

export default { saveTokens, getTokens, clearTokens, sendTokenToBackend };
