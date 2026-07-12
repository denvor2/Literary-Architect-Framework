// Sprint-30-Step-03: user repository — authentication and user management.
// Provides password hashing, verification, and user CRUD operations via bcrypt.

import * as bcrypt from "bcrypt";
import { prisma } from "@/lib/db";
import type { User, Role } from "@/generated/prisma/client";

const PASSWORD_HASH_ROUNDS = 10;

/**
 * Validates password strength: >=8 characters, >=1 letter, >=1 digit
 */
function validatePasswordStrength(plainPassword: string): boolean {
  if (plainPassword.length < 8) {
    return false;
  }
  // Check for at least one letter
  if (!/[a-zA-Z]/.test(plainPassword)) {
    return false;
  }
  // Check for at least one digit
  if (!/\d/.test(plainPassword)) {
    return false;
  }
  return true;
}

/**
 * Find a user by email address.
 * Returns the User object if found, or null if not found.
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  if (!prisma) {
    throw new Error("Database connection unavailable");
  }
  return prisma.user.findUnique({
    where: { email },
  });
}

/**
 * Check if a plain-text password matches a bcrypt hash.
 * If passwordHash is null (admin without password), returns false.
 */
export async function checkPassword(
  plainPassword: string,
  passwordHash: string | null
): Promise<boolean> {
  if (!passwordHash) {
    return false;
  }
  return bcrypt.compare(plainPassword, passwordHash);
}

/**
 * Create a new user with a hashed password.
 * Password must be strong (>=8 chars, >=1 letter, >=1 digit).
 * Throws if email already exists or password is weak.
 */
export async function createUser(
  email: string,
  plainPassword: string,
  role: Role = "user"
): Promise<User> {
  if (!prisma) {
    throw new Error("Database connection unavailable");
  }

  // Validate password strength
  if (!validatePasswordStrength(plainPassword)) {
    throw new Error("Password too weak");
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(plainPassword, PASSWORD_HASH_ROUNDS);

  return prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
    },
  });
}

/**
 * Get a user by their ID.
 * Returns the User object if found, or null if not found.
 */
export async function getUserById(userId: string): Promise<User | null> {
  if (!prisma) {
    throw new Error("Database connection unavailable");
  }
  return prisma.user.findUnique({
    where: { id: userId },
  });
}

/**
 * Update a user's password.
 * Password must be strong (>=8 chars, >=1 letter, >=1 digit).
 * Throws if password is weak.
 */
export async function updateUserPassword(
  userId: string,
  newPlainPassword: string
): Promise<User> {
  if (!prisma) {
    throw new Error("Database connection unavailable");
  }

  // Validate password strength
  if (!validatePasswordStrength(newPlainPassword)) {
    throw new Error("Password too weak");
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(
    newPlainPassword,
    PASSWORD_HASH_ROUNDS
  );

  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

/**
 * Update a user's status (block/unblock).
 * Admin-only operation.
 */
export async function updateUserStatus(
  userId: string,
  isBlocked: boolean
): Promise<User> {
  if (!prisma) {
    throw new Error("Database connection unavailable");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { isBlocked },
  });
}

/**
 * DEPRECATED: Single-user stopgap from ADR-0012.
 * Replaced by proper authentication in Sprint-30.
 * Kept for backward compatibility only.
 * Creates a default admin user with a placeholder email if none exists.
 */
export async function getOrCreateDefaultUser(): Promise<User> {
  if (!prisma) {
    throw new Error("Database connection unavailable. Cannot retrieve or create user.");
  }
  const existingUser = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (existingUser) {
    return existingUser;
  }
  // Create a default admin user with placeholder email
  return prisma.user.create({
    data: {
      email: `default-admin-${Date.now()}@localhost`,
      role: "admin",
    },
  });
}
