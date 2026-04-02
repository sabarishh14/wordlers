import { neon } from '@neondatabase/serverless';

export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  try {
    const body = await request.json();
    
    // Extract everything, making sure time_taken matches what we send from the app
    const { username, status, guessesTaken, wordsGuessed, evaluations, time_taken } = body;

    const sql = neon(process.env.EXPO_PUBLIC_DATABASE_URL!);

    // Using your original daily_scores table and ON CONFLICT logic!
    await sql`
      INSERT INTO daily_scores (username, status, guesses_taken, words_guessed, evaluations, time_taken)
      VALUES (
        ${username}, 
        ${status}, 
        ${guessesTaken}, 
        ${wordsGuessed ? JSON.stringify(wordsGuessed) : null}::jsonb, 
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

    return new Response(JSON.stringify({ success: true, message: "Score saved!" }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Database Error:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to save score" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}