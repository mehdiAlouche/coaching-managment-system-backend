import { Types } from 'mongoose';
import { UserRole } from '../../user/model/user.model';

export interface RegisterUserDto {
  email: string;
  password: string;
  role: UserRole;
  organizationId?: string;
  firstName?: string;
  lastName?: string;
  startupName?: string;
  hourlyRate?: number;
  phone?: string;
  timezone?: string;
}

export interface LoginUserDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    organizationId?: Types.ObjectId;
    firstName?: string;
    lastName?: string;
  };
}

export interface RefreshTokenDto {
  refreshToken: string;
}