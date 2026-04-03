import { neon } from '@neondatabase/serverless';

export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  try {
    const body = await request.json();
    const { username, stats } = body;
    const sql = neon(process.env.EXPO_PUBLIC_DATABASE_URL!);

    await sql`
      INSERT INTO user_legacy_stats (
        username, played, win_pct, current_streak, max_streak, 
        dist_1, dist_2, dist_3, dist_4, dist_5, dist_6, last_played_date
      ) VALUES (
        ${username}, ${stats.played}, ${stats.winPct}, ${stats.currentStreak}, ${stats.maxStreak},
        ${stats.distribution['1'] || 0}, ${stats.distribution['2'] || 0}, ${stats.distribution['3'] || 0},
        ${stats.distribution['4'] || 0}, ${stats.distribution['5'] || 0}, ${stats.distribution['6'] || 0},
        (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date
      )
      ON CONFLICT (username) DO UPDATE SET
        played = EXCLUDED.played,
        win_pct = EXCLUDED.win_pct,
        current_streak = EXCLUDED.current_streak,
        max_streak = EXCLUDED.max_streak,
        dist_1 = EXCLUDED.dist_1, dist_2 = EXCLUDED.dist_2, dist_3 = EXCLUDED.dist_3,
        dist_4 = EXCLUDED.dist_4, dist_5 = EXCLUDED.dist_5, dist_6 = EXCLUDED.dist_6,
        last_played_date = EXCLUDED.last_played_date;
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Import Error:", error);
    return Response.json({ error: 'Failed to import' }, { status: 500 });
  }
}