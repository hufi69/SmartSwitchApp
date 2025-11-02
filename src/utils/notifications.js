import { Alert } from 'react-native';

// Request permissions (placeholder for Expo Go compatibility)
export const requestNotificationPermissions = async () => {
  // In Expo Go, we'll use alerts instead of push notifications
  return true;
};

// Send local notification using Alert for Expo Go
export const sendNotification = async (title, body, data = {}) => {
  Alert.alert(title, body, [{ text: 'OK' }]);
};

// Notification types
export const NotificationTypes = {
  OVERVOLTAGE: 'overvoltage',
  UNDERVOLTAGE: 'undervoltage',
  HIGH_POWER: 'high_power',
  DEVICE_OFFLINE: 'device_offline',
  DEVICE_ONLINE: 'device_online',
  TIMER_COMPLETE: 'timer_complete',
};

// Send alert notifications
export const sendOvervoltageAlert = async (voltage) => {
  await sendNotification(
    '⚠️ Overvoltage Alert',
    `Voltage is too high: ${voltage.toFixed(1)}V. Device may be at risk.`,
    { type: NotificationTypes.OVERVOLTAGE, voltage }
  );
};

export const sendUndervoltageAlert = async (voltage) => {
  await sendNotification(
    '⚠️ Undervoltage Alert',
    `Voltage is too low: ${voltage.toFixed(1)}V. Check your power supply.`,
    { type: NotificationTypes.UNDERVOLTAGE, voltage }
  );
};

export const sendHighPowerAlert = async (power) => {
  await sendNotification(
    '⚡ High Power Consumption',
    `Power usage is high: ${power.toFixed(0)}W. Check your connected device.`,
    { type: NotificationTypes.HIGH_POWER, power }
  );
};

export const sendDeviceOfflineAlert = async () => {
  await sendNotification(
    '🔴 Device Offline',
    'Your Smart Switch is not responding. Check your connection.',
    { type: NotificationTypes.DEVICE_OFFLINE }
  );
};

export const sendDeviceOnlineAlert = async () => {
  await sendNotification(
    '🟢 Device Online',
    'Your Smart Switch is back online.',
    { type: NotificationTypes.DEVICE_ONLINE }
  );
};

export const sendTimerCompleteAlert = async (timerName) => {
  await sendNotification(
    '⏰ Timer Complete',
    `Timer "${timerName}" has finished.`,
    { type: NotificationTypes.TIMER_COMPLETE, timerName }
  );
};
