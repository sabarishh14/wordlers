import { neon } from '@neondatabase/serverless';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // FIX 1: Extracted 'time_taken' to match the frontend perfectly
    const { username, status, guessesTaken, wordsGuessed, evaluations, time_taken } = body;

    const sql = neon(process.env.EXPO_PUBLIC_DATABASE_URL!);

    await sql`
      INSERT INTO daily_scores (username, status, guesses_taken, words_guessed, evaluations, time_taken)
      VALUES (
        ${username}, 
        ${status}, 
        ${guessesTaken}, 
        ${wordsGuessed ? JSON.stringify(wordsGuessed) : null}::jsonb, -- FIX 2: Stringified the array for Neon!
        ${evaluations ? JSON.stringify(evaluations) : null}::jsonb,
        ${time_taken || 0}
      )
      ON CONFLICT (username, played_date) 
      DO UPDATE SET 
        status = EXCLUDED.status,
        guesses_taken = EXCLUDED.guesses_taken,
        words_guessed = EXCLUDED.words_guessed,
        evaluations = EXCLUDED.evaluations,
        time_taken = EXCLUDED.time_taken;
    `;

    return Response.json({ success: true, message: "Score saved!" });
  } catch (error) {
    console.error("Database Error:", error);
    return Response.json({ success: false, error: "Failed to save score" }, { status: 500 });
  }
}