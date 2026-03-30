import { neon } from '@neondatabase/serverless';

export async function GET() {
  try {
    const sql = neon(process.env.EXPO_PUBLIC_DATABASE_URL!);
    
    const scores = await sql`
      SELECT username, status, guesses_taken 
      FROM daily_scores 
      WHERE played_date = CURRENT_DATE
      ORDER BY 
        CASE WHEN status = 'WIN' THEN 1 ELSE 2 END,
        guesses_taken ASC;
    `;
    return Response.json({ success: true, scores });
  } catch (error) {
    return Response.json({ success: false, error: "Failed to fetch" }, { status: 500 });
  }
}