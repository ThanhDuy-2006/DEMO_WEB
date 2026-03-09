
import { pool, connectDB } from "../../utils/db.js";

const sampleVocabulary = [
  { word: "Magnificent", type: "adjective", pronounce: "/mæɡˈnɪfɪsnt/", meaning: "Tráng lệ, lộng lẫy", example_sentence: "The view from the top of the mountain is magnificent." },
  { word: "Benevolent", type: "adjective", pronounce: "/bəˈnevələnt/", meaning: "Nhân từ, rộng lượng", example_sentence: "A benevolent uncle paid for her to have music lessons." },
  { word: "Resilience", type: "noun", pronounce: "/rɪˈzɪliəns/", meaning: "Khả năng phục hồi, tính kiên cường", example_sentence: "She has shown great resilience to stress." },
  { word: "Ambiguous", type: "adjective", pronounce: "/æmˈbɪɡjuəs/", meaning: "Mơ hồ, khó hiểu", example_sentence: "Her response was ambiguous, we didn't know what she meant." },
  { word: "Exquisite", type: "adjective", pronounce: "/ɪkˈskwɪzɪt/", meaning: "Tinh xảo, tuyệt đẹp", example_sentence: "She has exquisite taste in art." },
  { word: "Vibrant", type: "adjective", pronounce: "/ˈvaɪbrənt/", meaning: "Sống động, đầy nghị lực", example_sentence: "Hong Kong is a vibrant, fascinating city." },
  { word: "Persevere", type: "verb", pronounce: "/ˌpɜːrsəˈvɪr/", meaning: "Kiên trì, bền bỉ", example_sentence: "Despite the difficulties, she decided to persevere with her studies." },
  { word: "Meticulous", type: "adjective", pronounce: "/məˈtɪkjələs/", meaning: "Tỉ mỉ, kỹ lưỡng", example_sentence: "He is always meticulous in keeping his accounts." },
  { word: "Eloquent", type: "adjective", pronounce: "/ˈeləkwənt/", meaning: "Có tài hùng biện", example_sentence: "She made an eloquent appeal for support." },
  { word: "Inevitably", type: "adverb", pronounce: "/ɪˈnevɪtəbli/", meaning: "Chắc chắn, không thể tránh khỏi", example_sentence: "Inevitably, the situation will change." }
];

async function seed() {
  await connectDB();
  console.log("🌱 Seeding sample vocabulary...");

  for (const item of sampleVocabulary) {
    try {
      await pool.execute(
        "INSERT INTO vocabulary (word, type, pronounce, meaning, example_sentence) VALUES (?, ?, ?, ?, ?)",
        [item.word, item.type, item.pronounce, item.meaning, item.example_sentence]
      );
      console.log(`✅ Added: ${item.word}`);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        console.log(`🟡 Skipping (Duplicate): ${item.word}`);
      } else {
        console.error(`❌ Error adding ${item.word}:`, err.message);
      }
    }
  }

  console.log("🏁 Seeding completed!");
  process.exit(0);
}

seed();
