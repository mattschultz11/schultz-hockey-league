export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export class NotFoundError extends ServiceError {
  constructor(entity: string, identifier: string, cause?: unknown) {
    super(`${entity} not found: ${identifier}`, cause);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends ServiceError {
  public readonly fieldErrors?: Record<string, string[]>;
  constructor(message: string, fieldErrors?: Record<string, string[]>, cause?: unknown) {
    super(message, cause);
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export class ConflictError extends ServiceError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "ConflictError";
  }
}
