import fs from "fs";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// IMPORT ALL STRONGLY-TYPED MODELS
import { Tour } from "../../src/models/tourModel";
import { User } from "../../src/models/userModel";
import { Review } from "../../src/models/reviewModel";
import { Booking } from "../../src/models/bookingModel";

// CONFIGURE ENVIROMENT VARIABLES PATH SEGMENTS
// dotenv.config({ path: path.join(process.cwd(), "env") });

dotenv.config();

// SECURELY CONNECT TO DATABASE CLUSTERS
const DB = (process.env.DATABASE as string).replace(
  "<PASSWORD>",
  process.env.DB_PASSWORD as string,
);

mongoose
  .connect(DB)
  .then(() => console.log("Database lookup connection successful for seeding!"))
  .catch((err) => console.error("💥 Database seeding connection error:", err));

// READ JSON SOURCE FILE BUFFER LAYERS
const toursFile = path.join(process.cwd(), "dev-data", "data", "tours.json");
const userFile = path.join(process.cwd(), "dev-data", "data", "users.json");
const reviewsFile = path.join(
  process.cwd(),
  "dev-data",
  "data",
  "reviews.json",
);

const tours = JSON.parse(fs.readFileSync(toursFile, "utf-8"));
const users = JSON.parse(fs.readFileSync(userFile, "utf-8"));
const reviews = JSON.parse(fs.readFileSync(reviewsFile, "utf-8"));

// IMPORT DATA INTO DATABASE
const importData = async (): Promise<void> => {
  try {
    // To completely prevent password pre-saves from hashing mock files twice, bypass validations on users if needed! (Using .create automatically validates fields)
    await Tour.create(tours);
    await Review.create(reviews);

    // Map through user array & explicitly transfer text IDs into ObjIDs
    const fullyTypedUsers = users.map((user: any) => ({
      ...user,
      _id: new mongoose.Types.ObjectId(user._id), // string id to objectId
    }));

    // Ingest the corrected records safely via the native driver
    await User.collection.insertMany(fullyTypedUsers);
    console.log("✨ Data successfully loaded into collections!");
  } catch (err) {
    console.error("💥 Error importing collection data:", err);
  }
  process.exit();
};

// DELETE ALL DATA FROM DATABASE
const deleteData = async (): Promise<void> => {
  try {
    console.log("🗑️ Commencing database scrub...");
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    await Booking.deleteMany();

    console.log("🛑 Data successfully flushed out of collections!");
  } catch (err) {
    console.error("💥 Error purging collection records:", err);
  }
  process.exit();
};

// CAPTURE COMMAND LINE INTERFACE TERMINAL EXECUTION VECTORS
if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
} else {
  console.log("⚠️ Please specify a valid option: --import or --delete");
  process.exit();
}

// node ./dev-data/data/import-dev-data.js --delete
