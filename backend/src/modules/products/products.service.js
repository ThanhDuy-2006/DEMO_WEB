import ProductsRepository from './products.repository.js';
import { createNotification } from "../notifications/notifications.service.js";
import { emitToUser, emitToHouse } from "../../utils/socket.js";
import { ForbiddenError, BadRequestError, NotFoundError } from "../../core/errors.js";
import { connectDB } from "../../utils/db.js";
import { deleteLocalFile } from "../../utils/fileHelper.js";
import xlsx from "xlsx";
import fs from "fs";

class ProductsService {
  async createProduct({ house_id, name, description, price, quantity, image_url, user, req }) {
    if (!house_id || !name || !price) {
        throw new BadRequestError("Missing fields");
    }

    const userId = user.id;
    const houseMember = await ProductsRepository.findHouseRole(house_id, userId);
    
    if (!houseMember) {
        throw new ForbiddenError("Not a member of this house");
    }

    const { owner_id: ownerId, role: userRole } = houseMember;
    const isOwner = userRole === 'owner' || user.role === 'admin';
    const status = isOwner ? 'active' : 'pending';

    const initialQty = quantity ? parseInt(quantity) : 1;
    const unitPrice = initialQty > 0 ? (parseFloat(price) / initialQty) : parseFloat(price);

    const productId = await ProductsRepository.createProduct({
        house_id,
        seller_id: userId,
        name,
        description,
        price,
        unitPrice,
        initialQty,
        image_url,
        status,
    });

    await ProductsRepository.addToInventory(userId, productId, initialQty);

    // Notifications and Socket Emissions
    if (userId !== ownerId) {
        await createNotification({
            userId: ownerId,
            houseId: house_id,
            type: 'PRODUCT_APPROVAL_REQUEST',
            title: 'Yêu cầu duyệt sản phẩm',
            message: `${user.full_name || 'Thành viên'} đã đăng sản phẩm mới: ${name}`,
            data: { productId: productId }
        });

        emitToUser(ownerId, "newNotification", {
            message: `${user.full_name || 'Thành viên'} đã đăng sản phẩm mới: ${name}`,
            type: 'PRODUCT_APPROVAL_REQUEST'
        });
    }

    if (status === 'active') {
        emitToHouse(house_id, "productUpdated", { productId, newQuantity: initialQty });
    }

    return await ProductsRepository.getProductById(productId);
  }

  async getProducts(queryParams) {
      if (!queryParams.house_id) {
          throw new BadRequestError("Missing house_id");
      }
      return await ProductsRepository.getProductsList(queryParams);
  }

  async updateProductStatus(id, status, user) {
      if (!['active', 'rejected'].includes(status)) {
          throw new BadRequestError("Invalid status");
      }

      let connection;
      try {
          const pool = await connectDB();
          connection = await pool.getConnection();
          await connection.beginTransaction();

          const product = await ProductsRepository.getProductBrief(id, connection);
          
          if (!product) {
              throw new NotFoundError("Product not found");
          }
          
          const houseId = product.house_id;

          if (user.role !== 'admin') {
              const isOwner = await ProductsRepository.checkHouseOwner(houseId, user.id, connection);
              
              if (!isOwner) {
                  throw new ForbiddenError("House Owner only");
              }
          }

          await ProductsRepository.updateProductStatus(id, status, connection);
          await connection.commit();

          // NOTIFICATION
          await createNotification({
              userId: product.seller_id,
              houseId: houseId,
              type: status === 'active' ? 'PRODUCT_APPROVED' : 'PRODUCT_REJECTED',
              title: status === 'active' ? 'Sản phẩm được duyệt' : 'Sản phẩm bị từ chối',
              message: `Sản phẩm '${product.name}' của bạn đã ${status === 'active' ? 'được duyệt' : 'bị từ chối'}.`,
              data: { productId: id }
          });

          emitToUser(product.seller_id, "newNotification", {
              message: `Sản phẩm '${product.name}' của bạn đã ${status === 'active' ? 'được duyệt' : 'bị từ chối'}.`,
              type: status === 'active' ? 'PRODUCT_APPROVED' : 'PRODUCT_REJECTED'
          });

          if (status === 'active') {
               const p = await ProductsRepository.getProductById(id);
               emitToHouse(houseId, "productUpdated", { productId: id, newQuantity: p?.quantity });
          }

          return await ProductsRepository.getProductById(id);
      } catch (err) {
          if (connection) await connection.rollback();
          throw err;
      } finally {
          if (connection) connection.release();
      }
  }

  async bulkUpdateStatus(productIds, status, user) {
      if (!Array.isArray(productIds) || productIds.length === 0) {
          throw new BadRequestError("No products selected");
      }
      if (!['active', 'rejected'].includes(status)) {
          throw new BadRequestError("Invalid status");
      }

      if (!productIds.every(id => Number.isInteger(Number(id)))) {
          throw new BadRequestError("Invalid IDs");
      }

      let connection;
      try {
          const pool = await connectDB();
          connection = await pool.getConnection();
          await connection.beginTransaction();

          const placeholders = productIds.map(() => '?').join(',');

          if (user.role !== 'admin') {
              const houses = await ProductsRepository.bulkGetDistinctHouses(productIds, placeholders, connection);
              
              for (const row of houses) {
                  const isOwner = await ProductsRepository.checkHouseOwner(row.house_id, user.id, connection);
                  if (!isOwner) {
                      throw new ForbiddenError(`Not owner of house ${row.house_id}`);
                  }
              }
          }

          await ProductsRepository.bulkUpdateStatus(productIds, placeholders, status, connection);
          await connection.commit();
          
          return { ok: true, count: productIds.length };
      } catch (err) {
          if (connection) await connection.rollback();
          throw err;
      } finally {
          if (connection) connection.release();
      }
  }

  async importProducts(houseId, files, user, protocol, host) {
      const excelFile = files.find(f => f.originalname.match(/\.(xlsx|xls)$/i));
      
      const imageMap = {};
      files.forEach(f => {
          if (f.mimetype.startsWith('image/')) {
              const url = `${protocol}://${host}/uploads/${f.filename}`;
              imageMap[f.originalname] = url;
              imageMap[f.originalname.toLowerCase()] = url;
          }
      });

      if (!houseId || !excelFile) {
          throw new BadRequestError("Missing file or house_id");
      }

      const houseMember = await ProductsRepository.findHouseRole(houseId, user.id);
      if (!houseMember) {
          throw new ForbiddenError("Not a member");
      }

      const { role: userRole, type: houseType } = houseMember;

      const workbook = xlsx.read(fs.readFileSync(excelFile.path), { type: "buffer" });
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new BadRequestError("Excel file has no sheets");
      }
      
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!firstSheet) throw new BadRequestError("Sheet is empty or missing");

      const data = xlsx.utils.sheet_to_json(firstSheet);
      if (data.length === 0) return { ok: false, message: "Empty file" };

      let connection;
      try {
          const pool = await connectDB();
          connection = await pool.getConnection();
          await connection.beginTransaction();

          let count = 0;
          let missingImages = [];

          for (const row of data) {
              const cleanRow = {};
              Object.keys(row).forEach(k => { if (k) cleanRow[k.trim()] = row[k]; });

              const name = cleanRow['Name'] || cleanRow['name'] || cleanRow['Tên'];
              let rawPrice = cleanRow['Price'] || cleanRow['price'] || cleanRow['Giá'];
              const desc = cleanRow['Description'] || cleanRow['description'] || cleanRow['Mô tả'] || "";
              let imgRaw = cleanRow['Image'] || cleanRow['image'] || cleanRow['Hình ảnh'] || null;
              let img = null;

              let price = 0;
              if (rawPrice !== undefined && rawPrice !== null) {
                  if (typeof rawPrice === 'string') {
                      price = parseFloat(rawPrice.replace(/[.,]/g, '').replace(/[^\d]/g, '')) || 0;
                  } else {
                      price = parseFloat(rawPrice) || 0;
                  }
              }

              if (imgRaw && typeof imgRaw === 'string') {
                  imgRaw = imgRaw.trim();
                  if (imageMap[imgRaw]) img = imageMap[imgRaw];
                  else {
                      const match = Object.keys(imageMap).find(k => k.toLowerCase().startsWith(imgRaw.toLowerCase() + '.'));
                      img = match ? imageMap[match] : (imgRaw.startsWith('http') ? imgRaw : null);
                      if (!img && !imgRaw.startsWith('http')) missingImages.push(imgRaw);
                  }
              }

              let rawQty = cleanRow['Quantity'] || cleanRow['quantity'] || cleanRow['Qty'] || cleanRow['qty'] || cleanRow['Số lượng'] || 1;
              let quantity = parseInt(String(rawQty).replace(/\D/g, '')) || 1;

              if (houseType === 'food' && quantity > 1 && price > 0) {
                  price = Math.ceil(price / quantity);
              }

              if (name && (price !== undefined)) {
                  const status = (userRole === 'owner' || userRole === 'admin') ? 'active' : 'pending';
                  const unitPrice = quantity > 0 ? (price / quantity) : price;

                  const productId = await ProductsRepository.importProduct({
                      house_id: houseId,
                      seller_id: user.id,
                      name, desc, price, unitPrice, quantity, img, status
                  }, connection);

                  if (houseType === 'excel') {
                      await ProductsRepository.addExcelItem(houseId, name, price, quantity, productId, connection);
                  }

                  count++;
              }
          }

          await connection.commit();
          try { fs.unlinkSync(excelFile.path); } catch(e){}

          let msg = `Thành công ${count} sản phẩm.`;
          if (missingImages.length > 0) msg += ` Thiếu ${missingImages.length} ảnh.`;
          return { ok: true, count, message: msg };
      } catch (err) {
          if (connection) await connection.rollback();
          throw err;
      } finally {
          if (connection) connection.release();
      }
  }

  async getMyListings(userId) {
      return await ProductsRepository.getMyListings(userId);
  }

  async getTrashProducts(userId) {
      const listings = await ProductsRepository.getTrashListings(userId);
      const inventories = await ProductsRepository.getTrashInventories(userId);
      const houses = await ProductsRepository.getTrashHouses(userId);

      const combined = [...listings, ...inventories, ...houses].sort((a, b) => 
          new Date(b.deleted_at) - new Date(a.deleted_at)
      );

      return combined;
  }

  async restoreProduct(id, user) {
      const product = await ProductsRepository.getProductStatusInfo(id);
      
      if (!product) {
          throw new NotFoundError("Sản phẩm không tồn tại");
      }
      
      if (user.role !== 'admin' && product.seller_id !== user.id) {
          throw new ForbiddenError("Bạn không có quyền khôi phục sản phẩm này");
      }

      const restoreStatus = product.previous_status || 'active';
      
      await ProductsRepository.restoreProductStatus(id, restoreStatus);
      await ProductsRepository.restoreProductInventories(id);

      return { ok: true };
  }

  async forceDeleteProduct(id, user) {
      let connection;
      try {
          const pool = await connectDB();
          connection = await pool.getConnection();
          await connection.beginTransaction();

          const product = await ProductsRepository.getProductForForceDelete(id, connection);
          
          if (!product) {
              throw new NotFoundError("Sản phẩm không tồn tại");
          }

          if (user.role !== 'admin' && product.seller_id !== user.id) {
              throw new ForbiddenError("Bạn không có quyền xóa sản phẩm này");
          }

          if (product.image_url) {
              deleteLocalFile(product.image_url);
          }

          await ProductsRepository.deleteInventoryAndProductById(id, connection);

          await connection.commit();
          return { ok: true };
      } catch (err) {
          if (connection) await connection.rollback();
          throw err;
      } finally {
          if (connection) connection.release();
      }
  }

  async deleteProduct(id, user) {
      const product = await ProductsRepository.getProductForSoftDelete(id);

      if (!product) {
          throw new NotFoundError("Sản phẩm không tồn tại");
      }
      
      if (user.role !== 'admin' && product.seller_id !== user.id && product.owner_id !== user.id) {
           throw new ForbiddenError("Bạn không có quyền xóa sản phẩm này");
      }

      await ProductsRepository.softDeleteProduct(id, product.status);
      await ProductsRepository.softDeleteProductInventories(id);

      return { ok: true };
  }

  async updateProduct(id, data, user) {
      const { name, price, quantity, description } = data;
      let connection;
      try {
          const product = await ProductsRepository.getProductForUpdateSync(id);

          if (!product) {
              throw new NotFoundError("Sản phẩm không tồn tại");
          }

          if (user.role !== 'admin' && product.seller_id !== user.id) {
              throw new ForbiddenError("Bạn không có quyền sửa sản phẩm này");
          }

          const pool = await connectDB();
          connection = await pool.getConnection();
          await connection.beginTransaction();

          const unitPrice = (quantity > 0) ? (price / quantity) : price;

          await ProductsRepository.updateProductDetails(id, name, price, unitPrice, quantity, description, connection);
          await ProductsRepository.syncInventory(id, product.seller_id, quantity, connection);
          await ProductsRepository.syncExcelItem(id, name, price, quantity, connection);

          await connection.commit();
          return { ok: true };
      } catch (err) {
          if (connection) await connection.rollback();
          throw err;
      } finally {
          if (connection) connection.release();
      }
  }

  async bulkDelete(productIds, user) {
      if (!Array.isArray(productIds) || productIds.length === 0) {
          throw new BadRequestError("Chưa chọn sản phẩm nào");
      }

      let connection;
      try {
          const pool = await connectDB();
          connection = await pool.getConnection();
          await connection.beginTransaction();

          const placeholders = productIds.map(() => '?').join(',');
          const rows = await ProductsRepository.getBulkProductsForDelete(productIds, placeholders, connection);

          const deletableProducts = rows.filter(p => user.role === 'admin' || p.seller_id === user.id || p.owner_id === user.id);
          
          if (deletableProducts.length === 0) {
              throw new ForbiddenError("Bạn không có quyền xóa các sản phẩm này");
          }

          for (const p of deletableProducts) {
              await ProductsRepository.softDeleteProductTx(p.id, p.status, connection);
              await ProductsRepository.softDeleteInventoriesTx(p.id, connection);
          }

          await connection.commit();
          return { ok: true, count: deletableProducts.length };
      } catch (err) {
          if (connection) await connection.rollback();
          throw err;
      } finally {
          if (connection) connection.release();
      }
  }

  async bulkRestore(productIds, user) {
      if (!Array.isArray(productIds) || productIds.length === 0) {
          throw new BadRequestError("Chưa chọn sản phẩm nào");
      }

      let connection;
      try {
          const pool = await connectDB();
          connection = await pool.getConnection();
          await connection.beginTransaction();

          const placeholders = productIds.map(() => '?').join(',');
          const rows = await ProductsRepository.getBulkProductsForRestore(productIds, placeholders, connection);

          const restorable = rows.filter(p => user.role === 'admin' || p.seller_id === user.id);
          
          for (const p of restorable) {
              const restoreStatus = p.previous_status || 'active';
              await ProductsRepository.restoreProductTx(p.id, restoreStatus, connection);
              await ProductsRepository.restoreInventoriesTx(p.id, connection);
          }

          await connection.commit();
          return { ok: true, count: restorable.length };
      } catch (err) {
           if (connection) await connection.rollback();
           throw err;
      } finally {
           if (connection) connection.release();
      }
  }

  async bulkForceDelete(productIds, user) {
      if (!Array.isArray(productIds) || productIds.length === 0) {
          throw new BadRequestError("Chưa chọn sản phẩm nào");
      }

      let connection;
      try {
          const pool = await connectDB();
          connection = await pool.getConnection();
          await connection.beginTransaction();

          const placeholders = productIds.map(() => '?').join(',');
          const rows = await ProductsRepository.getBulkProductsForForceDelete(productIds, placeholders, connection);

          const deletable = rows.filter(p => user.role === 'admin' || p.seller_id === user.id);
          
          for (const p of deletable) {
              if (p.image_url) {
                  deleteLocalFile(p.image_url);
              }
              await ProductsRepository.deleteInventoryAndProductById(p.id, connection);
          }

          await connection.commit();
          return { ok: true, count: deletable.length };
      } catch (err) {
          if (connection) await connection.rollback();
          throw err;
      } finally {
          if (connection) connection.release();
      }
  }

  async buyProduct(productId, buyerId) {
      let connection;
      try {
          const pool = await connectDB();
          connection = await pool.getConnection();
          await connection.beginTransaction();

          const product = await ProductsRepository.getProductWithHouseIdForUpdate(productId, connection);
          if (!product) throw new Error("Sản phẩm không tồn tại");
          if (product.status !== 'active') throw new Error("Sản phẩm chưa được duyệt hoặc đã bị xóa");
          if (product.quantity <= 0) throw new Error("Sản phẩm đã hết hàng");

          const wallet = await ProductsRepository.getWalletForUpdate(buyerId, connection);
          if (!wallet) throw new Error("Ví người dùng không tồn tại");

          const balance = parseFloat(wallet.balance);
          const unitPrice = (product.unit_price && parseFloat(product.unit_price) > 0)
              ? parseFloat(product.unit_price)
              : (product.quantity > 0 ? parseFloat(product.price) / product.quantity : parseFloat(product.price));

          if (balance < unitPrice) throw new Error("Số dư ví không đủ để thanh toán");

          await ProductsRepository.decrementProductQuantity(productId, connection);

          const sellerInv = await ProductsRepository.getInventoryForUpdate(product.seller_id, productId, connection);
          if (sellerInv) {
              await ProductsRepository.updateOrDeleteInventory(sellerInv.id, sellerInv.quantity, connection);
          }

          await ProductsRepository.debitWallet(buyerId, unitPrice, connection);
          await ProductsRepository.creditWallet(product.seller_id, unitPrice, connection);

          await ProductsRepository.createTransaction(buyerId, productId, product.house_id, unitPrice, `Mua: ${product.name}`, connection);
          await ProductsRepository.createSalesLog(productId, buyerId, connection);

          const buyerInv = await ProductsRepository.getBuyerInventory(buyerId, productId, connection);
          if (buyerInv) {
              await ProductsRepository.incrementBuyerInventory(buyerInv.id, connection);
          } else {
              await ProductsRepository.addBuyerInventory(buyerId, productId, connection);
          }

          await connection.commit();

          const buyerBalance = await ProductsRepository.getWalletBalance(buyerId, pool);
          const sellerBalance = await ProductsRepository.getWalletBalance(product.seller_id, pool);
          
          emitToUser(buyerId, "walletUpdated", { newBalance: buyerBalance });
          emitToUser(product.seller_id, "walletUpdated", { newBalance: sellerBalance });

          const newQuantity = await ProductsRepository.getProductQuantity(productId, pool);
          emitToHouse(product.house_id, "productUpdated", { productId, newQuantity });

          emitToUser(product.seller_id, "newNotification", {
              message: `Bạn vừa bán được 1 ${product.name}!`,
              type: 'PRODUCT_SOLD'
          });

          return { ok: true, message: "Mua hàng thành công", unitPrice };
      } catch (err) {
          if (connection) await connection.rollback();
          throw err;
      } finally {
          if (connection) connection.release();
      }
  }

  async getHouseTransactions(houseId) {
      if (!houseId) throw new BadRequestError("Missing houseId");
      return await ProductsRepository.getHouseTransactions(houseId);
  }
}

export default new ProductsService();
