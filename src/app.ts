import express, { Application } from "express";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { xss } from "express-xss-sanitizer";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";
import path from "path";
import { Request, Response, NextFunction } from "express";

import { IUser } from "./models/userModel";
import tourRouter from "./routes/tourRoutes";
import userRouter from "./routes/userRoutes";
import reviewRouter from "./routes/reviewRoutes";
import bookingRouter from "./routes/bookingRoutes";
import viewRouter from "./routes/viewRoutes";
import * as bookingController from "./controllers/bookingController";
import AppError from "./utils/appError";
import globalErrorHandler from "./controllers/errorController";

// TYPE DECLARATION MERGING: Informms TypeScript about custom Request properties
declare global {
  namespace Express {
    interface Request {
      requestTime?: string;
      user?: IUser;
    }
  }
}

// Starting express app
const app: Application = express();

app.set("trust proxy", 1); // trust first proxy

// Point the view engine directly to your true root views directory
app.set("views", path.join(process.cwd(), "views"));

// Clear view engine template parameters
app.set("view engine", "pug");

// /////////// GLOBAL MIDDLEWARES //////////////
// Implement CORS
app.use(cors()); //for simple request

app.options("/*any", cors()); // for all non-simple request

// Serving static files
app.use(express.static(path.join(process.cwd(), "public")));

// Set security HTTP headers

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://api.mapbox.com",
        "https://*.mapbox.com",
        "https://cdn.jsdelivr.net",
        "https://js.stripe.com",
      ],
      frameSrc: ["'self'", "https://js.stripe.com"], // allow stripe checkout iframe
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://api.mapbox.com",
        "https://*.mapbox.com",
        "https://fonts.googleapis.com",
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://api.mapbox.com",
        "https://*.mapbox.com",
      ],
      connectSrc: [
        "'self'",
        "https://api.mapbox.com",
        "https://events.mapbox.com",
        "https://cdn.jsdelivr.net",
        "https://*.mapbox.com", // covers a.tiles, b.tiles, api, events
        "https://api.stripe.com",
        "ws://127.0.0.1:1234",
        "ws://localhost:1234",
      ],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'", "blob:"],
    },
  }),
);

// Development Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api/*any", limiter);

// Need to be in row form not JSON hence calling handler in app.js
app.post(
  "/webhook-checkout",
  express.raw({ type: "application/json" }),
  bookingController.webhookCheckout,
);

// ////////// PARSING THE RAW BODY  ////////////////

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));

// CONNECT HTML FROM TO THE ROUTE HANDLER
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
// app.use(
//   mongoSanitize({
//     replaceWith: "_", // Replaces any "$" or "." keys with an unnderscore
//   }),
// );

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuality",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  }),
);

// USED to compress our API response
app.use(compression());

// ////////////// MIDDLEWARE, ROUTES...

// Test middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Routes
app.use("/", viewRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

// SILENCING CHROME DEVTOOLS REQUEST
app.get(
  "/.well-known/appspecific/com.chrome.devtools.json",
  (req: Request, res: Response) => {
    res.status(204).end(); // No content
  },
);

// Catch-All Unmatched Routes
app.all("/*any", (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
