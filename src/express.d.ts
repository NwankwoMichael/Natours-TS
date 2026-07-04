import * as express from "express";

declare module "express-serve-static-core" {
  interface Request {
    requestTime?: string; // Use ? cos requestTime only exists after middleware is called
  }
}
