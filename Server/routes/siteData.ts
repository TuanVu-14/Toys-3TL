import express, { Request, Response } from "express";
import { client } from "../data/DB";

const router = express.Router();

const normalizeText = (value: unknown) => String(value ?? "").trim();

function slugSql(column: string) {
  return `regexp_replace(lower(${column}), '[^a-z0-9]+', '-', 'g')`;
}

async function getImage(productID: number) {
  try {
    const result = await client.query(
      `SELECT imageid, imglink, imgalt
       FROM productimages
       WHERE productid = $1 AND isprimary = true
       LIMIT 1`,
      [productID],
    );

    return result.rows[0] || { imageid: 0, imglink: "", imgalt: "" };
  } catch {
    return { imageid: 0, imglink: "", imgalt: "" };
  }
}

async function getColors(productID: number) {
  try {
    const result = await client.query(
      `SELECT colorid, colorname, colorclass
       FROM productcolors
       WHERE productid = $1`,
      [productID],
    );

    return result.rows;
  } catch {
    return [];
  }
}

async function getSizes(productID: number) {
  try {
    const result = await client.query(
      `SELECT sizeid, sizename, instock
       FROM productsizes
       WHERE productid = $1`,
      [productID],
    );

    return result.rows;
  } catch {
    return [];
  }
}

async function getReviewCount(productID: number) {
  try {
    const result = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM reviews
       WHERE productid = $1 AND COALESCE(status, 'approved') <> 'hidden'`,
      [productID],
    );

    return result.rows[0]?.count || 0;
  } catch {
    return 0;
  }
}

async function enrichProducts(rows: any[]) {
  return Promise.all(
    rows.map(async (product) => {
      const productID = Number(product.productid);
      const [colors, sizes, reviewCount, images] = await Promise.all([
        getColors(productID),
        getSizes(productID),
        getReviewCount(productID),
        getImage(productID),
      ]);

      return {
        ...product,
        colors,
        sizes,
        reviewCount,
        images,
      };
    }),
  );
}

async function resolveCategoryIDs(categoryValue: string) {
  const raw = normalizeText(categoryValue);
  const lower = raw.toLowerCase();

  if (!raw) return [];

  const exactCategory = await client.query(
    `SELECT categoryid, name, slug, maincategory
     FROM categories
     WHERE lower(slug) = $1
        OR lower(name) = $1
        OR ${slugSql("name")} = $1
     ORDER BY categoryid
     LIMIT 1`,
    [lower],
  );

  if (exactCategory.rows.length > 0) {
    return [exactCategory.rows[0].categoryid];
  }

  const byMainCategory = await client.query(
    `SELECT categoryid
     FROM categories
     WHERE lower(maincategory) = $1
        OR ${slugSql("maincategory")} = $1
     ORDER BY categoryid`,
    [lower],
  );

  return byMainCategory.rows.map((row) => row.categoryid);
}

async function getSiblingCategories(categoryValue: string) {
  const raw = normalizeText(categoryValue);
  const lower = raw.toLowerCase();

  const current = await client.query(
    `SELECT categoryid, name, slug, maincategory
     FROM categories
     WHERE lower(slug) = $1
        OR lower(name) = $1
        OR lower(maincategory) = $1
        OR ${slugSql("name")} = $1
        OR ${slugSql("maincategory")} = $1
     ORDER BY categoryid
     LIMIT 1`,
    [lower],
  );

  if (current.rows.length === 0) {
    return [];
  }

  const maincategory = current.rows[0].maincategory;

  const categories = await client.query(
    `SELECT categoryid, name, slug, maincategory
     FROM categories
     WHERE maincategory = $1
     ORDER BY categoryid`,
    [maincategory],
  );

  return categories.rows;
}

function buildCatalogWhere(req: Request, params: any[]) {
  let sql = "";

  const add = (condition: string, value: unknown) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      params.push(value);
      sql += ` AND ${condition.replace("?", `$${params.length}`)}`;
    }
  };

  add("products.age_group = ?", req.query.age_group);
  add("lower(products.gender) = lower(?)", req.query.gender);
  add("lower(products.material) = lower(?)", req.query.material);
  add("lower(products.skill_type) = lower(?)", req.query.skill_type);
  add("lower(products.brand) = lower(?)", req.query.brand);

  if (req.query.collection_id) {
    params.push(Number(req.query.collection_id));
    sql += ` AND EXISTS (
      SELECT 1
      FROM collection_products cp
      WHERE cp.productid = products.productid
        AND cp.collection_id = $${params.length}
    )`;
  }

  return sql;
}

async function fetchProductsByCategoryIDs(categoryIDs: number[], extraWhere = "", extraParams: any[] = []) {
  if (categoryIDs.length === 0) return [];

  const categoryParams = categoryIDs.map((_, index) => `$${index + 1}`).join(",");
  const params = [...categoryIDs, ...extraParams];

  const result = await client.query(
    `SELECT products.productid,
            products.title,
            categories.name AS category,
            categories.slug AS category_slug,
            products.price,
            products.discount,
            productparams.stars,
            productparams.isnew,
            productparams.issale,
            productparams.isdiscount
     FROM products
     INNER JOIN categories ON products.categoryid = categories.categoryid
     INNER JOIN productparams ON products.productid = productparams.productid
     WHERE products.categoryid IN (${categoryParams})
       AND COALESCE(products.is_active, true) = true
       ${extraWhere}
     ORDER BY products.productid DESC`,
    params,
  );

  return enrichProducts(result.rows);
}

router.get("/articles", async (_req: Request, res: Response) => {
  try {
    const response = await client.query("SELECT * FROM articles ORDER BY createdat DESC NULLS LAST");
    res.status(200).json({ data: response.rows });
  } catch {
    res.status(200).json({ data: [] });
  }
});

router.get("/category/:category", async (req: Request, res: Response) => {
  try {
    const categoryValue = normalizeText(req.params.category);
    const categoryIDs = await resolveCategoryIDs(categoryValue);
    const categories = await getSiblingCategories(categoryValue);
    const products = await fetchProductsByCategoryIDs(categoryIDs);

    res.status(200).json({
      data: {
        categories,
        products,
      },
    });
  } catch (error) {
    console.error("GET /category/:category error:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/filter/category/:minPrice/:maxPrice/:categoryID/:minRating/:categoryName", async (req: Request, res: Response) => {
  try {
    const minPrice = Number(req.params.minPrice || 0);
    const maxPrice = Number(req.params.maxPrice || 999999999);
    const minRating = Number(req.params.minRating || 0);
    const categoryID = Number(req.params.categoryID || 0);

    const categoryIDs = categoryID !== 0
      ? [categoryID]
      : await resolveCategoryIDs(req.params.categoryName);

    const extraParams: any[] = [];
    let extraWhere = "";

    extraParams.push(minPrice);
    extraWhere += ` AND products.price >= $${categoryIDs.length + extraParams.length}`;

    extraParams.push(maxPrice);
    extraWhere += ` AND products.price <= $${categoryIDs.length + extraParams.length}`;

    extraParams.push(minRating);
    extraWhere += ` AND COALESCE(productparams.stars, 0) >= $${categoryIDs.length + extraParams.length}`;

    const reqParamsForCatalog = [...categoryIDs, ...extraParams];
    const catalogWhere = buildCatalogWhere(req, reqParamsForCatalog);
    const catalogExtraParams = reqParamsForCatalog.slice(categoryIDs.length + extraParams.length);

    const products = await fetchProductsByCategoryIDs(
      categoryIDs,
      extraWhere + catalogWhere,
      [...extraParams, ...catalogExtraParams],
    );

    res.status(200).json({ data: products });
  } catch (error) {
    console.error("GET /filter/category error:", error);
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/filter/category-only/:categoryID/:categoryName", async (req: Request, res: Response) => {
  try {
    const categoryID = Number(req.params.categoryID || 0);

    const categoryIDs = categoryID !== 0
      ? [categoryID]
      : await resolveCategoryIDs(req.params.categoryName);

    const params = [...categoryIDs];
    const extraWhere = buildCatalogWhere(req, params);
    const extraParams = params.slice(categoryIDs.length);

    const products = await fetchProductsByCategoryIDs(categoryIDs, extraWhere, extraParams);

    res.status(200).json({ data: products });
  } catch (error) {
    console.error("GET /filter/category-only error:", error);
    res.status(500).json({ error: "Failed" });
  }
});

async function searchProducts(keyword: string, filters?: { minPrice?: number; maxPrice?: number; rating?: number }) {
  const words = keyword
    .split("-")
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length === 0) return [];

  const params: any[] = [];
  const wordConditions = words.map((word) => {
    params.push(`%${word}%`);
    const idx = `$${params.length}`;

    return `(products.title ILIKE ${idx}
      OR products.description ILIKE ${idx}
      OR products.tags ILIKE ${idx}
      OR products.age_group ILIKE ${idx}
      OR products.gender ILIKE ${idx}
      OR products.material ILIKE ${idx}
      OR products.skill_type ILIKE ${idx}
      OR products.brand ILIKE ${idx}
      OR categories.name ILIKE ${idx}
      OR categories.slug ILIKE ${idx}
      OR categories.maincategory ILIKE ${idx})`;
  });

  let extra = "";

  if (filters?.minPrice !== undefined) {
    params.push(filters.minPrice);
    extra += ` AND products.price >= $${params.length}`;
  }

  if (filters?.maxPrice !== undefined) {
    params.push(filters.maxPrice);
    extra += ` AND products.price <= $${params.length}`;
  }

  if (filters?.rating !== undefined) {
    params.push(filters.rating);
    extra += ` AND COALESCE(productparams.stars, 0) >= $${params.length}`;
  }

  const response = await client.query(
    `SELECT products.productid,
            products.title,
            categories.name AS category,
            products.price,
            products.discount,
            productparams.stars,
            productparams.isnew,
            productparams.issale,
            productparams.isdiscount
     FROM products
     INNER JOIN categories ON products.categoryid = categories.categoryid
     INNER JOIN productparams ON products.productid = productparams.productid
     WHERE COALESCE(products.is_active, true) = true
       AND (${wordConditions.join(" OR ")})
       ${extra}
     ORDER BY products.productid DESC`,
    params,
  );

  return enrichProducts(response.rows);
}

router.get("/search/product/:productName", async (req: Request, res: Response) => {
  try {
    const products = await searchProducts(req.params.productName);
    res.status(200).json({ data: products });
  } catch (error) {
    console.error("GET /search/product error:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/search/filtered-product/:productName/:minPrice/:maxPrice/:rating", async (req: Request, res: Response) => {
  try {
    const products = await searchProducts(req.params.productName, {
      minPrice: Number(req.params.minPrice || 0),
      maxPrice: Number(req.params.maxPrice || 999999999),
      rating: Number(req.params.rating || 0),
    });

    res.status(200).json({ data: products });
  } catch (error) {
    console.error("GET /search/filtered-product error:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/sub-category/:mainCategory/:subCategory", async (req: Request, res: Response) => {
  try {
    const categoryIDs = await resolveCategoryIDs(req.params.subCategory);
    const products = await fetchProductsByCategoryIDs(categoryIDs);

    res.status(200).json({
      data: products,
      categoryid: categoryIDs[0] || 0,
    });
  } catch (error) {
    console.error("GET /sub-category error:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

router.get("/sub-category/filtered-product/:categoryID/:minPrice/:maxPrice/:rating", async (req: Request, res: Response) => {
  try {
    const categoryID = Number(req.params.categoryID || 0);
    if (!categoryID) return res.status(200).json({ data: [] });

    const minPrice = Number(req.params.minPrice || 0);
    const maxPrice = Number(req.params.maxPrice || 999999999);
    const rating = Number(req.params.rating || 0);

    const products = await fetchProductsByCategoryIDs(
      [categoryID],
      ` AND products.price >= $2
        AND products.price <= $3
        AND COALESCE(productparams.stars, 0) >= $4`,
      [minPrice, maxPrice, rating],
    );

    res.status(200).json({ data: products });
  } catch (error) {
    console.error("GET /sub-category/filtered-product error:", error);
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
