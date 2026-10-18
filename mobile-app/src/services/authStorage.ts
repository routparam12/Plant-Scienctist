import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'plant_scientist_access_token';
const REFRESH_TOKEN_KEY = 'plant_scientist_refresh_token';
const USER_DATA_KEY = 'plant_scientist_user';
const LAST_ACTIVE_KEY = 'plant_scientist_last_active_at';
const LANGUAGE_KEY = 'plant_scientist_app_language';

const SESSION_MAX_AGE_MS = 24 * 24 * 60 * 60 * 1000; // 24 days (matches refresh token lifetime)

let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;

async function isSecureStoreAvailable(): Promise<boolean> {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

async function touchSession(): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
  } catch (e) {
    console.warn('Could not update last active timestamp:', e);
  }
}

export const authStorage = {
  async isSessionExpired(): Promise<boolean> {
    try {
      const lastActiveStr = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
      if (!lastActiveStr) return false;
      const lastActive = parseInt(lastActiveStr, 10);
      if (isNaN(lastActive)) return false;
      const elapsed = Date.now() - lastActive;
      return elapsed > SESSION_MAX_AGE_MS;
    } catch {
      return false;
    }
  },

  async saveTokens(accessToken: string, refreshToken: string, user?: any) {
    memoryAccessToken = accessToken;
    memoryRefreshToken = refreshToken;
    const useSecure = await isSecureStoreAvailable();
    try {
      if (useSecure) {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      } else {
        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }

      if (user) {
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
      }

      await touchSession();
    } catch (e) {
      console.warn('Could not persist encrypted tokens to storage:', e);
    }
  },

  async getAccessToken(): Promise<string | null> {
    const expired = await this.isSessionExpired();
    if (expired) {
      await this.clearSession();
      return null;
    }

    if (memoryAccessToken) {
      await touchSession();
      return memoryAccessToken;
    }

    const useSecure = await isSecureStoreAvailable();
    try {
      const token = useSecure
        ? await SecureStore.getItemAsync(ACCESS_TOKEN_KEY)
        : await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      memoryAccessToken = token;
      if (token) {
        await touchSession();
      }
      return token;
    } catch {
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    const expired = await this.isSessionExpired();
    if (expired) {
      await this.clearSession();
      return null;
    }

    if (memoryRefreshToken) {
      await touchSession();
      return memoryRefreshToken;
    }

    const useSecure = await isSecureStoreAvailable();
    try {
      const token = useSecure
        ? await SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
        : await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      memoryRefreshToken = token;
      if (token) {
        await touchSession();
      }
      return token;
    } catch {
      return null;
    }
  },

  async getUser(): Promise<any | null> {
    const expired = await this.isSessionExpired();
    if (expired) {
      await this.clearSession();
      return null;
    }

    try {
      const data = await AsyncStorage.getItem(USER_DATA_KEY);
      if (data) {
        await touchSession();
        return JSON.parse(data);
      }
      return null;
    } catch {
      return null;
    }
  },

  async clearSession() {
    memoryAccessToken = null;
    memoryRefreshToken = null;
    const useSecure = await isSecureStoreAvailable();
    try {
      if (useSecure) {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY).catch(() => {});
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {});
      }
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY).catch(() => {});
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY).catch(() => {});
      await AsyncStorage.removeItem(USER_DATA_KEY).catch(() => {});
      await AsyncStorage.removeItem(LAST_ACTIVE_KEY).catch(() => {});
    } catch (e) {
      console.warn('Error clearing encrypted session:', e);
    }
  },

  async getLanguage(): Promise<'en' | 'hi'> {
    try {
      const lang = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (lang === 'en' || lang === 'hi') {
        return lang;
      }
      return 'en';
    } catch {
      return 'en';
    }
  },

  async saveLanguage(lang: 'en' | 'hi'): Promise<void> {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    } catch (e) {
      console.warn('Could not persist language preference:', e);
    }
  },
};
