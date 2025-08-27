import { MochaUser } from "@getmocha/users-service/shared";

export interface AppUser {
  id: number;
  mocha_user_id: string;
  email: string;
  name: string;
  is_admin: boolean;
  is_payment_confirmed: boolean;
  created_at: string;
  updated_at: string;
}

export async function createOrUpdateUser(db: D1Database, mochaUser: MochaUser): Promise<AppUser> {
  // Try to find existing user
  const existingUser = await db.prepare(`
    SELECT * FROM users WHERE mocha_user_id = ?
  `).bind(mochaUser.id).first();

  if (existingUser) {
    // Update existing user with latest info from Mocha
    await db.prepare(`
      UPDATE users 
      SET email = ?, name = ?, updated_at = CURRENT_TIMESTAMP
      WHERE mocha_user_id = ?
    `).bind(
      mochaUser.email,
      mochaUser.google_user_data.name || mochaUser.email,
      mochaUser.id
    ).run();

    return getUserByMochaId(db, mochaUser.id);
  } else {
    // Create new user
    const result = await db.prepare(`
      INSERT INTO users (mocha_user_id, email, name, is_admin, is_payment_confirmed)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      mochaUser.id,
      mochaUser.email,
      mochaUser.google_user_data.name || mochaUser.email,
      false,
      false
    ).run();

    if (!result.success) {
      throw new Error("Failed to create user");
    }

    return getUserById(db, result.meta.last_row_id as number);
  }
}

export async function getUserByMochaId(db: D1Database, mochaUserId: string): Promise<AppUser> {
  const user = await db.prepare(`
    SELECT * FROM users WHERE mocha_user_id = ?
  `).bind(mochaUserId).first();

  if (!user) {
    throw new Error("User not found");
  }

  return user as unknown as AppUser;
}

export async function getUserById(db: D1Database, id: number): Promise<AppUser> {
  const user = await db.prepare(`
    SELECT * FROM users WHERE id = ?
  `).bind(id).first();

  if (!user) {
    throw new Error("User not found");
  }

  return user as unknown as AppUser;
}

export async function getAllUsers(db: D1Database): Promise<AppUser[]> {
  const result = await db.prepare(`
    SELECT * FROM users ORDER BY created_at DESC
  `).all();

  return result.results as unknown as AppUser[];
}
