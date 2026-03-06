import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'General',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#EA580C',
    });
  }

  let isDevice = true;
  try {
    const Device = await import('expo-device');
    isDevice = (Device && (Device.isDevice ?? Device.default?.isDevice)) ?? true;
  } catch (e) {
    isDevice = false;
  }

  if (!isDevice && Platform.OS !== 'web') {
    console.warn('Push notifications fully supported only on physical devices (expo-device not available).');
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return null;
    }

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? '19584c7c-7dfb-4799-aa70-26a452f02714';
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId
    });
    return tokenData?.data ?? null;
  } catch (e) {
    console.log('Error getting push token (handled):', e);
    return null;
  }
}

export default { registerForPushNotificationsAsync };
