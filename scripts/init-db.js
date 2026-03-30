const { neon } = require('@neondatabase/serverless');

async function main() {
  const connectionString = process.env.EXPO_PUBLIC_DATABASE_URL;
  if (!connectionString) {
    throw new Error('Missing EXPO_PUBLIC_DATABASE_URL');
  }

  const sql = neon(connectionString);

  await sql`
    CREATE TABLE IF NOT EXISTS scores (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      username TEXT NOT NULL,
      guesses INTEGER,
      status TEXT,
      date TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(username, date)
    );
  `;

  console.log("Scores table initialized successfully!");
}

main().catch(console.error);
