class AppError extends Error {
  // Declare properties types before assigning them
  public statusCode: number;
  public status: "fail" | "error";
  public isOperational: boolean;
  public code?: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
