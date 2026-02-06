import AsyncStorage from '@react-native-async-storage/async-storage';

const REQUESTS_KEY = 'profesional_cercano_requests_v1';

export async function getRequests() {
  try {
    const raw = await AsyncStorage.getItem(REQUESTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    console.log('[requests] getRequests -> read', parsed && parsed.length ? parsed.length : 0);
    return parsed;
  } catch (err) {
    console.warn('Error leyendo solicitudes:', err);
    return [];
  }
}

export async function saveRequest(request) {
  try {
    const list = await getRequests();
    const updated = [request, ...list];
    await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(updated));
    console.log('[requests] saveRequest -> wrote', request.id, 'total', updated.length);
    return updated;
  } catch (err) {
    console.warn('Error guardando solicitud:', err);
    throw err;
  }
}

export async function clearRequests() {
  try {
    await AsyncStorage.removeItem(REQUESTS_KEY);
    return true;
  } catch (err) {
    console.warn('Error borrando solicitudes:', err);
    return false;
  }
}

export async function setRequests(list) {
  try {
    const payload = list || [];
    const stringified = JSON.stringify(payload);

    try {
      await AsyncStorage.setItem(REQUESTS_KEY, stringified);
    } catch (quotaErr) {
      if (quotaErr.name === 'QuotaExceededError' || quotaErr.message.includes('quota')) {
        console.warn('[requests] Quota exceeded. Clearing old requests to make space.');
        // Try clearing and saving only the most recent ones
        if (Array.isArray(payload) && payload.length > 5) {
          const reduced = payload.slice(0, 5);
          await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(reduced));
        } else {
          await AsyncStorage.removeItem(REQUESTS_KEY);
        }
      } else {
        throw quotaErr;
      }
    }

    // verify
    const raw = await AsyncStorage.getItem(REQUESTS_KEY);
    try {
      const parsed = raw ? JSON.parse(raw) : [];
      console.log('[requests] setRequests -> wrote', parsed && parsed.length ? parsed.length : 0);
    } catch (e) {
      console.warn('[requests] setRequests -> write verification failed', e);
    }
    return true;
  } catch (err) {
    console.warn('Error estableciendo solicitudes:', err);
    return false;
  }
}

export default { getRequests, saveRequest, clearRequests };
