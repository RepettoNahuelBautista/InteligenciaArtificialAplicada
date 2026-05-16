/**
 * Custom error classes for the application
 */

export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number = 500,
    message: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, string>) {
    super('VALIDATION_ERROR', 400, message, false);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super('AUTH_ERROR', 401, message, false);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super('AUTHORIZATION_ERROR', 403, message, false);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super('NOT_FOUND', 404, `${resource} not found`, false);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super('CONFLICT', 409, message, false);
    this.name = 'ConflictError';
  }
}

export class RecommendationError extends AppError {
  constructor(
    code: string,
    statusCode: number = 500,
    message: string,
    retryable: boolean = false
  ) {
    super(code, statusCode, message, retryable);
    this.name = 'RecommendationError';
  }
}
