import { Request, Response } from 'express';

export const register = async (req: Request, res: Response) => {
  // TODO: implement registration using User service
  res.json({ message: 'register controller (stub)' });
};

export const login = async (req: Request, res: Response) => {
  // TODO: implement login + JWT issue
  res.json({ message: 'login controller (stub)' });
};
