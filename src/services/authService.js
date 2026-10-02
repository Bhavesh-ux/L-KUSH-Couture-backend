// src/services/authService.js
import bcrypt from "bcrypt";
import pool from "../config/db.js";
import AppError from "../utils/Apperror.js";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = 10;

export const registerUser = async ({ name, email, password, phone }) => {
  // 1. Check if user already exists
  const existingUser = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new AppError("Email already registered", 409);
  }

  // 2. Hash the password
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  // 3. Insert new user (default role = customer)
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, phone, role)
     VALUES ($1, $2, $3, $4, 'customer')
     RETURNING id, name, email, phone, role, created_at`,
    [name, email, password_hash, phone]
  );

  return result.rows[0];
};




export const loginUser = async ({ email, password }) => {
  // 1. Find user by email
  const result = await pool.query(
    "SELECT id, name, email, password_hash, phone, role FROM users WHERE email = $1",
    [email]
  );

  if (result.rows.length === 0) {
    throw new AppError("Invalid email or password", 401);
  }

  const user = result.rows[0];

  // 2. Compare password with hashed password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  // 3. Generate JWT token
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  // 4. Remove password_hash before returning user object
  delete user.password_hash;

  return { user, token };
};

export const updateUserProfile = async (
  userId,
  { name, phone, address, city, state, pincode }
) => {
  const result = await pool.query(
    `UPDATE users
     SET
       name = $1,
       phone = $2,
       address = $3,
       city = $4,
       state = $5,
       pincode = $6,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $7
     RETURNING id, name, email, phone, address, city, state, pincode, role, created_at, updated_at`,
    [
      name,
      phone,
      address,
      city,
      state,
      pincode,
      userId,
    ]
  );

  if (result.rows.length === 0) {
    throw new AppError("User not found", 404);
  }

  return result.rows[0];
};