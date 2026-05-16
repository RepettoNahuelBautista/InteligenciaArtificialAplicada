import { Request, Response } from 'express';
import { registerUser, loginUser } from '../services/authService';
import { RegisterSchema, LoginSchema } from '../schemas/auth';
import { logger } from '../utils/logger';

export async function registerController(req: Request, res: Response): Promise<void> {
  try {
    const validatedInput = RegisterSchema.parse(req.body);
    const result = await registerUser(validatedInput);

    res.status(201).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
}

export async function loginController(req: Request, res: Response): Promise<void> {
  try {
    const validatedInput = LoginSchema.parse(req.body);
    const result = await loginUser(validatedInput);

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
}

export function meController(req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    data: {
      userId: req.userId,
      email: req.userEmail,
    },
    timestamp: new Date().toISOString(),
  });
}
