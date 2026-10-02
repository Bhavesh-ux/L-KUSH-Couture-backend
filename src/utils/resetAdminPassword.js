import readline from "readline";
import bcrypt from "bcrypt";
import pool from "../config/db.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter new admin password: ", async (password) => {
  try {
    if (!password || password.length < 6) {
      console.log("Password must be at least 6 characters");
      rl.close();
      await pool.end();
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `UPDATE users
       SET password_hash = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE email = 'bhavesh@test.com'
         AND role = 'admin'
       RETURNING id, email, role`,
      [passwordHash]
    );

    if (result.rows.length === 0) {
      console.log("Admin user not found");
    } else {
      console.log("Admin password reset successfully");
      console.log(result.rows[0]);
    }
  } catch (error) {
    console.error("Password reset failed:", error.message);
  } finally {
    rl.close();
    await pool.end();
  }
});