export type UserRole = 'admin' | 'manager' | 'marketer' | 'viewer';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  teamId?: string;
  isEmailVerified: boolean;
  isMfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  planId: string;
  memberCount: number;
  createdAt: string;
}