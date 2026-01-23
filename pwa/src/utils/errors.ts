export enum ErrorCategory {
  AUTH = 'AUTH',           // Authentication/authorization failures
  VALIDATION = 'VALIDATION', // User input validation errors
  NETWORK = 'NETWORK',      // Network connectivity issues
  API = 'API',              // Edge Function/Supabase API errors
  STORAGE = 'STORAGE',      // File upload/download errors
  UNKNOWN = 'UNKNOWN',      // Unexpected errors
}

export interface AppError {
  category: ErrorCategory;
  message: string;          // User-facing message
  technicalMessage?: string; // Developer-facing details
  code?: string;            // Error code from API (if applicable)
  retryable?: boolean;      // Can user retry this operation?
  metadata?: Record<string, any>; // Additional context
}

export class FrontendError extends Error {
  constructor(
    public category: ErrorCategory,
    public userMessage: string,
    public technicalMessage?: string,
    public retryable: boolean = false,
    public metadata?: Record<string, any>
  ) {
    super(technicalMessage || userMessage);
    this.name = 'FrontendError';
  }
}

/**
 * Parse Supabase Functions error responses
 * Handles the structured error format from Edge Functions
 */
export function parseSupabaseFunctionError(error: any): AppError {
  // Debug logging in development to understand error structure
  if (import.meta.env.DEV) {
    console.log('[parseSupabaseFunctionError] Raw error:', error);
    console.log('[parseSupabaseFunctionError] Error keys:', Object.keys(error || {}));
    if (error?.context) {
      console.log('[parseSupabaseFunctionError] Error context:', error.context);
    }
  }

  // Check if this is a FunctionsHttpError with our structured error response
  // The error might have the response body in error.context or directly on the error object

  // Try to extract structured error from various possible locations
  let structuredError = null;

  // Check if error has a context property with error details
  if (error?.context?.error) {
    structuredError = error.context.error;
  }
  // Check if error.error exists (direct nesting)
  else if (error?.error?.code && error?.error?.message) {
    structuredError = error.error;
  }
  // Check if error message is JSON string
  else if (error?.message && typeof error.message === 'string') {
    try {
      const parsed = JSON.parse(error.message);
      if (parsed.error) {
        structuredError = parsed.error;
      }
    } catch {
      // Not JSON, continue
    }
  }

  // If we found our structured error format
  if (structuredError?.code && structuredError?.message) {
    return {
      category: mapErrorCodeToCategory(structuredError.code),
      message: structuredError.message,
      technicalMessage: JSON.stringify(structuredError.details),
      code: structuredError.code,
      retryable: isRetryableError(structuredError.code),
      metadata: {
        requestId: structuredError.requestId,
        ...structuredError.details
      },
    };
  }

  // Fallback: use generic error parsing
  return parseApiError(error);
}

/**
 * Parse API errors (generic)
 * Handles Supabase PostgrestError and other API errors
 */
export function parseApiError(error: any): AppError {
  // Handle Supabase PostgrestError
  if (error?.code && error?.message) {
    return {
      category: ErrorCategory.API,
      message: 'A database error occurred',
      technicalMessage: error.message,
      code: error.code,
      retryable: false,
      metadata: { supabaseError: error },
    };
  }

  // Handle network errors
  if (error?.message?.includes('Failed to fetch') ||
      error?.message?.includes('Network') ||
      error?.message?.includes('NetworkError')) {
    return {
      category: ErrorCategory.NETWORK,
      message: 'Network connection lost. Please check your internet connection.',
      technicalMessage: error.message,
      retryable: true,
    };
  }

  // Generic fallback
  return {
    category: ErrorCategory.UNKNOWN,
    message: 'An unexpected error occurred',
    technicalMessage: error?.message || String(error),
    retryable: false,
  };
}

function mapErrorCodeToCategory(code: string): ErrorCategory {
  if (code.includes('AUTH') || code.includes('UNAUTHORIZED')) return ErrorCategory.AUTH;
  if (code.includes('VALIDATION')) return ErrorCategory.VALIDATION;
  if (code.includes('EXTERNAL_API') || code.includes('DATABASE')) return ErrorCategory.API;
  if (code.includes('STORAGE')) return ErrorCategory.STORAGE;
  return ErrorCategory.UNKNOWN;
}

function isRetryableError(code: string): boolean {
  return ['EXTERNAL_API_ERROR', 'DATABASE_ERROR', 'INTERNAL_ERROR'].includes(code);
}

/**
 * User-friendly error messages for common scenarios
 */
export function getUserMessage(error: any): string {
  const parsed = parseApiError(error);
  return parsed.message;
}
