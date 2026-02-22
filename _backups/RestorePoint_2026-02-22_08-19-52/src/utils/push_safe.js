export async function registerForPushNotificationsAsync() {
  try {
    // Dynamic import of expo-device
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

    // Dynamic import of expo-notifications
    let Notifications;
    try {
      Notifications = await import('expo-notifications');
      Notifications = Notifications.default ?? Notifications;
    } catch (e) {
      console.warn('expo-notifications is not available in this environment:', e);
      return null;
    }

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

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      return tokenData?.data ?? null;
    } catch (e) {
      console.warn('Notifications.getExpoPushTokenAsync failed', e);
      return null;
    }
  } catch (err) {
    console.warn('Error registering for push notifications', err);
    return null;
  }
}

export default { registerForPushNotificationsAsync };
