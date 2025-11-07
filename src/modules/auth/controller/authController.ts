import { Request, Response } from 'express';
import { AuthenticationError, registerUser, authenticateUser, getCurrentUser } from '../service/authService';
import { RegisterUserDto, LoginUserDto } from '../types/auth.types';
import { AuthRequest } from '../../../middleware/auth';

export const register = async (req: Request, res: Response) => {
  try {
    const userData: RegisterUserDto = req.body;
    const result = await registerUser(userData);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const credentials: LoginUserDto = req.body;
    const result = await authenticateUser(credentials);
    res.json(result);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(401).json({ message: error.message });
    }
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await getCurrentUser(req.user.userId);
    res.json({
      id: user._id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      firstName: user.firstName,
      lastName: user.lastName,
      startupName: user.startupName,
      hourlyRate: user.hourlyRate,
      phone: user.phone,
      timezone: user.timezone,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(401).json({ message: error.message });
    }
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
