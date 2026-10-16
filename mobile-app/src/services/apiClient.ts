import { Platform } from 'react-native';
import { authStorage } from './authStorage';

// ─── Host PC's Wi-Fi LAN IP (updated to current subnet) ───
const HOST_LAN_IP = '192.168.1.36';
const DEFAULT_LAN_API = `http://${HOST_LAN_IP}:8000`;
const ALT_LAN_API = 'http://192.168.0.165:8000';

// User-override via .env
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_LAN_API;

// ─── Smart candidate list based on platform & connection type ───
function buildCandidateBases(): string[] {
  // If we already found a working base, always try it first
  const bases: string[] = [];
  if (cachedWorkingBaseUrl) bases.push(cachedWorkingBaseUrl);

  if (Platform.OS === 'web') {
    // Web: same-origin or explicit URL
    bases.push(API_BASE_URL);
    bases.push('http://localhost:8000');
  } else if (Platform.OS === 'android') {
    // Android physical device via USB: adb reverse makes localhost work
    bases.push('http://localhost:8000');
    // Primary LAN IP (works over current Wi-Fi)
    bases.push(DEFAULT_LAN_API);
    // Alternate LAN IP
    bases.push(ALT_LAN_API);
    // Android emulator special IP
    bases.push('http://10.0.2.2:8000');
    // User-override
    if (API_BASE_URL !== DEFAULT_LAN_API) bases.push(API_BASE_URL);
  } else {
    // iOS simulator: localhost works directly
    bases.push('http://localhost:8000');
    bases.push(DEFAULT_LAN_API);
    bases.push(ALT_LAN_API);
    if (API_BASE_URL !== DEFAULT_LAN_API) bases.push(API_BASE_URL);
  }

  // De-duplicate while preserving order
  return [...new Set(bases)];
}

// Adaptive base URL with auto-detection for physical USB (adb reverse), Wi-Fi LAN, and Emulator
let cachedWorkingBaseUrl: string | null = null;

export function getBaseUrl(): string {
  return cachedWorkingBaseUrl || API_BASE_URL;
}

export function setBaseUrl(url: string) {
  cachedWorkingBaseUrl = url;
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

// ─── Silent token refresh state ───
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  // Prevent multiple concurrent refreshes
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = await authStorage.getRefreshToken();
      if (!refreshToken) return false;

      const base = cachedWorkingBaseUrl || buildCandidateBases()[0];
      const resp = await fetch(`${base}/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!resp.ok) return false;

      const data = await resp.json();
      if (data?.access_token && data?.refresh_token) {
        await authStorage.saveTokens(data.access_token, data.refresh_token);
        console.log('[API] Token refreshed silently');
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[API] Token refresh failed:', err);
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest<T = any>(endpoint: string, options: RequestOptions = {}, _isRetry = false): Promise<T> {
  const { requiresAuth = true, headers = {}, ...rest } = options;
  const mergedHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = await authStorage.getAccessToken();
    if (token) {
      mergedHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // If body is NOT FormData, default to application/json
  if (!(rest.body instanceof FormData) && !mergedHeaders['Content-Type']) {
    mergedHeaders['Content-Type'] = 'application/json';
  }

  const candidateBases = buildCandidateBases();

  let lastError: any = null;
  let successfulResponse: Response | null = null;
  let workingBase: string = candidateBases[0];

  for (const base of candidateBases) {
    const candidateUrl = `${base}${endpoint}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const resp = await fetch(candidateUrl, {
        ...rest,
        headers: mergedHeaders,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      successfulResponse = resp;
      workingBase = base;
      if (cachedWorkingBaseUrl !== base) {
        console.log(`[API] Connected via ${base}`);
      }
      cachedWorkingBaseUrl = base;
      break;
    } catch (err: any) {
      lastError = err;
    }
  }

  if (!successfulResponse) {
    const triedUrls = candidateBases.map((b) => `${b}${endpoint}`).join(', ');
    console.error(`API Request failed for [${options.method || 'GET'}]. Tried: [${triedUrls}] Error:`, lastError?.message);
    throw new Error(
      `Cannot connect to backend server. Tried:\n• ${candidateBases.join('\n• ')}\n\n` +
      `Ensure FastAPI is running with: uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000`
    );
  }

  const response = successfulResponse;

  // ─── Auto-refresh on 401 Unauthorized ───
  if (response.status === 401 && requiresAuth && !_isRetry) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Retry the original request with the new token
      return apiRequest<T>(endpoint, options, true);
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.detail || errorBody?.message || response.statusText || `HTTP ${response.status}`;
    throw new Error(message);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }
  return (await response.blob()) as unknown as T;
}

// ─────────────────────────────────────────────────────────────
// AUTHENTICATION ENDPOINTS
// ─────────────────────────────────────────────────────────────

export async function requestOtp(email: string): Promise<{ success: boolean; message: string }> {
  return apiRequest('/v1/auth/otp/request', {
    method: 'POST',
    requiresAuth: false,
    body: JSON.stringify({ email }),
  });
}

export async function verifyOtp(email: string, token: string): Promise<{
  user: { id: string; email: string };
  session: { access_token: string; refresh_token: string; expires_in: number };
  is_new_user?: boolean;
  profile?: any;
}> {
  const data = await apiRequest('/v1/auth/otp/verify', {
    method: 'POST',
    requiresAuth: false,
    body: JSON.stringify({ email, token }),
  });

  if (data?.session?.access_token) {
    await authStorage.saveTokens(data.session.access_token, data.session.refresh_token, data.user);
  }

  return data;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest('/v1/auth/logout', { method: 'POST', requiresAuth: true });
  } catch {
    // Ignore error if token expired
  } finally {
    await authStorage.clearSession();
  }
}

// ─────────────────────────────────────────────────────────────
// FARMER PROFILE & HOME CONTEXT ENDPOINTS
// ─────────────────────────────────────────────────────────────

export async function getProfile() {
  return apiRequest('/v1/me', { method: 'GET', requiresAuth: true });
}

export async function updateProfile(profileData: {
  full_name?: string;
  phone?: string;
  preferred_language?: string;
  state?: string;
  district?: string;
  village?: string;
  total_acreage?: number;
}) {
  return apiRequest('/v1/me', {
    method: 'PATCH',
    requiresAuth: true,
    body: JSON.stringify(profileData),
  });
}

export async function completeOnboarding() {
  return apiRequest('/v1/me/onboarding/complete', {
    method: 'POST',
    requiresAuth: true,
  });
}

export async function getHomeContext() {
  try {
    return await apiRequest('/api/v1/users/me/home-context', { method: 'GET', requiresAuth: true });
  } catch {
    return null;
  }
}

export async function updateUserLocation(locationData: {
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  source?: 'signup' | 'device' | 'manual';
}) {
  try {
    return await apiRequest('/api/v1/users/me/location', {
      method: 'PATCH',
      requiresAuth: true,
      body: JSON.stringify(locationData),
    });
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// USER CROPS & CATALOG ENDPOINTS
// ─────────────────────────────────────────────────────────────

export async function getUserCrops() {
  return apiRequest('/v1/crops', { method: 'GET', requiresAuth: true });
}

export async function getCropsCatalog() {
  return apiRequest('/v1/crops/catalog', { method: 'GET', requiresAuth: false });
}

export async function getUserCropDetail(cropId: string) {
  return apiRequest(`/v1/crops/${cropId}`, { method: 'GET', requiresAuth: true });
}

export async function createUserCrop(data: {
  crop_type_id?: string;
  custom_name?: string;
  variety?: string;
  acreage?: number;
  planted_date?: string;
  reported_stage?: string;
  notes?: string;
  source?: 'manual' | 'diagnosis' | 'voice';
}) {
  return apiRequest('/v1/crops', {
    method: 'POST',
    requiresAuth: true,
    body: JSON.stringify(data),
  });
}

export async function updateUserCrop(
  cropId: string,
  data: {
    custom_name?: string;
    variety?: string;
    acreage?: number;
    planted_date?: string;
    reported_stage?: string;
    notes?: string;
  }
) {
  return apiRequest(`/v1/crops/${cropId}`, {
    method: 'PATCH',
    requiresAuth: true,
    body: JSON.stringify(data),
  });
}

export async function deleteUserCrop(cropId: string) {
  return apiRequest(`/v1/crops/${cropId}`, {
    method: 'DELETE',
    requiresAuth: true,
  });
}

export async function resolveDiagnosis(diagnosisId: string, resolved: boolean = true) {
  return apiRequest(`/v1/diagnoses/${diagnosisId}`, {
    method: 'PATCH',
    requiresAuth: true,
    body: JSON.stringify({ resolved }),
  });
}

// Legacy farm helpers
export async function getFarms() {
  return apiRequest('/v1/farms', { method: 'GET', requiresAuth: true });
}

export async function createFarm(data: {
  name: string;
  village?: string;
  district?: string;
  state?: string;
  total_acreage?: number;
  soil_type?: string;
}) {
  return apiRequest('/v1/farms', {
    method: 'POST',
    requiresAuth: true,
    body: JSON.stringify(data),
  });
}

export async function addFarmCrop(farmId: string, cropData: any) {
  return createUserCrop(cropData);
}

export async function deleteFarmCrop(farmId: string, cropId: string) {
  return deleteUserCrop(cropId);
}

// ─────────────────────────────────────────────────────────────
// DIAGNOSIS ENDPOINT
// ─────────────────────────────────────────────────────────────

export async function diagnoseCropImage(params: {
  imageUri?: string;
  notes?: string;
  crop?: string;
  language?: string;
  farmCropId?: string;
}) {
  const formData = new FormData();

  if (params.imageUri) {
    const filename = params.imageUri.split('/').pop() || 'crop_specimen.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1].toLowerCase() : 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    formData.append('image', {
      uri: params.imageUri,
      name: filename,
      type: mimeType,
    } as any);
  }

  if (params.notes) formData.append('notes', params.notes);
  if (params.crop) formData.append('crop', params.crop);
  if (params.language) formData.append('language', params.language);
  if (params.farmCropId) formData.append('farm_crop_id', params.farmCropId);

  return apiRequest('/v1/diagnoses', {
    method: 'POST',
    requiresAuth: true,
    body: formData,
  });
}

// ─────────────────────────────────────────────────────────────
// VOICE ASSISTANT ENDPOINT
// ─────────────────────────────────────────────────────────────

export async function queryVoiceAssistant(audioUri: string, returnAudio: boolean = false) {
  const formData = new FormData();
  const filename = audioUri.split('/').pop() || 'farmer_voice.m4a';
  const match = /\.(\w+)$/.exec(filename);
  const ext = match ? match[1].toLowerCase() : 'm4a';
  const mimeType = ext === 'wav' ? 'audio/wav' : ext === 'mp3' ? 'audio/mpeg' : 'audio/m4a';

  formData.append('audio_file', {
    uri: audioUri,
    name: filename,
    type: mimeType,
  } as any);

  formData.append('return_audio', String(returnAudio));

  return apiRequest('/voice/query', {
    method: 'POST',
    requiresAuth: false,
    body: formData,
  });
}
