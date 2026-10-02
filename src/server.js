import dotenv from "dotenv";

dotenv.config();

import "./config/env.js";

import app from "./app.js";
import pool from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Database connection check
pool.query("SELECT NOW()")
  .then(() => {
    console.log("Database connection successful");
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
  });

// Vercel serverless environment
export default app;

// Local development
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(
      `L-KUSH Couture backend running on http://localhost:${PORT}`
    );
  });
}