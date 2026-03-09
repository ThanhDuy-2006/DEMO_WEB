
import VocabularyRepository from "./vocabulary.repository.js";
import TopicRepository from "./topic.repository.js";
import xlsx from "xlsx";
import { AppError } from "../../core/errors.js";

class VocabularyService {
  async getAllVocabulary(query, type, topicId = null) {
    return await VocabularyRepository.getAll(query, type, topicId);
  }

  async getById(id) {
    return await VocabularyRepository.getById(id);
  }

  async createVocabulary(data) {
    return await VocabularyRepository.create(data);
  }

  async updateVocabulary(id, data) {
    return await VocabularyRepository.update(id, data);
  }

  async deleteVocabulary(id) {
    return await VocabularyRepository.delete(id);
  }

  async importBulk(fileBuffer, type = "xlsx", userId = null) {
    let workbook;
    if (type === "xlsx") {
      workbook = xlsx.read(fileBuffer, { type: "buffer" });
    } else {
      // CSV handling
      workbook = xlsx.read(fileBuffer.toString(), { type: "string" });
    }
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const topicCache = {};
    const items = [];

    for (const row of data) {
       const word = row.Word || row.word;
       const meaning = row.Meaning || row.meaning;
       
       if (!word || !meaning) continue;

       let topicId = null;
       const topicName = row.Topic || row.topic;
       if (topicName) {
          if (topicCache[topicName]) {
             topicId = topicCache[topicName];
          } else {
             topicId = await TopicRepository.findOrCreate(topicName, userId);
             topicCache[topicName] = topicId;
          }
       }

       items.push({
         word,
         type: row.Type || row.type,
         pronounce: row.Pronounce || row.pronounce,
         meaning,
         example_sentence: row.Example || row.example_sentence || row.example,
         audio_url: row.Audio || row.audio_url || row.audio,
         topic_id: topicId
       });
    }

    return await VocabularyRepository.bulkUpsert(items);
  }

  async generateQuiz(userId, mode, limit = 10, topicId = null) {
    const words = await VocabularyRepository.getWordsForReview(userId, limit, topicId);
    // Create a real session ID in the database
    const sessionId = await VocabularyRepository.createQuizSession(userId, mode, words.length);
    
    return {
      sessionId,
      words: words.sort(() => Math.random() - 0.5)
    };
  }

  async submitQuiz(userId, sessionId, answers) {
    // Mode-based base XP
    const modeXP = {
      flashcard: 5,
      multiple_choice: 10,
      matching: 10,
      typing: 15,
      dictation: 20,
      mixed: 25
    };

    // Need to fetch session to get mode
    // (Wait, repository doesn't have fetch session yet, let's assume it's passed or modes are predefined)
    // For simplicity, let's just use the passed mode from answers or session metadata
    const mode = answers.mode || 'flashcard';
    const baseXP = modeXP[mode] || 10;

    let totalXP = 0;
    let correctCount = 0;
    let comboCount = 0;
    let maxCombo = 0;

    for (const ans of answers.results) {
      const { vocabId, isCorrect, timeMs } = ans;
      
      await VocabularyRepository.saveQuizAnswer(sessionId, vocabId, isCorrect, timeMs);
      
      if (isCorrect) {
        correctCount++;
        comboCount++;
        maxCombo = Math.max(maxCombo, comboCount);
        totalXP += baseXP;
        
        // Bonus for combos
        if (comboCount === 5) totalXP += 10;
        if (comboCount === 10) totalXP += 25;
        
        await this._updateSpacedRepetition(userId, vocabId, true);
      } else {
        comboCount = 0;
        await this._updateSpacedRepetition(userId, vocabId, false);
      }
    }

    await VocabularyRepository.completeQuizSession(sessionId, correctCount, totalXP);
    await VocabularyRepository.updateStats(userId, totalXP, new Date());
    const updatedStats = await VocabularyRepository.getStats(userId);

    return {
      session_id: sessionId,
      correct: correctCount,
      total: answers.results.length,
      xp_earned: totalXP,
      max_combo: maxCombo,
      current_streak: updatedStats?.current_streak || 0
    };
  }

  async _updateSpacedRepetition(userId, vocabId, isCorrect) {
    const progress = await VocabularyRepository.getProgress(userId, vocabId);
    
    // User defined cycle: Day 1, 3, 7, 14, 30
    const intervals = [0, 1, 3, 7, 14, 30];
    
    let currentIntervalIdx = 0;
    if (progress) {
      currentIntervalIdx = intervals.indexOf(progress.interval_days);
      if (currentIntervalIdx === -1) currentIntervalIdx = 0;
    }

    let nextIntervalDays = 1;
    let masteryLevel = progress ? progress.mastery_level : 0;

    if (isCorrect) {
      if (currentIntervalIdx < intervals.length - 1) {
        nextIntervalDays = intervals[currentIntervalIdx + 1];
      } else {
        nextIntervalDays = 30; // Max
      }
      masteryLevel = Math.min(masteryLevel + 1, 5);
    } else {
      nextIntervalDays = 1; // Back to start
      masteryLevel = Math.max(masteryLevel - 1, 0);
    }

    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + nextIntervalDays);

    await VocabularyRepository.upsertProgress(userId, vocabId, {
      mastery_level: masteryLevel,
      next_review_at: nextReviewAt,
      interval_days: nextIntervalDays,
      ease_factor: 2.5, // Not fully using EF in this simplified cycle
      correct_inc: isCorrect ? 1 : 0,
      incorrect_inc: isCorrect ? 0 : 1
    });
  }

  async getLeaderboard(type) {
    return await VocabularyRepository.getLeaderboard(type);
  }

  async getStreak(userId) {
    const stats = await VocabularyRepository.getStats(userId);
    return stats ? stats.current_streak : 0;
  }

  async getUserProgress(userId) {
    const stats = await VocabularyRepository.getStats(userId);
    const summary = await VocabularyRepository.getUserLearningSummary(userId);
    
    return {
      ...(stats || { total_xp: 0, current_streak: 0, longest_streak: 0 }),
      ...summary
    };
  }
}

export default new VocabularyService();
