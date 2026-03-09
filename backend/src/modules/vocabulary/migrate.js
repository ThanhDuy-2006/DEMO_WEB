
import fs from "fs";
import path from "path";
import { connectDB } from "../../utils/db.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function migrateVocabulary() {
  console.log("🚀 Running Vocabulary Module Migration...");
  
  try {
    const pool = await connectDB();
    const schemaPath = path.join(__dirname, "schema.sql");
    
    if (!fs.existsSync(schemaPath)) {
        console.warn("⚠️ Vocabulary schema file not found!");
        return;
    }

    const schema = fs.readFileSync(schemaPath, "utf8");
    const queries = schema.split(";").filter(q => q.trim().length > 0);

    for (const query of queries) {
        try {
            await pool.query(query.trim());
        } catch (err) {
            if (err.code !== 'ER_TABLE_EXISTS_ERROR' && err.code !== 'ER_DUP_KEYNAME') {
                 console.warn(`⚠️ Warning executing vocabulary query: ${err.message}`);
            }
        }
    }
    
    console.log("✅ Vocabulary Migration Completed Successfully!");
  } catch (err) {
    console.error("❌ Vocabulary Migration Failed:", err);
  }
}

// Run if called directly
if (process.argv[1] === __filename) {
    migrateVocabulary().then(() => process.exit(0));
}
