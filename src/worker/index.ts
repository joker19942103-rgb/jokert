import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { getCookie, setCookie } from "hono/cookie";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import { 
  CreateMatchSchema
} from "@/shared/types";
import { createOrUpdateUser, getUserByMochaId, getAllUsers } from "./auth";
import { createMatch, getMatchById, getUserMatches, updateMatchScore, updateMatchTimer, updateMatchHalf, updateMatchSettings, getAllMatches, deleteMatch } from "./matches";
import { createPayment, confirmPayment, getAllPayments } from "./payments";
import { 
  createAdminSession, 
  deleteAdminSession, 
  validateAdminCredentials,
  adminAuthMiddleware,
  cleanExpiredSessions 
} from "./admin-auth";

// Server-side timer management
let timerInterval: any = null;

// Function to update all running timers
async function updateRunningTimers(env: Env) {
  try {
    // Get all matches with running timers
    const runningMatches = await env.DB.prepare(`
      SELECT id, current_time, timer_duration, current_half, half_time_offset 
      FROM matches 
      WHERE is_timer_running = true AND is_active = true
    `).all();

    for (const match of runningMatches.results) {
      const newTime = match.current_time + 1;
      
      // Check if timer reached duration
      if (newTime >= match.timer_duration) {
        // Stop the timer when it reaches the end
        await updateMatchTimer(env.DB, match.id, match.timer_duration, false);
      } else {
        // Continue the timer
        await updateMatchTimer(env.DB, match.id, newTime, true);
      }
    }
  } catch (error) {
    console.error("Error updating running timers:", error);
  }
}

// Start server-side timer
function startServerTimer(env: Env) {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  timerInterval = setInterval(() => {
    updateRunningTimers(env);
  }, 1000);
}

// Stop server-side timer
function stopServerTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

const app = new Hono<{ Bindings: Env }>();

app.use(cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

// Start server-side timer on worker initialization
app.use('*', async (c, next) => {
  if (!timerInterval) {
    startServerTimer(c.env);
  }
  await next();
});

// Auth routes
app.get('/api/oauth/google/redirect_url', async (c) => {
  const redirectUrl = await getOAuthRedirectUrl('google', {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  const mochaUser = c.get("user");
  
  if (!mochaUser) {
    return c.json({ success: false, message: "Не авторизований" }, 401);
  }
  
  // Create or update user in our database
  const user = await createOrUpdateUser(c.env.DB, mochaUser);
  
  return c.json({ mochaUser, user });
});

app.get('/api/logout', async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === 'string') {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Match routes
app.post("/api/matches", authMiddleware, zValidator("json", CreateMatchSchema), async (c) => {
  try {
    const mochaUser = c.get("user");
    if (!mochaUser) {
      return c.json({ success: false, message: "Не авторизований" }, 401);
    }
    
    const user = await getUserByMochaId(c.env.DB, mochaUser.id);
    
    if (!user.is_payment_confirmed) {
      return c.json({ success: false, message: "Потрібно підтвердити оплату для створення табло" }, 403);
    }

    const matchData = c.req.valid("json");
    const match = await createMatch(c.env.DB, user.id, matchData);
    
    return c.json({ success: true, data: match });
  } catch (error) {
    console.error("Create match error:", error);
    return c.json({ success: false, message: "Помилка створення матчу" }, 500);
  }
});

app.get("/api/matches/my", authMiddleware, async (c) => {
  try {
    const mochaUser = c.get("user");
    if (!mochaUser) {
      return c.json({ success: false, message: "Не авторизований" }, 401);
    }
    
    const user = await getUserByMochaId(c.env.DB, mochaUser.id);
    const matches = await getUserMatches(c.env.DB, user.id);
    
    return c.json({ success: true, data: matches });
  } catch (error) {
    console.error("Get user matches error:", error);
    return c.json({ success: false, message: "Помилка отримання матчів" }, 500);
  }
});

app.get("/api/matches/:id", async (c) => {
  try {
    const matchId = parseInt(c.req.param("id"));
    const match = await getMatchById(c.env.DB, matchId);
    
    if (!match) {
      return c.json({ success: false, message: "Матч не знайдено" }, 404);
    }

    return c.json({ success: true, data: match });
  } catch (error) {
    console.error("Get match error:", error);
    return c.json({ success: false, message: "Помилка отримання матчу" }, 500);
  }
});

app.put("/api/matches/:id/score", authMiddleware, async (c) => {
  try {
    const matchId = parseInt(c.req.param("id"));
    const { team1_score, team2_score } = await c.req.json();
    
    await updateMatchScore(c.env.DB, matchId, team1_score, team2_score);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Update score error:", error);
    return c.json({ success: false, message: "Помилка оновлення рахунку" }, 500);
  }
});

app.put("/api/matches/:id/timer", authMiddleware, async (c) => {
  try {
    const matchId = parseInt(c.req.param("id"));
    const { current_time, is_timer_running } = await c.req.json();
    
    await updateMatchTimer(c.env.DB, matchId, current_time, is_timer_running);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Update timer error:", error);
    return c.json({ success: false, message: "Помилка оновлення таймера" }, 500);
  }
});

app.put("/api/matches/:id/visibility", authMiddleware, async (c) => {
  try {
    const matchId = parseInt(c.req.param("id"));
    const { is_visible } = await c.req.json();
    
    await c.env.DB.prepare(`
      UPDATE matches 
      SET is_visible = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(is_visible, matchId).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Update visibility error:", error);
    return c.json({ success: false, message: "Помилка оновлення видимості табло" }, 500);
  }
});

app.put("/api/matches/:id/team", authMiddleware, async (c) => {
  try {
    const matchId = parseInt(c.req.param("id"));
    const updateData = await c.req.json();
    
    const fields = Object.keys(updateData).filter(key => 
      ['team1_name', 'team2_name', 'team1_logo_url', 'team2_logo_url'].includes(key)
    );
    
    if (fields.length === 0) {
      return c.json({ success: false, message: "Немає полів для оновлення" }, 400);
    }
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updateData[field]);
    
    await c.env.DB.prepare(`
      UPDATE matches 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(...values, matchId).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Update team error:", error);
    return c.json({ success: false, message: "Помилка оновлення команди" }, 500);
  }
});

app.put("/api/matches/:id/half", authMiddleware, async (c) => {
  try {
    const matchId = parseInt(c.req.param("id"));
    const { current_half, current_time, half_time_offset, is_timer_running } = await c.req.json();
    
    await c.env.DB.prepare(`
      UPDATE matches 
      SET current_half = ?, current_time = ?, half_time_offset = ?, is_timer_running = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(current_half, current_time, half_time_offset || 0, is_timer_running, matchId).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Update half error:", error);
    return c.json({ success: false, message: "Помилка зміни тайму" }, 500);
  }
});

app.put("/api/matches/:id/settings", authMiddleware, async (c) => {
  try {
    const matchId = parseInt(c.req.param("id"));
    const { timer_duration } = await c.req.json();
    
    await c.env.DB.prepare(`
      UPDATE matches 
      SET timer_duration = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(timer_duration, matchId).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Update settings error:", error);
    return c.json({ success: false, message: "Помилка оновлення налаштувань" }, 500);
  }
});

// Payment routes
app.post("/api/payments", authMiddleware, async (c) => {
  try {
    const mochaUser = c.get("user");
    if (!mochaUser) {
      return c.json({ success: false, message: "Не авторизований" }, 401);
    }
    
    const user = await getUserByMochaId(c.env.DB, mochaUser.id);

    const payment = await createPayment(c.env.DB, user.id, 100); // Fixed amount
    return c.json({ success: true, data: payment });
  } catch (error) {
    console.error("Create payment error:", error);
    return c.json({ success: false, message: "Помилка створення платежу" }, 500);
  }
});

// Admin authentication routes
app.post("/api/admin/login", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!validateAdminCredentials(email, password)) {
      return c.json({ success: false, message: "Невірні дані для входу" }, 401);
    }

    // Clean expired sessions
    await cleanExpiredSessions(c.env.DB);

    // Create new session
    const sessionToken = await createAdminSession(c.env.DB, email);

    setCookie(c, "admin_session_token", sessionToken, {
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: true,
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return c.json({ success: true, message: "Успішний вхід" });
  } catch (error) {
    console.error("Admin login error:", error);
    return c.json({ success: false, message: "Помилка входу" }, 500);
  }
});

app.get("/api/admin/check", adminAuthMiddleware, async (c) => {
  return c.json({ success: true, authenticated: true });
});

app.post("/api/admin/logout", async (c) => {
  const sessionToken = getCookie(c, "admin_session_token");
  
  if (sessionToken) {
    await deleteAdminSession(c.env.DB, sessionToken);
  }

  setCookie(c, "admin_session_token", "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true });
});

// Admin routes
app.get("/api/admin/users", adminAuthMiddleware, async (c) => {
  try {
    const users = await getAllUsers(c.env.DB);
    return c.json({ success: true, data: users });
  } catch (error) {
    console.error("Get all users error:", error);
    return c.json({ success: false, message: "Помилка отримання користувачів" }, 500);
  }
});

app.get("/api/admin/payments", adminAuthMiddleware, async (c) => {
  try {
    const payments = await getAllPayments(c.env.DB);
    return c.json({ success: true, data: payments });
  } catch (error) {
    console.error("Get all payments error:", error);
    return c.json({ success: false, message: "Помилка отримання платежів" }, 500);
  }
});

app.put("/api/admin/payments/:id/confirm", adminAuthMiddleware, async (c) => {
  try {
    const paymentId = parseInt(c.req.param("id"));
    
    await confirmPayment(c.env.DB, paymentId, 1); // Use admin user ID = 1
    return c.json({ success: true, message: "Платіж підтверджено" });
  } catch (error) {
    console.error("Confirm payment error:", error);
    return c.json({ success: false, message: "Помилка підтвердження платежу" }, 500);
  }
});

app.get("/api/admin/matches", adminAuthMiddleware, async (c) => {
  try {
    const matches = await getAllMatches(c.env.DB);
    return c.json({ success: true, data: matches });
  } catch (error) {
    console.error("Get all matches error:", error);
    return c.json({ success: false, message: "Помилка отримання матчів" }, 500);
  }
});

app.delete("/api/admin/matches/:id", adminAuthMiddleware, async (c) => {
  try {
    const matchId = parseInt(c.req.param("id"));
    await deleteMatch(c.env.DB, matchId);
    
    return c.json({ success: true, message: "Матч видалено" });
  } catch (error) {
    console.error("Delete match error:", error);
    return c.json({ success: false, message: "Помилка видалення матчу" }, 500);
  }
});

app.put("/api/admin/users/:id/toggle", adminAuthMiddleware, async (c) => {
  try {
    const userId = parseInt(c.req.param("id"));
    const { activate } = await c.req.json();
    
    await c.env.DB.prepare(`
      UPDATE users 
      SET is_payment_confirmed = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(activate, userId).run();
    
    const action = activate ? "активовано" : "деактивовано";
    return c.json({ success: true, message: `Користувача ${action}` });
  } catch (error) {
    console.error("Toggle user status error:", error);
    return c.json({ success: false, message: "Помилка зміни статусу користувача" }, 500);
  }
});

// Scoreboard route
app.get("/scoreboard", async (c) => {
  const matchId = c.req.query("match_id");
  if (!matchId) {
    return c.html("<h1>Match ID required</h1>");
  }

  try {
    const match = await getMatchById(c.env.DB, parseInt(matchId));
    if (!match) {
      return c.html("<h1>Match not found</h1>");
    }

    const html = generateScoreboardHTML(match);
    return c.html(html);
  } catch (error) {
    console.error("Scoreboard error:", error);
    return c.html("<h1>Error loading scoreboard</h1>");
  }
});

function generateScoreboardHTML(match: any) {
  if (!match.is_visible) {
    return `
      <!DOCTYPE html>
      <html lang="uk">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Табло - KS TV</title>
        <style>
          body { margin: 0; padding: 0; background: transparent; }
        </style>
      </head>
      <body>
        <script>
          setTimeout(() => window.location.reload(), 1000);
        </script>
      </body>
      </html>
    `;
  }

  const getDisplayTime = () => {
    if (match.current_half === 2) {
      return match.current_time + (match.half_time_offset || match.timer_duration);
    }
    return match.current_time;
  };

  const formatDisplayTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return `
    <!DOCTYPE html>
    <html lang="uk">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Табло - KS TV</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background: transparent;
          font-family: 'Arial Black', 'Arial', sans-serif;
          font-weight: bold;
        }
        .scoreboard-container {
          position: fixed;
          top: 24px;
          left: 24px;
          z-index: 9999;
        }
        .scoreboard {
          display: flex;
          align-items: center;
          background: linear-gradient(135deg, #1f2937, #374151, #1f2937);
          border-radius: 50px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 255, 255, 0.1);
          overflow: hidden;
          font-size: 14px;
        }
        .timer-section {
          background: #f97316;
          padding: 8px 16px;
          display: flex;
          align-items: center;
        }
        .timer {
          color: black;
          font-weight: bold;
          font-size: 20px;
          font-family: 'Courier New', monospace;
          ${match.is_timer_running ? 'animation: pulse 1s infinite;' : ''}
        }
        .team-section {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
        }
        .team-logo {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.3);
          overflow: hidden;
        }
        .team-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .team-logo-text {
          color: white;
          font-weight: bold;
          font-size: 10px;
        }
        .team-name {
          color: white;
          font-weight: bold;
          font-size: 18px;
          letter-spacing: 1px;
        }
        .score-section {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 0 12px;
        }
        .score {
          background: white;
          color: black;
          font-weight: bold;
          font-size: 20px;
          padding: 4px 12px;
          border-radius: 4px;
        }
        .score-divider {
          color: white;
          font-weight: bold;
          font-size: 18px;
        }
        .half-section {
          background: #2563eb;
          padding: 8px 12px;
        }
        .half-indicator {
          color: white;
          font-weight: bold;
          font-size: 14px;
        }
        .branding {
          position: absolute;
          bottom: -24px;
          left: 0;
          background: #dc2626;
          padding: 4px 12px;
          border-radius: 6px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        .branding-text {
          color: white;
          font-weight: bold;
          font-size: 10px;
          letter-spacing: 1px;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      </style>
    </head>
    <body>
      <div class="scoreboard-container">
        <div style="position: relative;">
          <div class="scoreboard">
            <!-- Timer section -->
            <div class="timer-section">
              <div class="timer">${formatDisplayTime(getDisplayTime())}</div>
            </div>

            <!-- Team 1 section -->
            <div class="team-section">
              <div class="team-logo">
                ${match.team1_logo_url ? 
                  `<img src="${match.team1_logo_url}" alt="${match.team1_name}">` :
                  `<div class="team-logo-text">${match.team1_name.slice(0, 3).toUpperCase()}</div>`
                }
              </div>
              <div class="team-name">${match.team1_name.slice(0, 3).toUpperCase()}</div>
            </div>

            <!-- Score section -->
            <div class="score-section">
              <div class="score">${match.team1_score}</div>
              <div class="score-divider">-</div>
              <div class="score">${match.team2_score}</div>
            </div>

            <!-- Team 2 section -->
            <div class="team-section">
              <div class="team-name">${match.team2_name.slice(0, 3).toUpperCase()}</div>
              <div class="team-logo">
                ${match.team2_logo_url ? 
                  `<img src="${match.team2_logo_url}" alt="${match.team2_name}">` :
                  `<div class="team-logo-text">${match.team2_name.slice(0, 3).toUpperCase()}</div>`
                }
              </div>
            </div>

            <!-- Half indicator -->
            <div class="half-section">
              <div class="half-indicator">${match.current_half === 1 ? '1T' : '2T'}</div>
            </div>
          </div>

          <!-- KS TV branding -->
          <div class="branding">
            <div class="branding-text">📺 KS TV</div>
          </div>
        </div>
      </div>

      <script>
        // Auto-refresh every 3 seconds for real-time updates
        setInterval(() => {
          window.location.reload();
        }, 3000);
      </script>
    </body>
    </html>
  `;
}



// Scheduled event handler for Cloudflare Workers
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },
  
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // This runs every minute - update timer 60 times per run to simulate 1-second intervals
    for (let i = 0; i < 60; i++) {
      await updateRunningTimers(env);
      if (i < 59) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
};
