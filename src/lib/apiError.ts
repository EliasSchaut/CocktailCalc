/** Error thrown by the API layer (remote HTTP status or mapped local service error). */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
