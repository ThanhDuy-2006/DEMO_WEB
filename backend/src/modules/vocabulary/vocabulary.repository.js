
import { pool } from "../../utils/db.js";

class VocabularyRepository {
  async getAll(query = "", type = "", topicId = null) {
    let sql = "SELECT v.*, t.name as topic_name FROM vocabulary v LEFT JOIN topics t ON v.topic_id = t.id WHERE 1=1";
    const params = [];
    if (query) {
      sql += " AND (v.word LIKE ? OR v.meaning LIKE ?)";
      params.push(`%${query}%`, `%${query}%`);
    }
    if (type) {
      sql += " AND v.type = ?";
      params.push(type);
    }
    if (topicId) {
      sql += " AND v.topic_id = ?";
      params.push(topicId);
    }
    sql += " ORDER BY v.id DESC";
    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  async getById(id) {
    const [rows] = await pool.execute(
      "SELECT v.*, t.name as topic_name FROM vocabulary v LEFT JOIN topics t ON v.topic_id = t.id WHERE v.id = ?", 
      [id]
    );
    return rows[0];
  }

  async create(data) {
    const { word, type, pronounce, meaning, example_sentence, audio_url, topic_id } = data;
    const [result] = await pool.execute(
      "INSERT INTO vocabulary (word, type, pronounce, meaning, example_sentence, audio_url, topic_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [word, type, pronounce, meaning, example_sentence, audio_url, topic_id || null]
    );
    return result.insertId;
  }

  async update(id, data) {
    const { word, type, pronounce, meaning, example_sentence, audio_url, topic_id } = data;
    await pool.execute(
      "UPDATE vocabulary SET word = ?, type = ?, pronounce = ?, meaning = ?, example_sentence = ?, audio_url = ?, topic_id = ? WHERE id = ?",
      [word, type, pronounce, meaning, example_sentence, audio_url, topic_id || null, id]
    );
    return id;
  }

  async delete(id) {
    await pool.execute("DELETE FROM vocabulary WHERE id = ?", [id]);
    return id;
  }

  async bulkUpsert(items) {
    const results = { imported: 0, updated: 0, skipped: 0, errors: 0 };
    for (const item of items) {
      try {
        const [existing] = await pool.execute("SELECT id FROM vocabulary WHERE word = ?", [item.word]);
        if (existing.length > 0) {
          // Update
          await this.update(existing[0].id, item);
          results.updated++;
        } else {
          // Insert
          await this.create(item);
          results.imported++;
        }
      } catch (err) {
        console.error(`Error importing ${item.word}:`, err);
        results.errors++;
      }
    }
    return results;
  }

  // PROGRESS METHODS
  async getProgress(userId, vocabId) {
    const [rows] = await pool.execute(
      "SELECT * FROM user_vocabulary_progress WHERE user_id = ? AND vocabulary_id = ?",
      [userId, vocabId]
    );
    return rows[0];
  }

  async upsertProgress(userId, vocabId, data) {
    const { mastery_level, next_review_at, interval_days, ease_factor, correct_inc, incorrect_inc } = data;
    const existing = await this.getProgress(userId, vocabId);
    if (existing) {
      await pool.execute(
        `UPDATE user_vocabulary_progress 
         SET mastery_level = ?, next_review_at = ?, last_reviewed_at = NOW(), interval_days = ?, ease_factor = ?, 
             correct_count = correct_count + ?, incorrect_count = incorrect_count + ?
         WHERE id = ?`,
        [mastery_level, next_review_at, interval_days, ease_factor, correct_inc, incorrect_inc, existing.id]
      );
    } else {
      await pool.execute(
        `INSERT INTO user_vocabulary_progress (user_id, vocabulary_id, mastery_level, next_review_at, last_reviewed_at, interval_days, ease_factor, correct_count, incorrect_count)
         VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?)`,
        [userId, vocabId, mastery_level, next_review_at, interval_days, ease_factor, correct_inc, incorrect_inc]
      );
    }
  }

  async getWordsForReview(userId, limit = 10, topicId = null) {
    // Get words due for review or new words
    let sql = `
      SELECT v.* FROM vocabulary v
      LEFT JOIN user_vocabulary_progress p ON v.id = p.vocabulary_id AND p.user_id = ?
      WHERE (p.next_review_at IS NULL OR p.next_review_at <= NOW())
    `;
    const params = [userId];

    if (topicId) {
      sql += " AND v.topic_id = ?";
      params.push(topicId);
    }

    sql += " ORDER BY p.next_review_at ASC, RAND() LIMIT ?";
    params.push(limit);

    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  // QUIZ SESSION
  async createQuizSession(userId, mode, total) {
    const [result] = await pool.execute(
      "INSERT INTO quiz_sessions (user_id, mode, total_questions) VALUES (?, ?, ?)",
      [userId, mode, total]
    );
    return result.insertId;
  }

  async completeQuizSession(sessionId, correct, xp) {
    await pool.execute(
      "UPDATE quiz_sessions SET correct_answers = ?, xp_earned = ?, completed_at = NOW() WHERE id = ?",
      [correct, xp, sessionId]
    );
  }

  async saveQuizAnswer(sessionId, vocabId, isCorrect, timeMs) {
    await pool.execute(
      "INSERT INTO quiz_answers (session_id, vocabulary_id, is_correct, response_time_ms) VALUES (?, ?, ?, ?)",
      [sessionId, vocabId, isCorrect, timeMs]
    );
  }

  // STATS & STREAK
  async getStats(userId) {
    const [rows] = await pool.execute("SELECT * FROM user_learning_stats WHERE user_id = ?", [userId]);
    return rows[0];
  }

  async getUserLearningSummary(userId) {
    const [totalWords] = await pool.execute("SELECT COUNT(*) as count FROM vocabulary");
    const [userLearned] = await pool.execute(
      "SELECT COUNT(*) as count FROM user_vocabulary_progress WHERE user_id = ?",
      [userId]
    );
    const [mastered] = await pool.execute(
      "SELECT COUNT(*) as count FROM user_vocabulary_progress WHERE user_id = ? AND mastery_level >= 4",
      [userId]
    );
    return {
      total_words: totalWords[0]?.count || 0,
      learned_words: userLearned[0]?.count || 0,
      mastered_words: mastered[0]?.count || 0
    };
  }

  async updateStats(userId, xpGain, lastLessonAt) {
    const existing = await this.getStats(userId);
    if (!existing) {
      await pool.execute(
        "INSERT INTO user_learning_stats (user_id, total_xp, current_streak, longest_streak, last_lesson_at) VALUES (?, ?, 1, 1, ?)",
        [userId, xpGain, lastLessonAt]
      );
    } else {
      let newStreak = existing.current_streak;
      const lastDate = existing.last_lesson_at ? new Date(existing.last_lesson_at).toDateString() : null;
      const today = new Date(lastLessonAt).toDateString();
      const yesterday = new Date(new Date(lastLessonAt).getTime() - 86400000).toDateString();

      if (lastDate === today) {
        // Already did a lesson today, streak stays the same
      } else if (lastDate === yesterday) {
        // Did a lesson yesterday, increment
        newStreak++;
      } else {
        // Broke streak
        newStreak = 1;
      }

      await pool.execute(
        `UPDATE user_learning_stats 
         SET total_xp = total_xp + ?, current_streak = ?, longest_streak = GREATEST(longest_streak, ?), last_lesson_at = ?
         WHERE user_id = ?`,
        [xpGain, newStreak, newStreak, lastLessonAt, userId]
      );
    }
  }

  async getLeaderboard(type) {
    // This could involve complex queries or reading from cache
    // For now, let's just query from stats for 'all_time'
    if (type === 'all_time') {
      const [rows] = await pool.execute(
        `SELECT u.full_name, u.avatar_url, s.total_xp as score 
         FROM user_learning_stats s
         JOIN users u ON s.user_id = u.id
         ORDER BY s.total_xp DESC LIMIT 100`
      );
      return rows;
    }
    // For daily/weekly, we would query quiz_sessions joined with users within time range
    let interval = type === 'daily' ? '1 DAY' : '7 DAY';
    const [rows] = await pool.execute(
      `SELECT u.full_name, u.avatar_url, SUM(q.xp_earned) as score 
       FROM quiz_sessions q
       JOIN users u ON q.user_id = u.id
       WHERE q.completed_at >= NOW() - INTERVAL ${interval}
       GROUP BY q.user_id
       ORDER BY score DESC LIMIT 100`
    );
    return rows;
  }
}

export default new VocabularyRepository();
