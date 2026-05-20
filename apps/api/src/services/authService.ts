import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../utils/jwt';
import { ConflictError, NotFoundError, AuthenticationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { RegisterInput, LoginInput, AuthResponse } from '../schemas/auth';

const prisma = new PrismaClient();

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  logger.info('Registering new user', { email: input.email });

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    logger.warn('Registration failed: user already exists', { email: input.email });
    throw new ConflictError(`User with email ${input.email} already exists`);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(input.password, 10);

  try {
    // Create user
    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        profile: {
          create: {
            favoriteGenres: '[]',
            favoriteDirectors: '[]',
            favoriteActors: '[]',
          },
        },
      },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    logger.info('User registered successfully', { userId: user.id, email: user.email });

    return {
      id: user.id,
      email: user.email,
      token,
    };
  } catch (error) {
    logger.error('Error creating user', error as Error);
    throw error;
  }
}

export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  logger.info('User login attempt', { email: input.email });

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    logger.warn('Login failed: user not found', { email: input.email });
    throw new AuthenticationError('Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(input.password, user.password);

  if (!isPasswordValid) {
    logger.warn('Login failed: invalid password', { email: input.email });
    throw new AuthenticationError('Invalid email or password');
  }

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email,
  });

  logger.info('User logged in successfully', { userId: user.id, email: user.email });

  return {
    id: user.id,
    email: user.email,
    token,
  };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) throw new AuthenticationError('La contraseña actual es incorrecta');

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  logger.info('Password changed', { userId });
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  return user;
}
