import { neon } from '@neondatabase/serverless';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, status, guessesTaken, wordsGuessed, evaluations } = body;

    const sql = neon(process.env.EXPO_PUBLIC_DATABASE_URL!);

    // Let Neon handle the words_guessed array natively, and cast evaluations to JSONB!
    await sql`
      INSERT INTO daily_scores (username, status, guesses_taken, words_guessed, evaluations)
      VALUES (
        ${username}, 
        ${status}, 
        ${guessesTaken}, 
        ${wordsGuessed || null}, 
        ${evaluations ? JSON.stringify(evaluations) : null}::jsonb
      )
      ON CONFLICT (username, played_date) 
      DO UPDATE SET 
        status = EXCLUDED.status,
        guesses_taken = EXCLUDED.guesses_taken,
        words_guessed = EXCLUDED.words_guessed,
        evaluations = EXCLUDED.evaluations;
    `;

    return Response.json({ success: true, message: "Score saved!" });
  } catch (error) {
    console.error("Database Error:", error);
    return Response.json({ success: false, error: "Failed to save score" }, { status: 500 });
  }
}