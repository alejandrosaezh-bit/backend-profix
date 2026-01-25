import AsyncStorage from '@react-native-async-storage/async-storage';

console.log('[auth_local] archivo cargado');

const USERS_KEY = 'profix_users_v1';

async function getAllUsers() {
  try {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    console.log('[auth_local] getAllUsers raw:', raw);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    console.log('[auth_local] getAllUsers parsed:', parsed);
    return parsed;
  } catch (e) {
    console.warn('auth_local: could not read users', e);
    return [];
  }
}

export async function getUser(email) {
  if (!email) return null;
  const users = await getAllUsers();
  return users.find(u => u.email?.toLowerCase() === email.toLowerCase()) || null;
}

export async function registerUser({ email, password, name, image }) {
  if (!email || !password) throw new Error('email and password required');
  const users = await getAllUsers();
  console.log('[auth_local] registerUser - before:', users);
  const exists = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  if (exists) throw new Error('User already exists');
  const user = { email, password, name: name || email.split('@')[0], image: image || null, role: 'client' };
  users.push(user);
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  console.log('[auth_local] registerUser - after:', users);
  return user;
}

export async function checkCredentials(email, password) {
  if (!email || !password) return null;
  const user = await getUser(email);
  if (!user) return null;
  return user.password === password ? user : null;
}

export default { getUser, registerUser, checkCredentials };
