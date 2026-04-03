import { neon } from '@neondatabase/serverless';

export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  try {
    const sql = neon(process.env.EXPO_PUBLIC_DATABASE_URL!);
    const url = new URL(request.url);
    const dateQuery = url.searchParams.get('date');
    const mode = url.searchParams.get('mode'); // <-- Check for mode

    // OVERALL LEADERBOARD
    if (mode === 'overall') {
      const scores = await sql`
        SELECT 
          username,
          COUNT(CASE WHEN status = 'WIN' THEN 1 END)::int AS total_wins,
          COALESCE(ROUND(AVG(CASE WHEN status = 'WIN' THEN guesses_taken END), 2), 0)::float AS avg_guesses,
          COALESCE(ROUND(AVG(CASE WHEN status = 'WIN' AND time_taken > 0 THEN time_taken END)), 0)::int AS avg_time
        FROM daily_scores
        GROUP BY username
        ORDER BY 
          total_wins DESC,
          avg_guesses ASC,
          avg_time ASC;
      `;
      return Response.json(scores);
    }

    // DAILY LEADERBOARD (Original Logic)
    let targetDate = dateQuery;
    if (!targetDate) {
      const d = new Date();
      targetDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    const scores = await sql`
      SELECT username, status, guesses_taken, words_guessed, evaluations, time_taken 
      FROM daily_scores 
      WHERE played_date = ${targetDate}::date
      ORDER BY 
        CASE WHEN status = 'WIN' THEN 1 ELSE 2 END,
        guesses_taken ASC,
        time_taken ASC;
    `;

    return Response.json(scores);
  } catch (error) {
    console.error("Leaderboard API Error:", error);
    return Response.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}