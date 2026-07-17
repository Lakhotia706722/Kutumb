import api from './api';

export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface FamilyInfo {
  _id: string;
  name: string;
  inviteCode?: string;
  inviteCodeExpiresAt?: string;
}

export interface AuthState {
  user: User;
  family: FamilyInfo | null;
  role: 'owner' | 'member' | null;
}

export const authApi = {
  signup: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    action: 'create' | 'join';
    familyName?: string;
    inviteCode?: string;
  }) => api.post<AuthState & { message: string }>('/auth/signup', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthState & { message: string }>('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  me: () => api.get<AuthState>('/auth/me'),
};

export const familyApi = {
  getMyFamily: () => api.get('/family/me'),
  refreshInviteCode: () => api.post('/family/refresh-invite'),
  joinFamily: (inviteCode: string) => api.post('/family/join', { inviteCode }),
};
