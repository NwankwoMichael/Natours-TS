import dotenv from "dotenv";
import path from "path";
// PRODUCTION VARIABLE TUNNEL: Dynamically loads the correct file enviroment sheets
const environmentFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env";

dotenv.config({ path: path.join(process.cwd(), environmentFile) });

console.log(
  `🌍 Environment configuration loaded cleanly from: ${environmentFile}`,
);
