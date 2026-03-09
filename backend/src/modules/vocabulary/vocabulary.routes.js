
import express from "express";
import multer from "multer";
import VocabularyController from "./vocabulary.controller.js";
import TopicController from "./topic.controller.js";
import { verifyAccessToken } from "../../middlewares/authMiddleware.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ADMIN ONLY (Check role)
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: "Admin only" });
    }
};

// Vocabulary CRUD & Import
// ADMIN ENDPOINTS
router.get("/vocabulary", verifyAccessToken, VocabularyController.getAll);
router.get("/vocabulary/:id", verifyAccessToken, VocabularyController.getById);
router.post("/vocabulary", verifyAccessToken, isAdmin, VocabularyController.create);
router.put("/vocabulary/:id", verifyAccessToken, isAdmin, VocabularyController.update);
router.delete("/vocabulary/:id", verifyAccessToken, isAdmin, VocabularyController.delete);
router.post("/vocabulary/import", verifyAccessToken, isAdmin, upload.single("file"), VocabularyController.importBulk);

// Topic Endpoints
router.get("/topics", verifyAccessToken, TopicController.getAll);
router.post("/topics", verifyAccessToken, TopicController.create);
router.delete("/topics/:id", verifyAccessToken, TopicController.delete);

// User Learning Endpoints
router.get("/quiz/generate", verifyAccessToken, VocabularyController.generateQuiz);
router.post("/quiz/submit", verifyAccessToken, VocabularyController.submitQuiz);

// Stats & Leaderboard
router.get("/user/progress", verifyAccessToken, VocabularyController.getProgress);
router.get("/streak", verifyAccessToken, VocabularyController.getStreak);
router.get("/leaderboard/:type", verifyAccessToken, VocabularyController.getLeaderboard);

export default router;
