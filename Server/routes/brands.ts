import express, { Request, Response } from "express";
import { client } from "../data/DB";

const router = express.Router();

// ============================================================
// GET /api/brands - Lấy danh sách tất cả thương hiệu
// ============================================================
router.get("/", async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        brandid, name, description, logo_url, manufacturer_info, 
        certification_details, created_at, updated_at,
        (SELECT COUNT(*) FROM products WHERE brandid = brands.brandid) AS product_count
      FROM brands
      ORDER BY name ASC
    `;
    const result = await client.query(query);
    return res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error("GET /brands error:", error);
    return res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách thương hiệu" });
  }
});

// ============================================================
// GET /api/brands/:brandId - Lấy chi tiết thương hiệu
// ============================================================
router.get("/:brandId", async (req: Request, res: Response) => {
  try {
    const { brandId } = req.params;

    if (!brandId || isNaN(Number(brandId))) {
      return res.status(400).json({ message: "ID thương hiệu không hợp lệ" });
    }

    const query = `
      SELECT 
        brandid, name, description, logo_url, manufacturer_info, 
        certification_details, created_at, updated_at
      FROM brands
      WHERE brandid = $1
    `;
    const result = await client.query(query, [brandId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy thương hiệu" });
    }

    // Lấy các sản phẩm của thương hiệu
    const productsQuery = `
      SELECT productid, title, price, discount
      FROM products
      WHERE brandid = $1
      ORDER BY productid DESC
      LIMIT 10
    `;
    const productsResult = await client.query(productsQuery, [brandId]);

    return res.status(200).json({
      data: result.rows[0],
      products: productsResult.rows,
    });
  } catch (error) {
    console.error("GET /brands/:brandId error:", error);
    return res
      .status(500)
      .json({ message: "Lỗi khi lấy chi tiết thương hiệu" });
  }
});

// ============================================================
// POST /api/brands - Tạo thương hiệu mới
// ============================================================
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      logo_url,
      manufacturer_info,
      certification_details,
    } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: "Tên thương hiệu là bắt buộc" });
    }

    const query = `
      INSERT INTO brands (name, description, logo_url, manufacturer_info, certification_details)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING brandid, name, description, logo_url, manufacturer_info, certification_details, created_at
    `;

    const result = await client.query(query, [
      name.trim(),
      description || null,
      logo_url || null,
      manufacturer_info || null,
      certification_details || null,
    ]);

    return res.status(201).json({
      message: "Tạo thương hiệu thành công",
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error("POST /brands error:", error);

    if (error.code === "23505") {
      return res.status(400).json({ message: "Thương hiệu này đã tồn tại" });
    }

    return res.status(500).json({ message: "Lỗi khi tạo thương hiệu" });
  }
});

// ============================================================
// PUT /api/brands/:brandId - Cập nhật thương hiệu
// ============================================================
router.put("/:brandId", async (req: Request, res: Response) => {
  try {
    const { brandId } = req.params;
    const {
      name,
      description,
      logo_url,
      manufacturer_info,
      certification_details,
    } = req.body;

    if (!brandId || isNaN(Number(brandId))) {
      return res.status(400).json({ message: "ID thương hiệu không hợp lệ" });
    }

    // Kiểm tra thương hiệu tồn tại
    const checkQuery = "SELECT brandid FROM brands WHERE brandid = $1";
    const checkResult = await client.query(checkQuery, [brandId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy thương hiệu" });
    }

    const updateQuery = `
      UPDATE brands
      SET 
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        logo_url = COALESCE($4, logo_url),
        manufacturer_info = COALESCE($5, manufacturer_info),
        certification_details = COALESCE($6, certification_details),
        updated_at = CURRENT_TIMESTAMP
      WHERE brandid = $1
      RETURNING brandid, name, description, logo_url, manufacturer_info, certification_details, updated_at
    `;

    const result = await client.query(updateQuery, [
      brandId,
      name?.trim() || null,
      description || null,
      logo_url || null,
      manufacturer_info || null,
      certification_details || null,
    ]);

    return res.status(200).json({
      message: "Cập nhật thương hiệu thành công",
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error("PUT /brands/:brandId error:", error);

    if (error.code === "23505") {
      return res
        .status(400)
        .json({ message: "Tên thương hiệu này đã tồn tại" });
    }

    return res.status(500).json({ message: "Lỗi khi cập nhật thương hiệu" });
  }
});

// ============================================================
// DELETE /api/brands/:brandId - Xóa thương hiệu
// ============================================================
router.delete("/:brandId", async (req: Request, res: Response) => {
  try {
    const { brandId } = req.params;

    if (!brandId || isNaN(Number(brandId))) {
      return res.status(400).json({ message: "ID thương hiệu không hợp lệ" });
    }

    // Kiểm tra thương hiệu tồn tại
    const checkQuery = "SELECT brandid FROM brands WHERE brandid = $1";
    const checkResult = await client.query(checkQuery, [brandId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy thương hiệu" });
    }

    // Xóa brand (sẽ set brandid trong products thành NULL)
    const deleteQuery =
      "DELETE FROM brands WHERE brandid = $1 RETURNING brandid";
    const result = await client.query(deleteQuery, [brandId]);

    return res.status(200).json({
      message: "Xóa thương hiệu thành công",
      data: { brandid: result.rows[0].brandid },
    });
  } catch (error) {
    console.error("DELETE /brands/:brandId error:", error);
    return res.status(500).json({ message: "Lỗi khi xóa thương hiệu" });
  }
});

// ============================================================
// GET /api/brands/:brandId/certificates - Lấy thông tin chứng chỉ
// ============================================================
router.get("/:brandId/certificates", async (req: Request, res: Response) => {
  try {
    const { brandId } = req.params;

    if (!brandId || isNaN(Number(brandId))) {
      return res.status(400).json({ message: "ID thương hiệu không hợp lệ" });
    }

    const query = `
      SELECT 
        brandid, name, certification_details,
        (SELECT COUNT(*) FROM products WHERE brandid = $1) AS products_with_cert
      FROM brands
      WHERE brandid = $1
    `;
    const result = await client.query(query, [brandId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy thương hiệu" });
    }

    return res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error("GET /brands/:brandId/certificates error:", error);
    return res.status(500).json({ message: "Lỗi khi lấy thông tin chứng chỉ" });
  }
});

export default router;
