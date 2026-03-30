import { neon } from '@neondatabase/serverless';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, status, guessesTaken, wordsGuessed } = body;

    const sql = neon(process.env.EXPO_PUBLIC_DATABASE_URL!);

    await sql`
      INSERT INTO daily_scores (username, status, guesses_taken, words_guessed)
      VALUES (${username}, ${status}, ${guessesTaken}, ${wordsGuessed})
      ON CONFLICT (username, played_date) 
      DO UPDATE SET 
        status = EXCLUDED.status,
        guesses_taken = EXCLUDED.guesses_taken,
        words_guessed = EXCLUDED.words_guessed;
    `;

    return Response.json({ success: true, message: "Score saved!" });
  } catch (error) {
    console.error("Database Error:", error);
    return Response.json({ success: false, error: "Failed to save score" }, { status: 500 });
  }
}