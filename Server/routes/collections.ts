import express, { Request, Response } from "express";
import { client } from "../data/DB";

const router = express.Router();

// ============================================================
// GET /api/collections - Lấy danh sách tất cả bộ sưu tập
// ============================================================
router.get("/", async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        collectionid, name, slug, description, banner_url, icon_url,
        sort_order, is_active, created_at, updated_at,
        (SELECT COUNT(*) FROM productcollections WHERE collectionid = collections.collectionid) AS product_count
      FROM collections
      ORDER BY sort_order ASC, name ASC
    `;
    const result = await client.query(query);
    return res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error("GET /collections error:", error);
    return res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách bộ sưu tập" });
  }
});

// ============================================================
// GET /api/collections/:collectionId - Lấy chi tiết bộ sưu tập
// ============================================================
router.get("/:collectionId", async (req: Request, res: Response) => {
  try {
    const { collectionId } = req.params;

    if (!collectionId || isNaN(Number(collectionId))) {
      return res.status(400).json({ message: "ID bộ sưu tập không hợp lệ" });
    }

    const query = `
      SELECT 
        collectionid, name, slug, description, banner_url, icon_url,
        sort_order, is_active, created_at, updated_at
      FROM collections
      WHERE collectionid = $1
    `;
    const result = await client.query(query, [collectionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bộ sưu tập" });
    }

    // Lấy các sản phẩm trong bộ sưu tập
    const productsQuery = `
      SELECT 
        p.productid, p.title, p.price, p.discount, pc.sort_order
      FROM productcollections pc
      JOIN products p ON pc.productid = p.productid
      WHERE pc.collectionid = $1
      ORDER BY pc.sort_order ASC
      LIMIT 20
    `;
    const productsResult = await client.query(productsQuery, [collectionId]);

    return res.status(200).json({
      data: result.rows[0],
      products: productsResult.rows,
    });
  } catch (error) {
    console.error("GET /collections/:collectionId error:", error);
    return res.status(500).json({ message: "Lỗi khi lấy chi tiết bộ sưu tập" });
  }
});

// ============================================================
// POST /api/collections - Tạo bộ sưu tập mới
// ============================================================
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      name,
      slug,
      description,
      banner_url,
      icon_url,
      sort_order,
      is_active,
    } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: "Tên bộ sưu tập là bắt buộc" });
    }

    if (!slug || slug.trim().length === 0) {
      return res.status(400).json({ message: "Slug là bắt buộc" });
    }

    const query = `
      INSERT INTO collections (name, slug, description, banner_url, icon_url, sort_order, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING collectionid, name, slug, description, banner_url, icon_url, sort_order, is_active, created_at
    `;

    const result = await client.query(query, [
      name.trim(),
      slug.trim(),
      description || null,
      banner_url || null,
      icon_url || null,
      sort_order || 0,
      is_active !== false,
    ]);

    return res.status(201).json({
      message: "Tạo bộ sưu tập thành công",
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error("POST /collections error:", error);

    if (error.code === "23505") {
      return res.status(400).json({ message: "Bộ sưu tập này đã tồn tại" });
    }

    return res.status(500).json({ message: "Lỗi khi tạo bộ sưu tập" });
  }
});

// ============================================================
// PUT /api/collections/:collectionId - Cập nhật bộ sưu tập
// ============================================================
router.put("/:collectionId", async (req: Request, res: Response) => {
  try {
    const { collectionId } = req.params;
    const {
      name,
      slug,
      description,
      banner_url,
      icon_url,
      sort_order,
      is_active,
    } = req.body;

    if (!collectionId || isNaN(Number(collectionId))) {
      return res.status(400).json({ message: "ID bộ sưu tập không hợp lệ" });
    }

    // Kiểm tra bộ sưu tập tồn tại
    const checkQuery =
      "SELECT collectionid FROM collections WHERE collectionid = $1";
    const checkResult = await client.query(checkQuery, [collectionId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bộ sưu tập" });
    }

    const updateQuery = `
      UPDATE collections
      SET 
        name = COALESCE($2, name),
        slug = COALESCE($3, slug),
        description = COALESCE($4, description),
        banner_url = COALESCE($5, banner_url),
        icon_url = COALESCE($6, icon_url),
        sort_order = COALESCE($7, sort_order),
        is_active = COALESCE($8, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE collectionid = $1
      RETURNING collectionid, name, slug, description, banner_url, icon_url, sort_order, is_active, updated_at
    `;

    const result = await client.query(updateQuery, [
      collectionId,
      name?.trim() || null,
      slug?.trim() || null,
      description || null,
      banner_url || null,
      icon_url || null,
      sort_order !== undefined ? sort_order : null,
      is_active !== undefined ? is_active : null,
    ]);

    return res.status(200).json({
      message: "Cập nhật bộ sưu tập thành công",
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error("PUT /collections/:collectionId error:", error);

    if (error.code === "23505") {
      return res
        .status(400)
        .json({ message: "Slug hoặc tên bộ sưu tập này đã tồn tại" });
    }

    return res.status(500).json({ message: "Lỗi khi cập nhật bộ sưu tập" });
  }
});

// ============================================================
// DELETE /api/collections/:collectionId - Xóa bộ sưu tập
// ============================================================
router.delete("/:collectionId", async (req: Request, res: Response) => {
  try {
    const { collectionId } = req.params;

    if (!collectionId || isNaN(Number(collectionId))) {
      return res.status(400).json({ message: "ID bộ sưu tập không hợp lệ" });
    }

    // Kiểm tra bộ sưu tập tồn tại
    const checkQuery =
      "SELECT collectionid FROM collections WHERE collectionid = $1";
    const checkResult = await client.query(checkQuery, [collectionId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bộ sưu tập" });
    }

    // Xóa bộ sưu tập (cascade sẽ xóa liên kết trong productcollections)
    const deleteQuery =
      "DELETE FROM collections WHERE collectionid = $1 RETURNING collectionid";
    const result = await client.query(deleteQuery, [collectionId]);

    return res.status(200).json({
      message: "Xóa bộ sưu tập thành công",
      data: { collectionid: result.rows[0].collectionid },
    });
  } catch (error) {
    console.error("DELETE /collections/:collectionId error:", error);
    return res.status(500).json({ message: "Lỗi khi xóa bộ sưu tập" });
  }
});

// ============================================================
// POST /api/collections/:collectionId/products/:productId - Thêm sản phẩm vào bộ sưu tập
// ============================================================
router.post(
  "/:collectionId/products/:productId",
  async (req: Request, res: Response) => {
    try {
      const { collectionId, productId } = req.params;
      const { sort_order } = req.body;

      if (
        !collectionId ||
        isNaN(Number(collectionId)) ||
        !productId ||
        isNaN(Number(productId))
      ) {
        return res.status(400).json({ message: "ID không hợp lệ" });
      }

      const query = `
      INSERT INTO productcollections (productid, collectionid, sort_order)
      VALUES ($1, $2, $3)
      RETURNING id, productid, collectionid, sort_order, created_at
    `;

      const result = await client.query(query, [
        productId,
        collectionId,
        sort_order || 0,
      ]);

      return res.status(201).json({
        message: "Thêm sản phẩm vào bộ sưu tập thành công",
        data: result.rows[0],
      });
    } catch (error: any) {
      console.error(
        "POST /collections/:collectionId/products/:productId error:",
        error,
      );

      if (error.code === "23505") {
        return res
          .status(400)
          .json({ message: "Sản phẩm này đã có trong bộ sưu tập" });
      }

      if (error.code === "23503") {
        return res
          .status(400)
          .json({ message: "ID bộ sưu tập hoặc sản phẩm không tồn tại" });
      }

      return res.status(500).json({ message: "Lỗi khi thêm sản phẩm" });
    }
  },
);

// ============================================================
// DELETE /api/collections/:collectionId/products/:productId - Xóa sản phẩm khỏi bộ sưu tập
// ============================================================
router.delete(
  "/:collectionId/products/:productId",
  async (req: Request, res: Response) => {
    try {
      const { collectionId, productId } = req.params;

      if (
        !collectionId ||
        isNaN(Number(collectionId)) ||
        !productId ||
        isNaN(Number(productId))
      ) {
        return res.status(400).json({ message: "ID không hợp lệ" });
      }

      const query = `
      DELETE FROM productcollections 
      WHERE collectionid = $1 AND productid = $2
      RETURNING id
    `;

      const result = await client.query(query, [collectionId, productId]);

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Sản phẩm không tồn tại trong bộ sưu tập" });
      }

      return res.status(200).json({
        message: "Xóa sản phẩm khỏi bộ sưu tập thành công",
      });
    } catch (error) {
      console.error(
        "DELETE /collections/:collectionId/products/:productId error:",
        error,
      );
      return res.status(500).json({ message: "Lỗi khi xóa sản phẩm" });
    }
  },
);

// ============================================================
// GET /api/collections/by-slug/:slug - Lấy bộ sưu tập theo slug
// ============================================================
router.get("/by-slug/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const query = `
      SELECT 
        collectionid, name, slug, description, banner_url, icon_url,
        sort_order, is_active, created_at, updated_at
      FROM collections
      WHERE slug = $1 AND is_active = true
    `;
    const result = await client.query(query, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bộ sưu tập" });
    }

    // Lấy các sản phẩm
    const productsQuery = `
      SELECT 
        p.productid, p.title, p.price, p.discount,
        pp.stars, pp.isnew, pp.issale, pp.isdiscount
      FROM productcollections pc
      JOIN products p ON pc.productid = p.productid
      LEFT JOIN productparams pp ON p.productid = pp.productid
      WHERE pc.collectionid = $1
      ORDER BY pc.sort_order ASC
    `;
    const productsResult = await client.query(productsQuery, [
      result.rows[0].collectionid,
    ]);

    return res.status(200).json({
      data: result.rows[0],
      products: productsResult.rows,
    });
  } catch (error) {
    console.error("GET /collections/by-slug/:slug error:", error);
    return res.status(500).json({ message: "Lỗi khi lấy bộ sưu tập" });
  }
});

export default router;
