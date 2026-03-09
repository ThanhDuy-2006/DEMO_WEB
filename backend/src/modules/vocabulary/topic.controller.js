
import TopicService from "./topic.service.js";

class TopicController {
  async getAll(req, res, next) {
    try {
      const userId = req.user.id;
      const data = await TopicService.getTopics(userId);
      res.json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const { name, description } = req.body;
      const userId = req.user.id;
      const id = await TopicService.createTopic(name, description, userId);
      res.status(201).json({ status: "success", id });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const userId = req.user.id;
      await TopicService.deleteTopic(req.params.id, userId);
      res.json({ status: "success", message: "Topic deleted" });
    } catch (err) {
      next(err);
    }
  }
}

export default new TopicController();
