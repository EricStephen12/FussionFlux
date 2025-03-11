import { User as FirebaseUser } from 'firebase/auth';

export interface CustomUser extends FirebaseUser {
  subscription?: {
    status: 'trial' | 'active' | 'expired';
    plan?: string;
    expiresAt?: string;
  };
  shopifyConnected?: boolean;
}

export type User = CustomUser; 