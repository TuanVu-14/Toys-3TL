import express, { Request, Response } from "express";
import { client } from "../data/DB";

const router = express.Router();

const toInt = (value: unknown, fallback: number) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

// GET /api/catalog/products?ageGroup=6-8&gender=unisex&material=wood&skillType=STEM&brand=LEGO&collectionID=1&page=1&pageSize=12
router.get("/catalog/products", async (req: Request, res: Response) => {
  const {
    ageGroup,
    gender,
    material,
    skillType,
    brand,
    brandID,
    collectionID,
    search,
    page = "1",
    pageSize = "12",
  } = req.query;

  const values: any[] = [];
  const where: string[] = ["COALESCE(p.is_active, true) = true"];
  let joinCollection = "";

  const addFilter = (sql: string, value: unknown) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      values.push(value);
      where.push(sql.replace("?", `$${values.length}`));
    }
  };

  addFilter("p.age_group = ?", ageGroup);
  addFilter("lower(p.gender) = lower(?)", gender);
  addFilter("lower(p.material) = lower(?)", material);
  addFilter("lower(p.skill_type) = lower(?)", skillType);
  addFilter("lower(p.brand) = lower(?)", brand);

  if (brandID) {
    addFilter("b.brand_id = ?", Number(brandID));
  }

  if (search && String(search).trim()) {
    values.push(`%${String(search).trim()}%`);
    where.push(`(p.title ILIKE $${values.length} OR p.description ILIKE $${values.length} OR p.tags ILIKE $${values.length})`);
  }

  if (collectionID) {
    joinCollection = "INNER JOIN collection_products cp ON cp.productid = p.productid";
    addFilter("cp.collection_id = ?", Number(collectionID));
  }

  const currentPage = toInt(page, 1);
  const limit = Math.min(toInt(pageSize, 12), 60);
  const offset = (currentPage - 1) * limit;

  values.push(limit, offset);
  const limitParam = `$${values.length - 1}`;
  const offsetParam = `$${values.length}`;

  const whereSql = `WHERE ${where.join(" AND ")}`;

  const sql = `
    SELECT
      p.productid,
      p.title,
      p.description,
      p.price,
      p.discount,
      p.stock,
      p.age_group,
      p.gender,
      p.material,
      p.skill_type,
      p.brand,
      pi.imglink,
      pi.imgalt,
      b.brand_id,
      b.name AS brandname,
      b.manufacturer,
      b.safety_certificates,
      COUNT(*) OVER() AS totalcount
    FROM products p
    LEFT JOIN productimages pi ON pi.productid = p.productid AND pi.isprimary = true
    LEFT JOIN brands b ON lower(b.name) = lower(p.brand)
    ${joinCollection}
    ${whereSql}
    ORDER BY p.productid DESC
    LIMIT ${limitParam}
    OFFSET ${offsetParam};
  `;

  try {
    const result = await client.query(sql, values);
    const total = result.rows[0]?.totalcount ? Number(result.rows[0].totalcount) : 0;

    res.status(200).json({
      data: result.rows.map(({ totalcount, ...row }) => row),
      pagination: {
        page: currentPage,
        pageSize: limit,
        total,
      },
    });
  } catch (error) {
    console.error("GET /catalog/products error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/catalog/filters", async (_req: Request, res: Response) => {
  try {
    const [brands, collections, materials, skillTypes, ageGroups] = await Promise.all([
      client.query(`
        SELECT brand_id, name, manufacturer, country, logo_url
        FROM brands
        WHERE COALESCE(is_active, true) = true
        ORDER BY name
      `),
      client.query(`
        SELECT collection_id, name, slug, description, imglink
        FROM collections
        WHERE COALESCE(is_active, true) = true
        ORDER BY display_order ASC, name ASC
      `),
      client.query(`
        SELECT DISTINCT material
        FROM products
        WHERE material IS NOT NULL AND material <> ''
        ORDER BY material
      `),
      client.query(`
        SELECT DISTINCT skill_type
        FROM products
        WHERE skill_type IS NOT NULL AND skill_type <> ''
        ORDER BY skill_type
      `),
      client.query(`
        SELECT DISTINCT age_group
        FROM products
        WHERE age_group IS NOT NULL AND age_group <> ''
        ORDER BY age_group
      `),
    ]);

    res.status(200).json({
      data: {
        ageGroups: ageGroups.rows.map((row) => row.age_group),
        genders: [
          { value: "unisex", label: "Unisex" },
          { value: "boy", label: "Bé trai" },
          { value: "girl", label: "Bé gái" },
        ],
        materials: materials.rows.map((row) => row.material),
        skillTypes: skillTypes.rows.map((row) => row.skill_type),
        brands: brands.rows,
        collections: collections.rows,
      },
    });
  } catch (error) {
    console.error("GET /catalog/filters error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/catalog/collections/:collectionID", async (req: Request, res: Response) => {
  try {
    const result = await client.query(
      `SELECT collection_id, name, slug, description, imglink, is_active
       FROM collections
       WHERE collection_id = $1`,
      [req.params.collectionID],
    );

    if (!result.rows.length) return res.status(404).json({ message: "Collection not found" });

    res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error("GET /catalog/collections error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
