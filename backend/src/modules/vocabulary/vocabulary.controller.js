
import VocabularyService from "./vocabulary.service.js";
import { AppError } from "../../core/errors.js";

class VocabularyController {
  async getAll(req, res, next) {
    try {
      const { query, type, topicId } = req.query;
      const data = await VocabularyService.getAllVocabulary(query, type, topicId);
      res.json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const data = await VocabularyService.getById(req.params.id);
      res.json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const id = await VocabularyService.createVocabulary(req.body);
      res.status(201).json({ status: "success", id });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      await VocabularyService.updateVocabulary(req.params.id, req.body);
      res.json({ status: "success", message: "Updated" });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await VocabularyService.deleteVocabulary(req.params.id);
      res.json({ status: "success", message: "Deleted" });
    } catch (err) {
      next(err);
    }
  }

  async importBulk(req, res, next) {
    try {
      if (!req.file) {
        throw new AppError("No file uploaded", 400);
      }
      const userId = req.user.id;
      const results = await VocabularyService.importBulk(req.file.buffer, "xlsx", userId);
      res.json({ status: "success", data: results });
    } catch (err) {
      next(err);
    }
  }

  // QUIZ ENDPOINTS
  async generateQuiz(req, res, next) {
    try {
      const mode = req.query.mode || 'mixed';
      const limit = parseInt(req.query.limit) || 10;
      const topicId = req.query.topicId || null;
      const userId = req.user.id;
      const data = await VocabularyService.generateQuiz(userId, mode, limit, topicId);
      res.json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  }

  async submitQuiz(req, res, next) {
    try {
      const { sessionId, mode, results } = req.body;
      const userId = req.user.id;
      const data = await VocabularyService.submitQuiz(userId, sessionId, { mode, results });
      res.json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  }

  // USER STATS
  async getProgress(req, res, next) {
    try {
      const userId = req.user.id;
      const stats = await VocabularyService.getUserProgress(userId);
      res.json({ status: "success", data: stats });
    } catch (err) {
      next(err);
    }
  }

  async getLeaderboard(req, res, next) {
    try {
      const { type } = req.params; // daily, weekly, alltime
      const data = await VocabularyService.getLeaderboard(type || 'all_time');
      res.json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  }

  async getStreak(req, res, next) {
    try {
      const userId = req.user.id;
      const streak = await VocabularyService.getStreak(userId);
      res.json({ status: "success", data: { streak } });
    } catch (err) {
      next(err);
    }
  }
}

export default new VocabularyController();
