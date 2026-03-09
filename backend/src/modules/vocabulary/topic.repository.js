
import { pool } from "../../utils/db.js";

class TopicRepository {
  async getAll(userId = null) {
    // Return admin topics (created_by is null) and user's topics
    let sql = "SELECT * FROM topics WHERE created_by IS NULL";
    const params = [];
    if (userId) {
      sql += " OR created_by = ?";
      params.push(userId);
    }
    sql += " ORDER BY name ASC";
    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  async getById(id) {
    const [rows] = await pool.execute("SELECT * FROM topics WHERE id = ?", [id]);
    return rows[0];
  }

  async getByName(name) {
    const [rows] = await pool.execute("SELECT * FROM topics WHERE name = ?", [name]);
    return rows[0];
  }

  async create(name, description = "", userId = null) {
    const [result] = await pool.execute(
      "INSERT INTO topics (name, description, created_by) VALUES (?, ?, ?)",
      [name, description, userId]
    );
    return result.insertId;
  }

  async delete(id, userId = null) {
    // Admins can delete any, users only their own
    let sql = "DELETE FROM topics WHERE id = ?";
    const params = [id];
    if (userId && userId !== 'admin') { // Simplified check, logic should be handled in service
        sql += " AND created_by = ?";
        params.push(userId);
    }
    await pool.execute(sql, params);
    return id;
  }

  async findOrCreate(name, userId = null) {
    const existing = await this.getByName(name);
    if (existing) return existing.id;
    return await this.create(name, "", userId);
  }

  async getUserTopics(userId) {
    const [rows] = await pool.execute(
      `SELECT t.* FROM topics t
       JOIN user_topics ut ON t.id = ut.topic_id
       WHERE ut.user_id = ?`,
      [userId]
    );
    return rows;
  }

  async addUserTopic(userId, topicId) {
    await pool.execute(
      "INSERT IGNORE INTO user_topics (user_id, topic_id) VALUES (?, ?)",
      [userId, topicId]
    );
  }
}

export default new TopicRepository();
