export interface LoginRequest {
  email: string;
  password?: string;
  magicLink?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  teamName?: string;
}

export interface AuthResponse {
  user: import('./user').User;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface MagicLinkRequest {
  email: string;
  redirectTo?: string;
}

export interface OAuthProvider {
  id: 'google' | 'linkedin';
  name: string;
  clientId: string;
  redirectUri: string;
}