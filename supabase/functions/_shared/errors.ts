export enum ErrorCode {
  MISSING_AUTH = 'MISSING_AUTH',
  INVALID_AUTH = 'INVALID_AUTH',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_CONFIG = 'MISSING_CONFIG',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: any;
    requestId?: string;
  };
  success: false;
}

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function createErrorResponse(
  error: ApiError | Error,
  requestId?: string,
  corsHeaders?: Record<string, string>
): Response {
  let errorResponse: ErrorResponse;

  if (error instanceof ApiError) {
    errorResponse = {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId,
      },
      success: false,
    };

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error.statusCode,
    });
  }

  // Generic error
  errorResponse = {
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
      requestId,
    },
    success: false,
  };

  return new Response(JSON.stringify(errorResponse), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 500,
  });
}
