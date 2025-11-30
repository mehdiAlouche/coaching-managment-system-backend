import bcrypt from 'bcryptjs';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { UserModel, IUser } from '../../user/model/user.model';
import { RegisterUserDto, LoginUserDto, AuthResponse } from '../types/auth.types';
import { Types } from 'mongoose';

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

function generateAccessToken(user: IUser): string {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    tokenVersion: user.tokenVersion || 0,
  };

  const secret: Secret = process.env.JWT_SECRET ?? 'dev-secret';
  const expiresIn: SignOptions['expiresIn'] = (process.env.JWT_ACCESS_EXPIRY ?? '15m') as SignOptions['expiresIn'];

  return jwt.sign(payload, secret, { expiresIn });
}

function generateRefreshToken(user: IUser): string {
  const payload = {
    userId: user._id,
    tokenVersion: user.tokenVersion || 0,
  };

  const secret: Secret = process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret';
  const expiresIn: SignOptions['expiresIn'] = (process.env.JWT_REFRESH_EXPIRY ?? '7d') as SignOptions['expiresIn'];

  return jwt.sign(payload, secret, { expiresIn });
}

function formatUserResponse(user: IUser, token: string, refreshToken: string): AuthResponse {
  return {
    token,
    refreshToken,
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
    tokenVersion: 0,
  });

  // Generate tokens
  const token = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Hash and store refresh token
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  await UserModel.findByIdAndUpdate(user._id, { refreshToken: hashedRefreshToken });

  return formatUserResponse(user, token, refreshToken);
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
  if (!user.password) {
    throw new AuthenticationError('Invalid email or password');
  }
  const isValid = await bcrypt.compare(data.password, user.password);
  if (!isValid) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AuthenticationError('Account is inactive');
  }

  // Generate tokens
  const token = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Hash and store refresh token
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  await UserModel.findByIdAndUpdate(user._id, { refreshToken: hashedRefreshToken });

  return formatUserResponse(user, token, refreshToken);
}

export async function getCurrentUser(userId: string): Promise<IUser> {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AuthenticationError('User not found');
  }
  return user;
}

export async function refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
  try {
    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret'
    ) as { userId: string; tokenVersion: number };

    // Find user and include refresh token
    const user = await UserModel.findById(decoded.userId)
      .select('+refreshToken')
      .exec();

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AuthenticationError('Account is inactive');
    }

    // Verify token version
    if (decoded.tokenVersion !== user.tokenVersion) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Verify stored refresh token
    if (!user.refreshToken) {
      throw new AuthenticationError('No refresh token found');
    }

    const isValidRefreshToken = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValidRefreshToken) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Hash and store new refresh token
    const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);
    await UserModel.findByIdAndUpdate(user._id, { refreshToken: hashedRefreshToken });

    return formatUserResponse(user, newAccessToken, newRefreshToken);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid refresh token');
    }
    throw error;
  }
}

export async function logout(userId: string): Promise<void> {
  // Increment token version to invalidate all existing tokens
  await UserModel.findByIdAndUpdate(userId, {
    $inc: { tokenVersion: 1 },
    $unset: { refreshToken: 1 },
  });
}
