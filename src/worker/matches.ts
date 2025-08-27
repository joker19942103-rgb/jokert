import { CreateMatchRequest } from "@/shared/types";

export async function createMatch(db: D1Database, userId: number, matchData: CreateMatchRequest): Promise<any> {
  const result = await db.prepare(`
    INSERT INTO matches (
      user_id, team1_name, team2_name, timer_duration, design_theme,
      team1_score, team2_score, current_time, is_timer_running, current_half, is_active
    )
    VALUES (?, ?, ?, ?, ?, 0, 0, 0, false, 1, true)
  `).bind(
    userId,
    matchData.team1_name,
    matchData.team2_name,
    matchData.timer_duration,
    matchData.design_theme
  ).run();

  if (!result.success) {
    throw new Error("Failed to create match");
  }

  return getMatchById(db, result.meta.last_row_id as number);
}

export async function getMatchById(db: D1Database, id: number): Promise<any | null> {
  const match = await db.prepare(`
    SELECT * FROM matches WHERE id = ?
  `).bind(id).first();

  return match;
}

export async function getUserMatches(db: D1Database, userId: number): Promise<any[]> {
  const result = await db.prepare(`
    SELECT * FROM matches 
    WHERE user_id = ? AND is_active = true
    ORDER BY created_at DESC
  `).bind(userId).all();

  return result.results;
}

export async function updateMatchScore(db: D1Database, matchId: number, team1Score: number, team2Score: number): Promise<void> {
  await db.prepare(`
    UPDATE matches 
    SET team1_score = ?, team2_score = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(team1Score, team2Score, matchId).run();
}

export async function updateMatchTimer(db: D1Database, matchId: number, currentTime: number, isRunning: boolean): Promise<void> {
  await db.prepare(`
    UPDATE matches 
    SET current_time = ?, is_timer_running = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(currentTime, isRunning, matchId).run();
}

export async function getAllMatches(db: D1Database): Promise<any[]> {
  const result = await db.prepare(`
    SELECT m.*, u.name as user_name, u.email as user_email
    FROM matches m
    JOIN users u ON m.user_id = u.id
    WHERE m.is_active = true
    ORDER BY m.created_at DESC
  `).all();

  return result.results as any[];
}

export async function deleteMatch(db: D1Database, matchId: number): Promise<void> {
  await db.prepare(`
    UPDATE matches 
    SET is_active = false, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(matchId).run();
}
