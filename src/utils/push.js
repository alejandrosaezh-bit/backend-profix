import * as Notifications from 'expo-notifications';

export async function registerForPushNotificationsAsync() {
  let isDevice = true;
  try {
    const Device = await import('expo-device');
    isDevice = (Device && (Device.isDevice ?? Device.default?.isDevice)) ?? true;
  } catch (e) {
    isDevice = false;
  }

  if (!isDevice) {
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

    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData?.data ?? null;
  } catch (e) {
    console.log('Error getting push token (handled):', e);
    return null;
  }
}

export default { registerForPushNotificationsAsync };
