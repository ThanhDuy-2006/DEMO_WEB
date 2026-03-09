
import TopicRepository from "./topic.repository.js";

class TopicService {
  async getTopics(userId = null) {
    return await TopicRepository.getAll(userId);
  }

  async createTopic(name, description, userId = null) {
    return await TopicRepository.create(name, description, userId);
  }

  async deleteTopic(id, userId = null) {
    return await TopicRepository.delete(id, userId);
  }

  async getUserTopics(userId) {
    return await TopicRepository.getUserTopics(userId);
  }

  async followTopic(userId, topicId) {
    return await TopicRepository.addUserTopic(userId, topicId);
  }
}

export default new TopicService();
