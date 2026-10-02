// src/config/env.js
import "dotenv/config";

const requiredEnvVariables = [
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
];

for (const variable of requiredEnvVariables) {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long");
}