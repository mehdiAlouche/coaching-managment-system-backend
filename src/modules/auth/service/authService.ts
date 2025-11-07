import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel, IUser } from '../../user/model/user.model';
import { RegisterUserDto, LoginUserDto, AuthResponse } from '../types/auth.types';
import { Types } from 'mongoose';

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

function generateToken(user: IUser): string {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: '24h',
  });
}

function formatUserResponse(user: IUser, token: string): AuthResponse {
  return {
    token,
    user: {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  };
}

export async function registerUser(data: RegisterUserDto): Promise<AuthResponse> {
  // Check if user already exists
  const existingUser = await UserModel.findOne({ email: data.email });
  if (existingUser) {
    throw new AuthenticationError('Email already registered');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Create user
  const user = await UserModel.create({
    ...data,
    password: hashedPassword,
    organizationId: data.organizationId ? new Types.ObjectId(data.organizationId) : undefined,
    isActive: true,
  });

  // Generate JWT
  const token = generateToken(user);

  return formatUserResponse(user, token);
}

export async function authenticateUser(data: LoginUserDto): Promise<AuthResponse> {
  // Find user and include password field which is normally excluded
  const user = await UserModel.findOne({ email: data.email })
    .select('+password')
    .exec();

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Verify password
  const isValid = await bcrypt.compare(data.password, user.password);
  if (!isValid) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AuthenticationError('Account is inactive');
  }

  // Generate JWT
  const token = generateToken(user);

  return formatUserResponse(user, token);
}

export async function getCurrentUser(userId: string): Promise<IUser> {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AuthenticationError('User not found');
  }
  return user;
}
