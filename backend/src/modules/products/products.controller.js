
import ProductsService from "./products.service.js";
import { SuccessResponse } from "../../core/responses.js";

// Tạo sản phẩm mới (Mặc định status = pending)
export const createProduct = async (req, res, next) => {
  try {
    const { house_id, name, description, price, quantity } = req.body || {};
    let image_url = null;

    if (req.file) {
      image_url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    const product = await ProductsService.createProduct({
        house_id,
        name,
        description,
        price,
        quantity,
        image_url,
        user: req.user,
        req
    });

    res.json(product);
  } catch (err) {
    next(err);
  }
};

// Lấy danh sách sản phẩm trong Nhà
export const getProducts = async (req, res, next) => {
    try {
        const products = await ProductsService.getProducts(req.query);
        res.json(products);
    } catch (err) {
        next(err);
    }
};

// Duyệt sản phẩm (Chỉ House Owner)
export const updateProductStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // active, rejected
        const user = req.user;

        const product = await ProductsService.updateProductStatus(id, status, user);
        res.json(product);
    } catch (err) {
        next(err);
    }
};

export const bulkUpdateStatus = async (req, res, next) => {
    try {
        const { productIds, status } = req.body;
        const user = req.user;

        const result = await ProductsService.bulkUpdateStatus(productIds, status, user);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const importProducts = async (req, res, next) => {
    try {
        let { house_id } = req.body;
        if (!house_id) house_id = req.query.house_id;
        
        const protocol = req.protocol;
        const host = req.get('host');

        const result = await ProductsService.importProducts(house_id, req.files || [], req.user, protocol, host);
        res.json(result);
    } catch (err) {
        next(err);
    }
};


// Lấy tất cả bài đăng của User (bao gồm hàng đang bán và hàng trong kho)
export const getMyListings = async (req, res, next) => {
    try {
        const result = await ProductsService.getMyListings(req.user.id);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const getTrashProducts = async (req, res, next) => {
    try {
        const result = await ProductsService.getTrashProducts(req.user.id);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const restoreProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await ProductsService.restoreProduct(id, req.user);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const forceDeleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await ProductsService.forceDeleteProduct(id, req.user);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await ProductsService.deleteProduct(id, req.user);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await ProductsService.updateProduct(id, req.body, req.user);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const bulkDelete = async (req, res, next) => {
    try {
        const { productIds } = req.body;
        const result = await ProductsService.bulkDelete(productIds, req.user);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const bulkRestore = async (req, res, next) => {
    try {
        const { productIds } = req.body;
        const result = await ProductsService.bulkRestore(productIds, req.user);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const bulkForceDelete = async (req, res, next) => {
    try {
        const { productIds } = req.body;
        const result = await ProductsService.bulkForceDelete(productIds, req.user);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

// --- WALLET BUYING LOGIC ---
export const buyProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await ProductsService.buyProduct(id, req.user.id);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const getHouseTransactions = async (req, res, next) => {
    try {
        const { houseId } = req.params;
        const result = await ProductsService.getHouseTransactions(houseId);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

