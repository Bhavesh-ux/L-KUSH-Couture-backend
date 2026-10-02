import dotenv from "dotenv";
import readline from "readline";
import bcrypt from "bcrypt";
import pool from "../src/config/db.js";

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question) =>
  new Promise((resolve) => {
    rl.question(question, resolve);
  });

const updateOwner = async () => {
  try {
    const name = "Bhavesh Chhipa";
   const email = "bhavesh@lkushcouture.com";

    const password = await ask("Enter new owner password: ");

    if (!password || password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await pool.query(
      `
      UPDATE users
      SET
        name = $1,
        email = $2,
        password_hash = $3,
        role = 'admin'
      WHERE id = 1
      `,
      [name, email, passwordHash]
    );

    console.log("Owner credentials updated successfully.");
  } catch (error) {
    console.error("Failed to update owner:", error.message);
  } finally {
    await pool.end();
    rl.close();
  }
};

updateOwner();