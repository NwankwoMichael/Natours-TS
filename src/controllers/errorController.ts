import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import AppError from "../utils/appError";

// HELPER TO HANDLE MONGOOSE CASTERROR (e.g., INVALID OBJECTIDs)
const handleCastErrorDB = (err: any): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

//  HELPER TO HANDLE MONGOOSE DUPLICATE FIELD ERRORS (Mongo eroor code 11000)
const handleDuplicateFieldsDB = (err: any): AppError => {
  // Extract the value between quotes using regex from errmsg or keyValues
  const errmsg =
    err.errmsg || (err.errorResponse && err.errorResponse.errmsg) || "";
  const match = errmsg.match(/(["'])(\\?.)*?\1/);
  const value = match ? match[0] : "unknown";

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

// HELPER TO HANDLE MONGOOSE VALIDATIONERROR PROFILES
const handleValidationErrorDB = (err: any): AppError => {
  const errors = Object.values(err.errors).map((el: any) => el.message);

  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 404);
};

// HELPER TO HANDLE JWT VALIDATION FAILURES
const handleJWTError = (): AppError =>
  new AppError("Invalid token, please log in again!", 401);

// HANDLE JWT EXPIRED ERROR
const handleJWTExpiredError = (): AppError =>
  new AppError("Your token has expired! Please log in again.", 401);

// DEVELOPMENT ERROR OUTPUT: DETAILED LOGS FOR DEBUGGING
const sendErrorDev = (
  err: AppError & { stack?: string },
  req: Request,
  res: Response,
): void => {
  // A) API
  if (req.originalUrl && req.originalUrl.startsWith("/api")) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
    return;
  }
  //   B) Rendered website(template)
  console.error("ERROR 💥", err);

  res.status(err.statusCode).render("error", {
    title: "Something went wrong!",
    message: err.message,
  });
};

// PRODUCTION ERROR OUTPUT: CLEAN< USER_FRIENDLY LEAKS PREVENTION
const sendErrorProd = (err: AppError, req: Request, res: Response): void => {
  // A) API
  if (req.originalUrl && req.originalUrl.startsWith("/api")) {
    // Operational, trusted error: send clean message to client
    if (err.isOperational && err.message) {
      res
        .status(err.statusCode)
        .json({ status: err.status, message: err.message });
      return;
    }

    // B) Programming or other unknown error: don't leak error details
    console.error("'ERROR 💥', err");

    // 2) Send generic message
    res.status(500).json({
      status: "error",
      message: "Something went very wrong",
    });
    return;
  }

  // B) Rendered website

  //   A) Operational, trusted error: send message to client
  if (err.isOperational && err.message) {
    res.status(err.statusCode).render("error", {
      title: "Something went wrong!",
      message: err.message,
    });
    return;
  }
  //   B) Programming or other unknown error: don't leak error details
  console.error("ERROR 💥", err);

  // 2) Send generic message
  res.status(err.statusCode).render("error", {
    title: "Something went wrong",
    message: "Please try again later.",
  });
};

// THE MAIN MIDDLEWARE INTERFACE ENGINE
const globalErrorHandler: ErrorRequestHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    // Create a shallow copy to maintain operationsl mutations safely
    let error = {
      ...err,
      message: err.message,
      name: err.name,
      code: err.code,
    } as AppError;

    // Handle invalid id (CastError)
    if (error.name === "CastError") error = handleCastErrorDB(error);

    // Handle duplicated fields error (errorCode)
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    // Handle validation error
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);

    // Handle JSON Web Token Error
    if (error.name === "JsonWebTokenError") error = handleJWTError();

    // Handle Token Expoired Error
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};

export default globalErrorHandler;
