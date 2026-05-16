import { Request, Response, NextFunction } from 'express';
import { extractTokenFromHeader, verifyToken } from '../utils/jwt';
import { AuthenticationError } from '../utils/errors';
import { logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      logger.warn('Missing authorization token', { path: req.path });
      throw new AuthenticationError('Missing authorization token');
    }

    const payload = verifyToken(token);
    req.userId = payload.userId;
    req.userEmail = payload.email;

    next();
  } catch (error) {
    logger.error('Authentication middleware error', error as Error);
    if (error instanceof AuthenticationError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    } else {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
      });
    }
  }
}

export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const payload = verifyToken(token);
      req.userId = payload.userId;
      req.userEmail = payload.email;
    }
  } catch (error) {
    logger.debug('Optional auth middleware: token verification failed', { path: req.path });
    // Silently continue even if token is invalid
  }

  next();
}
