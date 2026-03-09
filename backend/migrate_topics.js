
import { connectDB } from "./src/utils/db.js";

async function migrate() {
  try {
    console.log("Starting topic migration...");
    const pool = await connectDB();

    // 1. Create topics table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS \`topics\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(100) NOT NULL,
        \`description\` text DEFAULT NULL,
        \`created_by\` int DEFAULT NULL,
        \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`unique_name\` (\`name\`),
        CONSTRAINT \`fk_topic_user\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("Table 'topics' created/verified.");

    // 2. Add topic_id to vocabulary if not exists
    const [cols] = await pool.execute("SHOW COLUMNS FROM vocabulary LIKE 'topic_id'");
    if (cols.length === 0) {
      await pool.execute(`
        ALTER TABLE vocabulary 
        ADD COLUMN topic_id int DEFAULT NULL,
        ADD CONSTRAINT fk_vocab_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL
      `);
      console.log("Column 'topic_id' added to vocabulary.");
    } else {
      console.log("Column 'topic_id' already exists in vocabulary.");
    }

    // 3. Create user_topics junction table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS \`user_topics\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`user_id\` int NOT NULL,
        \`topic_id\` int NOT NULL,
        \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`user_topic_unique\` (\`user_id\`, \`topic_id\`),
        CONSTRAINT \`fk_ut_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_ut_topic\` FOREIGN KEY (\`topic_id\`) REFERENCES \`topics\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("Table 'user_topics' created/verified.");

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
