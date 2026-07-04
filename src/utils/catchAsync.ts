import { Request, Response, NextFunction } from "express";

// TYPE DEFINITION FOR THE ASYNCHRONOUS ROUTE HANDLER FUNCTION
type AsynchronousHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<any>;

// CATCHASYNC WRAPPER
export default (fn: AsynchronousHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
