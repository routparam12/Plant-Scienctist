import { Platform } from 'react-native';
import { authStorage } from './authStorage';

// ─── Host PC's Wi-Fi LAN IP (updated to current subnet) ───
const HOST_LAN_IP = '192.168.1.36';
const DEFAULT_LAN_API = `http://${HOST_LAN_IP}:8000`;
const ALT_LAN_APIS = ['http://192.168.1.36:8000', 'http://192.168.1.43:8000', 'http://192.168.0.165:8000'];

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
    // User-override from .env if defined
    if (API_BASE_URL) bases.push(API_BASE_URL);
    // Primary LAN IP (works over current Wi-Fi)
    bases.push(DEFAULT_LAN_API);
    // Fallback LAN IPs
    for (const alt of ALT_LAN_APIS) {
      bases.push(alt);
    }
    // Android emulator special IP
    bases.push('http://10.0.2.2:8000');
  } else {
    // iOS simulator: localhost works directly
    bases.push('http://localhost:8000');
    if (API_BASE_URL) bases.push(API_BASE_URL);
    bases.push(DEFAULT_LAN_API);
    for (const alt of ALT_LAN_APIS) {
      bases.push(alt);
    }
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
  timeout?: number;
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

/**
 * Multipart/form-data upload using React Native's native XMLHttpRequest.
 * Bypasses Expo SDK's WinterCG fetch polyfill which throws:
 * "Unsupported FormDataPart implementation" when encountering React Native's { uri, name, type } format.
 */
export async function apiMultipartRequest<T = any>(
  endpoint: string,
  formData: FormData,
  requiresAuth: boolean = true,
  _isRetry = false
): Promise<T> {
  const token = requiresAuth ? await authStorage.getAccessToken() : null;
  const candidateBases = buildCandidateBases();

  let lastError: any = null;

  for (const base of candidateBases) {
    const candidateUrl = `${base}${endpoint}`;
    try {
      const result = await new Promise<{ status: number; text: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', candidateUrl);
        xhr.timeout = 30000;

        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        // IMPORTANT: Never manually set 'Content-Type': 'multipart/form-data'.
        // React Native / XMLHttpRequest automatically generates the boundary header!

        xhr.onload = () => {
          resolve({ status: xhr.status, text: xhr.responseText });
        };

        xhr.onerror = () => {
          reject(new Error(`Network request failed at ${candidateUrl}`));
        };

        xhr.ontimeout = () => {
          reject(new Error(`Upload request timed out at ${candidateUrl}`));
        };

        xhr.send(formData as any);
      });

      // Handle 401 Unauthorized token refresh
      if (result.status === 401 && requiresAuth && !_isRetry) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          return apiMultipartRequest<T>(endpoint, formData, true, true);
        }
      }

      if (result.status >= 200 && result.status < 300) {
        if (cachedWorkingBaseUrl !== base) {
          console.log(`[API] Connected via ${base}`);
        }
        cachedWorkingBaseUrl = base;

        try {
          return JSON.parse(result.text) as T;
        } catch {
          return result.text as unknown as T;
        }
      } else {
        let errorMsg = `HTTP ${result.status}`;
        try {
          const parsed = JSON.parse(result.text);
          errorMsg = parsed.detail || parsed.message || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  const triedUrls = candidateBases.map((b) => `${b}${endpoint}`).join(', ');
  console.error(`API Multipart Request failed. Tried: [${triedUrls}] Error:`, lastError?.message || lastError);
  throw new Error(
    `Cannot connect to backend server. Tried:\n• ${candidateBases.join('\n• ')}\n\n` +
    `Ensure FastAPI is running with: uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000`
  );
}

export async function apiRequest<T = any>(endpoint: string, options: RequestOptions = {}, _isRetry = false): Promise<T> {
  const { requiresAuth = true, headers = {}, ...rest } = options;

  // Intercept FormData bodies to avoid Expo WinterCG fetch "Unsupported FormDataPart implementation"
  if (rest.body instanceof FormData) {
    return apiMultipartRequest<T>(endpoint, rest.body, requiresAuth, _isRetry);
  }

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
  if (!mergedHeaders['Content-Type']) {
    mergedHeaders['Content-Type'] = 'application/json';
  }

  const candidateBases = buildCandidateBases();

  const isMutating = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase() || 'GET');
  const timeoutMs = options.timeout || (isMutating ? 20000 : 15000);

  let lastError: any = null;
  let successfulResponse: Response | null = null;
  let workingBase: string = candidateBases[0];

  for (const base of candidateBases) {
    const candidateUrl = `${base}${endpoint}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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
      // If the request was aborted due to timeout and was a mutating request (e.g. POST /v1/auth/otp/request),
      // DO NOT continue spamming alternate candidate URLs which creates duplicate side-effects (e.g. duplicate OTPs)
      if (isMutating && (err.name === 'AbortError' || err.message?.includes('canceled') || err.message?.includes('aborted'))) {
        break;
      }
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
    timeout: 25000,
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
    timeout: 20000,
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
  latitude?: number;
  longitude?: number;
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
  return null;
}

export async function updateUserLocation(locationData: {
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  source?: 'signup' | 'device' | 'manual';
}) {
  try {
    return await updateProfile({
      district: locationData.city,
      state: locationData.state,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
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

export interface VoiceQueryOptions {
  audioUri?: string;
  queryText?: string;
  language?: string;
  cropId?: string;
  returnAudio?: boolean;
}

export interface VoiceQueryResponse {
  success: boolean;
  transcript: string;
  transcription?: string;
  reply_text: string;
  plant_response?: string;
  audio_base64?: string | null;
  detected_crop?: string | null;
  language?: string;
  active_issue?: string | null;
  has_memory?: boolean;
}

export async function queryVoiceAssistant(
  audioUriOrOptions: string | VoiceQueryOptions,
  returnAudio: boolean = false
): Promise<VoiceQueryResponse> {
  const options: VoiceQueryOptions =
    typeof audioUriOrOptions === 'string'
      ? { audioUri: audioUriOrOptions, returnAudio }
      : audioUriOrOptions;

  const formData = new FormData();

  if (options.audioUri) {
    const filename = options.audioUri.split('/').pop() || 'farmer_voice.m4a';
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1].toLowerCase() : 'm4a';
    const mimeType = ext === 'wav' ? 'audio/wav' : ext === 'mp3' ? 'audio/mpeg' : 'audio/m4a';

    const filePayload = {
      uri: options.audioUri,
      name: filename,
      type: mimeType,
    } as any;

    formData.append('audio', filePayload);
    formData.append('audio_file', filePayload);
  }

  if (options.queryText) {
    formData.append('query_text', options.queryText);
  }

  if (options.language) {
    formData.append('language', options.language);
  }

  if (options.cropId) {
    formData.append('crop_id', options.cropId);
  }

  formData.append('return_audio', String(Boolean(options.returnAudio)));

  return apiRequest<VoiceQueryResponse>('/v1/voice/query', {
    method: 'POST',
    requiresAuth: true,
    body: formData,
  });
}

// ─────────────────────────────────────────────────────────────
// UNIFIED ASSISTANT ENDPOINT (/v1/assistant/message)
// ─────────────────────────────────────────────────────────────

export interface UploadMediaResult {
  success: boolean;
  media_id: string;
  url: string;
  content_type: string;
  filename: string;
  size: number;
}

export async function uploadMedia(
  uri: string,
  category: string = 'media'
): Promise<UploadMediaResult> {
  const formData = new FormData();
  const filename = uri.split('/').pop() || 'upload.bin';
  const match = /\.(\w+)$/.exec(filename);
  const ext = match ? match[1].toLowerCase() : 'jpg';

  let mimeType = 'image/jpeg';
  if (ext === 'png') mimeType = 'image/png';
  else if (ext === 'webp') mimeType = 'image/webp';
  else if (ext === 'm4a') mimeType = 'audio/m4a';
  else if (ext === 'wav') mimeType = 'audio/wav';
  else if (ext === 'mp3') mimeType = 'audio/mpeg';
  else if (ext === 'webm') mimeType = 'audio/webm';

  formData.append('file', {
    uri,
    name: filename,
    type: mimeType,
  } as any);

  formData.append('category', category);

  return apiRequest<UploadMediaResult>('/v1/media/upload', {
    method: 'POST',
    requiresAuth: true,
    body: formData,
  });
}

export interface AssistantMessagePayload {
  conversation_id?: string;
  input_mode: 'voice' | 'text';
  audio_media_id?: string | null;
  image_media_ids?: string[] | null;
  text?: string | null;
  language?: string;
  crop_id?: string | null;
}

export interface AssistantMessageResponse {
  reply_text: string;
  audio_url?: string | null;
  transcript?: string | null;
  intent?: string;
  confidence?: number;
  is_followup?: boolean;
  follow_up_question?: string | null;
  detected_crop?: string | null;
  crop_type_id?: string | null;
  conversation_id?: string;
  source?: string;
}

export async function sendAssistantMessage(
  payload: AssistantMessagePayload
): Promise<AssistantMessageResponse> {
  return apiRequest<AssistantMessageResponse>('/v1/assistant/message', {
    method: 'POST',
    requiresAuth: true,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}


