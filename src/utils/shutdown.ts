import mongoose from "mongoose";

const gracefulShutdown = async () => {
  try {
    await mongoose.connection.close();
    console.log("💥 MongoDB connection closed");
    process.exit(0);
  } catch (err) {
    if (err instanceof Error) {
      console.log("Error! Closing MongoDB connection:", err);
      process.exit(1);
    }
  }
};

export default gracefulShutdown;
