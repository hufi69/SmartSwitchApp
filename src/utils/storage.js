import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_EMAIL: '@user_email',
  USER_PASSWORD: '@user_password',
  REMEMBER_ME: '@remember_me',
  LOGIN_TIMESTAMP: '@login_timestamp',
};

const REMEMBER_ME_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

// Save user credentials with remember me
export const saveUserCredentials = async (email, password, rememberMe) => {
  try {
    if (rememberMe) {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.USER_EMAIL, email],
        [STORAGE_KEYS.USER_PASSWORD, password],
        [STORAGE_KEYS.REMEMBER_ME, 'true'],
        [STORAGE_KEYS.LOGIN_TIMESTAMP, Date.now().toString()],
      ]);
      console.log('User credentials saved with Remember Me');
    } else {
      // Clear saved credentials if remember me is unchecked
      await clearUserCredentials();
    }
  } catch (error) {
    console.error('Error saving credentials:', error);
  }
};

// Get saved user credentials
export const getSavedCredentials = async () => {
  try {
    const values = await AsyncStorage.multiGet([
      STORAGE_KEYS.USER_EMAIL,
      STORAGE_KEYS.USER_PASSWORD,
      STORAGE_KEYS.REMEMBER_ME,
      STORAGE_KEYS.LOGIN_TIMESTAMP,
    ]);

    const credentials = {
      email: values[0][1],
      password: values[1][1],
      rememberMe: values[2][1] === 'true',
      loginTimestamp: values[3][1],
    };

    // Check if 30 days have passed
    if (credentials.rememberMe && credentials.loginTimestamp) {
      const currentTime = Date.now();
      const loginTime = parseInt(credentials.loginTimestamp);
      const timeDiff = currentTime - loginTime;

      if (timeDiff > REMEMBER_ME_DURATION) {
        // 30 days passed, clear credentials
        await clearUserCredentials();
        console.log('30 days passed, credentials cleared');
        return null;
      }
    }

    if (credentials.email && credentials.password && credentials.rememberMe) {
      return credentials;
    }

    return null;
  } catch (error) {
    console.error('Error getting credentials:', error);
    return null;
  }
};

// Clear user credentials (on logout or 30 days expiry)
export const clearUserCredentials = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_EMAIL,
      STORAGE_KEYS.USER_PASSWORD,
      STORAGE_KEYS.REMEMBER_ME,
      STORAGE_KEYS.LOGIN_TIMESTAMP,
    ]);
    console.log('User credentials cleared');
  } catch (error) {
    console.error('Error clearing credentials:', error);
  }
};

// Check if user should be auto-logged in
export const shouldAutoLogin = async () => {
  const credentials = await getSavedCredentials();
  return credentials !== null;
};
