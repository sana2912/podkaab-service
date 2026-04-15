// Shared API error primitives and convenience factories.
export interface AppErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }

  // Converts the runtime error into the public API error response shape.
  toJSON(): AppErrorBody {
    return {
      code: this.code,
      message: this.message,
      ...(this.details !== undefined && { details: this.details }),
    };
  }
}

export const Errors = {
  notFound: (resource: string, id?: string) =>
    new AppError(
      404,
      "NOT_FOUND",
      id ? `${resource} with id '${id}' not found` : `${resource} not found`
    ),

  badRequest: (message: string, details?: unknown) =>
    new AppError(400, "BAD_REQUEST", message, details),

  unauthorized: (message = "Unauthorized") => new AppError(401, "UNAUTHORIZED", message),

  forbidden: (message = "Forbidden") => new AppError(403, "FORBIDDEN", message),

  conflict: (message: string) => new AppError(409, "CONFLICT", message),

  internal: (message = "Internal server error") => new AppError(500, "INTERNAL_ERROR", message),
} as const;
