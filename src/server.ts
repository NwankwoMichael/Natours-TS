import "./loadEnv";
import mongoose from "mongoose";
import express, { Application } from "express";
import app from "./app";
import gracefulShutdown from "./utils/shutdown";

// HANDLE UNCAUGHT EXCEPTIONS EARLY
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  console.log(err.stack);
  process.exit(1);
});

// STRICT CHECK TO ENSURE VARIABLES LOADED BEFORE PROCESSING
const rawDatabaseUrl = process.env.DATABASE;
const databasePassword = process.env.DB_PASSWORD;

if (!rawDatabaseUrl || !databasePassword) {
  console.error("❌ CRITICAL ERROR: Environment variables failed to load!");
  console.error(
    "Please ensure your configuration file is named '.env' and placed in the project root.",
  );
  process.exit(1);
}

// PERFORM STRING SUBSTITUTION SAFELY
const DB = rawDatabaseUrl.replace("<PASSWORD>", databasePassword);

// CONNECT THE DATABASE
mongoose
  .connect(DB)
  .then(() => console.log("DB connection successful"))
  .catch((err) => console.error("DB connection error:", err));

// START THE SERVER
const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  console.log(`App running on port ${port}...`),
);

// HANDLE UNHANDLED REJECTION
process.on("unhandledRejection", (err) => {
  if (err instanceof Error) {
    console.log(err.name, err.message);
    console.log("UNHANDLED REJECTION 💥 Shutting down...");
    server.close(gracefulShutdown);
  }
});

// LISTEN FOR SIGTERM SIGNAL
process.on("SIGTERM", () => {
  console.log("✋ SIGTERM RECEIVED. Shutting down gracefully");
  server.close(gracefulShutdown);
});

// HANDLE LOCAL SHUTDOWN
process.on("SIGINT", () => {
  console.log("✋ SIGINT RECEIVED. Shutting down gracefully");
  server.close(gracefulShutdown);
});
