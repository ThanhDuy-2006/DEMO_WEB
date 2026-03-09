import { connectDB } from "../../utils/db.js";

class ProductsRepository {
  async findHouseRole(houseId, userId) {
    const pool = await connectDB();
    const [rows] = await pool.execute(`
        SELECT uh.role, h.owner_id 
        FROM user_houses uh 
        JOIN houses h ON h.id = uh.house_id 
        WHERE uh.house_id = ? AND uh.user_id = ?
    `, [houseId, userId]);
    return rows[0];
  }

  async createProduct({ house_id, seller_id, name, description, price, unitPrice, initialQty, image_url, status }) {
    const pool = await connectDB();
    const [result] = await pool.execute(`
        INSERT INTO products (house_id, seller_id, name, description, price, unit_price, quantity, image_url, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [house_id, seller_id, name, description || "", price, unitPrice, initialQty, image_url || null, status]);
    
    return result.insertId;
  }

  async addToInventory(userId, productId, quantity) {
    const pool = await connectDB();
    await pool.execute(`
        INSERT INTO user_inventories (user_id, product_id, quantity, is_selling) 
        VALUES (?, ?, ?, 1)
    `, [userId, productId, quantity]);
  }

  async getProductById(productId) {
    const pool = await connectDB();
    const [rows] = await pool.execute(`SELECT * FROM products WHERE id = ?`, [productId]);
    return rows[0];
  }

  async getProductsList({ house_id, status, seller_id, q, date }) {
    const pool = await connectDB();
    let query = `
        SELECT p.*, u.full_name as owner_name
        FROM products p
        LEFT JOIN users u ON u.id = p.seller_id
        WHERE p.house_id = ?
    `;
    let params = [house_id];

    if (status) {
        query += ` AND p.status = ?`;
        params.push(status);
    } else {
        query += ` AND p.status = 'active'`;
    }

    if (q) {
        query += ` AND (p.name LIKE ? OR u.full_name LIKE ?)`;
        params.push(`%${q}%`, `%${q}%`);
    }

    if (seller_id) {
        query += ` AND p.seller_id = ?`;
        params.push(seller_id);
    }

    if (date) {
        if (date === 'today') {
            query += ` AND DATE(p.created_at) = CURDATE()`;
        } else if (date === 'week') {
            query += ` AND YEARWEEK(p.created_at, 1) = YEARWEEK(CURDATE(), 1)`;
        } else if (date === 'month') {
            query += ` AND MONTH(p.created_at) = MONTH(CURDATE()) AND YEAR(p.created_at) = YEAR(CURDATE())`;
        } else if (date === 'year') {
            query += ` AND YEAR(p.created_at) = YEAR(CURDATE())`;
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            query += ` AND DATE(p.created_at) = ?`;
            params.push(date);
        }
    }
    
    query += ` ORDER BY p.created_at DESC`;

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  async updateProductStatus(id, status, connection) {
      await connection.execute(`UPDATE products SET status = ? WHERE id = ?`, [status, id]);
  }

  async getProductForUpdate(id, connection) {
      const [rows] = await connection.execute(`
          SELECT p.*, h.owner_id 
          FROM products p 
          LEFT JOIN houses h ON h.id = p.house_id 
          WHERE p.id = ? 
          FOR UPDATE
      `, [id]);
      return rows[0];
  }

  async getProductBrief(id, connection) {
      const [rows] = await connection.execute(`SELECT house_id, seller_id, name FROM products WHERE id = ?`, [id]);
      return rows[0];
  }

  async bulkGetDistinctHouses(productIds, placeholders, connection) {
      const [houses] = await connection.execute(`SELECT DISTINCT house_id FROM products WHERE id IN (${placeholders})`, productIds);
      return houses;
  }

  async checkHouseOwner(houseId, userId, connection) {
      const [mRows] = await connection.execute(`SELECT role FROM user_houses WHERE house_id = ? AND user_id = ?`, [houseId, userId]);
      return mRows[0]?.role === 'owner';
  }

  async bulkUpdateStatus(productIds, placeholders, status, connection) {
      await connection.execute(`UPDATE products SET status = ? WHERE id IN (${placeholders})`, [status, ...productIds]);
  }

  async importProduct(productData, connection) {
      const { house_id, seller_id, name, desc, price, unitPrice, quantity, img, status } = productData;
      const [pRes] = await connection.execute(
          `INSERT INTO products (house_id, seller_id, name, description, price, unit_price, quantity, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [house_id, seller_id, name, desc, price, unitPrice, quantity, img, status]
      );
      
      const productId = pRes.insertId;
      await connection.execute(
          `INSERT INTO user_inventories (user_id, product_id, quantity, is_selling) VALUES (?, ?, ?, 1)`,
          [seller_id, productId, quantity]
      );
      
      return productId;
  }

  async addExcelItem(house_id, name, price, quantity, productId, connection) {
      await connection.execute(
          `INSERT INTO house_excel_items (house_id, name, price, quantity, product_id) VALUES (?, ?, ?, ?, ?)`,
          [house_id, name, price, quantity, productId]
      );
  }
  async getMyListings(userId) {
      const pool = await connectDB();
      const [rows] = await pool.execute(`
          SELECT DISTINCT 
              p.*, 
              h.name as house_name,
              CASE WHEN p.seller_id = ? THEN 'selling' ELSE 'inventory' END as source_type,
              IFNULL(ui.quantity, 0) as inventory_qty
          FROM products p
          JOIN houses h ON h.id = p.house_id
          LEFT JOIN user_inventories ui ON ui.product_id = p.id AND ui.user_id = ?
          WHERE (p.seller_id = ? OR ui.user_id = ?) 
            AND p.status != 'deleted'
          ORDER BY p.created_at DESC
      `, [userId, userId, userId, userId]);
      return rows;
  }

  async getTrashListings(userId) {
      const pool = await connectDB();
      const [rows] = await pool.execute(`
          SELECT p.*, h.name as house_name, u.full_name as seller_name, 'listing' as trash_type
          FROM products p
          LEFT JOIN houses h ON h.id = p.house_id
          JOIN users u ON u.id = p.seller_id
          WHERE (p.seller_id = ? OR h.owner_id = ?) AND p.status = 'deleted'
      `, [userId, userId]);
      return rows;
  }

  async getTrashInventories(userId) {
      const pool = await connectDB();
      const [rows] = await pool.execute(`
          SELECT ui.*, p.name, p.description, p.image_url, h.name as house_name, u.full_name as seller_name, 'inventory' as trash_type
          FROM user_inventories ui
          JOIN products p ON p.id = ui.product_id
          JOIN users u ON u.id = p.seller_id
          LEFT JOIN houses h ON h.id = p.house_id
          WHERE ui.user_id = ? AND ui.deleted_at IS NOT NULL
      `, [userId]);
      return rows;
  }

  async getTrashHouses(userId) {
      const pool = await connectDB();
      const [rows] = await pool.execute(`
          SELECT h.*, h.name, 'house' as trash_type, u.full_name as seller_name
          FROM houses h
          JOIN users u ON u.id = h.owner_id
          WHERE h.owner_id = ? AND h.status = 'deleted'
      `, [userId]);
      return rows;
  }

  async getProductStatusInfo(id) {
      const pool = await connectDB();
      const [rows] = await pool.execute(`SELECT seller_id, previous_status FROM products WHERE id = ?`, [id]);
      return rows[0];
  }

  async restoreProductStatus(id, restoreStatus) {
      const pool = await connectDB();
      await pool.execute(
          `UPDATE products SET status = ?, previous_status = NULL, deleted_at = NULL WHERE id = ?`,
          [restoreStatus, id]
      );
  }

  async restoreProductInventories(id) {
      const pool = await connectDB();
      await pool.execute(
          `UPDATE user_inventories SET deleted_at = NULL WHERE product_id = ? AND deleted_at IS NOT NULL`,
          [id]
      );
  }

  async getProductForForceDelete(id, connection) {
      const [rows] = await connection.execute(`SELECT seller_id, image_url FROM products WHERE id = ?`, [id]);
      return rows[0];
  }

  async deleteInventoryAndProductById(id, connection) {
      await connection.execute(`DELETE FROM user_inventories WHERE product_id = ?`, [id]);
      await connection.execute(`DELETE FROM products WHERE id = ?`, [id]);
  }

  async getProductForSoftDelete(id) {
      const pool = await connectDB();
      const [rows] = await pool.execute(`
          SELECT p.seller_id, p.house_id, h.owner_id, p.status 
          FROM products p 
          JOIN houses h ON p.house_id = h.id 
          WHERE p.id = ?
      `, [id]);
      return rows[0];
  }

  async softDeleteProduct(id, currentStatus) {
      const pool = await connectDB();
      await pool.execute(
          `UPDATE products SET status = 'deleted', previous_status = ?, deleted_at = NOW() WHERE id = ?`,
          [currentStatus, id]
      );
  }

  async softDeleteProductInventories(id) {
      const pool = await connectDB();
      await pool.execute(
          `UPDATE user_inventories SET deleted_at = NOW() WHERE product_id = ? AND deleted_at IS NULL`,
          [id]
      );
  }

  async getProductForUpdateSync(id) {
      const pool = await connectDB();
      const [rows] = await pool.execute(`SELECT seller_id, house_id, status FROM products WHERE id = ?`, [id]);
      return rows[0];
  }

  async updateProductDetails(id, name, price, unitPrice, quantity, description, connection) {
      await connection.execute(
          `UPDATE products SET name = ?, price = ?, unit_price = ?, quantity = ?, description = ? WHERE id = ?`,
          [name, price, unitPrice, quantity, description, id]
      );
  }

  async syncInventory(id, sellerId, quantity, connection) {
      await connection.execute(
          `UPDATE user_inventories SET quantity = ? WHERE product_id = ? AND user_id = ?`,
          [quantity, id, sellerId]
      );
  }

  async syncExcelItem(id, name, price, quantity, connection) {
      await connection.execute(
          `UPDATE house_excel_items SET name = ?, price = ?, quantity = ? WHERE product_id = ?`,
          [name, price, quantity, id]
      );
  }

  async getBulkProductsForDelete(productIds, placeholders, connection) {
      const [rows] = await connection.execute(`
          SELECT p.id, p.seller_id, p.status, h.owner_id 
          FROM products p
          JOIN houses h ON p.house_id = h.id
          WHERE p.id IN (${placeholders})
      `, productIds);
      return rows;
  }

  async softDeleteProductTx(id, status, connection) {
       await connection.execute(
          `UPDATE products SET status = 'deleted', previous_status = ?, deleted_at = NOW() WHERE id = ?`,
          [status, id]
      );
  }

  async softDeleteInventoriesTx(id, connection) {
       await connection.execute(
          `UPDATE user_inventories SET deleted_at = NOW() WHERE product_id = ? AND deleted_at IS NULL`,
          [id]
      );
  }

  async getBulkProductsForRestore(productIds, placeholders, connection) {
       const [rows] = await connection.execute(
          `SELECT id, seller_id, previous_status FROM products WHERE id IN (${placeholders})`,
          productIds
      );
      return rows;
  }

  async restoreProductTx(id, status, connection) {
       await connection.execute(
          `UPDATE products SET status = ?, previous_status = NULL, deleted_at = NULL WHERE id = ?`,
          [status, id]
      );
  }

  async restoreInventoriesTx(id, connection) {
       await connection.execute(
          `UPDATE user_inventories SET deleted_at = NULL WHERE product_id = ? AND deleted_at IS NOT NULL`,
          [id]
      );
  }

  async getBulkProductsForForceDelete(productIds, placeholders, connection) {
       const [rows] = await connection.execute(
          `SELECT id, seller_id, image_url FROM products WHERE id IN (${placeholders})`,
          productIds
      );
      return rows;
  }

  async getProductWithHouseIdForUpdate(id, connection) {
      const [rows] = await connection.execute(
          `SELECT p.*, h.owner_id FROM products p JOIN houses h ON h.id = p.house_id WHERE p.id = ? FOR UPDATE`,
          [id]
      );
      return rows[0];
  }

  async getWalletForUpdate(userId, connection) {
      const [rows] = await connection.execute(`SELECT balance FROM wallets WHERE user_id = ? FOR UPDATE`, [userId]);
      return rows[0];
  }

  async decrementProductQuantity(id, connection) {
      await connection.execute(`UPDATE products SET quantity = quantity - 1 WHERE id = ?`, [id]);
  }

  async getInventoryForUpdate(userId, productId, connection) {
      const [rows] = await connection.execute(
          `SELECT id, quantity FROM user_inventories WHERE user_id = ? AND product_id = ? FOR UPDATE`,
          [userId, productId]
      );
      return rows[0];
  }

  async updateOrDeleteInventory(inventoryId, quantity, connection) {
      if (quantity > 1) {
          await connection.execute(`UPDATE user_inventories SET quantity = quantity - 1 WHERE id = ?`, [inventoryId]);
      } else {
          await connection.execute(`DELETE FROM user_inventories WHERE id = ?`, [inventoryId]);
      }
  }

  async debitWallet(userId, amount, connection) {
      await connection.execute(`UPDATE wallets SET balance = balance - ? WHERE user_id = ?`, [amount, userId]);
  }

  async creditWallet(userId, amount, connection) {
      await connection.execute(`UPDATE wallets SET balance = balance + ? WHERE user_id = ?`, [amount, userId]);
  }

  async createTransaction(buyerId, productId, houseId, unitPrice, description, connection) {
      await connection.execute(
          `INSERT INTO transactions (user_id, product_id, house_id, quantity, unit_price, total_price, type, description)
           VALUES (?, ?, ?, 1, ?, ?, 'PAYMENT', ?)`,
          [buyerId, productId, houseId, unitPrice, unitPrice, description]
      );
  }

  async createSalesLog(productId, buyerId, connection) {
      await connection.execute(
          `INSERT INTO product_sales_log (product_id, buyer_id, action_type) VALUES (?, ?, 'BUY')`,
          [productId, buyerId]
      );
  }

  async getBuyerInventory(userId, productId, connection) {
       const [rows] = await connection.execute(
            `SELECT id FROM user_inventories WHERE user_id = ? AND product_id = ?`,
            [userId, productId]
        );
        return rows[0];
  }

  async incrementBuyerInventory(inventoryId, connection) {
      await connection.execute(`UPDATE user_inventories SET quantity = quantity + 1 WHERE id = ?`, [inventoryId]);
  }

  async addBuyerInventory(userId, productId, connection) {
      await connection.execute(
          `INSERT INTO user_inventories (user_id, product_id, quantity, is_selling) VALUES (?, ?, 1, 0)`, 
          [userId, productId]
      );
  }

  async getWalletBalance(userId, pool) {
      const [rows] = await pool.execute(`SELECT balance FROM wallets WHERE user_id = ?`, [userId]);
      return rows[0]?.balance;
  }

  async getProductQuantity(id, pool) {
      const [rows] = await pool.execute(`SELECT quantity FROM products WHERE id = ?`, [id]);
      return rows[0]?.quantity;
  }

  async getHouseTransactions(houseId) {
      const pool = await connectDB();
      const [rows] = await pool.execute(`
          SELECT 
              t.*, 
              u.full_name as buyer_name, 
              s.full_name as seller_name,
              p.name as product_name,
              t.description,
              t.type
          FROM transactions t
          LEFT JOIN users u ON u.id = t.user_id
          LEFT JOIN products p ON p.id = t.product_id
          LEFT JOIN users s ON s.id = p.seller_id
          WHERE t.house_id = ?
          ORDER BY t.created_at DESC
      `, [houseId]);
      return rows;
  }
}

export default new ProductsRepository();
