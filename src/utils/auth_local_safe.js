console.log('[auth_local_safe] archivo cargado');
const USERS_KEY = 'profix_users_v1';

async function getAllUsers() {
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    console.log('[auth_local_safe] getAllUsers raw:', raw);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    console.log('[auth_local_safe] getAllUsers parsed:', parsed);
    return parsed;
  } catch (e) {
    console.warn('auth_local_safe: could not read users', e);
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
  console.log('[auth_local_safe] registerUser - before:', users);
  const exists = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  if (exists) throw new Error('User already exists');
  const user = { email, password, name: name || email.split('@')[0], image: image || null, role: 'client' };
  users.push(user);
  try {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
    console.log('[auth_local_safe] registerUser - after:', users);
  } catch (e) {
    console.error('[auth_local_safe] ERROR al guardar usuario:', e);
  }
  return user;
}

export async function checkCredentials(email, password) {
  if (!email || !password) return null;
  const user = await getUser(email);
  if (!user) return null;
  return user.password === password ? user : null;
}

export default { getUser, registerUser, checkCredentials };
