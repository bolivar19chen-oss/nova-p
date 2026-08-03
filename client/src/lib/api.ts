import axios from "axios";

// In production the frontend is served by the same Express server, so a
// relative "/api" works. Set VITE_API_URL only if you deploy the backend
// on a different host than the frontend.
const baseURL = (import.meta.env.VITE_API_URL || "") + "/api";

export const api = axios.create({ baseURL });

const TOKEN_KEY = "petNovaToken";
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---------- Types ----------
export interface Appointment {
  id: string;
  petId: string;
  date: string;
  time: string;
  type: string;
  veterinarian: string;
  notes: string;
  createdAt: string;
}

export interface Vaccine {
  id: string;
  petId: string;
  name: string;
  date: string;
  nextDue: string;
  veterinarian: string;
  createdAt: string;
}

export interface LostPetAlert {
  id: string;
  petName: string;
  date: string;
  location: string;
  description: string;
  contact: string;
  city: string;
  createdAt: string;
}

export interface AnonymousReport {
  id: string;
  category: string;
  description: string;
  location: string;
  city: string;
  createdAt: string;
}

export interface CommunityComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  author: string;
  city: string;
  petName?: string;
  text: string;
  emoji: string;
  likes: string[];
  comments: CommunityComment[];
  createdAt: string;
}

export interface TrackingUpdate {
  petId: string;
  walkerName: string;
  lat: number;
  lng: number;
  progress: number;
  etaSeconds: number;
  arrived: boolean;
}

// ---------- Appointments ----------
export const getAppointments = () => api.get<Appointment[]>("/appointments").then((r) => r.data);
export const createAppointment = (payload: Partial<Appointment>) => api.post<Appointment>("/appointments", payload).then((r) => r.data);
export const deleteAppointment = (id: string) => api.delete(`/appointments/${id}`);

// ---------- Vaccines ----------
export const getVaccines = () => api.get<Vaccine[]>("/vaccines").then((r) => r.data);
export const createVaccine = (payload: Partial<Vaccine>) => api.post<Vaccine>("/vaccines", payload).then((r) => r.data);
export const deleteVaccine = (id: string) => api.delete(`/vaccines/${id}`);

// ---------- Alerts ----------
export const getAlerts = () => api.get<LostPetAlert[]>("/alerts").then((r) => r.data);
export const createAlert = (payload: Partial<LostPetAlert>) => api.post<LostPetAlert>("/alerts", payload).then((r) => r.data);

// ---------- Anonymous reports ----------
export const getAnonymousReports = () => api.get<AnonymousReport[]>("/anonymous-reports").then((r) => r.data);
export const createAnonymousReport = (payload: Partial<AnonymousReport>) =>
  api.post<AnonymousReport>("/anonymous-reports", payload).then((r) => r.data);

// ---------- Community ----------
export const getPosts = () => api.get<CommunityPost[]>("/community/posts").then((r) => r.data);
export const createPost = (payload: Partial<CommunityPost>) => api.post<CommunityPost>("/community/posts", payload).then((r) => r.data);
export const likePost = (id: string, user: string) => api.post<CommunityPost>(`/community/posts/${id}/like`, { user }).then((r) => r.data);
export const commentOnPost = (id: string, author: string, text: string) =>
  api.post<CommunityPost>(`/community/posts/${id}/comments`, { author, text }).then((r) => r.data);

// ---------- Auth ----------
export interface AuthUser {
  id: string;
  ownerName: string;
  email: string;
  profile?: Record<string, unknown>;
}
export const registerAccount = (payload: { ownerName: string; email: string; password: string; profile?: Record<string, unknown> }) =>
  api.post<{ token: string; user: AuthUser }>("/auth/register", payload).then((r) => r.data);
export const loginAccount = (payload: { email: string; password: string }) =>
  api.post<{ token: string; user: AuthUser }>("/auth/login", payload).then((r) => r.data);
export const getMe = () => api.get<AuthUser>("/auth/me").then((r) => r.data);
export const updateProfile = (payload: { ownerName?: string; email?: string; profile?: Record<string, unknown> }) =>
  api.patch<AuthUser>("/auth/me", payload).then((r) => r.data);
export const changePassword = (payload: { currentPassword: string; newPassword: string }) =>
  api.post<{ ok: true }>("/auth/change-password", payload).then((r) => r.data);

// ---------- Photo upload ----------
export const uploadPhoto = (file: File) => {
  const form = new FormData();
  form.append("photo", file);
  return api.post<{ url: string }>("/upload", form, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
};

// ---------- Live tracking ("buddy en camino") ----------
export const startTracking = (payload: { petId: string; walkerName?: string; start: { lat: number; lng: number }; end: { lat: number; lng: number }; durationSeconds?: number }) =>
  api.post("/tracking/start", payload).then((r) => r.data);
export const getTracking = (petId: string) => api.get<TrackingUpdate>(`/tracking/${petId}`).then((r) => r.data);
