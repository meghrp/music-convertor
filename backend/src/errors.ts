export class AppError extends Error {
  constructor(
    public readonly errorCode:
      | "UNSUPPORTED_LINK_TYPE"
      | "NO_MATCH"
      | "AMBIGUOUS_MATCH"
      | "RATE_LIMITED"
      | "PROVIDER_ERROR",
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
  }
}
